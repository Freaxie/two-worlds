import { useMemo, useRef, useState } from 'react'
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion } from 'framer-motion'
import { EASE, Guides, PartHead, Reveal, Tag } from '../lib/ui'
import './Together.css'

/* A lemniscate: the left lobe is Ti (build and check the model), the right lobe
   is Te (act and measure), and the crossing is where a model becomes a decision.
   The slider re-weights the loop; the dot spends time in proportion to each lobe. */

const CX = 320
const CY = 190
const A = 270

const ZONES = [
  { max: 0.18, head: 'All model, no world.', body: 'The loop barely leaves the head. Theories grow more elegant and remain untested.' },
  { max: 0.4, head: 'Ti-led.', body: 'Think carefully, test occasionally. Slow — but rarely wrong for long.' },
  { max: 0.6, head: 'A learning loop.', body: 'Every theory gets tested. Every result gets explained. Each lap makes the next one faster and truer.' },
  { max: 0.82, head: 'Te-led.', body: 'Act fast, explain later. Quick — but explanation debt quietly accumulates.' },
  { max: 1.01, head: 'All world, no model.', body: 'The loop barely enters the head. It works, and nobody can say why — until it doesn’t.' },
]

const scales = (b: number) => ({ l: 0.28 + 0.72 * Math.min(1, 2 * (1 - b)), r: 0.28 + 0.72 * Math.min(1, 2 * b) })

function point(t: number, l: number, r: number): [number, number] {
  const s = Math.sin(t)
  const c = Math.cos(t)
  const den = 1 + s * s
  const x = (A * c) / den
  const y = (A * s * c) / den
  const k = x < 0 ? l : r
  return [CX + x * k, CY + y * k * 1.25]
}

function lobePath(l: number, r: number, from: number, to: number) {
  const pts: string[] = []
  for (let i = 0; i <= 80; i++) {
    const t = from + ((to - from) * i) / 80
    const [x, y] = point(t, l, r)
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return 'M' + pts.join(' L')
}

export function Together() {
  const [bal, setBal] = useState(0.5)
  const { l, r } = scales(bal)
  const zone = ZONES.find((z) => bal < z.max)!
  const tiPath = useMemo(() => lobePath(l, r, Math.PI / 2, (3 * Math.PI) / 2), [l, r])
  const tePath = useMemo(() => lobePath(l, r, -Math.PI / 2, Math.PI / 2), [l, r])

  return (
    <section id="together" className="part part--rule tog" aria-labelledby="together-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="together"
          n="07"
          name="Not opposites"
          title={['Not a choice.', 'A circuit.']}
          lede="Ti and Te are not rival answers to the same question. They are two halves of a loop: one makes a model worth testing, the other makes a test worth explaining. Drag the balance and watch the loop change shape."
        />

        <div className="tog__stage">
          <div className="tog__figure">
            <Loop tiPath={tiPath} tePath={tePath} l={l} r={r} />
          </div>

          <div className="tog__control">
            <div className="tog__ends">
              <span className="label ti">Ti without Te</span>
              <span className="label te">Te without Ti</span>
            </div>
            <input
              className="tog__range"
              type="range"
              min={0}
              max={100}
              value={Math.round(bal * 100)}
              onChange={(e) => setBal(+e.target.value / 100)}
              aria-label="Balance between Ti and Te"
              aria-valuetext={zone.head}
              style={{ ['--p' as string]: `${bal * 100}%` }}
            />
            <div className="tog__ends tog__ends--sub">
              <span className="serif">a beautiful theory nobody tested</span>
              <span className="serif">a working system nobody understands</span>
            </div>
            <motion.div key={zone.head} className="tog__zone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <p className="tog__zone-head display">{zone.head}</p>
              <p className="tog__zone-body">{zone.body}</p>
            </motion.div>
          </div>
        </div>

        <div className="tog__cases grid">
          {[
            { k: 'Science', ti: 'A hypothesis that is internally consistent', te: 'An experiment that replicates' },
            { k: 'Engineering', ti: 'A specification with no contradictions', te: 'A build that passes in production' },
            { k: 'Debugging', ti: 'A theory that explains every symptom', te: 'A fix that holds under load' },
          ].map((c, i) => (
            <Reveal key={c.k} className="tog__case" delay={i * 0.08}>
              <span className="label label--muted">{String(i + 1).padStart(2, '0')} · {c.k}</span>
              <p>
                <Tag who="ti" />
                {c.ti}
              </p>
              <span className="tog__case-join" aria-hidden="true">⇄</span>
              <p>
                <Tag who="te" />
                {c.te}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Loop({ tiPath, tePath, l, r }: { tiPath: string; tePath: string; l: number; r: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref)
  const reduce = useReducedMotion()
  const x = useMotionValue(CX)
  const y = useMotionValue(CY)
  const fill = useMotionValue('var(--te)')
  const t = useRef(0)

  useAnimationFrame((_, delta) => {
    if (!inView || reduce) return
    const onLeft = Math.cos(t.current) < 0
    const k = onLeft ? l : r
    t.current = (t.current + (delta / 1000) * (1.5 / (0.35 + k))) % (Math.PI * 2)
    const [px, py] = point(t.current, l, r)
    x.set(px)
    y.set(py)
    fill.set(Math.cos(t.current) < 0 ? 'var(--ti)' : 'var(--te)')
  })

  const [lx] = point(Math.PI, l, r)
  const [rx] = point(0, l, r)

  return (
    <svg ref={ref} className="tog__svg" viewBox="0 0 640 380" role="img" aria-label="A figure-eight loop: Ti on the left, Te on the right, crossing at the point of decision">
      <motion.path d={tiPath} fill="none" stroke="var(--ti)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE }} />
      <motion.path d={tePath} fill="none" stroke="var(--te)" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EASE, delay: 0.3 }} />
      <line x1={CX} y1="30" x2={CX} y2="350" stroke="var(--rule-strong)" strokeDasharray="2 5" />

      <text x={(lx + CX) / 2} y={CY + 5} textAnchor="middle" className="tog__lobe-label" fill="var(--ti)">
        model
      </text>
      <text x={(rx + CX) / 2} y={CY + 5} textAnchor="middle" className="tog__lobe-label" fill="var(--te)">
        world
      </text>
      <text x={lx - 10} y={CY + 4} textAnchor="end" className="svg-mono" fill="var(--ti)">
        explain
      </text>
      <text x={rx + 10} y={CY + 4} className="svg-mono" fill="var(--te)">
        test
      </text>
      <text x={CX} y="22" textAnchor="middle" className="svg-mono" fill="var(--ink)">
        decision
      </text>
      <text x={CX} y="372" textAnchor="middle" className="svg-mono" fill="var(--muted)">
        evidence returns
      </text>

      <circle cx={CX} cy={CY} r="5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      {!reduce && <motion.circle r="8" style={{ cx: x, cy: y, fill }} />}
    </svg>
  )
}
