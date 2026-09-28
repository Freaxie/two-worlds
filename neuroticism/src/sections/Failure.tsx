import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import { Guides, PartHead, Reveal, Tag, type Who } from '../lib/ui'
import './Failure.css'

export function Failure() {
  return (
    <section id="failure" className="part part--rule fail" aria-labelledby="failure-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="failure"
          n="05"
          name="Failure modes"
          title={['Every alarm', 'trades false alarms', 'for misses.']}
          lede="A mind that reacts to threat works like a smoke detector. Set it sensitive and it catches every real fire, along with every piece of burnt toast. Set it relaxed and it stays quiet, including through the small fire that mattered. Both figures below read the same week of signal."
        />

        <div className="fail__grid grid">
          <article className="fail__plate fail__plate--tu">
            <div className="fail__head">
              <Tag who="tu">Threshold 0.30</Tag>
              <span className="label label--muted">Fig. 5.1</span>
            </div>
            <Detector who="tu" />
            <h3 className="fail__title display">
              An alarm <span className="serif">that won’t switch off.</span>
            </h3>
            <Symptoms
              items={[
                'Rumination: replaying what has already happened',
                'Treating the worst case as the likely one',
                'Reassurance that works for about an hour',
                'Avoiding things to avoid the feeling',
              ]}
            />
          </article>

          <article className="fail__plate fail__plate--as">
            <div className="fail__head">
              <Tag who="as">Threshold 0.70</Tag>
              <span className="label label--muted">Fig. 5.2</span>
            </div>
            <Detector who="as" />
            <h3 className="fail__title display">
              A calm <span className="serif">that doesn’t check.</span>
            </h3>
            <Symptoms
              items={[
                'Missing the early, quiet signal',
                'Under-preparing for the hard question',
                'Hearing other people’s concern as overreaction',
                'Surprise at problems everyone else saw coming',
              ]}
            />
          </article>
        </div>
      </div>
    </section>
  )
}

function Symptoms({ items }: { items: string[] }) {
  return (
    <ul className="fail__list">
      {items.map((t, i) => (
        <Reveal as="li" key={t} delay={i * 0.06}>
          <span className="label label--muted">{String(i + 1).padStart(2, '0')}</span>
          {t}
        </Reveal>
      ))}
    </ul>
  )
}

/* ---------- One shared signal: mostly noise, two real events ---------- */

const N = 120
const rnd = (i: number) => {
  const x = Math.sin(i * 78.233 + 1.7) * 43758.5453
  return x - Math.floor(x)
}
const bump = (i: number, c: number, w: number, h: number) => h * Math.exp(-(((i - c) / w) ** 2))
const REAL = [44, 96]
const SIGNAL = Array.from({ length: N }, (_, i) => {
  const noise = 0.12 + Math.sin(i * 0.7) * 0.06 + Math.sin(i * 1.9) * 0.05 + rnd(i) * 0.1
  const spikes = bump(i, 14, 1.4, 0.24) + bump(i, 27, 1.2, 0.2) + bump(i, 63, 1.5, 0.26) + bump(i, 78, 1.2, 0.2) + bump(i, 110, 1.3, 0.22)
  const real = bump(i, REAL[0], 2, 0.46) + bump(i, REAL[1], 2.4, 0.72)
  return Math.min(1, noise + spikes + real)
})
const THRESHOLD: Record<Who, number> = { tu: 0.3, as: 0.7 }

function crossings(th: number) {
  const out: { i: number; real: boolean }[] = []
  for (let i = 1; i < N; i++) if (SIGNAL[i - 1] < th && SIGNAL[i] >= th) out.push({ i, real: REAL.some((r) => Math.abs(r - i) <= 4) })
  return out
}

const PX0 = 20
const PX1 = 380
const PY0 = 200
const PH = 150
const sx = (i: number) => PX0 + (i / (N - 1)) * (PX1 - PX0)
const sy = (v: number) => PY0 - v * PH
const SIGNAL_D = 'M' + SIGNAL.map((v, i) => `${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' L')

function Detector({ who }: { who: Who }) {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reduce = useReducedMotion()
  const th = THRESHOLD[who]
  const alarms = crossings(th)
  const scan = useMotionValue(reduce ? N : 0)
  const scanX = useTransform(scan, (v) => sx(Math.min(N - 1, v)))
  const scanW = useTransform(scanX, (x) => Math.max(0, x - PX0 + 2))
  const [at, setAt] = useState(reduce ? N : 0)
  useMotionValueEvent(scan, 'change', (v) => setAt(v))

  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(scan, [0, N], { duration: 6, ease: 'linear', repeat: Infinity, repeatDelay: 2.2 })
    return () => c.stop()
  }, [inView, reduce, scan])

  const seen = alarms.filter((a) => a.i <= at)
  const hits = seen.filter((a) => a.real).length
  const falses = seen.length - hits
  const passed = REAL.filter((r) => r - 4 <= at).length
  const missed = REAL.filter((r) => r + 4 <= at && !alarms.some((a) => a.real && Math.abs(a.i - r) <= 4)).length
  const color = `var(--${who})`

  return (
    <svg ref={ref} className="fail__svg" viewBox="0 0 400 270" role="img" aria-label={`Alarm threshold ${th}: ${alarms.length} alarms over the week, ${alarms.filter((a) => a.real).length} of 2 real events caught`}>
      <line x1={PX0} x2={PX1} y1={PY0} y2={PY0} stroke="var(--rule-strong)" />
      <path d={SIGNAL_D} fill="none" stroke="var(--ink)" strokeOpacity="0.25" strokeWidth="1.2" />
      <defs>
        <clipPath id={`scan-${who}`}>
          <motion.rect x={PX0 - 2} y="0" height="270" style={{ width: scanW }} />
        </clipPath>
      </defs>
      <path d={SIGNAL_D} fill="none" stroke="var(--ink)" strokeWidth="1.5" clipPath={`url(#scan-${who})`} />
      <line x1={PX0} x2={PX1} y1={sy(th)} y2={sy(th)} stroke={color} strokeWidth="1.5" strokeDasharray="5 4" />
      <text x={PX1} y={sy(th) - 6} textAnchor="end" className="svg-mono" fill={color}>
        alarm ≥ {th.toFixed(2)}
      </text>

      {REAL.map((r) => (
        <g key={r}>
          <path d={`M${sx(r) - 5} ${PY0 + 14} l5 -8 5 8 z`} fill="var(--ink)" />
          <text x={sx(r)} y={PY0 + 28} textAnchor="middle" className="svg-mono" fill="var(--ink)">
            real
          </text>
        </g>
      ))}

      {alarms.map((a) => (
        <motion.g key={a.i} initial={false} animate={{ opacity: a.i <= at ? 1 : 0 }} transition={{ duration: 0.15 }}>
          <line x1={sx(a.i)} x2={sx(a.i)} y1="18" y2="38" stroke={color} strokeWidth={a.real ? 3 : 1.5} />
          <circle cx={sx(a.i)} cy={sy(SIGNAL[a.i])} r="3.5" fill={color} />
        </motion.g>
      ))}
      <motion.line y1="12" y2={PY0} stroke={color} strokeOpacity="0.5" x1={scanX} x2={scanX} />

      <text x={PX0} y="258" className="svg-mono" fill={color}>
        alarms {seen.length} · false {falses}
      </text>
      <text x={PX1} y="258" textAnchor="end" className="svg-mono" fill={missed ? 'var(--ink)' : 'var(--muted)'}>
        real caught {hits}/{passed || 0}
        {missed ? ` · missed ${missed}` : ''}
      </text>
    </svg>
  )
}
