import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { EASE } from './common'
import './Hero.css'

/*
  The hero is the argument in one frame. On the left, a geometric construction is drawn in
  hairlines: a square, its diagonal, an arc, the golden section, each measured. That is Ti —
  understanding how a thing is built. On the right, an amber line runs: inputs move along a
  conveyor and the output bars climb. That is Te — making the thing run.
  "Ti" is drawn as an outline before it is filled; "Te" arrives solid and already moving.
*/

const W = 1440
const H = 900

/* the construction, in drawing order */
const SQ = { x: 120, y: 170, s: 420 }
const PHI = 1.618
const CONSTRUCTION = [
  `M${SQ.x},${SQ.y} h${SQ.s} v${SQ.s} h${-SQ.s} Z`,
  `M${SQ.x + SQ.s / 2},${SQ.y + SQ.s} L${SQ.x + SQ.s},${SQ.y}`,
  `M${SQ.x + SQ.s / 2},${SQ.y + SQ.s} m${(SQ.s * Math.sqrt(5)) / 2},0 a${(SQ.s * Math.sqrt(5)) / 2},${(SQ.s * Math.sqrt(5)) / 2} 0 0 0 ${-(SQ.s * Math.sqrt(5)) / 2 + SQ.s / 2},${-SQ.s}`,
  `M${SQ.x + SQ.s},${SQ.y} h${SQ.s * (PHI - 1)} v${SQ.s} h${-SQ.s * (PHI - 1)}`,
  `M${SQ.x},${SQ.y + SQ.s} a${SQ.s},${SQ.s} 0 0 1 ${SQ.s},${-SQ.s}`,
  `M${SQ.x + SQ.s / 2},${SQ.y} v${SQ.s} M${SQ.x},${SQ.y + SQ.s / 2} h${SQ.s}`,
]

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const tiY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%'])
  const teX = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const artY = useTransform(scrollYProgress, [0, 1], [0, 120])

  /* pointer: the construction holds perfectly still — only the line on the right responds */
  const mx = useSpring(0, { stiffness: 60, damping: 20 })
  useEffect(() => {
    if (reduce) return
    const on = (e: PointerEvent) => mx.set((e.clientX / window.innerWidth - 0.5) * 2)
    window.addEventListener('pointermove', on)
    return () => window.removeEventListener('pointermove', on)
  }, [reduce, mx])
  const beltX = useTransform(mx, (v) => v * 14)

  const bars = [0.32, 0.45, 0.52, 0.66, 0.74, 0.9]

  return (
    <section className="hero" id="top" ref={ref} aria-labelledby="hero-title">
      <div className="hero__band" aria-hidden="true" />

      <motion.svg className="hero__art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ y: artY }}>
        {/* Ti: construction lines */}
        <g className="hero__construction">
          {CONSTRUCTION.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              className={i === 0 ? 'hero__c hero__c--main' : 'hero__c'}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.2 + i * 0.35 }}
            />
          ))}
          {/* dimension lines */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 2.4 }}>
            <line x1={SQ.x} x2={SQ.x + SQ.s} y1={SQ.y - 34} y2={SQ.y - 34} className="hero__dim" />
            <line x1={SQ.x} x2={SQ.x} y1={SQ.y - 42} y2={SQ.y - 26} className="hero__dim" />
            <line x1={SQ.x + SQ.s} x2={SQ.x + SQ.s} y1={SQ.y - 42} y2={SQ.y - 26} className="hero__dim" />
            <text x={SQ.x + SQ.s / 2} y={SQ.y - 42} textAnchor="middle" className="hero__dim-text">
              1.000
            </text>
            <line x1={SQ.x + SQ.s} x2={SQ.x + SQ.s * PHI} y1={SQ.y - 34} y2={SQ.y - 34} className="hero__dim" />
            <line x1={SQ.x + SQ.s * PHI} x2={SQ.x + SQ.s * PHI} y1={SQ.y - 42} y2={SQ.y - 26} className="hero__dim" />
            <text x={SQ.x + SQ.s * (1 + (PHI - 1) / 2)} y={SQ.y - 42} textAnchor="middle" className="hero__dim-text">
              0.618
            </text>
            <text x={SQ.x + SQ.s * PHI + 14} y={SQ.y + SQ.s} className="hero__dim-text">
              WHY THE RATIO HOLDS
            </text>
          </motion.g>
        </g>

        {/* Te: the belt */}
        <motion.g style={{ x: beltX }}>
          <motion.line
            x1={600}
            x2={W + 20}
            y1={530}
            y2={530}
            className="hero__belt"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1.2 }}
          />
          <g className={reduce ? 'hero__chevrons' : 'hero__chevrons hero__chevrons--run'}>
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${640 + i * 70},${516} l14,14 l-14,14`} className="hero__chev" />
            ))}
          </g>
          {bars.map((b, i) => (
            <motion.rect
              key={i}
              x={1010 + i * 62}
              width={40}
              y={740 - b * 160}
              height={b * 160}
              className={i === bars.length - 1 ? 'hero__bar hero__bar--last' : 'hero__bar'}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 1.6 + i * 0.12 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
            />
          ))}
          <text x={990} y={740} textAnchor="end" className="hero__dim-text hero__dim-text--te">
            OUTPUT / WEEK
          </text>
        </motion.g>
      </motion.svg>

      <div className="hero__inner wrap">
        <motion.div className="hero__meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }}>
          <span className="label">An exhibition in eight rooms</span>
          <span className="label label--muted hero__meta-mid">Models · Systems · Proof · Results</span>
          <span className="label">Fig. 00 — How it works / that it works</span>
        </motion.div>

        <h1 className="hero__title display" id="hero-title">
          <motion.span className="hero__ti" style={{ y: tiY }}>
            <svg className="hero__ti-svg" viewBox="0 0 100 74" aria-hidden="true">
              <motion.text
                x={0}
                y={66}
                className="hero__ti-text"
                initial={reduce ? false : { strokeDashoffset: 300, fillOpacity: 0 }}
                animate={{ strokeDashoffset: 0, fillOpacity: 1 }}
                transition={{ strokeDashoffset: { duration: 2.2, ease: 'easeInOut', delay: 0.3 }, fillOpacity: { duration: 0.8, delay: 2.3 } }}
              >
                Ti
              </motion.text>
            </svg>
            <span className="visually-hidden">Ti</span>
          </motion.span>
          <motion.span className="hero__vs serif" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1, ease: EASE }}>
            vs
          </motion.span>
          <motion.span className="hero__te-wrap" style={{ x: teX }}>
            <motion.span
              className="hero__te"
              initial={reduce ? false : { x: -160, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1], delay: 1.1 }}
            >
              Te
            </motion.span>
          </motion.span>
        </h1>

        <motion.p className="hero__sub serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.3, delay: 1.6, ease: EASE }}>
          Two ways of making things make sense.
        </motion.p>

        <motion.div className="hero__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 2.1 }}>
          <div className="hero__side hero__side--ti">
            <span className="label">Ti — Internal logic</span>
            <span className="serif hero__q">“Does this make sense?”</span>
          </div>
          <a className="hero__cue label" href="#difference">
            <span className="hero__cue-line" aria-hidden="true" />
            Enter
          </a>
          <div className="hero__side hero__side--te">
            <span className="label">Te — External logic</span>
            <span className="serif hero__q">“Does this work?”</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
