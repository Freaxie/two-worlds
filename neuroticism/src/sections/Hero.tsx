import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE, Guides, Mark } from '../lib/ui'
import { INTRO, Ridge, type RidgeSignal } from '../lib/fx'
import './Hero.css'

/* The cursor is a stressor. Bring it near the words: "Turbulent" amplifies the
   disturbance and settles slowly; "Assertive" barely registers it and settles at
   once. Same input, different gain — the whole exhibition in one gesture. */

const TU = 'Turbulent'.split('')
const AS = 'Assertive'.split('')
const seed = (i: number) => {
  const x = Math.sin(i * 91.7) * 43758.5453
  return x - Math.floor(x)
}

export function Hero() {
  const reduce = useReducedMotion()
  const tuRefs = useRef<(HTMLSpanElement | null)[]>([])
  const asRefs = useRef<(HTMLSpanElement | null)[]>([])
  const signal = useRef<RidgeSignal>({ stress: 0.05, focus: 0.3 })
  const [read, setRead] = useState({ tu: 0, as: 0 })

  useEffect(() => {
    if (reduce) return
    let px = -9999
    let py = -9999
    let lastMove = -1e9
    const state = { tu: TU.map(() => ({ x: 0, y: 0, r: 0 })), as: AS.map(() => ({ x: 0, y: 0, r: 0 })) }
    let tuLevel = 0
    let asLevel = 0
    let frame = 0
    let raf = 0

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      px = e.clientX
      py = e.clientY
      lastMove = performance.now()
    }
    window.addEventListener('pointermove', onMove)

    const tick = (now: number) => {
      const t = now / 1000
      /* Without a mouse (touch, idle) a slow ambient stressor pulses instead */
      const idle = now - lastMove > 2500
      const ambient = idle ? 0.05 + 0.25 * Math.max(0, Math.sin(t * 0.9)) ** 6 : 0

      const drive = (els: (HTMLSpanElement | null)[], st: { x: number; y: number; r: number }[], gain: number, ease: number) => {
        let sum = 0
        els.forEach((el, i) => {
          if (!el) return
          const b = el.getBoundingClientRect()
          const d = Math.hypot(b.left + b.width / 2 - px, b.top + b.height / 2 - py)
          const stress = idle ? ambient : Math.max(0, 1 - d / 520) ** 1.5
          sum += stress
          const a = seed(i + gain * 10) * Math.PI * 2
          const tremor = Math.sin(t * (9 + seed(i) * 7) + i) * stress
          const tx = (Math.cos(a) * 46 + tremor * 7) * stress * gain
          const ty = (Math.sin(a) * 38 + tremor * 5) * stress * gain
          const tr = (seed(i + 3) - 0.5) * 30 * stress * gain
          const s = st[i]
          s.x += (tx - s.x) * ease
          s.y += (ty - s.y) * ease
          s.r += (tr - s.r) * ease
          el.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) rotate(${s.r.toFixed(2)}deg)`
        })
        return sum / els.length
      }

      /* Turbulent: high gain, slow recovery. Assertive: low gain, fast recovery. */
      const tuS = drive(tuRefs.current, state.tu, 1, 0.07)
      const asS = drive(asRefs.current, state.as, 0.08, 0.35)
      tuLevel += (tuS - tuLevel) * 0.05
      asLevel += (asS * 0.1 - asLevel) * 0.3

      /* The ridgeline behind the title is the same signal, drawn large */
      const focusX = idle ? 0.3 + Math.sin(t * 0.25) * 0.15 : px / window.innerWidth
      signal.current.stress = tuLevel
      signal.current.focus += (focusX - signal.current.focus) * 0.05

      if (++frame % 6 === 0) setRead({ tu: Math.round(tuLevel * 100), as: Math.round(asLevel * 100) })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduce])

  return (
    <header className="hero" id="top">
      <Guides />
      <Ridge signal={signal} ground="paper" rows={34} split={0.56} className="hero__field" />

      <div className="hero__top wrap grid">
        <motion.p className="hero__kicker label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: INTRO + 0.2 }}>
          An exhibition in eight parts
        </motion.p>
        <motion.p
          className="hero__kicker hero__kicker--r label label--muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: INTRO + 0.35 }}
        >
          On neuroticism, high and low
        </motion.p>
      </div>

      <h1 className="hero__title wrap" aria-label="Turbulent versus Assertive">
        <span className="hero__line hero__line--tu" aria-hidden="true" data-cursor="tu">
          {TU.map((c, i) => (
            <motion.span
              key={i}
              className="hero__mask"
              initial={{ y: '110%', rotate: 6 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: INTRO + 0.1 + i * 0.03 }}
            >
              <span className="hero__ch" ref={(el) => void (tuRefs.current[i] = el)}>
                {c}
              </span>
            </motion.span>
          ))}
        </span>
        <span className="hero__line hero__line--as" aria-hidden="true" data-cursor="as">
          <motion.span className="hero__vs serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: INTRO + 0.9 }}>
            vs
          </motion.span>
          {AS.map((c, i) => (
            <motion.span
              key={i}
              className="hero__mask"
              initial={{ y: '110%', rotate: 6 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: INTRO + 0.3 + i * 0.03 }}
            >
              <span className="hero__ch" ref={(el) => void (asRefs.current[i] = el)}>
                {c}
              </span>
            </motion.span>
          ))}
        </span>
      </h1>

      <div className="hero__foot wrap grid">
        <motion.p className="hero__sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: INTRO + 1.1 }}>
          Two ways a mind responds <span className="serif">to the same weather.</span>
        </motion.p>

        <motion.dl className="hero__defs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: INTRO + 1.4 }}>
          <div className="hero__def">
            <dt className="label tu">
              <Mark who="tu" size={11} /> Turbulent — high neuroticism
            </dt>
            <dd className="serif">“What if it goes wrong?”</dd>
          </div>
          <div className="hero__def">
            <dt className="label as">
              <Mark who="as" size={11} /> Assertive — low neuroticism
            </dt>
            <dd className="serif">“It’ll be fine.”</dd>
          </div>
        </motion.dl>

        {!reduce && (
          <motion.div className="hero__meter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: INTRO + 1.6 }} aria-hidden="true">
            <span className="label tu">Arousal {String(read.tu).padStart(2, '0')}</span>
            <span className="hero__meter-track">
              <span className="hero__meter-bar hero__meter-bar--tu" style={{ transform: `scaleX(${Math.min(1, read.tu / 100)})` }} />
              <span className="hero__meter-bar hero__meter-bar--as" style={{ transform: `scaleX(${Math.min(1, read.as / 100)})` }} />
            </span>
            <span className="label as">Arousal {String(read.as).padStart(2, '0')}</span>
            <span className="hero__meter-cap label label--muted">Bring the cursor close — the cursor is the stressor</span>
          </motion.div>
        )}
      </div>
    </header>
  )
}
