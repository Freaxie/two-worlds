import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag, useMedia, type Who } from '../lib/ui'
import './Problem.css'

type Step = { time: string; title: string; body: string }

const TIMES = ['6:40 pm', '7:30 pm', '10:15 pm', '2:10 am', '9:00 am']

const TU: Step[] = [
  { time: TIMES[0], title: '“What did I do?”', body: 'The heart rate is up before the message is finished. The mind starts searching for the reason.' },
  { time: TIMES[1], title: 'Replays last week', body: 'Every sentence of Tuesday’s meeting is re-examined for the moment it went wrong.' },
  { time: TIMES[2], title: 'Drafts a defence', body: 'Three versions of an explanation, none of them sent. One contains a genuinely good contingency plan.' },
  { time: TIMES[3], title: 'Awake, rehearsing', body: 'The conversation has now happened eleven times in the dark, all of them badly.' },
  { time: TIMES[4], title: 'Prepared, and tired', body: 'It is about moving the launch date. The 10:15 pm contingency plan is exactly what the team needs.' },
]

const AS: Step[] = [
  { time: TIMES[0], title: '“Probably the launch.”', body: 'Noted, filed, back to cooking. No search for a reason, because nothing seems to require one.' },
  { time: TIMES[1], title: 'Dinner', body: 'The message does not come up again.' },
  { time: TIMES[2], title: 'A chapter, then sleep', body: 'Tomorrow is tomorrow’s problem.' },
  { time: TIMES[3], title: 'Asleep', body: 'Eight hours, uninterrupted.' },
  { time: TIMES[4], title: 'Rested, and unready', body: 'It is about moving the launch date. Asked for a plan B, improvises one on the spot — a thinner one.' },
]

const OUT: Record<Who, string> = {
  tu: 'Cost: a night’s sleep. Gain: the only plan in the room.',
  as: 'Cost: one awkward question. Gain: a clear head for everything else.',
}

/* ---------- Geometry: time runs down the axis; arousal pushes each trace outward ---------- */

type Pt = [number, number]
const AXIS = 200
const Y_TOP = 70
const Y_BOT = 520
const stepY = (i: number) => Y_TOP + (i / (TIMES.length - 1)) * (Y_BOT - Y_TOP)
const LEVEL: Record<Who, number[]> = { tu: [0.92, 0.66, 0.74, 0.86, 0.55], as: [0.22, 0.05, 0.03, 0.01, 0.36] }

function trace(who: Who): Pt[] {
  const lv = LEVEL[who]
  const pts: Pt[] = [[AXIS, Y_TOP - 30]]
  for (let y = Y_TOP - 20; y <= Y_BOT + 20; y += 4) {
    const f = Math.max(0, Math.min(lv.length - 1, (y - Y_TOP) / ((Y_BOT - Y_TOP) / (lv.length - 1))))
    const i = Math.floor(f)
    const k = f - i
    const smooth = k * k * (3 - 2 * k)
    const a = lv[i] + (lv[Math.min(lv.length - 1, i + 1)] - lv[i]) * smooth
    const jitter = who === 'tu' ? (Math.sin(y * 0.9) * 0.5 + Math.sin(y * 0.37) * 0.5) * 0.1 * a : 0
    const ramp = Math.min(1, Math.max(0, (y - (Y_TOP - 30)) / 30))
    const amp = Math.max(0, a + jitter) * 165 * ramp
    pts.push([who === 'tu' ? AXIS - 8 - amp : AXIS + 8 + amp, y])
  }
  return pts
}

function lengths(pts: Pt[]) {
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return acc.map((l) => l / acc[acc.length - 1])
}
const d = (pts: Pt[]) => 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L')

const TRACES = (['tu', 'as'] as const).map((who) => {
  const pts = trace(who)
  const len = lengths(pts)
  const marks = TIMES.map((_, i) => {
    const y = stepY(i)
    const j = pts.findIndex((p) => p[1] >= y)
    return { pt: pts[j], at: len[j] }
  })
  return { who, pts, marks }
})

export function Evening() {
  const wide = useMedia('(min-width: 900px)')
  return (
    <section id="evening" className="part part--rule part--deep prob" aria-labelledby="evening-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="evening"
          n="03"
          name="One evening, two nights"
          title={['One message.', 'Two very', 'different nights.']}
          lede="An ordinary stressor, delivered to both minds at the same minute. Follow the evening hour by hour. Watch how far each trace swings from the centre line, and how long it stays out there."
        />
      </div>
      {wide ? <Scrubbed /> : <Stacked />}
    </section>
  )
}

function EventCard() {
  return (
    <div className="prob__card">
      <span className="label label--muted">6:40 pm · a message from your manager</span>
      <p className="prob__q">
        “Can we talk tomorrow <b>at 9?</b>” <span className="serif">No other context.</span>
      </p>
    </div>
  )
}

function Scrubbed() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const draw = useTransform(scrollYProgress, [0.04, 0.84], [0, 1], { clamp: true })
  const [steps, setSteps] = useState({ tu: -1, as: -1 })
  const [done, setDone] = useState(false)
  useMotionValueEvent(draw, 'change', (v) => {
    const reached = (marks: { at: number }[]) => marks.reduce((n, m, i) => (v >= m.at - 0.001 ? i : n), -1)
    const tu = reached(TRACES[0].marks)
    const as = reached(TRACES[1].marks)
    setSteps((s) => (s.tu === tu && s.as === as ? s : { tu, as }))
  })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setDone(v > 0.88))

  return (
    <div ref={ref} className="prob__scrub">
      <div className="prob__sticky wrap">
        <div className="prob__stage">
          <Column who="tu" steps={TU} step={steps.tu} done={done} />
          <div className="prob__center">
            <EventCard />
            <Chart draw={draw} />
          </div>
          <Column who="as" steps={AS} step={steps.as} done={done} />
        </div>
      </div>
    </div>
  )
}

function Column({ who, steps, step, done }: { who: Who; steps: Step[]; step: number; done: boolean }) {
  return (
    <div className={`prob__col prob__col--${who}`}>
      <Tag who={who}>{who === 'tu' ? 'High neuroticism' : 'Low neuroticism'}</Tag>
      <ol className="prob__steps">
        {steps.map((s, i) => {
          const state = i === step && !done ? 'is-now' : i <= step ? 'is-past' : ''
          return (
            <li key={s.time} className={`prob__step ${state}`}>
              <span className="prob__verb label">{s.time}</span>
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
      <motion.p className="prob__out" initial={false} animate={{ opacity: done ? 1 : 0, y: done ? 0 : 12 }} transition={{ duration: 0.7, ease: EASE }}>
        <span className="label">By morning</span>
        {OUT[who]}
      </motion.p>
    </div>
  )
}

function Chart({ draw }: { draw: MotionValue<number> }) {
  return (
    <svg className="prob__fork" viewBox="0 0 400 580" aria-hidden="true">
      <line x1={AXIS} x2={AXIS} y1={Y_TOP - 30} y2={Y_BOT + 30} stroke="var(--ink)" />
      {TIMES.map((t, i) => (
        <g key={t}>
          <line x1={AXIS - 190} x2={AXIS + 190} y1={stepY(i)} y2={stepY(i)} stroke="var(--rule)" />
          <text x={AXIS + 190} y={stepY(i) - 6} textAnchor="end" className="svg-mono" fill="var(--ink)">
            {t}
          </text>
        </g>
      ))}
      {TRACES.map(({ who, pts, marks }) => (
        <g key={who}>
          <path d={d(pts)} fill="none" stroke="var(--rule)" />
          <motion.path d={d(pts)} fill="none" stroke={`var(--${who})`} strokeWidth="2" style={{ pathLength: draw }} />
          {marks.map((m, i) => (
            <Marker key={i} pt={m.pt} at={m.at} draw={draw} color={`var(--${who})`} />
          ))}
        </g>
      ))}
      <text x="20" y="570" className="svg-mono" fill="var(--tu)">
        ← arousal
      </text>
      <text x="380" y="570" textAnchor="end" className="svg-mono" fill="var(--as)">
        arousal →
      </text>
    </svg>
  )
}

function Marker({ pt, at, draw, color }: { pt: Pt; at: number; draw: MotionValue<number>; color: string }) {
  const on = useTransform(draw, [at - 0.02, at], [0, 1], { clamp: true })
  return <motion.circle cx={pt[0]} cy={pt[1]} r="6" fill="var(--paper-2)" stroke={color} strokeWidth="2" style={{ opacity: on }} />
}

function Stacked() {
  return (
    <div className="wrap prob__stacked">
      <EventCard />
      {(['tu', 'as'] as const).map((who) => (
        <div key={who} className={`prob__col prob__col--${who}`}>
          <Tag who={who}>{who === 'tu' ? 'High neuroticism' : 'Low neuroticism'}</Tag>
          <ol className="prob__steps">
            {(who === 'tu' ? TU : AS).map((s, i) => (
              <Reveal as="li" key={s.time} className="prob__step is-now" delay={i * 0.05}>
                <span className="prob__verb label">{s.time}</span>
                <span className="prob__title">{s.title}</span>
                <span className="prob__body">{s.body}</span>
              </Reveal>
            ))}
          </ol>
          <Reveal as="p" className="prob__out">
            <span className="label">By morning</span>
            {OUT[who]}
          </Reveal>
        </div>
      ))}
    </div>
  )
}
