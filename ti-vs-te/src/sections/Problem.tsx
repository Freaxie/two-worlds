import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag, useMedia } from '../lib/ui'
import './Problem.css'

type Step = { verb: string; title: string; body: string }

const TI: Step[] = [
  { verb: 'Define', title: 'What does “slow” mean?', body: 'Push-to-production, wall clock. Which stages count as “the pipeline”? Nothing can be explained until the term is fixed.' },
  { verb: 'Model', title: 'Draw the whole system', body: 'Every stage as a node: what it consumes, what it produces, what it depends on. The model predicts how long each change should take.' },
  { verb: 'Contradict', title: 'Find where the model breaks', body: 'By the model, a docs-only change should skip the test suite. It doesn’t. Something is violating the rules of the system.' },
  { verb: 'Derive', title: 'Name the principle', body: 'The cache key contains a timestamp, so every build looks new. A cache key must be a pure function of its inputs.' },
]

const TE: Step[] = [
  { verb: 'Measure', title: 'Instrument every stage', body: 'Tests 24 min. Build 11 min. Deploy 6 min. Opinions are replaced by a table.' },
  { verb: 'Rank', title: 'Attack the biggest bar', body: 'Tests are 58% of the total. Whatever the cause, that is where the minutes are.' },
  { verb: 'Act', title: 'Change the world', body: 'Split the suite across six parallel runners. Move the build to a larger machine. Merge by noon.' },
  { verb: 'Verify', title: 'Check the number', body: '41 → 14 minutes. Add an alert at 15. Ship it and move on to the next constraint.' },
]

const OUT = {
  ti: 'An explanation. Every one of the 32 lost minutes is accounted for — by tomorrow.',
  te: 'A result. The team is unblocked by lunch — and the cache bug is still there.',
}

/* ---------- Geometry: Ti spirals inward, Te steps outward ---------- */

type Pt = [number, number]
const ORIGIN: Pt = [200, 46]

function spiral(): Pt[] {
  const cx = 104
  const cy = 420
  const pts: Pt[] = [ORIGIN, [196, 120], [170, 200], [cx, cy - 118]]
  const turns = 2.6
  for (let i = 1; i <= 120; i++) {
    const t = i / 120
    const a = -Math.PI / 2 - t * turns * Math.PI * 2
    const r = 118 * (1 - t) + 4
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}
const TE_PTS: Pt[] = [ORIGIN, [296, 116], [296, 212], [336, 262], [336, 372], [360, 420], [360, 548]]
const TI_PTS = spiral()

function lengths(pts: Pt[]) {
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return acc.map((l) => l / acc[acc.length - 1])
}
const TI_LEN = lengths(TI_PTS)
const TE_LEN = lengths(TE_PTS)
const d = (pts: Pt[]) => 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L')

/* markers sit at chosen vertices; each lights when the line reaches it */
const TI_MARKS = [3, 40, 80, 118].map((i) => ({ pt: TI_PTS[i], at: TI_LEN[i] }))
const TE_MARKS = [1, 2, 4, 6].map((i) => ({ pt: TE_PTS[i], at: TE_LEN[i] }))

export function Problem() {
  const wide = useMedia('(min-width: 900px)')
  return (
    <section id="problem" className="part part--rule part--deep prob" aria-labelledby="problem-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="problem"
          n="03"
          name="One problem, two operations"
          title={['Same input.', 'Different', 'machinery.']}
          lede="A single, ordinary engineering problem, handed to both functions at once. Watch not what they conclude, but the path each one takes — and the shape that path makes."
        />
      </div>
      {wide ? <Scrubbed /> : <Stacked />}
    </section>
  )
}

function ProblemCard() {
  return (
    <div className="prob__card">
      <span className="label label--muted">The problem</span>
      <p className="prob__q">
        The deploy pipeline takes <b>41 minutes</b>. <span className="serif">Last month it took nine.</span>
      </p>
    </div>
  )
}

/* ---------- Desktop: a sticky stage scrubbed by scroll ---------- */

function Scrubbed() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const draw = useTransform(scrollYProgress, [0.04, 0.84], [0, 1], { clamp: true })
  const [steps, setSteps] = useState({ ti: -1, te: -1 })
  const [done, setDone] = useState(false)
  useMotionValueEvent(draw, 'change', (v) => {
    const reached = (marks: { at: number }[]) => marks.reduce((n, m, i) => (v >= m.at - 0.001 ? i : n), -1)
    const ti = reached(TI_MARKS)
    const te = reached(TE_MARKS)
    setSteps((s) => (s.ti === ti && s.te === te ? s : { ti, te }))
  })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setDone(v > 0.88))

  return (
    <div ref={ref} className="prob__scrub">
      <div className="prob__sticky wrap">
        <div className="prob__stage">
          <Column who="ti" steps={TI} step={steps.ti} done={done} />
          <div className="prob__center">
            <ProblemCard />
            <Fork draw={draw} />
          </div>
          <Column who="te" steps={TE} step={steps.te} done={done} />
        </div>
      </div>
    </div>
  )
}

function Column({ who, steps, step, done }: { who: 'ti' | 'te'; steps: Step[]; step: number; done: boolean }) {
  return (
    <div className={`prob__col prob__col--${who}`}>
      <Tag who={who}>{who === 'ti' ? 'Operation: cohere' : 'Operation: effect'}</Tag>
      <ol className="prob__steps">
        {steps.map((s, i) => {
          const state = i === step && !done ? 'is-now' : i <= step ? 'is-past' : ''
          return (
            <li key={s.verb} className={`prob__step ${state}`}>
              <span className="prob__verb label">
                {who === 'ti' ? 'T' : 'E'}
                {i + 1} · {s.verb}
              </span>
              <span className="prob__title">{s.title}</span>
              <AnimatePresence initial={false}>
                {i === step && !done && (
                  <motion.span
                    className="prob__body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    {s.body}
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
      <motion.p
        className="prob__out"
        initial={false}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 12 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <span className="label">Output</span>
        {OUT[who]}
      </motion.p>
    </div>
  )
}

function Fork({ draw }: { draw: MotionValue<number> }) {
  return (
    <svg className="prob__fork" viewBox="0 0 400 580" aria-hidden="true">
      <path d={d(TI_PTS)} fill="none" stroke="var(--rule)" strokeWidth="1" />
      <path d={d(TE_PTS)} fill="none" stroke="var(--rule)" strokeWidth="1" />
      <motion.path d={d(TI_PTS)} fill="none" stroke="var(--ti)" strokeWidth="2" style={{ pathLength: draw }} />
      <motion.path d={d(TE_PTS)} fill="none" stroke="var(--te)" strokeWidth="2" style={{ pathLength: draw }} />
      <path d="M350 540 l10 12 10 -12" fill="none" stroke="var(--te)" strokeWidth="2" />
      {TI_MARKS.map((m, i) => (
        <Marker key={`ti${i}`} m={m} draw={draw} color="var(--ti)" label={`T${i + 1}`} dx={-22} />
      ))}
      {TE_MARKS.map((m, i) => (
        <Marker key={`te${i}`} m={m} draw={draw} color="var(--te)" label={`E${i + 1}`} dx={14} />
      ))}
      <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r="7" fill="var(--ink)" />
      <text x="104" y="570" textAnchor="middle" className="svg-mono" fill="var(--ti)">
        inward · deeper
      </text>
      <text x="360" y="574" textAnchor="end" className="svg-mono" fill="var(--te)" dx="-20">
        outward · sooner
      </text>
    </svg>
  )
}

function Marker({ m, draw, color, label, dx }: { m: { pt: Pt; at: number }; draw: MotionValue<number>; color: string; label: string; dx: number }) {
  const on = useTransform(draw, [m.at - 0.02, m.at], [0, 1], { clamp: true })
  return (
    <motion.g style={{ opacity: on }}>
      <circle cx={m.pt[0]} cy={m.pt[1]} r="6" fill="var(--paper-2)" stroke={color} strokeWidth="2" />
      <text x={m.pt[0] + dx} y={m.pt[1] + 4} textAnchor={dx < 0 ? 'end' : 'start'} className="svg-mono" fill={color}>
        {label}
      </text>
    </motion.g>
  )
}

/* ---------- Narrow screens: the same two operations, stacked ---------- */

function Stacked() {
  return (
    <div className="wrap prob__stacked">
      <ProblemCard />
      {(['ti', 'te'] as const).map((who) => (
        <div key={who} className={`prob__col prob__col--${who}`}>
          <Tag who={who}>{who === 'ti' ? 'Operation: cohere' : 'Operation: effect'}</Tag>
          <ol className="prob__steps">
            {(who === 'ti' ? TI : TE).map((s, i) => (
              <Reveal as="li" key={s.verb} className="prob__step is-now" delay={i * 0.05}>
                <span className="prob__verb label">
                  {who === 'ti' ? 'T' : 'E'}
                  {i + 1} · {s.verb}
                </span>
                <span className="prob__title">{s.title}</span>
                <span className="prob__body">{s.body}</span>
              </Reveal>
            ))}
          </ol>
          <Reveal as="p" className="prob__out">
            <span className="label">Output</span>
            {OUT[who]}
          </Reveal>
        </div>
      ))}
    </div>
  )
}
