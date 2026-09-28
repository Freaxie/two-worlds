import { useEffect, useRef } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { Clock, EASE, rng } from '../components/common'
import './Hero.css'

const ECHOES = 6

/* Each echo trails the pointer with more lag than the last:
   the further back a memory, the slower it catches up with the present. */
function Echo({ i, mx, my }: { i: number; mx: MotionValue<number>; my: MotionValue<number> }) {
  const k = i + 1
  const sx = useSpring(mx, { stiffness: 60 / k, damping: 14 + k * 2, mass: 1 + k * 0.3 })
  const sy = useSpring(my, { stiffness: 60 / k, damping: 14 + k * 2, mass: 1 + k * 0.3 })
  const x = useTransform(sx, (v) => v * (10 + k * 12) - k * 7)
  const y = useTransform(sy, (v) => v * (6 + k * 8) + k * 3)
  return (
    <motion.span
      className="hero__echo"
      aria-hidden="true"
      style={{ x, y, opacity: 0.55 - i * 0.075 }}
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 0.55 - i * 0.075, scale: 1 }}
      transition={{ duration: 2.6, delay: 0.3 + i * 0.18, ease: EASE }}
    >
      Si
    </motion.span>
  )
}

/* Dense, uneven ticks for accumulated time, ending at a single red instant. */
const ticks = (() => {
  const r = rng(7)
  return Array.from({ length: 120 }, (_, i) => ({ x: (i / 120) * 88 + r() * 0.6, h: 4 + r() * r() * 22 }))
})()

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  // Se takes the pointer almost literally: a stiff spring with no memory of where it was.
  const seX = useSpring(useTransform(mx, (v) => v * 18), { stiffness: 900, damping: 40 })
  const seY = useSpring(useTransform(my, (v) => v * 12), { stiffness: 900, damping: 40 })

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Parallax: the present leaves quickly, what was experienced lingers.
  const siY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const seYs = useTransform(scrollYProgress, [0, 1], [0, -160])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    if (reduce) return
    const on = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', on)
    return () => window.removeEventListener('pointermove', on)
  }, [mx, my, reduce])

  return (
    <header className="hero" id="top" ref={ref}>
      <div className="hero__grid" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} style={{ left: `${((i + 1) / 12) * 100}%` }} />
        ))}
      </div>

      <div className="hero__meta wrap">
        <motion.p className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          An exhibition in eight rooms
        </motion.p>
        <motion.p className="label hero__meta-mid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          Introverted Sensing <span className="muted">/</span> Extraverted Sensing
        </motion.p>
        <motion.p className="label hero__clock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <span className="hero__rec" aria-hidden="true" />
          <span className="se">Now</span> <Clock />
        </motion.p>
      </div>

      <motion.h1 className="hero__title wrap" style={{ opacity: fade }}>
        <span className="sr-only">Si vs Se</span>
        <motion.span className="hero__si" style={{ y: siY }} aria-hidden="true">
          {!reduce && Array.from({ length: ECHOES }, (_, i) => <Echo key={i} i={i} mx={mx} my={my} />)}
          <motion.span
            className="hero__si-main"
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 2.4, ease: EASE }}
          >
            Si
          </motion.span>
        </motion.span>
        <motion.span
          className="hero__vs serif"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          vs
        </motion.span>
        <motion.span className="hero__se" style={{ y: seYs }} aria-hidden="true">
          <motion.span className="hero__se-inner" style={{ x: seX, y: seY }}>
            {/* Hard cut in: no fade, the present simply arrives */}
            <motion.span
              className="hero__se-main"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.2, 1] }}
              transition={{ delay: 0.9, duration: 0.24, times: [0, 0.2, 0.5, 1], ease: 'linear' }}
            >
              Se
            </motion.span>
            <svg className="hero__reticle" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M0 14V0h14M86 0h14v14M100 86v14H86M14 100H0V86" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </svg>
          </motion.span>
        </motion.span>
      </motion.h1>

      <div className="hero__foot wrap">
        <motion.p
          className="hero__tagline"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 1.2, ease: EASE }}
        >
          Two ways of experiencing <em className="serif">reality.</em>
        </motion.p>

        <div className="hero__defs">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1.4 }}>
            <p className="label si">Si — Experienced reality</p>
            <p className="hero__q">“What do I know from what I’ve experienced?”</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.15 }}>
            <p className="label se">Se — Immediate reality</p>
            <p className="hero__q">“What is happening right now?”</p>
          </motion.div>
        </div>

        <svg className="hero__axis" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="29.5" x2="100" y2="29.5" stroke="currentColor" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
          {ticks.map((t, i) => (
            <motion.line
              key={i}
              x1={t.x}
              x2={t.x}
              y1={30}
              y2={30 - t.h}
              className="hero__tick"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.012, duration: 0.8 }}
            />
          ))}
          <line x1="96" x2="96" y1="30" y2="0" className="hero__tick-now" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="hero__axis-labels label">
          <span className="si">Everything already lived</span>
          <span className="se">
            This instant
          </span>
        </div>
      </div>
    </header>
  )
}
