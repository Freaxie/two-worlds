import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Reveal, SectionHead } from '../components/common'
import './Together.css'

/*
  A route to a goal, with walls nobody planned for.
  Both: J commits to straight legs; at each wall P feels around, finds the gap, and J commits again.
  Only J: the plan runs straight into the first wall and stops.
  Only P: the route explores beautifully and never arrives.
*/

type Mode = 'both' | 'p' | 'j'
type Pt = [number, number]

const Y = 260
const A: Pt = [80, Y]
const G: Pt = [1320, Y]
const WALLS = [
  { x: 440, y1: 150, y2: 470 },
  { x: 900, y1: 40, y2: 350 },
]

type Seg = { a: Pt; b: Pt; kind: 'j' | 'p' | 'feeler' | 'ghost' }

function build(mode: Mode): { route: Pt[]; segs: Seg[]; blocked: Pt[]; arrives: boolean } {
  if (mode === 'j') {
    const stop: Pt = [428, Y]
    return {
      route: [A, stop],
      segs: [
        { a: A, b: stop, kind: 'j' },
        { a: stop, b: G, kind: 'ghost' },
      ],
      blocked: [stop],
      arrives: false,
    }
  }
  if (mode === 'p') {
    const route: Pt[] = [A, [190, 150], [300, 330], [410, 105], [520, 90], [610, 300], [700, 150], [770, 390], [830, 220], [860, 110], [800, 60], [720, 110]]
    const feelers: Seg[] = [
      [[190, 150], [240, 70]],
      [[300, 330], [360, 430]],
      [[610, 300], [660, 440]],
      [[700, 150], [760, 60]],
      [[770, 390], [700, 470]],
      [[830, 220], [890, 250]],
    ].map(([a, b]) => ({ a: a as Pt, b: b as Pt, kind: 'feeler' as const }))
    const segs: Seg[] = route.slice(1).map((b, i) => ({ a: route[i], b, kind: 'p' as const }))
    return { route, segs: [...feelers, ...segs], blocked: [], arrives: false }
  }
  const route: Pt[] = [A, [360, Y], [410, 110], [520, 110], [600, Y], [820, Y], [870, 410], [980, 410], [1060, Y], G]
  const kinds: Seg['kind'][] = ['j', 'p', 'p', 'p', 'j', 'p', 'p', 'p', 'j']
  const segs: Seg[] = route.slice(1).map((b, i) => ({ a: route[i], b, kind: kinds[i] }))
  const feelers: Seg[] = [
    [[360, Y], [428, 300]],
    [[360, Y], [428, 200]],
    [[820, Y], [888, 210]],
    [[820, Y], [888, 320]],
  ].map(([a, b]) => ({ a: a as Pt, b: b as Pt, kind: 'feeler' as const }))
  return { route, segs: [...feelers, ...segs], blocked: [], arrives: true }
}

function along(route: Pt[], t: number): Pt {
  const lens = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]))
  const total = lens.reduce((a, b) => a + b, 0)
  let d = t * total
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const u = d / lens[i]
      return [route[i][0] + (route[i + 1][0] - route[i][0]) * u, route[i][1] + (route[i + 1][1] - route[i][1]) * u]
    }
    d -= lens[i]
  }
  return route[route.length - 1]
}

function Particles({ route, mode, active }: { route: Pt[]; mode: Mode; active: boolean }) {
  const reduce = useReducedMotion()
  const [time, setTime] = useState(0)
  useAnimationFrame((ms) => {
    if (!reduce && active) setTime(ms / 1000)
  })
  const period = mode === 'j' ? 2.6 : 7
  return (
    <g>
      {Array.from({ length: 6 }, (_, i) => {
        const t = ((time + i * (period / 6)) % period) / period
        const [x, y] = along(route, t)
        const fade = mode === 'p' ? 1 - Math.max(0, (t - 0.7) / 0.3) : t > 0.95 ? (1 - t) / 0.05 : Math.min(1, t / 0.04)
        return <circle key={i} cx={x} cy={y} r={6} className={`tog__particle tog__particle--${mode}`} style={{ opacity: fade }} />
      })}
    </g>
  )
}

const CAPTIONS: Record<Mode, { title: string; body: string }> = {
  both: { title: 'Commit, adapt, commit again.', body: 'The plan carries you between walls. Openness finds the way around them. Then the plan resumes, on a better line.' },
  p: { title: 'Every way explored. No arrival.', body: 'Without closure, each wall becomes an invitation to look somewhere else. The route is rich and it never reaches the flag.' },
  j: { title: 'On plan, into the wall.', body: 'Without openness, the plan cannot see the wall until it hits it. The route on paper still goes all the way to the flag.' },
}

export function Together() {
  const [mode, setMode] = useState<Mode>('both')
  const figRef = useRef<HTMLDivElement>(null)
  const inView = useInView(figRef)
  const { scrollYProgress } = useScroll({ target: figRef, offset: ['start 90%', 'center 55%'] })
  const clipW = useTransform(scrollYProgress, [0, 1], [0, 1400])
  const data = useMemo(() => build(mode), [mode])

  const stages = [
    { from: 80, to: 360, n: 'i', t: 'Plan', s: 'J commits', who: 'j' },
    { from: 360, to: 600, n: 'ii', t: 'Adapt', s: 'P finds the gap', who: 'p' },
    { from: 600, to: 820, n: 'iii', t: 'Re-plan', s: 'J commits again', who: 'j' },
    { from: 820, to: 1060, n: 'iv', t: 'Adapt', s: 'P reroutes', who: 'p' },
    { from: 1060, to: 1320, n: 'v', t: 'Arrive', s: 'J closes it', who: 'j' },
  ] as const

  return (
    <section className="section tog" id="together" aria-labelledby="tog-title">
      <div className="wrap">
        <SectionHead
          index="07"
          name="Not opposites"
          title={
            <span id="tog-title">
              Not opposites. <em>A relay.</em>
            </span>
          }
          lede="Closure gets you moving. Openness gets you around what you did not foresee. Any journey that arrives has used both, whoever was holding the map."
        />

        <div className="tog__controls" role="radiogroup" aria-label="Show">
          {(
            [
              ['both', 'Both, in turn'],
              ['p', 'Only P'],
              ['j', 'Only J'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="radio" aria-checked={mode === id} className={`tog__btn tog__btn--${id}`} onClick={() => setMode(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="tog__fig" ref={figRef}>
          <svg viewBox="0 0 1400 520" className="tog__svg" role="img" aria-labelledby="tog-desc">
            <desc id="tog-desc">
              A route from a start point to a flag with two walls in the way. Red straight legs are committed plan; black detours are adaptations that
              find the gap around each wall. Dashed short lines are feelers that hit the wall.
            </desc>
            <defs>
              <clipPath id="tog-clip">
                <motion.rect x={0} y={-200} height={920} style={{ width: clipW }} />
              </clipPath>
            </defs>
            <g clipPath="url(#tog-clip)">
              {WALLS.map((w) => (
                <rect key={w.x} x={w.x - 10} y={w.y1} width={20} height={w.y2 - w.y1} className="tog__wall" />
              ))}
              <AnimatePresence mode="wait">
                <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  {data.segs.map((s, i) => (
                    <line key={i} x1={s.a[0]} y1={s.a[1]} x2={s.b[0]} y2={s.b[1]} className={`tog__line tog__line--${s.kind}`} />
                  ))}
                  {data.segs
                    .filter((s) => s.kind === 'feeler')
                    .map((s, i) => (
                      <circle key={`f${i}`} cx={s.b[0]} cy={s.b[1]} r={4} className="tog__feeler-end" />
                    ))}
                  {data.blocked.map((b, i) => (
                    <path key={i} d={`M${b[0] - 12},${b[1] - 12} l24,24 M${b[0] + 12},${b[1] - 12} l-24,24`} className="tog__blocked" />
                  ))}
                  <Particles route={data.route} mode={mode} active={inView} />
                </motion.g>
              </AnimatePresence>
              <circle cx={A[0]} cy={A[1]} r={9} className="tog__start" />
              <g className={data.arrives ? 'tog__flag tog__flag--reached' : 'tog__flag'}>
                <line x1={G[0]} x2={G[0]} y1={G[1] - 44} y2={G[1] + 10} />
                <path d={`M${G[0]},${G[1] - 44} l34,12 l-34,12 Z`} />
              </g>
            </g>
          </svg>

          <ol className="tog__stages" aria-label="Phases">
            {stages.map((s) => (
              <li
                key={s.n}
                className={`tog__stage tog__stage--${s.who}`}
                style={{ left: `${(((s.from + s.to) / 2) / 1400) * 100}%` }}
                data-dim={mode === 'both' || mode === s.who ? undefined : 'true'}
              >
                <span className="label">{s.n}</span>
                <span className="tog__stage-t">{s.t}</span>
                <span className="label label--muted">{s.s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="tog__caption grid">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className="tog__cap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              aria-live="polite"
            >
              <p className="tog__cap-title serif">{CAPTIONS[mode].title}</p>
              <p className="body">{CAPTIONS[mode].body}</p>
            </motion.div>
          </AnimatePresence>
          <Reveal className="tog__note">
            <p className="label label--muted">Note</p>
            <p className="body">
              P and J describe a preference in how someone meets the outer world, not a limit on what they can do. Most people plan some things and
              improvise others, and the best teams often pair the two on purpose: one to set the line, one to watch for walls.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
