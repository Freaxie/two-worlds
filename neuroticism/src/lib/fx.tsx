import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { EASE, Mark } from './ui'
import './fx.css'

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Seconds the hero waits while the intro plays (zero when motion is reduced) */
export const INTRO = prefersReduced() ? 0 : 1.5

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* ------------------------------------------------------------------
   Ridge — stacked seismograph lines on a canvas, each occluding the one
   behind it. The upper band is the turbulent register: its spikes swell
   with `stress` and gather under `focus` (0–1 across the width). The lower
   band is the assertive register: a slow swell that barely notices.
------------------------------------------------------------------- */

export type RidgeSignal = { stress: number; focus: number }

type RidgeProps = {
  signal: MutableRefObject<RidgeSignal>
  rows?: number
  split?: number
  ground: 'paper' | 'ink'
  className?: string
}

export function Ridge({ signal, rows = 30, split = 0.55, ground, className }: RidgeProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const css = getComputedStyle(document.documentElement)
    const tu = ground === 'ink' ? '#a386ff' : css.getPropertyValue('--tu').trim() || '#5a1fe0'
    const as = ground === 'ink' ? '#4fc79a' : css.getPropertyValue('--as').trim() || '#0b7a55'
    const fill = ground === 'ink' ? '#0f0f0e' : css.getPropertyValue('--paper').trim() || '#f1eee7'
    let w = 0
    let h = 0
    let visible = true
    let raf = 0
    const reduce = prefersReduced()

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(cv)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const gap = h / (rows + 4)
      const step = Math.max(6, w / 160)
      const { stress, focus } = signal.current
      const tick = Math.floor(t * 12)
      for (let r = 0; r < rows; r++) {
        const base = gap * (r + 3)
        const upper = r < rows * split
        const k = r / rows
        ctx.beginPath()
        ctx.moveTo(0, base)
        for (let x = 0; x <= w + step; x += step) {
          const u = x / w
          let y: number
          if (upper) {
            const env = Math.exp(-(((u - focus) / (0.16 + stress * 0.1)) ** 2))
            const jag =
              Math.sin(u * 40 + t * 3 + r) * 0.35 + Math.sin(u * 97 - t * 5 + r * 2) * 0.25 + (hash(Math.round(x / step) * 31 + r * 7 + tick) - 0.5) * 1.2
            const amp = gap * (0.15 + env * (0.6 + stress * 5.5))
            y = base - Math.abs(jag) * amp * (0.6 + 0.4 * Math.sin(r * 1.7 + t))
          } else {
            const amp = gap * (0.25 + stress * 0.25)
            y = base - (Math.sin(u * 6 + t * 0.6 + r * 0.5) * 0.5 + 0.5) * amp * (0.5 + 0.5 * Math.sin(u * 3.1 + r))
          }
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w + step, base + gap * 3)
        ctx.lineTo(0, base + gap * 3)
        ctx.closePath()
        ctx.fillStyle = fill
        ctx.fill()
        ctx.globalAlpha = upper ? 0.3 + (1 - k) * 0.4 : 0.1 + (1 - k) * 0.3
        ctx.strokeStyle = upper ? tu : as
        ctx.lineWidth = 1.1
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    const loop = (now: number) => {
      if (visible) draw(now / 1000)
      raf = requestAnimationFrame(loop)
    }
    if (reduce) draw(0)
    else raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [signal, rows, split, ground])

  return <canvas ref={ref} className={`ridge ${className ?? ''}`} aria-hidden="true" />
}

/* ------------------------------------------------------------------
   Seismo — a divider that records the scroll. The pen starts on the
   turbulent side and writes its way across to the calm one.
------------------------------------------------------------------- */

const SW = 1440
const SH = 90
const seismoY = (x: number) => {
  const u = x / SW
  if (u < 0.5) {
    const amp = 34 * (1 - u * 1.6) + 4
    return 45 + (Math.sin(x * 0.21) * 0.5 + (hash(Math.round(x / 6)) - 0.5) * 1.2) * amp
  }
  return 45 + Math.sin(x * 0.012) * 5 * (1.2 - u)
}
const SEISMO_TU = 'M' + Array.from({ length: 121 }, (_, i) => `${i * 6} ${seismoY(i * 6).toFixed(1)}`).join(' L')
const SEISMO_AS = 'M' + Array.from({ length: 61 }, (_, i) => `${720 + i * 12} ${seismoY(720 + i * 12).toFixed(1)}`).join(' L')

export function Seismo() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'start 30%'] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24 })
  const clipW = useTransform(p, (v) => v * SW)
  const penX = useTransform(p, (v) => `${v * 100}%`)
  const penY = useTransform(p, (v) => `${(seismoY(v * SW) / SH) * 100}%`)
  const penColor = useTransform(p, [0.45, 0.55], ['var(--tu)', 'var(--as)'])
  return (
    <div ref={ref} className="seismo" aria-hidden="true">
      <svg viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none">
        <defs>
          <clipPath id="seismo-clip">
            <motion.rect x="0" y="0" height={SH} style={{ width: clipW }} />
          </clipPath>
        </defs>
        <line x1="0" x2={SW} y1="45" y2="45" stroke="var(--rule)" vectorEffect="non-scaling-stroke" />
        <g clipPath="url(#seismo-clip)">
          <path d={SEISMO_TU} fill="none" stroke="var(--tu)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          <path d={SEISMO_AS} fill="none" stroke="var(--as)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <motion.span className="seismo__pen" style={{ left: penX, top: penY, backgroundColor: penColor }} />
    </div>
  )
}

/* ------------------------------------------------------------------
   Marquee — two bands of inner speech. The turbulent band runs fast and
   speeds up with every flick of the scroll; the assertive band drifts the
   other way and barely registers the push.
------------------------------------------------------------------- */

const wrap = (min: number, max: number, v: number) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

function Band({ items, who, base }: { items: string[]; who: 'tu' | 'as'; base: number }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const { scrollY } = useScroll()
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const gain = useTransform(vel, [-1500, 0, 1500], who === 'tu' ? [-6, 0, 6] : [-0.6, 0, 0.6], { clamp: false })
  const dir = useRef(1)
  useAnimationFrame((_, delta) => {
    if (reduce) return
    const g = gain.get()
    if (g < 0) dir.current = -1
    else if (g > 0) dir.current = 1
    const move = dir.current * base * (delta / 1000) * (1 + Math.abs(g))
    x.set(x.get() + move)
  })
  const tx = useTransform(x, (v) => `${wrap(-50, 0, who === 'tu' ? -v : v)}%`)
  const row = (k: number) => (
    <span className="band__run" key={k}>
      {items.map((t, i) => (
        <span key={i} className="band__item">
          {t}
          <Mark who={who} size={28} />
        </span>
      ))}
    </span>
  )
  return (
    <div className={`band band--${who}`} data-cursor={who}>
      <motion.div className="band__track" style={{ x: tx }}>
        {row(0)}
        {row(1)}
      </motion.div>
    </div>
  )
}

export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <Band who="tu" base={3.2} items={['What if', 'Did I', 'Should I have', 'What am I missing', 'Is it me', 'What if']} />
      <Band who="as" base={1} items={['It’ll be fine', 'Next', 'We’ll handle it', 'Sleep on it', 'Not yet a problem']} />
    </div>
  )
}

/* ------------------------------------------------------------------
   Cursor — a ring that trails the pointer. Over turbulent material it
   jitters; over assertive material it levels out.
------------------------------------------------------------------- */

type CursorMode = 'none' | 'link' | 'tu' | 'as'

export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<CursorMode>('none')
  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)
  const rx = useSpring(mx, { stiffness: 380, damping: 32, mass: 0.5 })
  const ry = useSpring(my, { stiffness: 380, damping: 32, mass: 0.5 })

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches && !prefersReduced()
    setEnabled(fine)
    if (!fine) return
    const move = (e: PointerEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
      const el = e.target as Element | null
      const tagged = el?.closest?.('[data-cursor]')?.getAttribute('data-cursor') as CursorMode | null
      setMode(tagged ?? (el?.closest?.('a, button, input, [role=button]') ? 'link' : 'none'))
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])

  if (!enabled) return null
  return (
    <>
      <motion.div className={`cursor cursor--${mode}`} style={{ x: rx, y: ry }} aria-hidden="true">
        <span className="cursor__ring" />
        <span className="cursor__level" />
      </motion.div>
      <motion.div className="cursor-dot" style={{ x: mx, y: my }} aria-hidden="true" />
    </>
  )
}

/* ------------------------------------------------------------------
   Intro — calibration. A trace writes itself from turbulent to calm,
   then the instrument opens.
------------------------------------------------------------------- */

export function Intro() {
  const [show, setShow] = useState(INTRO > 0)
  const n = useMotionValue(0)
  const [count, setCount] = useState(0)
  useMotionValueEvent(n, 'change', (v) => setCount(Math.round(v)))
  const clip = useTransform(n, (v) => `inset(0 ${100 - v}% 0 0)`)

  useEffect(() => {
    if (!show) return
    const c = animate(n, 100, { duration: 1.05, ease: [0.6, 0, 0.3, 1] })
    const t = setTimeout(() => setShow(false), 1250)
    return () => {
      c.stop()
      clearTimeout(t)
    }
  }, [show, n])

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="intro" aria-hidden="true" exit={{ pointerEvents: 'none' }} transition={{ duration: 0.9 }}>
          <motion.div className="intro__half intro__half--top" exit={{ y: '-100%' }} transition={{ duration: 0.9, ease: EASE }}>
            <span className="label intro__label">Calibrating sensitivity</span>
          </motion.div>
          <motion.div className="intro__half intro__half--bot" exit={{ y: '100%' }} transition={{ duration: 0.9, ease: EASE }}>
            <span className="intro__count">{String(count).padStart(3, '0')}</span>
          </motion.div>
          <motion.svg className="intro__trace" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" style={{ clipPath: clip }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <path d={SEISMO_TU} fill="none" stroke="#a386ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path d={SEISMO_AS} fill="none" stroke="#4fc79a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
