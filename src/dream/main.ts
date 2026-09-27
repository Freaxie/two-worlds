/* ------------------------------------------------------------------
   BLUE HOUR — the projector
   Renders the current 3D shot, blooms it, tone-maps it, bends it
   through the lens, and cuts to the next shot on a steady beat.
------------------------------------------------------------------- */

import './dream.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { LensShader } from './lens'
import { buildShots, clock } from './world/shots'

const params = new URLSearchParams(location.search)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const BEAT = reduced ? 7 : Number(params.get('beat')) || 3.4

const stage = document.getElementById('stage') as HTMLCanvasElement
const ui = {
  root: document.getElementById('ui')!,
  num: document.getElementById('shot-num')!,
  title: document.getElementById('shot-title')!,
  ticks: document.getElementById('ticks')!,
  play: document.getElementById('play') as HTMLButtonElement,
  prev: document.getElementById('prev') as HTMLButtonElement,
  next: document.getElementById('next') as HTMLButtonElement,
}

let renderer: THREE.WebGLRenderer
try {
  renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, powerPreference: 'high-performance' })
} catch {
  ui.title.textContent = 'This reel needs WebGL, which this browser has turned off.'
  throw new Error('WebGL unavailable')
}
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace

const shots = buildShots(renderer)

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(shots[0].scene, shots[0].camera)
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.6, 0.9)
const lens = new ShaderPass(LensShader)
composer.addPass(renderPass)
composer.addPass(bloom)
composer.addPass(new OutputPass())
composer.addPass(lens)

/* ---------- sizing ---------- */

/** drops when the device can't keep up, trading sharpness for a steady frame rate */
let quality = 1

function resize() {
  const w = innerWidth
  const h = innerHeight
  const pr = Math.min(devicePixelRatio || 1, 1.5) * quality
  renderer.setPixelRatio(pr)
  renderer.setSize(w, h, false)
  composer.setPixelRatio(pr)
  composer.setSize(w, h)
  lens.uniforms.uRes.value.set(w * pr, h * pr)
  for (const s of shots) {
    s.camera.aspect = w / h
    // keep the vertical framing on phones by widening the lens instead of cropping
    s.camera.zoom = w < h ? w / h + 0.25 : 1
    s.camera.updateProjectionMatrix()
  }
}

/* ---------- playback ---------- */

let index = Math.min(shots.length - 1, Math.max(0, Math.floor(Number(params.get('shot')) || 1) - 1))
let time = 0
let shotStart = -(Number(params.get('t')) || 0)
let cutAt = -10
let playing = !params.has('still')
let last = performance.now()

function go(i: number) {
  index = (i + shots.length) % shots.length
  shotStart = time
  cutAt = reduced ? -10 : time
  label()
}

function label() {
  ui.num.textContent = `${String(index + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`
  ui.title.textContent = shots[index].title
  ui.ticks.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === index))
}

function render() {
  const s = shots[index]
  const p = Math.min(1, (time - shotStart) / BEAT)
  clock.uTime.value = time
  s.update(time, reduced ? 0.5 + (p - 0.5) * 0.3 : p)
  renderPass.scene = s.scene
  renderPass.camera = s.camera
  renderer.toneMappingExposure = s.exposure
  lens.uniforms.uTime.value = time
  lens.uniforms.uCut.value = time - cutAt
  lens.uniforms.uK.value = s.lens
  composer.render()
}

let slow = 0
let avg = 1 / 60

function frame(now: number) {
  const raw = (now - last) / 1000
  last = now
  if (raw < 0.5) {
    avg += (raw - avg) * 0.05
    slow = avg > 1 / 32 ? slow + raw : 0
    if (slow > 1.5 && quality > 0.5) {
      quality *= 0.8
      slow = 0
      avg = 1 / 60
      resize()
    }
  }
  if (playing) {
    time += Math.min(0.05, raw)
    if (time - shotStart >= BEAT) go(index + 1)
  }
  render()
  requestAnimationFrame(frame)
}

/* ---------- controls ---------- */

function setPlaying(v: boolean) {
  playing = v
  ui.play.setAttribute('aria-label', v ? 'Pause' : 'Play')
  ui.play.dataset.state = v ? 'playing' : 'paused'
}

ui.play.onclick = () => setPlaying(!playing)
ui.prev.onclick = () => go(index - 1)
ui.next.onclick = () => go(index + 1)
shots.forEach((s, i) => {
  const b = document.createElement('i')
  b.title = s.title
  b.onclick = () => go(i)
  ui.ticks.appendChild(b)
})

addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault()
    setPlaying(!playing)
  } else if (e.key === 'ArrowRight') go(index + 1)
  else if (e.key === 'ArrowLeft') go(index - 1)
  wake()
})

let idle = 0
function wake() {
  ui.root.classList.remove('is-idle')
  clearTimeout(idle)
  idle = window.setTimeout(() => ui.root.classList.add('is-idle'), 2600)
}
addEventListener('pointermove', wake)
addEventListener('pointerdown', wake)
addEventListener('resize', resize)

resize()
// compile every shot's shaders up front so cuts don't stutter
for (const s of shots) {
  s.update(0, 0)
  renderer.compile(s.scene, s.camera)
}

if (params.has('record')) {
  // offline rendering for scripts/record.mjs: time is stepped exactly, one frame per call
  ui.root.hidden = true
  Object.assign(window, {
    renderAt(t: number) {
      const n = Math.floor(t / BEAT)
      index = n % shots.length
      shotStart = n * BEAT
      cutAt = n > 0 ? shotStart : -10
      time = t
      render()
      return stage.toDataURL('image/jpeg', 0.94)
    },
    loopLength: BEAT * shots.length,
  })
} else {
  setPlaying(playing)
  label()
  wake()
  requestAnimationFrame(frame)
}
