/* ------------------------------------------------------------------
   BLUE HOUR — the projector
   Loads the assets, cuts between six 3D shots on the bars of the
   score, and keeps picture locked to sound while the music plays.
------------------------------------------------------------------- */

import './dream.css'
import * as THREE from 'three'
import { loadAssets } from './assets'
import { createPipeline } from './post'
import { clock } from './world/kit'
import { buildShots, type Shot } from './world/shots'

const params = new URLSearchParams(location.search)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const recording = params.has('record')
/** one shot per bar of the score (60 bpm, 4/4) */
const BEAT = 4

const stage = document.getElementById('stage') as HTMLCanvasElement
const $ = (id: string) => document.getElementById(id)!
const ui = {
  root: $('ui'),
  loader: $('loader'),
  bar: $('loader-bar'),
  status: $('loader-status'),
  start: $('start') as HTMLButtonElement,
  startMuted: $('start-muted') as HTMLButtonElement,
  num: $('shot-num'),
  title: $('shot-title'),
  ticks: $('ticks'),
  play: $('play') as HTMLButtonElement,
  prev: $('prev') as HTMLButtonElement,
  next: $('next') as HTMLButtonElement,
  sound: $('sound') as HTMLButtonElement,
}

let renderer: THREE.WebGLRenderer
try {
  renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: recording })
} catch {
  ui.status.textContent = 'This reel needs WebGL, which is turned off in this browser.'
  throw new Error('WebGL unavailable')
}
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
const pipeline = createPipeline(renderer)

let shots: Shot[] = []
let LOOP = BEAT

/* ---------- sizing ---------- */

/** drops when the device can't keep up, trading sharpness for a steady frame rate */
let quality = 1

function resize() {
  const w = innerWidth
  const h = innerHeight
  const pr = Math.min(devicePixelRatio || 1, 1.5) * quality
  renderer.setPixelRatio(pr)
  renderer.setSize(w, h, false)
  pipeline.setSize(w, h, pr)
  for (const s of shots) {
    s.camera.aspect = w / h
    // on tall screens widen the view rather than crop the composition
    s.camera.zoom = w < h ? w / h + 0.3 : 1
    s.camera.updateProjectionMatrix()
  }
}

/* ---------- sound ---------- */

let audio: AudioContext | null = null
let buffer: AudioBuffer | null = null
let source: AudioBufferSourceNode | null = null
let gain: GainNode | null = null
let audioStart = 0
let soundOn = false

function startSound(at: number) {
  if (!audio || !buffer || !gain) return
  stopSound()
  source = audio.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.loopStart = 0
  source.loopEnd = LOOP
  source.connect(gain)
  const offset = ((at % LOOP) + LOOP) % LOOP
  source.start(0, offset)
  audioStart = audio.currentTime - at
  gain.gain.cancelScheduledValues(audio.currentTime)
  gain.gain.setValueAtTime(0, audio.currentTime)
  gain.gain.linearRampToValueAtTime(0.9, audio.currentTime + 0.4)
}

function stopSound() {
  source?.stop()
  source?.disconnect()
  source = null
}

async function setSound(on: boolean) {
  soundOn = on
  ui.sound.setAttribute('aria-pressed', String(on))
  ui.sound.setAttribute('aria-label', on ? 'Mute' : 'Sound on')
  ui.sound.dataset.state = on ? 'on' : 'off'
  if (!audio) return
  if (on && playing) {
    await audio.resume()
    startSound(time)
  } else stopSound()
}

/* ---------- playback ---------- */

let time = (Math.max(1, Math.floor(Number(params.get('shot')) || 1)) - 1) * BEAT + (Number(params.get('t')) || 0)
let playing = !params.has('still')
let last = performance.now()
let index = -1
let cutAt = -10

function shotAt(t: number) {
  return Math.floor((((t % LOOP) + LOOP) % LOOP) / BEAT) % shots.length
}

function label() {
  ui.num.textContent = `${String(index + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`
  ui.title.textContent = shots[index].title
  ui.ticks.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === index))
}

function jump(i: number) {
  const n = shots.length
  const k = ((i % n) + n) % n
  time = Math.floor(time / LOOP) * LOOP + k * BEAT + 0.001
  if (soundOn && playing) startSound(time)
}

function render() {
  const i = shotAt(time)
  if (i !== index) {
    index = i
    // the ripple is timed from the bar line, wherever playback entered the shot
    cutAt = Math.floor(time / BEAT) * BEAT
    pipeline.cut()
    label()
  }
  const s = shots[index]
  const local = (((time % LOOP) + LOOP) % LOOP) - index * BEAT
  const p = Math.min(1, local / BEAT)
  clock.uTime.value = time
  s.update(time, reduced ? 0.5 + (p - 0.5) * 0.3 : p)
  renderer.toneMappingExposure = s.exposure
  const look = reduced ? { ...s.look, motion: 0 } : s.look
  pipeline.render(s.scene, s.camera, look, time, reduced ? 10 : time - cutAt)
}

let slow = 0
let avg = 1 / 60

function frame(now: number) {
  const raw = (now - last) / 1000
  last = now
  if (raw < 0.5) {
    avg += (raw - avg) * 0.05
    slow = avg > 1 / 30 ? slow + raw : 0
    if (slow > 1.5 && quality > 0.5) {
      quality *= 0.85
      slow = 0
      avg = 1 / 60
      resize()
    }
  }
  if (playing) {
    // while the music plays, it is the clock
    if (soundOn && audio && source) time = audio.currentTime - audioStart
    else time += Math.min(0.05, raw)
  }
  render()
  requestAnimationFrame(frame)
}

/* ---------- controls ---------- */

function setPlaying(v: boolean) {
  playing = v
  ui.play.setAttribute('aria-label', v ? 'Pause' : 'Play')
  ui.play.dataset.state = v ? 'playing' : 'paused'
  if (soundOn) {
    if (v) startSound(time)
    else stopSound()
  }
}

let idle = 0
function wake() {
  ui.root.classList.remove('is-idle')
  clearTimeout(idle)
  idle = window.setTimeout(() => ui.root.classList.add('is-idle'), 2600)
}

function wire() {
  ui.play.onclick = () => setPlaying(!playing)
  ui.prev.onclick = () => jump(index - 1)
  ui.next.onclick = () => jump(index + 1)
  ui.sound.onclick = () => setSound(!soundOn)
  shots.forEach((s, i) => {
    const b = document.createElement('i')
    b.title = s.title
    b.onclick = () => jump(i)
    ui.ticks.appendChild(b)
  })
  addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      setPlaying(!playing)
    } else if (e.key === 'ArrowRight') jump(index + 1)
    else if (e.key === 'ArrowLeft') jump(index - 1)
    else if (e.key === 'm') setSound(!soundOn)
    wake()
  })
  addEventListener('pointermove', wake)
  addEventListener('pointerdown', wake)
  addEventListener('resize', resize)
}

/* ---------- boot ---------- */

async function boot() {
  const assets = await loadAssets((f) => {
    ui.bar.style.transform = `scaleX(${f})`
    ui.status.textContent = `Loading skies, models and score · ${Math.round(f * 100)}%`
  })
  ui.status.textContent = 'Building the sets…'
  await new Promise((r) => setTimeout(r, 30))
  shots = buildShots(assets)
  LOOP = BEAT * shots.length
  resize()
  // compile every shot's shaders up front so the cuts never stutter
  for (const s of shots) {
    s.update(0, 0)
    renderer.compile(s.scene, s.camera)
  }

  if (recording) {
    ui.root.hidden = true
    ui.loader.hidden = true
    Object.assign(window, {
      renderAt(t: number) {
        time = t
        render()
        return stage.toDataURL('image/jpeg', 0.94)
      },
      loopLength: LOOP,
    })
    return
  }

  audio = new AudioContext()
  gain = audio.createGain()
  gain.connect(audio.destination)
  buffer = await audio.decodeAudioData(assets.score.slice(0))

  wire()
  ui.loader.classList.add('is-ready')
  ui.status.textContent = 'Best with sound.'
  const begin = (withSound: boolean) => {
    ui.loader.classList.add('is-gone')
    setTimeout(() => (ui.loader.hidden = true), 900)
    setPlaying(true)
    setSound(withSound)
    wake()
  }
  ui.start.onclick = () => begin(true)
  ui.startMuted.onclick = () => begin(false)
  ui.start.focus()
  // the picture runs behind the title card until the viewer chooses
  requestAnimationFrame(frame)
}

boot().catch((e) => {
  console.error(e)
  ui.status.textContent = 'The reel could not load. Reload the page to try again.'
})
