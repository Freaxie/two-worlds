import { useMemo, useRef } from 'react'
import { Reveal, SectionHead, rng, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import './Time.css'

/*
  One time axis, two shapes of the future, scrubbed by a single cursor.
  Ni: a spread of possible futures tightening into one trajectory — a cone that closes.
  Ne: a present that keeps forking — a cone that opens.
*/

const X0 = 90
const X1 = 1110
const NI_Y = 190
const NE_Y = 545

type Branch = { x1: number; y1: number; x2: number; y2: number; depth: number }

function useNeTree() {
  return useMemo(() => {
    const r = rng(8)
    const out: Branch[] = []
    const depthMax = 6
    const step = (X1 - X0) / depthMax
    const grow = (x: number, y: number, d: number, amp: number) => {
      if (d >= depthMax) return
      const n = r() < 0.22 && d > 0 ? 3 : 2
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1) - 0.5
        const y2 = Math.max(398, Math.min(692, y + t * amp * 2 + (r() - 0.5) * amp * 0.3))
        const x2 = x + step * (0.9 + r() * 0.2)
        out.push({ x1: x, y1: y, x2: Math.min(X1, x2), y2, depth: d })
        grow(Math.min(X1, x2), y2, d + 1, amp * 0.56)
      }
    }
    grow(X0, NE_Y, 0, 70)
    return out
  }, [])
}

function useNiPaths() {
  return useMemo(() => {
    const r = rng(21)
    return Array.from({ length: 17 }, (_, i) => {
      const s = (i / 16 - 0.5) * 290 + (r() - 0.5) * 16
      return { d: `M${X0},${NI_Y} C${380},${NI_Y + s * 1.05} ${760},${NI_Y + s * 0.32} ${X1},${NI_Y}`, s }
    })
  }, [])
}

function TimeFigure({ t }: { t: number }) {
  const ni = useNiPaths()
  const ne = useNeTree()
  const cursorX = X0 + (X1 - X0) * seg(t, 0.05, 0.95)
  const draw = seg(t, 0.02, 0.3)

  /* live readouts at the cursor */
  const u = (cursorX - X0) / (X1 - X0)
  const niCount = Math.max(1, Math.round(17 * (1 - Math.pow(u, 1.4))))
  const neCount = ne.filter((b) => b.x1 <= cursorX && b.x2 > cursorX).length || 1
  const niWidth = 290 * 0.5 * (1 - u) * (1 - u) * 1.2

  return (
    <svg viewBox="0 0 1200 760" className="time__svg" role="img" aria-labelledby="time-desc">
      <desc id="time-desc">
        A shared time axis from now to the horizon. Above, seventeen possible futures narrow into a single trajectory. Below, one present forks
        again and again into dozens of futures.
      </desc>

      {/* band labels */}
      <text x={0} y={34} className="time__band-label time__band-label--ni">NI · THE FUTURE AS A DESTINATION</text>
      <text x={0} y={390} className="time__band-label">NE · THE FUTURE AS A FIELD</text>

      {/* Ni cone */}
      <path
        d={`M${X0},${NI_Y} C380,${NI_Y - 152} 760,${NI_Y - 46} ${X1},${NI_Y} C760,${NI_Y + 46} 380,${NI_Y + 152} ${X0},${NI_Y} Z`}
        className="time__cone"
        style={{ opacity: draw * 0.9 }}
      />
      <defs>
        <clipPath id="time-ni-clip">
          <rect x={0} y={0} width={cursorX} height={380} />
        </clipPath>
      </defs>
      <g clipPath="url(#time-ni-clip)">
        {ni.map((p, i) => (
          <path key={i} d={p.d} className="time__ni-path" />
        ))}
      </g>
      {/* Ni knows the destination before the route: the endpoint is there from the start */}
      <line x1={X0} y1={NI_Y} x2={X1} y2={NI_Y} className="time__ni-ghost" />
      <line x1={X0} y1={NI_Y} x2={X0 + (cursorX - X0) * seg(t, 0.2, 1) ** 0.5} y2={NI_Y} className="time__ni-main" />
      <circle cx={X1} cy={NI_Y} r={5 + seg(t, 0.85, 1) * 9} className="time__ni-end" />
      <text x={X1} y={NI_Y - 22} textAnchor="middle" className="time__tick time__tick--ni">
        ALREADY FELT
      </text>

      {/* Ne tree */}
      {ne.map((b, i) => {
        const bx = seg(cursorX, b.x1, b.x2)
        if (bx <= 0) return null
        return (
          <g key={i}>
            <line
              x1={b.x1}
              y1={b.y1}
              x2={b.x1 + (b.x2 - b.x1) * bx}
              y2={b.y1 + (b.y2 - b.y1) * bx}
              className={`time__ne-line time__ne-line--d${Math.min(b.depth, 4)}`}
            />
            {bx >= 1 && <circle cx={b.x2} cy={b.y2} r={b.depth > 3 ? 2.2 : 3.4} className="time__ne-node" />}
          </g>
        )
      })}

      {/* origin */}
      <circle cx={X0} cy={NI_Y} r={7} className="time__now" />
      <circle cx={X0} cy={NE_Y} r={7} className="time__now" />

      {/* axis */}
      <line x1={X0} y1={728} x2={X1} y2={728} className="time__axis" />
      {['now', 'soon', 'later', 'horizon'].map((l, i) => {
        const x = X0 + ((X1 - X0) * i) / 3
        return (
          <g key={l}>
            <line x1={x} y1={722} x2={x} y2={734} className="time__axis" />
            <text x={x} y={754} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'} className="time__tick">
              {l.toUpperCase()}
            </text>
          </g>
        )
      })}

      {/* cursor */}
      <g style={{ opacity: seg(t, 0.03, 0.08) }}>
        <line x1={cursorX} y1={48} x2={cursorX} y2={728} className="time__cursor" />
        <line x1={cursorX} y1={NI_Y - niWidth} x2={cursorX} y2={NI_Y + niWidth} className="time__cursor-ni" />
        <rect x={cursorX + 8} y={52} width={132} height={22} className="time__read-bg" />
        <text x={cursorX + 14} y={67} className="time__read time__read--ni">
          FUTURES {String(niCount).padStart(2, '0')}
        </text>
        <rect x={cursorX + 8} y={404} width={132} height={22} className="time__read-bg" />
        <text x={cursorX + 14} y={419} className="time__read">
          FUTURES {String(neCount).padStart(2, '0')}
        </text>
      </g>
    </svg>
  )
}

export function Time() {
  const wide = useMedia('(min-width: 861px)')
  const ref = useRef<HTMLDivElement>(null)
  const p = useDiagramProgress(ref, wide, ['start start', 'end end'], 5)
  const t = useFrameValue(p)

  return (
    <section className="time" id="time" aria-labelledby="time-title">
      <div className="wrap section time__head">
        <SectionHead
          index="04"
          name="Time & possibility"
          title={
            <span id="time-title">
              One future, <em>or</em> a thousand.
            </span>
          }
          lede="Both functions live partly in time that hasn’t happened. What differs is the shape of that time: a trajectory, or a field."
        />
      </div>

      <div className={wide ? 'time__track' : 'time__flow'} ref={ref}>
        <div className="time__sticky">
          <div className="wrap">
            <TimeFigure t={t} />
          </div>
        </div>
      </div>

      <div className="wrap time__text grid">
        <Reveal className="time__col time__col--ni">
          <h3 className="time__h display">A trajectory.</h3>
          <p className="body">
            For Ni, time has a direction before it has details. The sense of <em>where this is going</em> arrives first, often as an image or a
            conviction, and the route is inferred backward from it.
          </p>
        </Reveal>
        <Reveal className="time__col time__col--ne" delay={0.1}>
          <h3 className="time__h display">A field.</h3>
          <p className="body">
            For Ne, the present keeps forking. Every moment multiplies the next ones, and the most interesting future is usually the one nobody
            has thought of yet.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
