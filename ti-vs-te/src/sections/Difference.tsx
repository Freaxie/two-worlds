import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag } from '../lib/ui'
import './Difference.css'

const ROWS = [
  {
    axis: 'Standard',
    ti: 'Coherence',
    te: 'Effectiveness',
    tiLine: 'A claim is good if it agrees with every other claim in the system.',
    teLine: 'A claim is good if acting on it produces the intended result.',
  },
  {
    axis: 'Starts from',
    ti: 'Principles',
    te: 'Outcomes',
    tiLine: 'Begin with what must be true, then derive what follows.',
    teLine: 'Begin with what must happen, then work backwards to the steps.',
  },
  {
    axis: 'Won’t proceed without',
    ti: 'Definitions',
    te: 'Execution',
    tiLine: 'Until a term means exactly one thing, nothing built on it is safe.',
    teLine: 'Until something ships, nothing has actually been tested.',
  },
  {
    axis: 'Trusts',
    ti: 'Necessity',
    te: 'Evidence',
    tiLine: 'It must be so, because the alternative contradicts itself.',
    teLine: 'It is so, because the numbers moved when we pulled the lever.',
  },
  {
    axis: 'Progress is',
    ti: 'An insight',
    te: 'A milestone',
    tiLine: 'The moment the parts click into a single explanation.',
    teLine: 'The moment a target is hit and the next one can be set.',
  },
]

export function Difference() {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <section id="difference" className="part part--rule diff" aria-labelledby="difference-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="difference"
          n="02"
          name="The core difference"
          title={[
            'Where must a',
            'thought hold up —',
            <span key="c">
              <span className="ti">inside</span> or <span className="te">outside</span>?
            </span>,
          ]}
          lede={
            <>
              Both functions are analytical. Both are demanding. They simply test ideas in different places:{' '}
              <span className="ti">Ti</span> checks an idea against the rest of the model;{' '}
              <span className="te">Te</span> checks it against the world.
            </>
          }
        />

        <div className="diff__plates grid">
          <Plate who="ti" />
          <Plate who="te" />
        </div>

        <div className="diff__table" role="table" aria-label="Ti and Te compared">
          <div className="diff__thead" role="row">
            <span role="columnheader" className="diff__cell diff__cell--ti">
              <Tag who="ti">Internal</Tag>
            </span>
            <span role="columnheader" className="diff__cell diff__axis label label--muted">
              Axis
            </span>
            <span role="columnheader" className="diff__cell diff__cell--te">
              <Tag who="te">External</Tag>
            </span>
          </div>
          {ROWS.map((r, i) => (
            <motion.div
              key={r.axis}
              role="row"
              className={`diff__row${hover !== null && hover !== i ? ' is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              initial="off"
              whileInView="on"
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            >
              <span role="cell" className="diff__cell diff__cell--ti">
                <motion.span
                  className="diff__word ti"
                  variants={{ off: { x: '-30%', opacity: 0 }, on: { x: 0, opacity: 1 } }}
                  transition={{ duration: 1, ease: EASE }}
                >
                  {r.ti}
                </motion.span>
                <span className="diff__line">{r.tiLine}</span>
              </span>
              <span role="cell" className="diff__cell diff__axis label label--muted">
                <motion.span
                  className="diff__axis-rule"
                  aria-hidden="true"
                  variants={{ off: { scaleX: 0 }, on: { scaleX: 1 } }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
                />
                {r.axis}
              </span>
              <span role="cell" className="diff__cell diff__cell--te">
                <motion.span
                  className="diff__word te"
                  variants={{ off: { x: '30%', opacity: 0 }, on: { x: 0, opacity: 1 } }}
                  transition={{ duration: 1, ease: EASE }}
                >
                  {r.te}
                </motion.span>
                <span className="diff__line">{r.teLine}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Plates: scroll-linked diagrams ---------- */

function Plate({ who }: { who: 'ti' | 'te' }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 45%'] })
  const p = useTransform(scrollYProgress, [0.15, 1], [0, 1], { clamp: true })
  return (
    <figure ref={ref} className={`plate plate--${who}`}>
      <div className="plate__head">
        <Tag who={who}>{who === 'ti' ? 'Internal coherence' : 'External effectiveness'}</Tag>
        <span className="label label--muted">Fig. 2.{who === 'ti' ? 1 : 2}</span>
      </div>
      <div className="plate__art">{who === 'ti' ? <Convergence p={p} /> : <Projection p={p} />}</div>
      <Reveal as="div" className="plate__caption">
        <p className="plate__big display">{who === 'ti' ? 'Coherence' : 'Effectiveness'}</p>
        <p className="note">
          {who === 'ti'
            ? 'Every claim is pulled toward a centre and tied to every other. The figure tightens as contradictions are removed — its success is internal fit.'
            : 'An intention leaves its origin and is corrected against a target it does not control. The figure succeeds only when the distance reaches zero.'}
        </p>
      </Reveal>
    </figure>
  )
}

const N = 8
function Convergence({ p }: { p: MotionValue<number> }) {
  const r = useTransform(p, [0, 1], [158, 118])
  const spokes = useTransform(p, [0, 0.6], [0, 1])
  const lattice = useTransform(p, [0.35, 1], [0, 1])
  const [fit, setFit] = useState(0)
  useMotionValueEvent(p, 'change', (v) => setFit(Math.round(v * 100)))

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Eight claims converging toward a centre and interlinking">
      <circle cx="200" cy="200" r="180" fill="none" stroke="var(--rule)" />
      <circle cx="200" cy="200" r="118" fill="none" stroke="var(--ti)" strokeOpacity="0.25" strokeDasharray="2 5" />
      {Array.from({ length: N }, (_, i) => (
        <Node key={i} i={i} r={r} spokes={spokes} lattice={lattice} />
      ))}
      <circle cx="200" cy="200" r="6" fill="var(--ti)" />
      <text x="200" y="392" textAnchor="middle" className="svg-mono" fill="var(--ti)">
        internal fit {fit}%
      </text>
    </svg>
  )
}

function Node({ i, r, spokes, lattice }: { i: number; r: MotionValue<number>; spokes: MotionValue<number>; lattice: MotionValue<number> }) {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2
  const b = ((i + 3) / N) * Math.PI * 2 - Math.PI / 2
  const x = useTransform(r, (v) => 200 + Math.cos(a) * v)
  const y = useTransform(r, (v) => 200 + Math.sin(a) * v)
  const x2 = useTransform(r, (v) => 200 + Math.cos(b) * v)
  const y2 = useTransform(r, (v) => 200 + Math.sin(b) * v)
  return (
    <g>
      <motion.line x1={x} y1={y} x2={200} y2={200} stroke="var(--ti)" strokeWidth="1" style={{ pathLength: spokes }} />
      <motion.line x1={x} y1={y} x2={x2} y2={y2} stroke="var(--ti)" strokeOpacity="0.45" strokeWidth="1" style={{ pathLength: lattice }} />
      <motion.circle cx={x} cy={y} r="5" fill="var(--paper)" stroke="var(--ti)" strokeWidth="1.5" />
    </g>
  )
}

function Projection({ p }: { p: MotionValue<number> }) {
  const miss1 = useTransform(p, [0, 0.35], [0, 1])
  const miss2 = useTransform(p, [0.25, 0.6], [0, 1])
  const hit = useTransform(p, [0.5, 1], [0, 1])
  const [delta, setDelta] = useState(270)
  useMotionValueEvent(p, 'change', (v) => setDelta(Math.max(0, Math.round(270 * (1 - Math.min(1, v * 1.02))))))
  const hitScale = useTransform(p, [0.92, 1], [0, 1])

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Attempts launched from an origin, corrected until one lands on the target">
      <line x1="20" y1="200" x2="380" y2="200" stroke="var(--rule)" />
      {[70, 48, 26].map((rr, i) => (
        <circle key={rr} cx="320" cy="200" r={rr} fill="none" stroke="var(--te)" strokeOpacity={0.2 + i * 0.2} />
      ))}
      <circle cx="320" cy="200" r="5" fill="var(--te)" />
      <motion.path d="M50 200 C 130 60, 250 40, 300 90" fill="none" stroke="var(--te)" strokeOpacity="0.4" strokeDasharray="3 5" style={{ pathLength: miss1 }} />
      <motion.path d="M50 200 C 140 300, 250 340, 330 300" fill="none" stroke="var(--te)" strokeOpacity="0.4" strokeDasharray="3 5" style={{ pathLength: miss2 }} />
      <motion.path d="M50 200 C 140 150, 240 170, 320 200" fill="none" stroke="var(--te)" strokeWidth="2" style={{ pathLength: hit }} />
      <motion.circle cx="320" cy="200" r="14" fill="none" stroke="var(--te)" strokeWidth="2" style={{ scale: hitScale }} />
      <circle cx="50" cy="200" r="6" fill="var(--paper)" stroke="var(--te)" strokeWidth="1.5" />
      <text x="50" y="228" textAnchor="middle" className="svg-mono" fill="var(--muted)">
        intent
      </text>
      <text x="320" y="116" textAnchor="middle" className="svg-mono" fill="var(--muted)">
        world
      </text>
      <text x="200" y="392" textAnchor="middle" className="svg-mono" fill="var(--te)">
        distance to target Δ {delta}
      </text>
    </svg>
  )
}
