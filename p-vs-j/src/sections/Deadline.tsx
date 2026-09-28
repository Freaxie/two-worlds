import { useMemo, useRef } from 'react'
import { Reveal, SectionHead, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import './Deadline.css'

/*
  One brief, one deadline, two curves of "done", scrubbed by a shared cursor.
  J climbs a staircase and finishes early, leaving a buffer.
  P explores first (the pale wave), finishes late in a surge — and still lands on the line.
*/

const X0 = 110
const X1 = 1130
const Y0 = 620 /* 0% */
const Y1 = 90 /* 100% */

const jDone = (u: number) => {
  /* eight milestones: work on each, close it, pause, start the next */
  const k = Math.min(1, u / 0.78)
  const i = Math.min(7, Math.floor(k * 8))
  const f = k * 8 - i
  return (i + Math.min(1, f / 0.7)) / 8
}
const pDone = (u: number) => Math.min(1, Math.pow(u / 0.985, 3.4))
const pExplore = (u: number) => Math.max(0, Math.sin(Math.min(1, u / 0.85) * Math.PI) * 0.82)

const X = (u: number) => X0 + (X1 - X0) * u
const Y = (v: number) => Y0 - (Y0 - Y1) * v

function curve(f: (u: number) => number, until: number, n = 160) {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * until
    d += `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(f(u)).toFixed(1)}`
  }
  return d
}

function Chart({ t }: { t: number }) {
  const u = seg(t, 0.04, 0.96)
  const exploreArea = useMemo(() => curve(pExplore, 1) + ` L${X(1)},${Y0} L${X0},${Y0} Z`, [])
  const jPath = curve(jDone, u)
  const pPath = curve(pDone, u)
  const milestones = Array.from({ length: 8 }, (_, i) => (i + 1) / 8)

  return (
    <svg viewBox="0 0 1200 700" className="dl__svg" role="img" aria-labelledby="dl-desc">
      <desc id="dl-desc">
        Percent of the work done, from the brief to the deadline. J climbs in eight even steps and finishes at about three quarters of the time,
        leaving a buffer. P spends the early time exploring, shown as a pale wave, and its done-curve stays low before rising steeply to finish at
        the deadline.
      </desc>

      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={X0} x2={X1} y1={Y(v)} y2={Y(v)} className={v === 0 ? 'dl__axis' : 'dl__grid'} />
          <text x={X0 - 14} y={Y(v) + 4} textAnchor="end" className="dl__tick">
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}

      {/* P: the exploring wave */}
      <clipPath id="dl-clip">
        <rect x={0} y={0} width={X(u)} height={700} />
      </clipPath>
      <path d={exploreArea} className="dl__explore" clipPath="url(#dl-clip)" />
      {u > 0.12 && (
        <text x={X(0.2)} y={Y(pExplore(0.425)) - 18} className="dl__note dl__note--p" style={{ opacity: seg(u, 0.12, 0.25) }}>
          exploring, sampling, trying things
        </text>
      )}

      {/* J buffer */}
      <rect x={X(0.78)} y={Y1} width={X(1) - X(0.78)} height={Y0 - Y1} className="dl__buffer" style={{ opacity: seg(u, 0.78, 0.86) }} />
      <text x={X(0.89)} y={Y1 + 26} textAnchor="middle" className="dl__note dl__note--j" style={{ opacity: seg(u, 0.8, 0.9) }}>
        BUFFER
      </text>

      {/* curves */}
      <path d={jPath} className="dl__j" />
      {milestones.map((m, i) => {
        const at = 0.78 * (m - 0.3 / 8)
        return u >= at ? <rect key={i} x={X(at) - 6} y={Y(jDone(at)) - 6} width={12} height={12} className="dl__milestone" /> : null
      })}
      <path d={pPath} className="dl__p" />
      {u >= 0.985 && <circle cx={X(0.985)} cy={Y(1)} r={9} className="dl__p-end" />}

      {/* deadline */}
      <line x1={X1} x2={X1} y1={Y1 - 30} y2={Y0} className="dl__deadline" />
      <text x={X1} y={Y1 - 40} textAnchor="middle" className="dl__tick dl__tick--strong">
        DEADLINE
      </text>
      <text x={X0} y={Y0 + 34} className="dl__tick">
        BRIEF
      </text>
      <text x={(X0 + X1) / 2} y={Y0 + 34} textAnchor="middle" className="dl__tick">
        TIME →
      </text>

      {/* cursor */}
      <g style={{ opacity: seg(t, 0.03, 0.08) }}>
        <line x1={X(u)} x2={X(u)} y1={Y1 - 10} y2={Y0} className="dl__cursor" />
        <rect x={X(u) + 10} y={Y1 - 4} width={236} height={60} className="dl__read-bg" />
        <text x={X(u) + 18} y={Y1 + 16} className="dl__read dl__read--j">
          J DONE {Math.round(jDone(u) * 100)}%
        </text>
        <text x={X(u) + 18} y={Y1 + 36} className="dl__read">
          P DONE {Math.round(pDone(u) * 100)}% · EXPLORING {Math.round(pExplore(u) * 100)}
        </text>
      </g>
    </svg>
  )
}

export function Deadline() {
  const wide = useMedia('(min-width: 861px)')
  const ref = useRef<HTMLDivElement>(null)
  const p = useDiagramProgress(ref, wide, ['start start', 'end end'], 5)
  const t = useFrameValue(p)

  return (
    <section className="dl" id="deadline" aria-labelledby="dl-title">
      <div className="wrap section dl__head">
        <SectionHead
          index="04"
          name="Time & the deadline"
          title={
            <span id="dl-title">
              Both finish. They disagree about <em>when</em> the work is.
            </span>
          }
          lede="Same brief, same deadline. The difference is the shape of the effort in between: a staircase or a wave."
        />
      </div>

      <div className={wide ? 'dl__track' : 'dl__flow'} ref={ref}>
        <div className="dl__sticky">
          <div className="wrap">
            <Chart t={t} />
          </div>
        </div>
      </div>

      <div className="wrap dl__text grid">
        <Reveal className="dl__col dl__col--p">
          <h3 className="dl__h display">A wave.</h3>
          <p className="body">
            P spends the early time gathering and trying. It looks like nothing is getting done, but the options are being explored. The deadline is
            what finally closes them, and late information often turns out to be the best information.
          </p>
        </Reveal>
        <Reveal className="dl__col dl__col--j" delay={0.1}>
          <h3 className="dl__h display">A staircase.</h3>
          <p className="body">
            J spreads the load forward. Each step closed is one less thing to carry, and the empty time before the deadline is not waste. It is
            the point: room for the thing nobody planned for.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
