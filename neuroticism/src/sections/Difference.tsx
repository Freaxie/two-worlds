import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag, type Who } from '../lib/ui'
import './Difference.css'

const ROWS = [
  {
    axis: 'Reacts to a threat',
    tu: 'Loud',
    as: 'Quiet',
    tuLine: 'A small signal arrives at full volume. The body is ready before the mind has decided.',
    asLine: 'A small signal arrives as a small signal. The body waits for more evidence.',
  },
  {
    axis: 'Recovers',
    tu: 'Slowly',
    as: 'Quickly',
    tuLine: 'The feeling fades, then echoes back later — at dinner, at 2 a.m.',
    asLine: 'The feeling passes and mostly stays passed.',
  },
  {
    axis: 'Attention goes to',
    tu: 'Risks',
    as: 'Openings',
    tuLine: 'Scans for what could go wrong, and usually finds something.',
    asLine: 'Scans for what is working, and usually finds something too.',
  },
  {
    axis: 'Criticism is',
    tu: 'Absorbed',
    as: 'Filtered',
    tuLine: 'Every note is taken seriously — including the ones that weren’t meant to be.',
    asLine: 'Keeps what is useful and lets the rest go — including, sometimes, the useful parts.',
  },
  {
    axis: 'Runs on',
    tu: 'Worry',
    as: 'Confidence',
    tuLine: 'Anxiety turns into preparation: backups, rehearsals, second drafts.',
    asLine: 'Calm turns into action: fewer drafts, faster starts.',
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
          title={['Same event.', <span key="b">Different <span className="tu">amplitude</span>.</span>]}
          lede={
            <>
              Neuroticism is one of the Big Five personality traits: a measure of how strongly, and how long, a person reacts to
              threat and loss. <span className="tu">Turbulent</span> minds sit high on it; <span className="as">assertive</span> minds sit low.
              Neither is a diagnosis. Both are ordinary settings of the same instrument.
            </>
          }
        />

        <div className="diff__plates grid">
          <Plate who="tu" />
          <Plate who="as" />
        </div>

        <div className="diff__table" role="table" aria-label="Turbulent and assertive compared">
          <div className="diff__thead" role="row">
            <span role="columnheader" className="diff__cell diff__cell--tu">
              <Tag who="tu">High N</Tag>
            </span>
            <span role="columnheader" className="diff__cell diff__axis label label--muted">
              Axis
            </span>
            <span role="columnheader" className="diff__cell diff__cell--as">
              <Tag who="as">Low N</Tag>
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
              <span role="cell" className="diff__cell diff__cell--tu">
                <motion.span
                  className="diff__word diff__word--tu tu"
                  variants={{ off: { x: '-30%', opacity: 0 }, on: { x: 0, opacity: 1 } }}
                  transition={{ duration: 1, ease: EASE }}
                >
                  {r.tu}
                </motion.span>
                <span className="diff__line">{r.tuLine}</span>
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
              <span role="cell" className="diff__cell diff__cell--as">
                <motion.span
                  className="diff__word diff__word--as as"
                  variants={{ off: { x: '30%', opacity: 0 }, on: { x: 0, opacity: 1 } }}
                  transition={{ duration: 1, ease: EASE }}
                >
                  {r.as}
                </motion.span>
                <span className="diff__line">{r.asLine}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Plates: one stressor, two response curves ---------- */

const gauss = (t: number, m: number, s: number) => Math.exp(-(((t - m) / s) ** 2))
const RESPONSE: Record<Who, (t: number) => number> = {
  tu: (t) => (t < 0 ? 0 : 0.88 * (1 - Math.exp(-t / 0.25)) * Math.exp(-t / 4.2) + 0.32 * gauss(t, 4.2, 0.55) + 0.24 * gauss(t, 7.6, 0.6)),
  as: (t) => (t < 0 ? 0 : 0.3 * (1 - Math.exp(-t / 0.25)) * Math.exp(-t / 0.7)),
}
const X0 = 40
const X1 = 380
const T_MAX = 11
const Y0 = 300
const H = 230
const toX = (t: number) => X0 + ((t + 1) / (T_MAX + 1)) * (X1 - X0)
const toY = (v: number) => Y0 - v * H

function curve(who: Who) {
  const pts: string[] = []
  for (let t = -1; t <= T_MAX; t += 0.05) pts.push(`${toX(t).toFixed(1)} ${toY(RESPONSE[who](t)).toFixed(1)}`)
  return 'M' + pts.join(' L')
}

const STATS: Record<Who, { peak: number; back: string; echoes: number }> = {
  tu: { peak: 86, back: '9 h', echoes: 2 },
  as: { peak: 28, back: '40 min', echoes: 0 },
}

function Plate({ who }: { who: Who }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 45%'] })
  const p = useTransform(scrollYProgress, [0.15, 1], [0, 1], { clamp: true })
  return (
    <figure ref={ref} className={`plate plate--${who}`}>
      <div className="plate__head">
        <Tag who={who}>{who === 'tu' ? 'Response curve' : 'Response curve'}</Tag>
        <span className="label label--muted">Fig. 2.{who === 'tu' ? 1 : 2}</span>
      </div>
      <div className="plate__art">
        <Response who={who} p={p} />
      </div>
      <Reveal as="div" className="plate__caption">
        <p className="plate__big display">{who === 'tu' ? 'High gain' : 'Low gain'}</p>
        <p className="note">
          {who === 'tu'
            ? 'The same email produces a sharp spike, a long tail, and two echoes hours later: rumination, the mind replaying the event after it has ended.'
            : 'The same email produces a small bump that is gone before the next task starts. Nothing echoes, because nothing was loud enough to replay.'}
        </p>
      </Reveal>
    </figure>
  )
}

function Response({ who, p }: { who: Who; p: MotionValue<number> }) {
  const color = `var(--${who})`
  const s = STATS[who]
  const [shown, setShown] = useState(0)
  useMotionValueEvent(p, 'change', (v) => setShown(v))
  const peak = Math.round(s.peak * Math.min(1, shown * 3))
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={`Arousal after a single stressor: peak ${s.peak}, back to baseline in ${s.back}`}>
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <line key={v} x1={X0} x2={X1} y1={toY(v)} y2={toY(v)} stroke="var(--rule)" />
      ))}
      <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="var(--ink)" />
      <line x1={X0} x2={X1} y1={toY(0.6)} y2={toY(0.6)} stroke="var(--ink)" strokeOpacity="0.5" strokeDasharray="3 4" />
      <text x={X1} y={toY(0.6) - 6} textAnchor="end" className="svg-mono" fill="var(--muted)">
        distress
      </text>
      <line x1={toX(0)} x2={toX(0)} y1={Y0 + 10} y2={40} stroke="var(--ink)" strokeWidth="1.5" />
      <text x={toX(0) + 6} y="50" className="svg-mono" fill="var(--ink)">
        event
      </text>
      <motion.path d={curve(who)} fill="none" stroke={color} strokeWidth="2.5" style={{ pathLength: p }} />
      <text x={X0} y={Y0 + 24} className="svg-mono" fill="var(--muted)">
        time →
      </text>
      <text x="200" y="370" textAnchor="middle" className="svg-mono" fill={color}>
        peak {peak} · baseline in {shown > 0.95 ? s.back : '…'} · echoes {shown > 0.95 ? s.echoes : '…'}
      </text>
    </svg>
  )
}
