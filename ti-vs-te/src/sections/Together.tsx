import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Reveal, SectionHead } from '../components/common'
import './Together.css'

/*
  A feedback loop, drawn as a coil travelling toward a target.
  Every loop passes over the top (Ti: model it, explain the result) and under the bottom
  (Te: act on it, measure it). Each pass carries it forward.
  Only Ti: the loop turns in place, beautifully, and never moves.
  Only Te: no loop at all — a fast line that overshoots further with every correction it skips.
*/

type Mode = 'both' | 'ti' | 'te'
type Pt = [number, number]

const Y = 250
const TARGET: Pt = [1320, Y]

function build(mode: Mode): Pt[] {
  const pts: Pt[] = []
  if (mode === 'both') {
    /* each turn: up over the axis (Ti), back down under it (Te), and forward */
    const loops = 4.5
    for (let i = 0; i <= 600; i++) {
      const th = (i / 600) * loops * Math.PI * 2
      const d = th / (Math.PI * 2)
      const k = 1 - (d / loops) * 0.45 /* the loop tightens as the aim improves */
      pts.push([110 + d * 230 + 80 * (1 - Math.cos(th)) * k, Y - 120 * Math.sin(th) * k])
    }
    pts.push(TARGET)
    return pts
  }
  if (mode === 'ti') {
    for (let i = 0; i <= 600; i++) {
      const th = (i / 600) * 5 * Math.PI * 2
      const r = 1 - i / 1400
      pts.push([300 - 80 * Math.sin(th) * r, Y - 120 * Math.cos(th) * r])
    }
    return pts
  }
  for (let i = 0; i <= 300; i++) {
    const u = i / 300
    const x = 110 + u * 1240
    const amp = 10 + u * u * 190
    pts.push([x, Y + amp * Math.sin(u * 22) + u * 120])
  }
  return pts
}

function along(route: Pt[], t: number): Pt {
  const f = t * (route.length - 1)
  const i = Math.floor(f)
  const u = f - i
  const a = route[i]
  const b = route[Math.min(route.length - 1, i + 1)]
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
}

function Particles({ route, mode, active }: { route: Pt[]; mode: Mode; active: boolean }) {
  const reduce = useReducedMotion()
  const [time, setTime] = useState(0)
  useAnimationFrame((ms) => {
    if (!reduce && active) setTime(ms / 1000)
  })
  const period = mode === 'te' ? 3 : 8
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => {
        const t = ((time + i * (period / 5)) % period) / period
        const [x, y] = along(route, t)
        const above = y < Y - 2
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={7}
            className={mode === 'te' ? 'tog__particle tog__particle--te' : above ? 'tog__particle tog__particle--ti' : 'tog__particle tog__particle--te'}
            style={{ opacity: t > 0.96 ? (1 - t) / 0.04 : Math.min(1, t / 0.03) }}
          />
        )
      })}
    </g>
  )
}

const CAPTIONS: Record<Mode, { title: string; body: string }> = {
  both: { title: 'Model, act, measure, explain. Then again.', body: 'Ti makes the next attempt smarter. Te makes the next model honest. Every turn of the loop moves the work forward and tightens the aim.' },
  ti: { title: 'Understood perfectly. Still at the start.', body: 'Without action, the model is never tested. It turns and refines in place, and nothing reaches the target.' },
  te: { title: 'Moving fast. Drifting off target.', body: 'Without a model, each correction is a guess. The line keeps moving, overshoots, and swings wider with every pass.' },
}

export function Together() {
  const [mode, setMode] = useState<Mode>('both')
  const figRef = useRef<HTMLDivElement>(null)
  const inView = useInView(figRef)
  const { scrollYProgress } = useScroll({ target: figRef, offset: ['start 90%', 'center 55%'] })
  const clipW = useTransform(scrollYProgress, [0, 1], [0, 1400])
  const route = useMemo(() => build(mode), [mode])

  /* split the coil into Ti (above the axis) and Te (below) runs */
  const runs = useMemo(() => {
    const out: { d: string; ti: boolean }[] = []
    let cur: Pt[] = []
    let curTi = route[0][1] < Y
    route.forEach((p) => {
      const ti = mode === 'te' ? false : p[1] < Y
      if (ti !== curTi && cur.length) {
        cur.push(p)
        out.push({ d: cur.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' '), ti: curTi })
        cur = []
        curTi = ti
      }
      cur.push(p)
    })
    out.push({ d: cur.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' '), ti: curTi })
    return out
  }, [route, mode])

  const stages = [
    { n: 'i', t: 'Model it', s: 'Ti', who: 'ti' },
    { n: 'ii', t: 'Act on it', s: 'Te', who: 'te' },
    { n: 'iii', t: 'Measure', s: 'Te', who: 'te' },
    { n: 'iv', t: 'Explain', s: 'Ti', who: 'ti' },
  ] as const

  return (
    <section className="section tog" id="together" aria-labelledby="tog-title">
      <div className="wrap">
        <SectionHead
          index="07"
          name="Not opposites"
          title={
            <span id="tog-title">
              Not opposites. <em>A feedback loop.</em>
            </span>
          }
          lede="Understanding without testing never leaves the room. Testing without understanding never learns from what it sees. Science, engineering and most good work alternate between the two."
        />

        <div className="tog__controls" role="radiogroup" aria-label="Show">
          {(
            [
              ['both', 'Both, in turn'],
              ['ti', 'Only Ti'],
              ['te', 'Only Te'],
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
              A coil travels from a start point toward a target. Each loop passes above the axis in teal, for modelling and explaining, and below in
              amber, for acting and measuring. Each turn moves the coil forward until it reaches the target.
            </desc>
            <defs>
              <clipPath id="tog-clip">
                <motion.rect x={0} y={-200} height={920} style={{ width: clipW }} />
              </clipPath>
            </defs>
            <g clipPath="url(#tog-clip)">
              <line x1={40} x2={1360} y1={Y} y2={Y} className="tog__axis" />
              <text x={40} y={Y - 140} className="tog__half tog__half--ti">
                ABOVE · TI · MODEL &amp; EXPLAIN
              </text>
              <text x={40} y={Y + 150} className="tog__half tog__half--te">
                BELOW · TE · ACT &amp; MEASURE
              </text>
              <AnimatePresence mode="wait">
                <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  {runs.map((r, i) => (
                    <path key={i} d={r.d} className={r.ti ? 'tog__run tog__run--ti' : 'tog__run tog__run--te'} />
                  ))}
                  <Particles route={route} mode={mode} active={inView} />
                </motion.g>
              </AnimatePresence>
              <circle cx={110} cy={Y} r={8} className="tog__start" />
              <g className={mode === 'both' ? 'tog__target tog__target--hit' : 'tog__target'}>
                <circle cx={TARGET[0]} cy={TARGET[1]} r={30} />
                <circle cx={TARGET[0]} cy={TARGET[1]} r={18} />
                <circle cx={TARGET[0]} cy={TARGET[1]} r={6} className="tog__bull" />
              </g>
            </g>
          </svg>

          <ol className="tog__stages" aria-label="One turn of the loop">
            {stages.map((s, i) => (
              <li
                key={s.n}
                className={`tog__stage tog__stage--${s.who}`}
                style={{ left: `${18 + i * 20}%` }}
                data-dim={mode === 'both' || mode === s.who ? undefined : 'true'}
              >
                <span className="label">
                  {s.n} · {s.s}
                </span>
                <span className="tog__stage-t">{s.t}</span>
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
              Ti and Te describe which kind of logic someone trusts first, not which kind they are capable of. The same loop shows up as the
              scientific method, as build–measure–learn, and as any good post-mortem: explain what happened, change what you do, check the
              result.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
