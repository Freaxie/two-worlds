/* ------------------------------------------------------------------
   BLUE HOUR — the projector
   Paints the current shot to an offscreen canvas, pushes it through
   the lens, and cuts to the next shot on a steady beat.
------------------------------------------------------------------- */

import './dream.css'
import { createLens } from './lens'
import { SHOTS } from './shots'
import { clamp, ease, lerp, makeSprites, type Frame } from './paint'

const params = new URLSearchParams(location.search)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const BEAT = reduced ? 5 : Number(params.get('beat')) || 1.7
const MAX_SCENE = 1152

const stage = document.getElementById('stage') as HTMLCanvasElement
const scene = document.createElement('canvas')
const scratch = document.createElement('canvas')
const ctx = scene.getContext('2d')!
const sprites = makeSprites()
let lens = null as ReturnType<typeof createLens>
try {
  lens = createLens(stage)
} catch (e) {
  console.error(e)
}
// without WebGL, show the painted frame directly
const out = lens ? null : stage.getContext('2d')

const ui = {
  root: document.getElementById('ui')!,
  num: document.getElementById('shot-num')!,
  title: document.getElementById('shot-title')!,
  ticks: document.getElementById('ticks')!,
  play: document.getElementById('play') as HTMLButtonElement,
  prev: document.getElementById('prev') as HTMLButtonElement,
  next: document.getElementById('next') as HTMLButtonElement,
}

let F: Frame
/** drops when the device can't keep up, trading sharpness for a steady frame rate */
let quality = 1
let painters: ((c: CanvasRenderingContext2D, t: number, p: number) => void)[] = []

function resize() {
  const vw = innerWidth
  const vh = innerHeight
  const s = Math.min(1, MAX_SCENE / Math.max(vw, vh)) * quality
  const W = Math.round(vw * s)
  const H = Math.round(vh * s)
  scene.width = scratch.width = W
  scene.height = scratch.height = H
  const u = Math.min(W, H)
  F = { W, H, u, cx: W / 2, cy: H / 2, ext: Math.hypot(W, H) * 0.62 }
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const ow = Math.min(2400, Math.round(vw * dpr))
  const oh = Math.round((ow / vw) * vh)
  if (lens) lens.resize(ow, oh)
  else {
    stage.width = ow
    stage.height = oh
  }
  // compose each shot for this frame size (painters are cheap to build)
  painters = SHOTS.map((s) => s.compose(F, sprites, scratch))
}

/* ---------- playback state ---------- */

let index = clamp(Math.floor(Number(params.get('shot')) || 1) - 1, 0, SHOTS.length - 1)
let clock = 0
let shotStart = -(Number(params.get('t')) || 0)
let cutAt = -10
let playing = !params.has('still')
let last = performance.now()

function go(i: number) {
  index = (i + SHOTS.length) % SHOTS.length
  shotStart = clock
  cutAt = reduced ? -10 : clock
  label()
}

function label() {
  ui.num.textContent = `${String(index + 1).padStart(2, '0')} / ${SHOTS.length}`
  ui.title.textContent = SHOTS[index].title
  ui.ticks.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === index))
}

function paint() {
  const shot = SHOTS[index]
  const p = clamp((clock - shotStart) / BEAT)
  const e = ease(p)
  const cam = shot.cam
  const damp = reduced ? 0.4 : 1
  // the lens magnifies the centre by (1 + k), so the camera pulls back to compensate
  const k = 0.55 * (cam.lens ?? 1)
  const zoom = (lerp(cam.zoom[0], cam.zoom[1], e) * 0.8) / (1 + k * 0.7)
  const roll = (lerp(cam.roll[0], cam.roll[1], e) * damp * Math.PI) / 180
  let px = lerp(cam.pan[0][0], cam.pan[1][0], e) * damp
  let py = lerp(cam.pan[0][1], cam.pan[1][1], e) * damp
  if (cam.shake && !reduced) {
    px += Math.sin(clock * 23) * cam.shake + Math.sin(clock * 37) * cam.shake * 0.5
    py += Math.cos(clock * 19) * cam.shake
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.translate(F.cx, F.cy)
  ctx.rotate(roll)
  ctx.scale(zoom, zoom)
  ctx.translate(-F.cx + px * F.u, -F.cy + py * F.u)
  painters[index](ctx, clock, p)

  if (lens) lens.render(scene, clock, clock - cutAt, k)
  else out!.drawImage(scene, 0, 0, stage.width, stage.height)
}

let slow = 0
let avg = 1 / 60

function frame(now: number) {
  const raw = (now - last) / 1000
  const dt = Math.min(0.05, raw)
  last = now
  if (raw < 0.5) {
    avg += (raw - avg) * 0.05
    slow = avg > 1 / 36 ? slow + raw : 0
    if (slow > 1.2 && quality > 0.55) {
      quality *= 0.85
      slow = 0
      avg = 1 / 60
      resize()
    }
  }
  if (playing) {
    clock += dt
    if (clock - shotStart >= BEAT) go(index + 1)
  }
  paint()
  requestAnimationFrame(frame)
}

/* ---------- controls ---------- */

function setPlaying(v: boolean) {
  playing = v
  ui.play.setAttribute('aria-pressed', String(!v))
  ui.play.setAttribute('aria-label', v ? 'Pause' : 'Play')
  ui.play.dataset.state = v ? 'playing' : 'paused'
}

ui.play.onclick = () => setPlaying(!playing)
ui.prev.onclick = () => go(index - 1)
ui.next.onclick = () => go(index + 1)
SHOTS.forEach((s, i) => {
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
setPlaying(playing)
label()
wake()
requestAnimationFrame(frame)
