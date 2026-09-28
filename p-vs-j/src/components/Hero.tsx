import { useEffect, useMemo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { EASE, rng } from './common'
import { smooth } from './tree'
import './Hero.css'

/*
  The hero is the argument in one frame. From a single point — now — P's paths wander off
  to the left, unhurried, ending in open rings. J's side is a ruled line and a grid of cells
  filling in, one checked box at a time. The letters act it out: P floats, J snaps into place.
*/

const W = 1440
const H = 900
const CX = 720
const CY = 520

function buildWander() {
  const r = rng(14)
  return Array.from({ length: 11 }, (_, i) => {
    const pts: [number, number][] = [[CX, CY]]
    let x = CX
    let y = CY
    let ang = Math.PI + (i / 10 - 0.5) * 2.2
    const steps = 6 + Math.floor(r() * 4)
    for (let s = 0; s < steps; s++) {
      ang += (r() - 0.5) * 1.3
      const len = 60 + r() * 70
      x += Math.cos(ang) * len
      y += Math.sin(ang) * len
      pts.push([x, y])
    }
    return { d: smooth(pts), end: pts[pts.length - 1], delay: r() * 0.8 }
  })
}

const COLS = 7
const ROWS = 3
const GX = 790
const GY = 600
const CELL = 44

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const wander = useMemo(buildWander, [])
  const checked = useMemo(() => {
    const r = rng(3)
    return Array.from({ length: COLS * ROWS }, (_, i) => i < 14 && r() < 0.85)
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const pY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const jY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const artY = useTransform(scrollYProgress, [0, 1], [0, 120])

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
  /* P's side drifts with the pointer; J's grid holds still */
  const wx = useTransform(mx, (v) => v * -22)
  const wy = useTransform(my, (v) => v * -16)

  return (
    <section className="hero" id="top" ref={ref} aria-labelledby="hero-title">
      <div className="hero__band" aria-hidden="true" />

      <motion.svg className="hero__art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ y: artY }}>
        <motion.g style={{ x: wx, y: wy }}>
          {wander.map((w, i) => (
            <g key={i}>
              <motion.path
                d={w.d}
                className="hero__wander"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.2, ease: 'easeOut', delay: 0.4 + w.delay }}
              />
              <motion.circle
                cx={w.end[0]}
                cy={w.end[1]}
                r={6}
                className="hero__open"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 3.2 + w.delay }}
              />
            </g>
          ))}
        </motion.g>

        {/* J: the ruled line, with milestones */}
        <motion.line
          x1={CX}
          y1={CY}
          x2={W + 10}
          y2={CY}
          className="hero__rule"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.6 }}
        />
        {Array.from({ length: 7 }, (_, i) => (
          <motion.line
            key={i}
            x1={CX + 100 + i * 100}
            x2={CX + 100 + i * 100}
            y1={CY - 12}
            y2={CY + 12}
            className="hero__tick"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 1.2 + i * 0.06 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}

        {/* J: the grid, cells checked off in reading order */}
        <g className="hero__grid">
        {checked.map((c, i) => {
          const col = i % COLS
          const row = Math.floor(i / COLS)
          const x = GX + col * CELL
          const y = GY + row * CELL
          return (
            <g key={i}>
              <motion.rect
                x={x}
                y={y}
                width={CELL - 10}
                height={CELL - 10}
                className="hero__cell"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 1.3 + i * 0.03 }}
              />
              {c && (
                <motion.rect
                  x={x}
                  y={y}
                  width={CELL - 10}
                  height={CELL - 10}
                  className="hero__cell-done"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.25, delay: 2.1 + i * 0.07, ease: 'backOut' }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
              )}
            </g>
          )
        })}
        </g>

        <motion.circle
          cx={CX}
          cy={CY}
          r={8}
          className="hero__point"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.6, 1] }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
        />
        <text x={CX} y={CY + 36} textAnchor="middle" className="hero__now">
          NOW
        </text>
      </motion.svg>

      <div className="hero__inner wrap">
        <motion.div className="hero__meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }}>
          <span className="label">An exhibition in eight rooms</span>
          <span className="label label--muted hero__meta-mid">Plans · Options · Deadlines · Change</span>
          <span className="label">Fig. 00 — Open ← now → closed</span>
        </motion.div>

        <h1 className="hero__title display" id="hero-title">
          <motion.span className="hero__p-wrap" style={{ y: pY }}>
            <motion.span
              className="hero__p"
              initial={{ opacity: 0 }}
              animate={
                reduce
                  ? { opacity: 1 }
                  : { opacity: 1, y: [0, -14, 4, 0], rotate: [-2, 3, -1, -2] }
              }
              transition={{
                opacity: { duration: 1.2, delay: 0.2 },
                y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              P
            </motion.span>
          </motion.span>
          <motion.span
            className="hero__vs serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1, ease: EASE }}
          >
            vs
          </motion.span>
          <motion.span className="hero__j-wrap" style={{ y: jY }}>
            <motion.span
              className="hero__j"
              initial={reduce ? false : { opacity: 0, y: -80, rotate: -9 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.9 }}
            >
              J
            </motion.span>
            <motion.span
              className="hero__j-rule"
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 1.4 }}
            />
          </motion.span>
        </h1>

        <motion.p className="hero__sub serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.3, delay: 1.5, ease: EASE }}>
          Two ways of meeting an unfinished world.
        </motion.p>

        <motion.div className="hero__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 2.1 }}>
          <div className="hero__side hero__side--p">
            <span className="label">P — Openness</span>
            <span className="serif hero__q">“What if we keep it open?”</span>
          </div>
          <a className="hero__cue label" href="#difference">
            <span className="hero__cue-line" aria-hidden="true" />
            Enter
          </a>
          <div className="hero__side hero__side--j">
            <span className="label">J — Closure</span>
            <span className="serif hero__q">“Is this decided?”</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
