import { useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion'
import { Figure, Head, Spread, figurePath, useScrollIn } from '../components/print'
import { C } from '../lib/organic'
import './Errors.css'

/* ---------- Error 01 · Ink flood (Fi) ---------- */

const OUTSIDE: [number, number, string][] = [
  [70, 70, 'feedback'],
  [330, 60, 'context'],
  [345, 330, 'their side'],
  [60, 335, 'the facts'],
]

function Flood({ p }: { p: MotionValue<number> }) {
  const r = useTransform(p, [0, 1], [110, 330])
  const solid = useTransform(p, [0.25, 1], [0, 250])
  return (
    <svg viewBox="0 0 400 400" className="err__svg" role="img" aria-label="Blue ink spreads from one figure until it covers the words around it: feedback, context, their side, the facts.">
      {OUTSIDE.map(([x, y, w]) => (
        <g key={w}>
          <Figure x={x} y={y - 34} s={0.55} fill={C.ink} />
          <text x={x} y={y + 16} textAnchor="middle" className="err__word">
            {w}
          </text>
        </g>
      ))}
      <g filter="url(#ht-blue)">
        <motion.circle cx="200" cy="205" r={r} fill="url(#soft)" />
        <motion.circle cx="200" cy="205" r={solid} fill="#000" />
      </g>
      <g fill="none" stroke={C.paper} strokeWidth="3">
        <circle cx="200" cy="172" r="17" />
        <path d={figurePath(200, 172, 1.3)} />
      </g>
    </svg>
  )
}

/* ---------- Error 02 · Ghosting (Fe) ---------- */

const CROWD: [number, number][] = [
  [80, 90],
  [200, 50],
  [320, 90],
  [330, 270],
  [70, 270],
]

function Ghost({ x, y, i, p }: { x: number; y: number; i: number; p: MotionValue<number> }) {
  // Each person leaves an impression on the self, drawn a little further onto it as the error grows
  const gx = useTransform(p, (v) => x + (200 - x) * v)
  const gy = useTransform(p, (v) => y + (180 - y) * v)
  const op = useTransform(p, [0.1 + i * 0.08, 0.6 + i * 0.06], [0, 0.55])
  const d = useTransform([gx, gy] as MotionValue<number>[], ([a, b]: number[]) => figurePath(a, b, 1.1))
  return (
    <motion.g style={{ opacity: op, mixBlendMode: 'multiply' }} fill={C.pink}>
      <motion.circle cx={gx} cy={gy} r="15" />
      <motion.path d={d} />
    </motion.g>
  )
}

function Ghosting({ p }: { p: MotionValue<number> }) {
  const own = useTransform(p, [0, 0.9], [1, 0.12])
  const core = useTransform(p, [0, 0.6], [1, 0])
  const ask = useTransform(p, [0.75, 1], [0, 1])
  return (
    <svg viewBox="0 0 400 400" className="err__svg" role="img" aria-label="A figure surrounded by five pink figures. Its own ink fades while pink copies of the others print over it.">
      {CROWD.map(([x, y], i) => (
        <Figure key={i} x={x} y={y} s={0.85} fill={C.pink} />
      ))}
      <motion.g style={{ opacity: own }}>
        <Figure x={200} y={180} s={1.1} fill={C.ink} />
      </motion.g>
      <motion.circle cx="200" cy="230" r="10" fill={C.blue} style={{ opacity: core }} />
      {CROWD.map(([x, y], i) => (
        <Ghost key={i} x={x} y={y} i={i} p={p} />
      ))}
      <motion.text x="200" y="350" textAnchor="middle" className="err__ask" style={{ opacity: ask }}>
        whose shape is this?
      </motion.text>
    </svg>
  )
}

/* ---------- A specimen: scroll pushes the error further ---------- */

type SpecimenProps = {
  code: string
  name: string
  ink: 'blue' | 'pink'
  gauge: [string, number, number]
  art: (p: MotionValue<number>) => ReactNode
  kind: string
  body: string
  signs: string[]
  remedy: string
}

function Specimen({ code, name, ink, gauge, art, kind, body, signs, remedy }: SpecimenProps) {
  const ref = useRef<HTMLDivElement>(null)
  const p = useScrollIn(ref, ['start 0.8', 'end 0.45'])
  const [ticks, setTicks] = useState(0)
  useMotionValueEvent(p, 'change', (v) => setTicks(Math.min(signs.length, Math.floor(v * (signs.length + 0.6)))))
  const pct = useTransform(p, (v) => `${Math.round(gauge[1] + (gauge[2] - gauge[1]) * v)}%`)
  const fill = useTransform(p, (v) => (gauge[2] > gauge[1] ? 0.38 + 0.62 * v : 1 - 0.88 * v))

  return (
    <article className={`err err--${ink}`}>
      <p className="caps err__code">
        <span className={`mark mark--${ink}`}>{code}</span>
      </p>
      <h3 className="err__name poster rough">{name}</h3>
      <div ref={ref} className="err__specimen">
        {art(p)}
        <div className="err__gauge">
          <span className="type">{gauge[0]}</span>
          <span className="err__bar">
            <motion.span className="err__fill" style={{ scaleX: fill }} />
          </span>
          <motion.span className="type err__pct">{pct}</motion.span>
        </div>
      </div>
      <p className="err__kind">{kind}</p>
      <p className="err__body">{body}</p>
      <ul className="err__signs" aria-label="Signs">
        {signs.map((s, i) => (
          <li key={s} data-on={i < ticks}>
            <span className="err__box" aria-hidden="true">
              {i < ticks ? '×' : ''}
            </span>
            {s}
          </li>
        ))}
      </ul>
      <p className="err__remedy type">
        <strong>Remedy:</strong> {remedy}
      </p>
    </article>
  )
}

export function Errors() {
  return (
    <Spread
      id="errors"
      label="Pages 12 and 13: failure modes"
      folios={[12, 13]}
      left={
        <>
          <Head pp="12–13" title="Failure modes" />
          <h2 className="err__title poster rough">Printing errors</h2>
          <p className="err__lede">Every gift, pushed past its limit, misprints. Neither error is malice. Keep scrolling and each one gets worse.</p>
          <Specimen
            code="Error 01 · Fi"
            name="Ink flood"
            ink="blue"
            gauge={['ink density', 38, 100]}
            art={(p) => <Flood p={p} />}
            kind="Excessive subjectivity: withdrawal into personal conviction."
            body="Too much of one colour. The inner compass stops taking readings from outside, and the feeling, which is real, becomes the only evidence admitted."
            signs={['My feeling is the evidence.', 'If you disagree, you haven’t understood.', 'Withdraws rather than explains.', 'Conviction hardens into isolation.']}
            remedy="let some paper show through. Ask one person what they see."
          />
        </>
      }
      right={
        <div className="err__right">
          <Specimen
            code="Error 02 · Fe"
            name="Ghosting"
            ink="pink"
            gauge={['own ink', 100, 12]}
            art={(p) => <Ghosting p={p} />}
            kind="Excessive accommodation: losing one’s own position in the group."
            body="Your own drum runs dry while everyone else’s image keeps printing over yours, until the one keeping the peace has no colour left, and the peace no longer includes them."
            signs={['Says yes to keep the peace.', 'Can’t tell their feeling from the room’s.', 'Resentment arrives late, all at once.', 'Harmony becomes hollow.']}
            remedy="re-ink your own drum. Say one thing you actually think."
          />
        </div>
      }
    />
  )
}
