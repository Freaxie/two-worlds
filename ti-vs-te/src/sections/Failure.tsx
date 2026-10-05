import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, SectionHead, seg, useFrameValue } from '../components/common'
import './Failure.css'

/*
  Each strength, pushed past its limit by scroll.
  Ti: the model is refined, and refined, and refined — the grid subdivides forever and nothing leaves it.
  Te: the number goes up and to the right while the thing it was meant to measure quietly falls.
*/

/* letters boxed in, then boxed in again */
function BoxedWord({ e, text }: { e: number; text: string }) {
  const n = Math.min(5, Math.floor(e * 6))
  const shadow =
    n === 0
      ? 'none'
      : Array.from({ length: n }, (_, k) => `inset 0 0 0 ${k * 5 + 1}px var(--ti), inset 0 0 0 ${k * 5 + 4}px var(--paper)`)
          .reverse()
          .join(', ')
  return (
    <p className="fail__word fail__word--ti display" aria-label={text}>
      {text.split('').map((ch, i) => (
        <span key={i} className="fail__cell" style={{ boxShadow: shadow, opacity: 1 - e * 0.45 }} aria-hidden="true">
          {ch}
        </span>
      ))}
    </p>
  )
}

function CrushWord({ p, text }: { p: MotionValue<number>; text: string }) {
  const ls = useTransform(p, [0, 1], [0.02, -0.12])
  const w = useTransform(p, [0, 1], [112, 62])
  const letterSpacing = useMotionTemplate`${ls}em`
  const fontVariationSettings = useMotionTemplate`'wdth' ${w}`
  return (
    <motion.p className="fail__word fail__word--te display" style={{ letterSpacing, fontVariationSettings }}>
      {text}
    </motion.p>
  )
}

/* ---------- Ti: the refinement that never ends ---------- */

function Refine({ e }: { e: number }) {
  const depth = 1 + Math.floor(e * 6.5)
  const rects: { x: number; y: number; s: number; d: number }[] = []
  /* subdivide toward the same corner, each level one more grid */
  let x = 40
  let y = 40
  let s = 400
  for (let d = 0; d < depth; d++) {
    rects.push({ x, y, s, d })
    const half = s / 2
    const q = d % 4
    x += q === 0 || q === 3 ? half : 0
    y += q === 1 || q === 0 ? half : 0
    s = half
  }
  const revisions = Math.round(1 + e * 46)

  return (
    <svg viewBox="0 0 500 500" className="fail__svg" role="img" aria-label="A square is divided, and one quarter divided again, and again, deeper and deeper, while the output box beside it stays empty.">
      {rects.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.s} height={r.s} className="fail__q" style={{ strokeWidth: Math.max(0.4, 1.6 - i * 0.2) }} />
          <line x1={r.x + r.s / 2} x2={r.x + r.s / 2} y1={r.y} y2={r.y + r.s} className="fail__q-line" />
          <line x1={r.x} x2={r.x + r.s} y1={r.y + r.s / 2} y2={r.y + r.s / 2} className="fail__q-line" />
          {r.s > 40 && (
            <text x={r.x + 6} y={r.y + 14} className="fail__q-label">
              v{i + 1}
            </text>
          )}
        </g>
      ))}
      <rect x={452} y={40} width={36} height={36} className="fail__out" />
      <text x={470} y={98} textAnchor="middle" className="fail__note">
        OUT
      </text>
      <text x={0} y={494} className="fail__meter">
        MODEL REVISIONS {String(revisions).padStart(2, '0')} · SHIPPED 0
      </text>
    </svg>
  )
}

/* ---------- Te: the metric that eats its goal ---------- */

function Hollow({ e }: { e: number }) {
  const N = 10
  const metric = (i: number) => 360 - Math.pow(i / (N - 1), 1.3) * e * 300
  const goal = (i: number) => 150 + Math.pow(i / (N - 1), 1.6) * e * 200
  let goalPath = ''
  for (let i = 0; i < N; i++) goalPath += `${i ? 'L' : 'M'}${50 + i * 45},${goal(i).toFixed(1)}`

  return (
    <svg viewBox="0 0 500 500" className="fail__svg" role="img" aria-label="Bars for a metric climb steeply while a dashed line for the real goal it was meant to measure falls away.">
      <line x1={30} x2={480} y1={420} y2={420} className="fail__axis" />
      {Array.from({ length: N }, (_, i) => (
        <rect key={i} x={36 + i * 45} y={metric(i)} width={28} height={420 - metric(i)} className={i === N - 1 ? 'fail__bar fail__bar--last' : 'fail__bar'} />
      ))}
      <path d={goalPath} className="fail__goal" />
      <text x={50} y={goal(0) - 14} className="fail__whisper" style={{ opacity: seg(e, 0.35, 0.6) }}>
        what it was meant to measure
      </text>
      <text x={36} y={474} className="fail__note">
        TICKETS CLOSED / WEEK
      </text>
      <text x={500} y={494} className="fail__meter" textAnchor="end">
        METRIC +{Math.round(e * 240)}% · REAL GOAL −{Math.round(e * 35)}%
      </text>
    </svg>
  )
}

function Panel({ who }: { who: 'ti' | 'te' }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] })
  const excess = useTransform(scrollYProgress, [0.1, 0.85], [0, 1], { clamp: true })
  const e = useFrameValue(excess)
  const ti = who === 'ti'

  return (
    <article ref={ref} className={`fail__panel fail__panel--${who}`} aria-labelledby={`fail-${who}`}>
      <div className="fail__panel-head">
        <span className="chip label">
          <span className={`chip__mark chip__mark--${who}`} aria-hidden="true" />
          {ti ? 'Ti in excess' : 'Te in excess'}
        </span>
        <span className="fail__gauge label" aria-hidden="true">
          <span className="fail__gauge-track">
            <span className="fail__gauge-fill" style={{ transform: `scaleX(${e})` }} />
          </span>
          {e < 0.35 ? 'healthy' : e < 0.7 ? 'strained' : 'failure'}
        </span>
      </div>

      <h3 className="fail__title" id={`fail-${who}`}>
        {ti ? 'Analysis paralysis' : 'Hollow metrics'}
      </h3>
      {ti ? <BoxedWord e={e} text="OVERTHOUGHT" /> : <CrushWord p={excess} text="Just ship it" />}

      <div className="fail__fig">{ti ? <Refine e={e} /> : <Hollow e={e} />}</div>

      <div className="fail__body">
        <ul className="fail__symptoms">
          {(ti
            ? ['Never quite ready to commit', 'Definitions argued past the point of use', 'What works dismissed because it isn’t explained', 'A perfect model nobody else ever sees']
            : ['The measure becomes the goal', 'Fast decisions on shallow reasons', 'People who ask “why?” overruled', 'More of what has already stopped working']
          ).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="fail__remedy serif">
          <span className="label">What it needs</span>
          {ti ? 'A version good enough to test in the world.' : 'A pause to ask why it works.'}
        </p>
      </div>
    </article>
  )
}

export function Failure() {
  return (
    <section className="section fail" id="failure" aria-labelledby="fail-title">
      <div className="wrap">
        <SectionHead
          index="06"
          name="Failure modes"
          title={
            <span id="fail-title">
              Every strength, <em>overdone,</em> becomes its own trap.
            </span>
          }
          lede="Scroll to push each one past its limit. Ti refines the model until nothing leaves it. Te hits the number while the point of the number slips away."
        />
        <div className="fail__grid">
          <Panel who="ti" />
          <Panel who="te" />
        </div>
        <Reveal className="fail__coda">
          <p className="serif">Too much Ti mistakes understanding for doing. Too much Te mistakes the measure for the thing measured, the trap known as Goodhart’s law.</p>
        </Reveal>
      </div>
    </section>
  )
}
