import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationFrame, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Reveal, SectionHead, rng } from '../components/common'
import './Together.css'

/*
  Diverge → converge → diverge → converge. Particles leave one point by different routes,
  meet again, split again, meet again. Removing either half breaks the rhythm:
  only Ne never arrives anywhere; only Ni arrives with nothing in hand.
*/

type Mode = 'both' | 'ne' | 'ni'
type Pt = [number, number]

const Y = 250
const XS = [80, 350, 620, 890, 1160, 1330] as const
const K = 9

function buildRoutes(mode: Mode): { routes: Pt[][]; lines: { a: Pt; b: Pt; kind: 'ne' | 'ni' }[]; nodes: Pt[] } {
  const r = rng(mode === 'both' ? 2 : mode === 'ne' ? 3 : 4)
  const s1 = Array.from({ length: K }, (_, i) => Y + (i / (K - 1) - 0.5) * 320 + (r() - 0.5) * 16)
  const s2 = Array.from({ length: K }, (_, i) => Y + (i / (K - 1) - 0.5) * 290 + (r() - 0.5) * 16)
  const perm = Array.from({ length: K }, (_, i) => (i * 4 + 3) % K)

  if (mode === 'ni') {
    const a: Pt = [XS[0], Y]
    const b: Pt = [XS[5], Y]
    return {
      routes: Array.from({ length: 3 }, () => [a, b]),
      lines: [{ a, b, kind: 'ni' }],
      nodes: [a, b],
    }
  }

  if (mode === 'ne') {
    const routes: Pt[][] = []
    const lines: { a: Pt; b: Pt; kind: 'ne' | 'ni' }[] = []
    const nodes: Pt[] = [[XS[0], Y]]
    for (let i = 0; i < K; i++) {
      const p1: Pt = [XS[1], s1[i]]
      const t = i / (K - 1) - 0.5
      const p2: Pt = [XS[2] + 10, Y + t * 440 + (r() - 0.5) * 40]
      const p3: Pt = [XS[3] + 40, Y + t * 640 + (r() - 0.5) * 80]
      const p4: Pt = [XS[4] + 80, Y + t * 900 + (r() - 0.5) * 120]
      routes.push([[XS[0], Y], p1, p2, p3, p4])
      lines.push({ a: [XS[0], Y], b: p1, kind: 'ne' }, { a: p1, b: p2, kind: 'ne' }, { a: p2, b: p3, kind: 'ne' }, { a: p3, b: p4, kind: 'ne' })
      nodes.push(p1, p2)
      /* side shoots: more options, still no meeting point */
      lines.push({ a: p2, b: [p2[0] + 120, p2[1] + (r() - 0.5) * 120], kind: 'ne' })
    }
    return { routes, lines, nodes }
  }

  const A: Pt = [XS[0], Y]
  const B: Pt = [XS[2], Y]
  const C: Pt = [XS[4], Y]
  const E: Pt = [XS[5], Y]
  const routes: Pt[][] = []
  const lines: { a: Pt; b: Pt; kind: 'ne' | 'ni' }[] = []
  for (let i = 0; i < K; i++) {
    const p1: Pt = [XS[1], s1[i]]
    const p2: Pt = [XS[3], s2[perm[i]]]
    routes.push([A, p1, B, p2, C, E])
    lines.push({ a: A, b: p1, kind: 'ne' }, { a: p1, b: B, kind: 'ni' }, { a: B, b: [XS[3], s2[i]], kind: 'ne' }, { a: [XS[3], s2[i]], b: C, kind: 'ni' })
  }
  lines.push({ a: C, b: E, kind: 'ni' })
  return { routes, lines, nodes: [A, B, C, E, ...s1.map((y) => [XS[1], y] as Pt), ...s2.map((y) => [XS[3], y] as Pt)] }
}

function along(route: Pt[], t: number): Pt {
  const segs = route.length - 1
  const f = Math.min(segs - 1e-6, Math.max(0, t * segs))
  const i = Math.floor(f)
  const u = f - i
  const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
  const a = route[i]
  const b = route[i + 1]
  return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]
}

function Particles({ routes, mode, active }: { routes: Pt[][]; mode: Mode; active: boolean }) {
  const reduce = useReducedMotion()
  const [time, setTime] = useState(0)
  useAnimationFrame((ms) => {
    if (!reduce && active) setTime(ms / 1000)
  })
  const period = mode === 'ni' ? 3 : 7
  return (
    <g>
      {routes.map((r, i) => {
        const t = ((time + i * (mode === 'ni' ? 1 : 0.07)) % period) / period
        const [x, y] = along(r, t)
        const fade = mode === 'ne' ? 1 - Math.max(0, (t - 0.55) / 0.45) : t > 0.96 ? (1 - t) / 0.04 : Math.min(1, t / 0.03)
        return <circle key={i} cx={x} cy={y} r={mode === 'ni' ? 6 : 4.5} className={`tog__particle tog__particle--${mode}`} style={{ opacity: fade }} />
      })}
    </g>
  )
}

const CAPTIONS: Record<Mode, { title: string; body: string }> = {
  both: { title: 'Material, then direction, then more material.', body: 'Each convergence becomes the seed of the next divergence. The process breathes.' },
  ne: { title: 'Material, never direction.', body: 'Without convergence, the branches never meet again. Nothing is wrong; nothing lands.' },
  ni: { title: 'Direction, without material.', body: 'Without divergence, convergence has nothing to synthesise. It arrives quickly, carrying very little.' },
}

export function Together() {
  const [mode, setMode] = useState<Mode>('both')
  const figRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: figRef, offset: ['start 90%', 'center 55%'] })
  const clipW = useTransform(scrollYProgress, [0, 1], [0, 1400])
  const data = useMemo(() => buildRoutes(mode), [mode])
  const inView = useInView(figRef)

  const stages = [
    { x: XS[1], n: 'i', t: 'Open', s: 'Ne generates' },
    { x: XS[2], n: 'ii', t: 'Choose', s: 'Ni synthesises' },
    { x: XS[3], n: 'iii', t: 'Open again', s: 'Ne tests the direction' },
    { x: XS[4], n: 'iv', t: 'Commit', s: 'Ni sets the course' },
  ]

  return (
    <section className="section tog" id="together" aria-labelledby="tog-title">
      <div className="wrap">
        <SectionHead
          index="07"
          name="Not opposites"
          title={
            <span id="tog-title">
              Not opposites. <em>A rhythm.</em>
            </span>
          }
          lede="Divergence generates possibilities. Convergence synthesises them into a direction. Then the direction becomes the next thing to diverge from."
        />

        <div className="tog__controls" role="radiogroup" aria-label="Show">
          {(
            [
              ['both', 'Both, in turn'],
              ['ne', 'Only Ne'],
              ['ni', 'Only Ni'],
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
              A sequence of two diamonds. From one point, lines fan out (divergence), then fan back into a single point (convergence), then fan out
              and back in again, ending in an arrow. Particles travel along the lines.
            </desc>
            <defs>
              <clipPath id="tog-clip">
                <motion.rect x={0} y={-200} height={920} style={{ width: clipW }} />
              </clipPath>
            </defs>
            <g clipPath="url(#tog-clip)">
              {mode === 'both' && (
                <g className="tog__fills">
                  <path d={`M${XS[0]},${Y} L${XS[1]},${Y - 170} L${XS[1]},${Y + 170} Z`} className="tog__fill tog__fill--ne" />
                  <path d={`M${XS[1]},${Y - 170} L${XS[2]},${Y} L${XS[1]},${Y + 170} Z`} className="tog__fill tog__fill--ni" />
                  <path d={`M${XS[2]},${Y} L${XS[3]},${Y - 155} L${XS[3]},${Y + 155} Z`} className="tog__fill tog__fill--ne" />
                  <path d={`M${XS[3]},${Y - 155} L${XS[4]},${Y} L${XS[3]},${Y + 155} Z`} className="tog__fill tog__fill--ni" />
                </g>
              )}
              <AnimatePresence mode="wait">
                <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  {data.lines.map((l, i) => (
                    <line key={i} x1={l.a[0]} y1={l.a[1]} x2={l.b[0]} y2={l.b[1]} className={`tog__line tog__line--${l.kind}`} />
                  ))}
                  {data.nodes.map((n, i) => (
                    <circle key={i} cx={n[0]} cy={n[1]} r={n[1] === Y && (n[0] === XS[0] || n[0] === XS[2] || n[0] === XS[4]) ? 8 : 3.5} className="tog__node" />
                  ))}
                  {mode !== 'ne' && <path d={`M${XS[5] - 16},${Y - 10} L${XS[5]},${Y} L${XS[5] - 16},${Y + 10}`} className="tog__arrow" />}
                  <Particles routes={data.routes} mode={mode} active={inView} />
                </motion.g>
              </AnimatePresence>
            </g>
          </svg>

          <ol className="tog__stages" aria-label="Phases">
            {stages.map((s, i) => (
              <li
                key={s.n}
                className={`tog__stage tog__stage--${i % 2 ? 'ni' : 'ne'}`}
                style={{ left: `${((XS[i] + (s.x - XS[i]) / 2) / 1400) * 100}%`, width: `${((s.x - XS[i]) / 1400) * 100}%` }}
                data-dim={mode === 'both' ? undefined : (mode === 'ne') === (i % 2 === 1) ? 'true' : undefined}
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
              Creativity research has long treated divergent and convergent thinking as partners rather than rivals, going back to J.&nbsp;P.
              Guilford’s work in the 1950s. Design practice draws the same rhythm as a pair of diamonds. A person may lead with one, but any
              finished idea has passed through both.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
