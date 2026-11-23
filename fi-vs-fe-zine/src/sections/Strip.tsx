import { useRef, type ReactNode } from 'react'
import { motion, useInView, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import { EASE, Figure, Head, Spread, useScrollIn } from '../components/print'
import { C } from '../lib/organic'
import './Strip.css'

/* Everyone at the dinner, in a 600 × 380 panel */
const TABLE = [
  { x: 110, y: 170, s: 0.8, stake: 0.45 },
  { x: 205, y: 160, s: 0.85, stake: 0.95, tag: 'the partner’s nerves', tagX: 150, tagY: 84 },
  { x: 300, y: 105, s: 1.05, stake: 1, tag: 'their hope', tagX: 300, tagY: 40 },
  { x: 395, y: 160, s: 0.85, stake: 0.55 },
  { x: 490, y: 170, s: 0.8, stake: 0.5, tag: 'the table’s joy', tagX: 500, tagY: 120 },
]
const YOU = { x: 300, y: 290, s: 1.15 }

function Table() {
  return <ellipse cx="300" cy="245" rx="250" ry="40" fill={C.paper} stroke={C.ink} strokeWidth="2.5" />
}

/* An inward spiral, ending in the chest of the one deciding */
const SPIRAL = (() => {
  let d = ''
  for (let i = 0; i <= 140; i++) {
    const k = i / 140
    const a = k * Math.PI * 2 * 3 - Math.PI / 2
    const r = 95 * (1 - k)
    d += (i ? 'L' : 'M') + (YOU.x + Math.cos(a) * r * 1.3).toFixed(1) + ',' + (YOU.y + 36 + Math.sin(a) * r * 0.7).toFixed(1)
  }
  return d
})()

/* A comic panel that prints in from top to bottom, as if fed under the drum */
function Panel({ n, drum, ink, children, caption }: { n: number; drum: string; ink: 'ink' | 'blue' | 'pink'; children: ReactNode; caption: ReactNode }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const shown = inView || reduce
  return (
    <figure ref={ref} className={`panel panel--${ink}`}>
      <span className="panel__tag caps">
        Panel {n} · <span className={ink === 'ink' ? '' : `mark mark--${ink}`}>{drum}</span>
      </span>
      <motion.div
        className="panel__art"
        initial={false}
        animate={{ clipPath: shown ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' }}
        transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
      >
        {children}
      </motion.div>
      <figcaption className="panel__cap">{caption}</figcaption>
    </figure>
  )
}

function FactsArt() {
  return (
    <svg viewBox="0 0 600 380" role="img" aria-label="A dinner table. Your friend stands and asks: you're quiet, what do you think?">
      <Table />
      {TABLE.map((q, i) => (
        <Figure key={i} x={q.x} y={q.y} s={q.s} fill={C.ink} />
      ))}
      <Figure x={YOU.x} y={YOU.y} s={YOU.s} fill={C.ink} />
      <text x={YOU.x} y={YOU.y + 84} textAnchor="middle" className="panel__you">
        YOU
      </text>
      {/* Speech balloon from the friend */}
      <path d="M352,28 h220 a12,12 0 0 1 12,12 v52 a12,12 0 0 1 -12,12 h-170 l-58,26 l20,-26 h-12 a12,12 0 0 1 -12,-12 v-52 a12,12 0 0 1 12,-12 z" fill={C.paper} stroke={C.ink} strokeWidth="2.5" />
      <text x="462" y="58" textAnchor="middle" className="panel__say">
        <tspan x="462">“You’re quiet.</tspan>
        <tspan x="462" dy="22">What do you think?”</tspan>
      </text>
    </svg>
  )
}

function FiArt() {
  const ref = useRef<SVGSVGElement>(null)
  const p = useScrollIn(ref, ['start 0.9', 'end 0.6'])
  const r = useTransform(p, [0, 1], [10, 120])
  return (
    <svg ref={ref} viewBox="0 0 600 380" role="img" aria-label="The same table, but the others are faint outlines. Blue ink pools in your chest; a spiral turns inward.">
      <g filter="url(#ht-blue)">
        <motion.circle cx={YOU.x} cy={YOU.y + 36} r={r} fill="url(#soft)" />
      </g>
      <ellipse cx="300" cy="245" rx="250" ry="40" fill="none" stroke={C.ink} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="3 6" />
      {TABLE.map((q, i) => (
        <Figure key={i} x={q.x} y={q.y} s={q.s} fill="none" stroke={C.ink} strokeWidth={1.5} opacity={0.4} />
      ))}
      <motion.path d={SPIRAL} fill="none" stroke={C.blue} strokeWidth="2.5" style={{ pathLength: p }} />
      <Figure x={YOU.x} y={YOU.y} s={YOU.s} fill={C.ink} />
      {/* Thought balloon */}
      <g fill={C.paper} stroke={C.blue} strokeWidth="2.5">
        <ellipse cx="470" cy="72" rx="120" ry="52" />
        <circle cx="388" cy="152" r="10" />
        <circle cx="365" cy="186" r="6" />
      </g>
      <text x="470" y="56" textAnchor="middle" className="panel__think panel__think--fi">
        <tspan x="470">Would “it’s wonderful”</tspan>
        <tspan x="470" dy="21">be a sentence I have</tspan>
        <tspan x="470" dy="21">to carry home?</tspan>
      </text>
      <text x="36" y="350" className="panel__word">honesty</text>
      <text x="420" y="350" className="panel__word">loyalty</text>
    </svg>
  )
}

/* The atmosphere around one person grows with what is at stake for them */
function Aura({ x, y, stake, k }: { x: number; y: number; stake: number; k: MotionValue<number> }) {
  const r = useTransform(k, (v) => 20 + v * 70 * stake)
  return <motion.circle cx={x} cy={y} r={r} fill="url(#soft-flat)" />
}

function FeArt() {
  const ref = useRef<SVGSVGElement>(null)
  const p = useScrollIn(ref, ['start 0.9', 'end 0.6'])
  const k = useTransform(p, [0, 1], [0.1, 1])
  return (
    <svg ref={ref} viewBox="0 0 600 380" role="img" aria-label="The same table, with pink ink around each person in proportion to what is at stake for them, and dashed lines of attention from you to everyone.">
      <g filter="url(#ht-pink)">
        {TABLE.map((q, i) => (
          <Aura key={i} x={q.x} y={q.y + 18} stake={q.stake} k={k} />
        ))}
      </g>
      <Table />
      {TABLE.map((q, i) => (
        <motion.path
          key={i}
          d={`M${YOU.x},${YOU.y - 10} Q${(YOU.x + q.x) / 2},${(YOU.y + q.y) / 2 - 30} ${q.x},${q.y + 34}`}
          fill="none"
          stroke={C.ink}
          strokeWidth="1.6"
          strokeDasharray="2 5"
          style={{ pathLength: p }}
        />
      ))}
      {TABLE.map((q, i) => (
        <Figure key={i} x={q.x} y={q.y} s={q.s} fill={C.ink} />
      ))}
      <Figure x={YOU.x} y={YOU.y} s={YOU.s * 0.85} fill={C.ink} />
      {TABLE.filter((q) => q.tag).map((q) => (
        <g key={q.tag}>
          <rect x={q.tagX! - q.tag!.length * 4.6 - 6} y={q.tagY! - 15} width={q.tag!.length * 9.2 + 12} height="22" fill={C.pink} opacity="0.55" style={{ mixBlendMode: 'multiply' }} />
          <text x={q.tagX} y={q.tagY} textAnchor="middle" className="panel__tagtext">
            {q.tag}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function Strip() {
  return (
    <Spread
      id="strip"
      label="Pages 4 and 5: one situation, two perspectives"
      folios={[4, 5]}
      left={
        <>
          <Head pp="4–5" title="One dinner, two readings" />
          <h2 className="strip__title poster rough">
            One table.
            <br />
            Two directions
            <br />
            of attention.
          </h2>
          <Panel
            n={1}
            drum="the facts · black drum"
            ink="ink"
            caption={
              <>
                A dinner for eight. Your oldest friend announces they are leaving a secure job to open a restaurant, with their savings and their
                partner’s. The table applauds. <strong>You think it is a mistake.</strong>
              </>
            }
          >
            <FactsArt />
          </Panel>
        </>
      }
      right={
        <div className="strip__right">
          <Panel
            n={2}
            drum="Fi · blue drum"
            ink="blue"
            caption={<>The room goes quiet in the mind. What you owe this friend may be the thing no one else at the table will say.</>}
          >
            <FiArt />
          </Panel>
          <Panel
            n={3}
            drum="Fe · pink drum"
            ink="pink"
            caption={<>Attention spreads across the table. Their hope, the partner’s fixed smile, everyone waiting. What does this moment need to stay whole?</>}
          >
            <FeArt />
          </Panel>
          <p className="strip__coda">
            Neither reading is the cold one. Each carries <em>a different idea of kindness.</em>
          </p>
        </div>
      }
    />
  )
}
