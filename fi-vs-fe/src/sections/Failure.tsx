import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { Figure, LivePath, Reveal, SectionHead, Tag, useLiveTime } from '../components/common'
import { blob, C, lerp, mix, range } from '../lib/organic'
import './Failure.css'

const FI_SIGNS = [
  'My feeling is the evidence.',
  'If you disagree, you haven’t understood.',
  'Withdraws rather than explains.',
  'Conviction hardens into isolation.',
]
const FE_SIGNS = [
  'Says yes to keep the peace.',
  'Can no longer tell their feeling from the room’s.',
  'Resentment arrives late, and all at once.',
  'Harmony becomes hollow.',
]

/* ---------- Fi: the sealed room ---------- */

const OUTSIDE: [number, number, string][] = [
  [60, 70, 'feedback'],
  [345, 80, 'context'],
  [360, 330, 'their side'],
  [45, 340, 'the facts'],
]

function Sealed({ p }: { p: MotionValue<number> }) {
  const ref = useRef<SVGSVGElement>(null)
  const t = useLiveTime(ref, 0.5)
  const core = useTransform(p, (v) => mix(C.fi, C.fiDeep, v))
  const outside = useTransform(p, [0.1, 0.8], [1, 0.12])
  const reach = useTransform(p, [0.05, 0.6], [1, 0])
  const blur = useTransform(p, (v) => `blur(${(v * 2.5).toFixed(2)}px)`)
  return (
    <svg ref={ref} viewBox="0 0 400 400" className="fail__svg" aria-hidden="true">
      <motion.g style={{ opacity: outside, filter: blur }}>
        {OUTSIDE.map(([x, y, w]) => (
          <g key={w}>
            <motion.line x1={x} y1={y} x2={200} y2={200} stroke={C.ink} strokeOpacity={0.4} strokeDasharray="2 5" style={{ pathLength: reach }} />
            <Figure x={x} y={y - 26} s={0.6} fill="#57514a" />
            <text x={x} y={y + 30} textAnchor="middle" className="fail__word">
              {w}
            </text>
          </g>
        ))}
      </motion.g>
      {Array.from({ length: 9 }, (_, i) => (
        <Wall key={i} i={i} p={p} t={t} />
      ))}
      <LivePath source={t} d={(v) => blob({ cx: 200, cy: 200, r: 40, wobble: 0.1, seed: 3, t: v })} style={{ fill: core }} />
    </svg>
  )
}

/* Each wall layer appears in turn, thickening as the conviction closes in */
function Wall({ i, p, t }: { i: number; p: MotionValue<number>; t: MotionValue<number> }) {
  const on = useTransform(p, (v) => (i < 3 ? 1 : range(v, 0.1 + (i - 3) * 0.1, 0.2 + (i - 3) * 0.1)))
  const d = useTransform([t, p] as MotionValue<number>[], ([tt, v]: number[]) =>
    blob({ cx: 200, cy: 200, r: 58 + i * lerp(12, 13.5, v), wobble: lerp(0.08, 0.02, v), seed: i + 2, t: tt * (1 - v * 0.8), points: 10 })
  )
  const w = useTransform(p, (v) => lerp(1, 2 + i * 0.7, v))
  return <motion.path d={d} fill="none" stroke={C.fi} strokeWidth={w} style={{ opacity: on }} strokeOpacity={0.55} />
}

/* ---------- Fe: the dissolved self ---------- */

const CROWD: [number, number][] = [[80, 110], [200, 50], [320, 100], [340, 260], [210, 345], [70, 280]]

function Dissolved({ p }: { p: MotionValue<number> }) {
  const ref = useRef<SVGSVGElement>(null)
  const t = useLiveTime(ref, 0.6)
  const selfFill = useTransform(p, (v) => mix(C.fi, C.fe, range(v, 0.15, 0.85)))
  const outline = useTransform(p, [0.1, 0.7], [1, 0])
  const ghost = useTransform(p, [0.7, 1], [0, 1])
  const pull = useTransform(p, (v) => lerp(1, 3.2, v))
  /* The self is tugged toward each person in turn */
  const sx = useTransform([t, p] as MotionValue<number>[], ([tt, v]: number[]) => 200 + Math.sin(tt * 1.3) * 28 * v + Math.sin(tt * 2.9) * 10 * v)
  const sy = useTransform([t, p] as MotionValue<number>[], ([tt, v]: number[]) => 200 + Math.cos(tt * 1.1) * 22 * v)
  const selfD = useTransform([t, p, sx, sy] as MotionValue<number>[], ([tt, v, x, y]: number[]) =>
    blob({ cx: x, cy: y, r: lerp(40, 24, v), wobble: lerp(0.1, 0.35, v), seed: 5, t: tt * (1 + v * 2), points: 9 })
  )
  const ringD = useTransform([t, sx, sy] as MotionValue<number>[], ([tt, x, y]: number[]) => blob({ cx: x, cy: y, r: 60, wobble: 0.08, seed: 1, t: tt }))

  return (
    <svg ref={ref} viewBox="0 0 400 400" className="fail__svg" aria-hidden="true">
      {CROWD.map(([x, y], i) => (
        <motion.line key={i} x1={x} y1={y} x2={sx} y2={sy} stroke={C.feDeep} strokeOpacity={0.5} style={{ strokeWidth: pull }} />
      ))}
      {CROWD.map(([x, y], i) => (
        <LivePath key={i} source={t} d={(v) => blob({ cx: x, cy: y, r: 24, wobble: 0.12, seed: i * 2, t: v, points: 7 })} fill={i % 2 ? C.fe2 : C.fe} style={{ mixBlendMode: 'multiply' }} />
      ))}
      <motion.path d={ringD} fill="none" stroke={C.fi} strokeWidth={1.3} style={{ opacity: outline }} />
      <motion.path d={selfD} style={{ fill: selfFill, mixBlendMode: 'multiply' }} />
      <motion.g style={{ opacity: ghost }}>
        <circle cx={200} cy={200} r={60} fill="none" stroke={C.ink} strokeOpacity={0.5} strokeDasharray="2 6" />
        <text x={200} y={290} textAnchor="middle" className="fail__word fail__word--ghost">
          where was I?
        </text>
      </motion.g>
    </svg>
  )
}

function Panel({ who, children }: { who: 'fi' | 'fe'; children: (p: MotionValue<number>) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.35'] })
  const p = useSpring(scrollYProgress, { stiffness: 50, damping: 20 })
  const meter = useTransform(p, (v) => `${Math.round(v * 100)}`)
  return (
    <div ref={ref} className={`fail__panel fail__panel--${who}`}>
      {children(p)}
      <div className="fail__meter" aria-hidden="true">
        <span className="label label--muted">Healthy</span>
        <span className="fail__bar">
          <motion.span className="fail__fill" style={{ scaleX: p }} />
        </span>
        <span className="label label--muted">
          Overextended <motion.span>{meter}</motion.span>%
        </span>
      </div>
    </div>
  )
}

export function Failure() {
  return (
    <section id="failure" className="section fail">
      <div className="wrap">
        <SectionHead
          n="06"
          name="Failure modes"
          title="Every strength, overextended, becomes a way of getting lost."
          lede="Keep scrolling and each gift is pushed past its limit. Neither failure is malice. Each is a strength with nothing left to push against."
        />

        <div className="fail__grid grid">
          <article className="fail__col fail__col--fi">
            <Panel who="fi">{(p) => <Sealed p={p} />}</Panel>
            <Tag who="fi">Failure mode</Tag>
            <h3 className="fail__title display">The sealed room</h3>
            <p className="fail__kind serif">Excessive subjectivity — withdrawal into personal conviction.</p>
            <p className="body-copy">
              The inner compass stops taking readings from outside. Every layer that once protected a value now protects the self from being
              questioned. The feeling is real; it has simply become the only evidence admitted.
            </p>
            <ul className="fail__signs">
              {FI_SIGNS.map((s, i) => (
                <Reveal as="li" key={s} delay={i * 0.08}>
                  {s}
                </Reveal>
              ))}
            </ul>
          </article>

          <article className="fail__col fail__col--fe">
            <Panel who="fe">{(p) => <Dissolved p={p} />}</Panel>
            <Tag who="fe">Failure mode</Tag>
            <h3 className="fail__title display">The dissolved self</h3>
            <p className="fail__kind serif">Excessive accommodation — losing one’s own position in the group.</p>
            <p className="body-copy">
              Attunement becomes absorption. Each person’s need pulls a little, until the one doing the harmonising has no colour of their own left
              — and the peace they keep no longer includes them.
            </p>
            <ul className="fail__signs">
              {FE_SIGNS.map((s, i) => (
                <Reveal as="li" key={s} delay={i * 0.08}>
                  {s}
                </Reveal>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
