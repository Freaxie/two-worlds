import { useMemo, useRef } from 'react'
import { SectionHead, rng, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import { ease, easeInOut } from '../components/tree'
import './OneIdea.css'

/*
  One observation, two mechanisms, scrubbed by scroll.
  Ni: many readings appear, most are dropped, the rest fuse into one interpretation.
  Ne: the observation opens generation by generation, then the branches cross-link.
*/

const OBS = 'A single light left on, high in an office tower, at 3 a.m.'

/* ---------- Ni ---------- */

type Cand = { text: string; x: number; y: number; keep: boolean }

const NI_CANDS: Cand[] = [
  { text: 'someone forgot to switch it off', x: 330, y: 64, keep: false },
  { text: 'a deadline', x: 430, y: 150, keep: true },
  { text: 'a cleaner on the late shift', x: 230, y: 190, keep: false },
  { text: 'a crisis', x: 180, y: 320, keep: true },
  { text: 'insomnia', x: 470, y: 372, keep: false },
  { text: 'an affair', x: 330, y: 452, keep: false },
  { text: 'someone waiting for a call', x: 420, y: 530, keep: true },
]

const NI_ANCHOR: [number, number] = [600, 300]
const NI_F: [number, number] = [96, 300]

function NiStage({ t }: { t: number }) {
  const appear = seg(t, 0.02, 0.3)
  const drop = seg(t, 0.3, 0.52)
  const fuse = easeInOut(seg(t, 0.42, 0.74))
  const arrive = seg(t, 0.7, 0.92)
  const threadLen = 520

  return (
    <svg viewBox="0 0 600 600" className="oi__svg" role="img" aria-labelledby="oi-ni-desc">
      <desc id="oi-ni-desc">
        Ni: seven readings of the observation appear. Four are dropped as noise. A deadline, a crisis and someone waiting fuse into one interpretation:
        a decision is being made tonight that will reach everyone by morning.
      </desc>
      {NI_CANDS.map((c, i) => {
        const a = seg(appear, i / NI_CANDS.length, i / NI_CANDS.length + 0.4)
        let x = c.x
        let y = c.y
        let o = a
        if (c.keep) {
          x = c.x + (NI_F[0] - c.x) * fuse
          y = c.y + (NI_F[1] - c.y) * fuse
        } else {
          o = a * (1 - drop * 0.78)
        }
        const cx = (NI_ANCHOR[0] + x) / 2
        return (
          <g key={i} style={{ opacity: o }}>
            <path
              d={`M${NI_ANCHOR[0]},${NI_ANCHOR[1]} Q${cx},${c.keep ? y : NI_ANCHOR[1]} ${x},${y}`}
              className={c.keep ? 'oi__ni-line' : 'oi__ni-line oi__ni-line--drop'}
              pathLength={1}
              strokeDasharray={c.keep ? '1 1' : '0.01 0.012'}
              strokeDashoffset={c.keep ? 1 - a : 0}
            />
            <circle cx={x} cy={y} r={c.keep ? 5 : 3.5} className={c.keep ? 'oi__ni-dot' : 'oi__ni-dot oi__ni-dot--drop'} />
            <text
              x={x}
              y={y - 12}
              textAnchor="middle"
              className={`oi__lab ${c.keep ? '' : 'oi__lab--drop'}`}
              style={{ opacity: c.keep ? 1 - fuse * 1.4 : 1 }}
            >
              {c.text}
            </text>
            {!c.keep && drop > 0.2 && (
              <line
                x1={x - c.text.length * 3.3}
                x2={x - c.text.length * 3.3 + c.text.length * 6.6 * seg(drop, 0.2, 1)}
                y1={y - 16}
                y2={y - 16}
                className="oi__strike"
              />
            )}
          </g>
        )
      })}

      {/* the thread: from the observation to its single meaning */}
      <path
        d={`M${NI_ANCHOR[0]},${NI_ANCHOR[1]} L${NI_F[0]},${NI_F[1]}`}
        className="oi__thread"
        strokeDasharray={threadLen}
        strokeDashoffset={threadLen * (1 - arrive)}
      />
      <circle cx={NI_F[0]} cy={NI_F[1]} r={6 + arrive * 16} className="oi__ni-focus" style={{ opacity: fuse }} />
      <circle cx={NI_F[0]} cy={NI_F[1]} r={6} className="oi__ni-core" style={{ opacity: fuse }} />

      <g className="oi__reading" style={{ opacity: seg(t, 0.8, 0.98), transform: `translateY(${(1 - seg(t, 0.8, 0.98)) * 10}px)` }}>
        <text x={NI_F[0] - 20} y={NI_F[1] + 64} className="oi__reading-text">
          <tspan x={NI_F[0] - 20}>A decision is being made tonight</tspan>
          <tspan x={NI_F[0] - 20} dy="1.25em">that will reach everyone by morning.</tspan>
        </text>
      </g>

      <text x={12} y={590} className="oi__count">
        READINGS {Math.round(7 - 4 * drop - 2 * fuse)} {t > 0.74 ? '· ONE MEANING' : ''}
      </text>
    </svg>
  )
}

/* ---------- Ne ---------- */

type NeNode = { text: string; kids: string[] }

const NE_TREE: NeNode[] = [
  { text: 'a lighthouse', kids: ['ships in the dark', 'a keeper’s solitude'] },
  { text: 'a signal', kids: ['Morse code', 'someone below is reading it'] },
  { text: 'a stage set', kids: ['who is the audience?', 'a film still'] },
  { text: 'insomnia', kids: ['3 a.m. thoughts', 'the night economy'] },
  { text: 'a Hopper painting', kids: ['Nighthawks', 'loneliness as architecture'] },
]

const NE_ANCHOR: [number, number] = [0, 300]

function NeStage({ t }: { t: number }) {
  const g1 = seg(t, 0.04, 0.34)
  const g2 = seg(t, 0.3, 0.64)
  const g3 = seg(t, 0.6, 0.9)
  const links = seg(t, 0.82, 1)

  const layout = useMemo(() => {
    const r = rng(17)
    const gen1 = NE_TREE.map((n, i) => ({ ...n, x: 118, y: 62 + i * 119 }))
    const gen2 = gen1.flatMap((p, i) =>
      p.kids.map((k, j) => {
        const slot = i * 2 + j
        return { text: k, px: p.x, py: p.y, x: 262, y: 34 + slot * 59, parent: i }
      })
    )
    const gen3 = gen2.flatMap((p, gi) => {
      const sx = p.x + 14 + p.text.length * 6.5
      const n = 2 + Math.floor(r() * 3)
      return Array.from({ length: n }, (_, k) => ({
        sx,
        sy: p.y,
        x: Math.min(588, sx + 30 + r() * 60),
        y: p.y + (k - (n - 1) / 2) * 13 + (r() - 0.5) * 6,
        g: gi,
      }))
    })
    /* one far tip per second-generation idea: the cross-links join these */
    const tips = gen2.map((_, gi) => {
      const own = gen3.filter((n) => n.g === gi)
      return own.reduce((m, n) => (n.x > m.x ? n : m), own[0])
    })
    const cross: [number, number][] = [
      [1, 9],
      [3, 6],
      [0, 7],
      [4, 8],
      [2, 5],
    ]
    return { gen1, gen2, gen3, tips, cross }
  }, [])

  const count = Math.round(1 + 5 * g1 + 10 * g2 + layout.gen3.length * g3)

  return (
    <svg viewBox="0 0 600 600" className="oi__svg" role="img" aria-labelledby="oi-ne-desc">
      <desc id="oi-ne-desc">
        Ne: the observation branches into a lighthouse, a signal, a stage set, insomnia and a Hopper painting. Each branches again, and again,
        until the branches begin connecting to one another.
      </desc>

      {layout.gen1.map((n, i) => {
        const k = ease(seg(g1, i * 0.1, i * 0.1 + 0.6))
        const x = NE_ANCHOR[0] + (n.x - NE_ANCHOR[0]) * k
        const y = NE_ANCHOR[1] + (n.y - NE_ANCHOR[1]) * k
        return (
          <g key={`a${i}`} style={{ opacity: Math.min(1, k * 2) }}>
            <path d={`M${NE_ANCHOR[0]},${NE_ANCHOR[1]} C${40},${NE_ANCHOR[1]} ${x - 60},${y} ${x},${y}`} className="oi__ne-line oi__ne-line--g1" />
            <circle cx={x} cy={y} r={6} className="oi__ne-dot" />
            <text x={x - 2} y={y - 13} className="oi__lab oi__lab--ne" textAnchor="middle">
              {n.text}
            </text>
          </g>
        )
      })}

      {layout.gen2.map((n, i) => {
        const k = ease(seg(g2, (i % 5) * 0.06 + Math.floor(i / 5) * 0.1, (i % 5) * 0.06 + Math.floor(i / 5) * 0.1 + 0.6))
        const x = n.px + (n.x - n.px) * k
        const y = n.py + (n.y - n.py) * k
        return (
          <g key={`b${i}`} style={{ opacity: Math.min(1, k * 2) }}>
            <path d={`M${n.px},${n.py} C${n.px + 50},${n.py} ${x - 50},${y} ${x},${y}`} className="oi__ne-line" />
            <circle cx={x} cy={y} r={4} className="oi__ne-dot" />
            <text x={x + 10} y={y + 4} className="oi__lab oi__lab--ne2">
              {n.text}
            </text>
          </g>
        )
      })}

      {layout.gen3.map((n, i) => {
        const k = ease(seg(g3, (i % 9) * 0.05, (i % 9) * 0.05 + 0.55))
        return (
          <g key={`c${i}`} style={{ opacity: k }}>
            <line x1={n.sx} y1={n.sy} x2={n.sx + (n.x - n.sx) * k} y2={n.sy + (n.y - n.sy) * k} className="oi__ne-line oi__ne-line--g3" />
            <circle cx={n.sx + (n.x - n.sx) * k} cy={n.sy + (n.y - n.sy) * k} r={2} className="oi__ne-tip" />
          </g>
        )
      })}

      {layout.cross.map(([a, b], i) => {
        const A = layout.tips[a]
        const B = layout.tips[b]
        const mid = 610 + i * 14
        return (
          <path
            key={`x${i}`}
            d={`M${A.x},${A.y} C${mid},${A.y} ${mid},${B.y} ${B.x},${B.y}`}
            className="oi__ne-cross"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - seg(links, i * 0.12, i * 0.12 + 0.5)}
          />
        )
      })}

      <text x={588} y={590} className="oi__count" textAnchor="end">
        {t > 0.86 ? 'AND… ' : ''}CONNECTIONS {count}
      </text>
    </svg>
  )
}

/* ---------- Room ---------- */

export function OneIdea() {
  const wide = useMedia('(min-width: 961px)')
  const trackRef = useRef<HTMLDivElement>(null)
  const niRef = useRef<HTMLDivElement>(null)
  const neRef = useRef<HTMLDivElement>(null)

  const pTrack = useDiagramProgress(trackRef, wide, ['start start', 'end end'])
  const pNi = useDiagramProgress(niRef, false, undefined, 5)
  const pNe = useDiagramProgress(neRef, false, undefined, 5)
  const tTrack = useFrameValue(pTrack)
  const tNi = useFrameValue(pNi)
  const tNe = useFrameValue(pNe)

  const tn = wide ? tTrack : tNi
  const te = wide ? tTrack : tNe

  return (
    <section className="oi" id="one-idea" aria-labelledby="oi-title">
      <div className="wrap section oi__head">
        <SectionHead
          index="02"
          name="One idea, two minds"
          title={
            <span id="oi-title">
              Begin with a single <em>observation.</em>
            </span>
          }
          lede="Watch what each mind does with it. One subtracts until a meaning remains. The other adds until the world is larger than it was."
        />
      </div>

      <div className={wide ? 'oi__track' : 'oi__flow'} ref={trackRef}>
        <div className="oi__sticky">
          <div className="oi__stage wrap">
            <div className="oi__col oi__col--ni" ref={niRef}>
              <div className="oi__col-head">
                <span className="chip label">
                  <span className="chip__mark chip__mark--ni" aria-hidden="true" />
                  Ni collapses
                </span>
                <span className="label label--muted">Discards what doesn’t fit. Fuses what does.</span>
              </div>
              <NiStage t={tn} />
            </div>

            <div className="oi__obs">
              <div className="oi__window" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => (
                  <span key={i} className={i === 6 ? 'is-lit' : undefined} />
                ))}
              </div>
              <p className="label label--muted">Observation</p>
              <p className="oi__obs-text serif">{OBS}</p>
              <div className="oi__meter" aria-hidden="true">
                <span style={{ transform: `scaleX(${wide ? tTrack : 1})` }} />
              </div>
            </div>

            <div className="oi__col oi__col--ne" ref={neRef}>
              <div className="oi__col-head">
                <span className="chip label">
                  <span className="chip__mark chip__mark--ne" aria-hidden="true" />
                  Ne branches
                </span>
                <span className="label label--muted">Keeps every door open. Draws lines between rooms.</span>
              </div>
              <NeStage t={te} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
