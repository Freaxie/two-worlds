import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag } from '../lib/ui'
import './Together.css'

/* An inverted U: performance rises with arousal, then falls. The assertive mind
   starts on the left slope, the turbulent mind on the right. Both can move. */

const ZONES = [
  { max: 0.2, head: 'Too calm to prepare.', body: 'Nothing feels urgent, so nothing gets rehearsed. The first hard question arrives as a surprise.' },
  { max: 0.4, head: 'Relaxed, a little loose.', body: 'Clear-headed and quick, with a few gaps a small amount of worry would have found.' },
  { max: 0.62, head: 'Useful tension.', body: 'Alert enough to check the details, calm enough to use them. Most good work happens here.' },
  { max: 0.8, head: 'Wound tight.', body: 'Sharp on risks, starting to fray. Attention narrows toward threats and away from the task.' },
  { max: 1.01, head: 'Too alarmed to think.', body: 'The alarm is louder than the problem. Energy goes into managing the feeling instead of the work.' },
]

const W = 640
const H = 350
const X0 = 40
const X1 = 600
const Y0 = 290
const perf = (a: number) => Math.exp(-(((a - 0.5) / 0.26) ** 2))
const px = (a: number) => X0 + a * (X1 - X0)
const py = (v: number) => Y0 - v * 230
const seg = (a0: number, a1: number) => {
  const pts: string[] = []
  for (let a = a0; a <= a1 + 1e-9; a += 0.01) pts.push(`${px(a).toFixed(1)} ${py(perf(a)).toFixed(1)}`)
  return 'M' + pts.join(' L')
}

export function Together() {
  const [a, setA] = useState(0.5)
  const zone = ZONES.find((z) => a < z.max)!
  const who = a < 0.4 ? 'as' : a > 0.62 ? 'tu' : 'ink'

  return (
    <section id="together" className="part part--rule tog" aria-labelledby="together-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="together"
          n="07"
          name="Not opposites"
          title={['Not a flaw.', 'A setting.']}
          lede="Since 1908 psychologists have sketched the link between arousal and performance as an inverted U: a little tension sharpens you, too much scatters you. It is a rough rule, not a law, but it explains why neither end wins. Drag the level and watch where the work gets done."
        />

        <div className="tog__stage">
          <div className="tog__figure">
            <svg className="tog__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Inverted U curve of performance against arousal">
              <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="var(--ink)" />
              <line x1={X0} x2={X0} y1={Y0} y2="40" stroke="var(--ink)" />
              <rect x={px(0.4)} y="40" width={px(0.62) - px(0.4)} height={Y0 - 40} fill="var(--ink)" fillOpacity="0.04" />
              <motion.path d={seg(0, 0.4)} fill="none" stroke="var(--as)" strokeWidth="2.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} />
              <motion.path d={seg(0.4, 0.62)} fill="none" stroke="var(--ink)" strokeWidth="2.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE, delay: 0.9 }} />
              <motion.path d={seg(0.62, 1)} fill="none" stroke="var(--tu)" strokeWidth="2.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE, delay: 1.4 }} />

              <text x={X0} y="30" className="svg-mono" fill="var(--muted)">
                performance
              </text>
              <text x={X1} y={Y0 + 44} textAnchor="end" className="svg-mono" fill="var(--muted)">
                arousal →
              </text>
              <text x={px(0.12)} y={Y0 + 24} textAnchor="middle" className="tog__lobe-label" fill="var(--as)">
                assertive slope
              </text>
              <text x={px(0.88)} y={Y0 + 24} textAnchor="middle" className="tog__lobe-label" fill="var(--tu)">
                turbulent slope
              </text>
              <text x={px(0.51)} y="30" textAnchor="middle" className="svg-mono" fill="var(--ink)">
                useful tension
              </text>

              <motion.line animate={{ x1: px(a), x2: px(a), y2: py(perf(a)) }} y1={Y0} stroke="var(--ink)" strokeDasharray="2 4" transition={{ duration: 0.25 }} />
              <motion.circle r="9" animate={{ cx: px(a), cy: py(perf(a)) }} transition={{ duration: 0.25 }} fill={who === 'ink' ? 'var(--ink)' : `var(--${who})`} />
              <text x={px(a)} y={py(perf(a)) - 18} textAnchor="middle" className="svg-mono" fill="var(--ink)">
                {Math.round(perf(a) * 100)}
              </text>
            </svg>
          </div>

          <div className="tog__control">
            <div className="tog__ends">
              <span className="label as">Low arousal</span>
              <span className="label tu">High arousal</span>
            </div>
            <input
              id="tog-range"
              className="tog__range"
              type="range"
              min={0}
              max={100}
              value={Math.round(a * 100)}
              onChange={(e) => setA(+e.target.value / 100)}
              aria-label="Arousal level"
              aria-valuetext={zone.head}
              style={{ ['--p' as string]: `${a * 100}%` }}
            />
            <div className="tog__ends tog__ends--sub">
              <span className="serif">nothing feels urgent</span>
              <span className="serif">everything feels urgent</span>
            </div>
            <motion.div key={zone.head} className="tog__zone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <p className="tog__zone-head display">{zone.head}</p>
              <p className="tog__zone-body">{zone.body}</p>
            </motion.div>
          </div>
        </div>

        <h3 className="tog__sub display">
          Worry early. <span className="serif">Calm late.</span>
        </h3>
        <div className="tog__cases grid">
          {[
            { k: 'Before', tu: 'Imagines how it could fail, and writes the checklist', as: 'Keeps the list short enough to actually use' },
            { k: 'During', tu: 'Notices the gauge drifting before anyone else', as: 'Runs the checklist without flinching' },
            { k: 'After', tu: 'Writes the honest post-mortem', as: 'Closes it without self-punishment, and sleeps' },
          ].map((c, i) => (
            <Reveal key={c.k} className="tog__case" delay={i * 0.08}>
              <span className="label label--muted">
                {String(i + 1).padStart(2, '0')} · {c.k}
              </span>
              <p>
                <Tag who="tu" />
                {c.tu}
              </p>
              <span className="tog__case-join" aria-hidden="true">
                +
              </span>
              <p>
                <Tag who="as" />
                {c.as}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
