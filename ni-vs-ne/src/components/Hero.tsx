import { useEffect, useMemo, useRef } from 'react'
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { EASE, rng } from './common'
import './Hero.css'

/*
  The hero is the whole argument in one frame: many lines arrive at a single point
  from the left (Ni), and from that same point a tree opens to the right (Ne).
  The letterforms act it out too — "Ni" condenses, "Ne" expands.
*/

const W = 1440
const H = 900
const CX = 720
const CY = 520

type Seg = { d: string; depth: number }

function buildConvergence(): Seg[] {
  const r = rng(11)
  const out: Seg[] = []
  const n = 22
  for (let i = 0; i < n; i++) {
    const y0 = 40 + (i / (n - 1)) * (H - 80) + (r() - 0.5) * 30
    const x0 = -20 + r() * 120
    const c1x = x0 + 260 + r() * 160
    const c2x = CX - 220 - r() * 80
    const c2y = CY + (y0 - CY) * (0.12 + r() * 0.1)
    out.push({ d: `M${x0},${y0} C${c1x},${y0} ${c2x},${c2y} ${CX},${CY}`, depth: Math.abs(y0 - CY) / H })
  }
  return out
}

function buildDivergence(): Seg[] {
  const r = rng(29)
  const out: Seg[] = []
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    if (depth > 5) return
    const x2 = x + Math.cos(ang) * len
    const y2 = y + Math.sin(ang) * len
    const bend = (r() - 0.5) * 0.5
    const mx = x + Math.cos(ang + bend) * len * 0.55
    const my = y + Math.sin(ang + bend) * len * 0.55
    out.push({ d: `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, depth })
    const kids = depth === 0 ? 4 : 2 + (r() < 0.35 ? 1 : 0)
    const spread = depth === 0 ? 1.7 : 0.9 - depth * 0.08
    for (let k = 0; k < kids; k++) {
      const t = kids === 1 ? 0 : k / (kids - 1) - 0.5
      grow(x2, y2, ang + t * spread + (r() - 0.5) * 0.25, len * (0.66 + r() * 0.14), depth + 1)
    }
  }
  grow(CX, CY, 0, 190, 0)
  return out
}

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const conv = useMemo(buildConvergence, [])
  const div = useMemo(buildDivergence, [])

  /* Letterforms act out the idea: Ni narrows, Ne widens */
  const niW = useMotionValue(reduce ? 62 : 125)
  const neW = useMotionValue(reduce ? 125 : 62)
  useEffect(() => {
    if (reduce) return
    const a = animate(niW, 62, { duration: 2.2, ease: EASE, delay: 0.25 })
    const b = animate(neW, 125, { duration: 2.2, ease: EASE, delay: 0.25 })
    return () => {
      a.stop()
      b.stop()
    }
  }, [reduce, niW, neW])
  const niVar = useMotionTemplate`'wdth' ${niW}`
  const neVar = useMotionTemplate`'wdth' ${neW}`

  /* Scroll: the two words drift apart as you leave the frame */
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const niX = useTransform(scrollYProgress, [0, 1], ['0%', '-14%'])
  const neX = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const artY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const subY = useTransform(scrollYProgress, [0, 1], [0, -60])

  /* Pointer: a slight parallax, lines further from the point move more */
  const mx = useSpring(0, { stiffness: 40, damping: 18 })
  const my = useSpring(0, { stiffness: 40, damping: 18 })
  useEffect(() => {
    if (reduce) return
    const on = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2)
      my.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('pointermove', on)
    return () => window.removeEventListener('pointermove', on)
  }, [reduce, mx, my])
  const convX = useTransform(mx, (v) => v * -14)
  const convY = useTransform(my, (v) => v * -10)
  const divX = useTransform(mx, (v) => v * 18)
  const divY = useTransform(my, (v) => v * 12)

  return (
    <section className="hero" id="top" ref={ref} aria-labelledby="hero-title">
      <div className="hero__band" aria-hidden="true" />

      <motion.svg className="hero__art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ y: artY }}>
        <motion.g style={{ x: convX, y: convY }}>
          {conv.map((s, i) => (
            <motion.path
              key={i}
              d={s.d}
              className="hero__conv"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.2, ease: EASE, delay: 0.1 + s.depth * 0.9 }}
            />
          ))}
        </motion.g>
        <motion.g style={{ x: divX, y: divY }}>
          {div.map((s, i) => (
            <motion.path
              key={i}
              d={s.d}
              className={`hero__div hero__div--d${s.depth}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 1.3 + s.depth * 0.32 }}
            />
          ))}
        </motion.g>
        <motion.circle
          cx={CX}
          cy={CY}
          r={7}
          className="hero__point"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.6, 1] }}
          transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        />
        <circle cx={CX} cy={CY} r={22} className="hero__halo" />
      </motion.svg>

      <div className="hero__inner wrap">
        <motion.div
          className="hero__meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          <span className="label">An exhibition in eight rooms</span>
          <span className="label label--muted hero__meta-mid">Intuition · Pattern · Possibility · Time</span>
          <span className="label">Fig. 00 — Many → one → many</span>
        </motion.div>

        <h1 className="hero__title display" id="hero-title">
          <motion.span className="hero__ni" style={{ fontVariationSettings: niVar, x: niX }}>
            Ni
          </motion.span>
          <motion.span
            className="hero__vs serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.2, ease: EASE }}
          >
            vs
          </motion.span>
          <motion.span className="hero__ne" style={{ fontVariationSettings: neVar, x: neX }}>
            Ne
          </motion.span>
        </h1>

        <motion.p
          className="hero__sub serif"
          style={{ y: subY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3, delay: 1.5, ease: EASE }}
        >
          Two ways of navigating possibility.
        </motion.p>

        <motion.div
          className="hero__foot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.1 }}
        >
          <div className="hero__side hero__side--ni">
            <span className="label">Ni — Convergence</span>
            <span className="serif hero__q">“Where is this all leading?”</span>
          </div>
          <a className="hero__cue label" href="#difference">
            <span className="hero__cue-line" aria-hidden="true" />
            Enter
          </a>
          <div className="hero__side hero__side--ne">
            <span className="label">Ne — Divergence</span>
            <span className="serif hero__q">“What else could this become?”</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
