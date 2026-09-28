import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag } from '../lib/ui'
import './Failure.css'

export function Failure() {
  return (
    <section id="failure" className="part part--rule fail" aria-labelledby="failure-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="failure"
          n="05"
          name="Failure modes"
          title={['Every strength', 'has a way', 'of overrunning.']}
          lede="Unchecked, each function keeps doing the thing it is good at — past the point where it helps. The failures are mirror images: one never leaves the model, the other leaves before there is one."
        />

        <div className="fail__grid grid">
          <article className="fail__plate fail__plate--ti">
            <div className="fail__head">
              <Tag who="ti">→ Endless analysis</Tag>
              <span className="label label--muted">Fig. 5.1</span>
            </div>
            <Zeno />
            <h3 className="fail__title display">
              A model so refined <span className="serif">it never meets the world.</span>
            </h3>
            <Symptoms
              items={[
                'Redefining the terms instead of using them',
                '“It depends” offered as a conclusion',
                'Model v12 — users: 0',
                'Waiting until every edge case is closed',
              ]}
            />
          </article>

          <article className="fail__plate fail__plate--te">
            <div className="fail__head">
              <Tag who="te">→ Premature optimization</Tag>
              <span className="label label--muted">Fig. 5.2</span>
            </div>
            <Hill />
            <h3 className="fail__title display">
              A result so fast <span className="serif">it never met the problem.</span>
            </h3>
            <Symptoms
              items={[
                'Measuring what is easy instead of what matters',
                'Scaling a process nobody understands',
                'Fixing symptoms at speed',
                'Hitting the target, missing the point',
              ]}
            />
          </article>
        </div>
      </div>
    </section>
  )
}

function Symptoms({ items }: { items: string[] }) {
  return (
    <ul className="fail__list">
      {items.map((t, i) => (
        <Reveal as="li" key={t} delay={i * 0.06}>
          <span className="label label--muted">{String(i + 1).padStart(2, '0')}</span>
          {t}
        </Reveal>
      ))}
    </ul>
  )
}

/* ---------- Fig 5.1 — Zeno: each refinement halves the gap and never closes it ---------- */

const X0 = 30
const SHIP = 370
const HOPS = 11

function Zeno() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reduce = useReducedMotion()
  const [{ k, round }, setHop] = useState({ k: reduce ? HOPS : 0, round: 0 })

  useEffect(() => {
    if (!inView || reduce) return
    const t = setInterval(() => {
      setHop((s) => (s.k >= HOPS ? { k: 0, round: s.round + 1 } : { k: s.k + 1, round: s.round }))
    }, 650)
    return () => clearInterval(t)
  }, [inView, reduce])

  const xs = [X0]
  for (let i = 0; i < HOPS; i++) xs.push(xs[i] + (SHIP - xs[i]) / 2)
  const gap = SHIP - xs[k]
  const version = `v${round + 1}.${k}`

  return (
    <svg ref={ref} className="fail__svg" viewBox="0 0 400 260" role="img" aria-label="Each refinement halves the distance to shipping but never reaches it">
      <line x1="10" y1="200" x2="390" y2="200" stroke="var(--rule-strong)" />
      <line x1={SHIP} y1="40" x2={SHIP} y2="214" stroke="var(--ink)" strokeWidth="1.5" />
      <text x={SHIP} y="30" textAnchor="middle" className="svg-mono" fill="var(--ink)">
        ship
      </text>
      {xs.slice(0, k).map((x, i) => {
        const x2 = xs[i + 1]
        const h = Math.max(4, (x2 - x) * 0.9)
        return (
          <motion.path
            key={`${round}-${i}`}
            d={`M${x} 200 Q ${(x + x2) / 2} ${200 - h * 1.4} ${x2} 200`}
            fill="none"
            stroke="var(--ti)"
            strokeWidth={i === k - 1 ? 2 : 1}
            strokeOpacity={i === k - 1 ? 1 : 0.4}
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        )
      })}
      <motion.circle cy="200" r="6" fill="var(--ti)" animate={{ cx: xs[k] }} transition={{ duration: 0.5, ease: EASE }} />
      <text x="10" y="240" className="svg-mono" fill="var(--ti)">
        model {version}
      </text>
      <text x="390" y="240" textAnchor="end" className="svg-mono" fill="var(--muted)">
        gap {gap.toFixed(gap < 1 ? 2 : 0)} · shipped 0
      </text>
      <motion.text
        x="200"
        y="120"
        textAnchor="middle"
        className="svg-mono"
        fill="var(--ti)"
        animate={{ opacity: k === 0 && round > 0 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        rewriting from first principles…
      </motion.text>
    </svg>
  )
}

/* ---------- Fig 5.2 — Greedy climb: fast to the nearest peak, blind to the higher one ---------- */

const LOCAL = { x: 120, h: 80 }
const GLOBAL = { x: 300, h: 160 }
const hAt = (x: number) =>
  LOCAL.h * Math.exp(-(((x - LOCAL.x) / 42) ** 2)) + GLOBAL.h * Math.exp(-(((x - GLOBAL.x) / 48) ** 2))
const yAt = (x: number) => 210 - hAt(x)
const curve = (a: number, b: number) => {
  const pts: string[] = []
  for (let x = a; x <= b; x += 4) pts.push(`${x} ${yAt(x).toFixed(1)}`)
  return 'M' + pts.join(' L')
}

function Hill() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reduce = useReducedMotion()
  const t = useMotionValue(reduce ? 1 : 0)
  const x = useTransform(t, (v) => 30 + (LOCAL.x - 30) * v)
  const y = useTransform(x, (v) => yAt(v) - 7)
  const trail = useTransform(t, [0, 1], [0, 1])
  const reveal = useTransform(t, [0.85, 1], [0, 1])
  const [score, setScore] = useState(0)
  useMotionValueEvent(t, 'change', (v) => setScore(Math.round(v * 100)))

  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(t, [0, 1], { duration: 1.6, ease: [0.1, 0.8, 0.2, 1], repeat: Infinity, repeatDelay: 3 })
    return () => c.stop()
  }, [inView, reduce, t])

  return (
    <svg ref={ref} className="fail__svg" viewBox="0 0 400 260" role="img" aria-label="A fast climb reaches the nearest peak and stops, missing a higher peak further away">
      <line x1="10" y1="210" x2="390" y2="210" stroke="var(--rule-strong)" />
      <path d={curve(20, 170)} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <path d={curve(170, 390)} fill="none" stroke="var(--ink)" strokeOpacity="0.35" strokeDasharray="3 5" />
      <motion.path d={curve(30, LOCAL.x)} fill="none" stroke="var(--te)" strokeWidth="3" style={{ pathLength: trail }} />
      <motion.circle r="7" fill="var(--te)" style={{ cx: x, cy: y }} />
      <motion.g style={{ opacity: reveal }}>
        <line x1={LOCAL.x} y1={yAt(LOCAL.x) - 18} x2={LOCAL.x} y2={yAt(LOCAL.x) - 40} stroke="var(--te)" />
        <text x={LOCAL.x} y={yAt(LOCAL.x) - 46} textAnchor="middle" className="svg-mono" fill="var(--te)">
          optimized ✓
        </text>
        <circle cx={GLOBAL.x} cy={yAt(GLOBAL.x)} r="5" fill="none" stroke="var(--ink)" />
        <text x={GLOBAL.x} y={yAt(GLOBAL.x) - 14} textAnchor="middle" className="svg-mono" fill="var(--muted)">
          the peak nobody modeled
        </text>
      </motion.g>
      <text x="10" y="240" className="svg-mono" fill="var(--te)">
        local {score}%
      </text>
      <text x="390" y="240" textAnchor="end" className="svg-mono" fill="var(--muted)">
        of what was possible {Math.round((score / 100) * (LOCAL.h / GLOBAL.h) * 100)}%
      </text>
    </svg>
  )
}
