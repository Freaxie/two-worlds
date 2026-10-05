import { useRef } from 'react'
import { Reveal, SectionHead, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import './Depth.css'

/*
  The same afternoon, spent two ways, on one shared time axis.
  Te goes across: one problem after another is closed and laid down along the line.
  Ti goes down: a single problem, probed layer by layer — what, how, why, why that —
  with long plateaus and sudden drops, until it hits first principles.
*/

const X0 = 150
const X1 = 1130
const X = (u: number) => X0 + (X1 - X0) * u
const TE_N = 28
const STRATA = ['WHAT', 'HOW', 'WHY', 'WHY THAT', 'FIRST PRINCIPLES']
const SY = 360 /* top of strata */
const SH = 64 /* stratum height */

/* depth in strata (0–5): plateaus, then breakthroughs */
const DEPTH_KEYS: [number, number][] = [
  [0, 0],
  [0.08, 0.9],
  [0.22, 1],
  [0.28, 1.9],
  [0.46, 2.05],
  [0.52, 2.95],
  [0.74, 3.1],
  [0.8, 4],
  [0.94, 4.1],
  [1, 4.85],
]

function depthAt(u: number) {
  for (let i = 1; i < DEPTH_KEYS.length; i++) {
    const [u1, d1] = DEPTH_KEYS[i]
    const [u0, d0] = DEPTH_KEYS[i - 1]
    if (u <= u1) return d0 + (d1 - d0) * ((u - u0) / (u1 - u0))
  }
  return DEPTH_KEYS[DEPTH_KEYS.length - 1][1]
}

function Chart({ t }: { t: number }) {
  const u = seg(t, 0.04, 0.96)
  const resolved = Math.floor(u * TE_N + 1e-6)
  const depth = depthAt(u)
  const layer = Math.min(5, Math.floor(depth + 1e-6) + 1)

  let probe = ''
  const n = 120
  for (let i = 0; i <= n; i++) {
    const uu = (i / n) * u
    probe += `${i ? 'L' : 'M'}${X(uu).toFixed(1)},${(SY + depthAt(uu) * SH).toFixed(1)}`
  }

  return (
    <svg viewBox="0 0 1200 760" className="dp__svg" role="img" aria-labelledby="dp-desc">
      <desc id="dp-desc">
        A shared time axis. Above, Te closes twenty-eight separate problems one after another, laid out along the line. Below, Ti follows one
        problem down through five layers labelled what, how, why, why that, and first principles, with long plateaus and sudden drops.
      </desc>

      {/* Te: reach */}
      <text x={0} y={60} className="dp__band dp__band--te">
        TE · REACH
      </text>
      <line x1={X0} x2={X1} y1={250} y2={250} className="dp__axis" />
      {Array.from({ length: TE_N }, (_, i) => {
        const at = (i + 1) / TE_N
        if (u < at) return null
        const x = X(at) - 14
        const y = i % 2 ? 186 : 214
        return (
          <g key={i}>
            <rect x={x} y={y} width={22} height={22} className="dp__te-done" />
            <path d={`M${x + 5},${y + 11} l4,4 l8,-9`} className="dp__te-tick" />
          </g>
        )
      })}
      <text x={X0} y={150} className="dp__read dp__read--te">
        PROBLEMS CLOSED {String(resolved).padStart(2, '0')}
      </text>

      {/* Ti: depth */}
      <text x={0} y={SY - 30} className="dp__band dp__band--ti">
        TI · DEPTH
      </text>
      {STRATA.map((s, i) => (
        <g key={s}>
          <rect x={X0} y={SY + i * SH} width={X1 - X0} height={SH} className={i < layer ? 'dp__stratum dp__stratum--on' : 'dp__stratum'} style={{ opacity: 0.25 + i * 0.12 }} />
          <text x={X0 - 14} y={SY + i * SH + SH / 2 + 4} textAnchor="end" className={i < layer ? 'dp__layer dp__layer--on' : 'dp__layer'}>
            {s}
          </text>
        </g>
      ))}
      <path d={probe} className="dp__probe" />
      <circle cx={X(u)} cy={SY + depth * SH} r={7} className="dp__probe-head" />
      <text x={X0 + 10} y={SY + 5 * SH + 30} className="dp__read dp__read--ti">
        ONE PROBLEM · LAYER {layer}/5
      </text>

      {/* shared axis */}
      <line x1={X(u)} x2={X(u)} y1={120} y2={SY + 5 * SH} className="dp__cursor" />
      <text x={X0} y={752} className="dp__tick">
        1 PM
      </text>
      <text x={X1} y={752} textAnchor="end" className="dp__tick">
        6 PM
      </text>
      <text x={(X0 + X1) / 2} y={752} textAnchor="middle" className="dp__tick">
        THE SAME AFTERNOON →
      </text>
    </svg>
  )
}

export function Depth() {
  const wide = useMedia('(min-width: 861px)')
  const ref = useRef<HTMLDivElement>(null)
  const p = useDiagramProgress(ref, wide, ['start start', 'end end'], 5)
  const t = useFrameValue(p)

  return (
    <section className="dp" id="depth" aria-labelledby="dp-title">
      <div className="wrap section dp__head">
        <SectionHead
          index="04"
          name="Depth & reach"
          title={
            <span id="dp-title">
              One goes <em>down.</em> One goes <em>across.</em>
            </span>
          }
          lede="Give each of them the same afternoon. Te closes twenty-eight things. Ti finds out why one of them happens at all."
        />
      </div>

      <div className={wide ? 'dp__track' : 'dp__flow'} ref={ref}>
        <div className="dp__sticky">
          <div className="wrap">
            <Chart t={t} />
          </div>
        </div>
      </div>

      <div className="wrap dp__text grid">
        <Reveal className="dp__col dp__col--ti">
          <h3 className="dp__h display">Depth.</h3>
          <p className="body">
            Ti stays with one question until it gives way. Progress looks like nothing for a long time, then a whole layer drops out at once. The
            reward is a model that explains the next twenty problems before they arrive.
          </p>
        </Reveal>
        <Reveal className="dp__col dp__col--te" delay={0.1}>
          <h3 className="dp__h display">Reach.</h3>
          <p className="body">
            Te looks for the move that closes the most. A problem does not have to be fully understood to be fully solved, and twenty-eight
            solved problems change more of the world than one perfect explanation.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
