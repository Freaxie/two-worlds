import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE, SectionHead, rng } from '../components/common'
import './Experiment.css'

/*
  The same fourteen things to do, re-arranged on demand.
  Observe: a loose pile.
  J: every item snaps into a slot on a seven-day grid and is ticked — the week decided in advance.
  P: items orbit "now" in three rings — today, probably this week, if it comes up.
*/

type Mode = 'observe' | 'p' | 'j'

type Specimen = {
  id: string
  numeral: string
  title: string
  prompt: string
  seed: number
  items: string[]
  j: string
  p: string
}

const SPECIMENS: Specimen[] = [
  {
    id: 'week',
    numeral: 'I',
    title: 'A free week',
    prompt: 'Seven days, nothing scheduled, fourteen things you could do.',
    seed: 5,
    items: ['groceries', 'gym', 'call mum', 'laundry', 'friend’s gig', 'fix the bike', 'museum', 'reply to emails', 'long walk', 'read', 'dinner out', 'tidy desk', 'nap', 'new café'],
    j: 'Every item has a slot. The week was decided on Sunday night, and now it can simply be lived.',
    p: 'Three things today. The rest stays in orbit until the moment feels right for it.',
  },
  {
    id: 'move',
    numeral: 'II',
    title: 'Moving cities',
    prompt: 'A new job starts in five weeks, in a city you barely know.',
    seed: 23,
    items: ['sign lease', 'pack books', 'goodbye dinner', 'utilities', 'change address', 'sell sofa', 'book van', 'new doctor', 'explore area', 'find a gym', 'bank', 'visit twice', 'keys', 'clean flat'],
    j: 'A checklist with dates. Each box closed now is one less thing waiting in the new city.',
    p: 'Get the lease and the van. Everything else gets easier once you are standing there.',
  },
  {
    id: 'project',
    numeral: 'III',
    title: 'A creative project',
    prompt: 'An open brief, a presentation in three weeks.',
    seed: 41,
    items: ['research', 'moodboard', 'sketches', 'interviews', 'first draft', 'feedback', 'second draft', 'visuals', 'rehearse', 'slides', 'print', 'test run', 'references', 'wild idea'],
    j: 'Milestones on the calendar, working backward from the day. The wild idea gets a slot too, on Tuesday.',
    p: 'Chase the research and the wild idea first. The shape of the project will show itself.',
  },
]

const W = 1000
const H = 640
const CX = 500
const CY = 330
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const COL = 128
const GX = (W - COL * 7) / 2

type Pos = { x: number; y: number; r: number }

function layout(spec: Specimen) {
  const r = rng(spec.seed)
  const raw: Pos[] = spec.items.map(() => ({ x: 110 + r() * (W - 220), y: 80 + r() * (H - 180), r: (r() - 0.5) * 22 }))
  const j: Pos[] = spec.items.map((_, i) => ({ x: GX + (i % 7) * COL + COL / 2, y: 190 + Math.floor(i / 7) * 74, r: 0 }))
  const rings = [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]
  const order = spec.items.map((_, i) => i).sort(() => r() - 0.5)
  const p: Pos[] = new Array(spec.items.length)
  const perRing = [3, 5, 6]
  const seen = [0, 0, 0]
  order.forEach((idx, k) => {
    const ring = rings[k]
    const n = seen[ring]++
    const ang = -Math.PI / 2 + (n / perRing[ring]) * Math.PI * 2 + ring * 0.5 + (r() - 0.5) * 0.3
    const rad = [115, 215, 305][ring]
    p[idx] = { x: CX + Math.cos(ang) * rad * 1.45, y: CY + Math.sin(ang) * rad * 0.82, r: (r() - 0.5) * 10 }
  })
  const today = order.slice(0, 3)
  return { raw, j, p, today }
}

const BG = { observe: '#e7e4db', p: '#7cc9f2', j: '#c8321f' }

function Stage({ spec, mode }: { spec: Specimen; mode: Mode }) {
  const reduce = useReducedMotion()
  const L = useMemo(() => layout(spec), [spec])

  return (
    <motion.div className={`exp__stage exp__stage--${mode}`} animate={{ backgroundColor: BG[mode] }} transition={{ duration: reduce ? 0 : 0.8, ease: EASE }}>
      <div className="exp__canvas">
        <svg viewBox={`0 0 ${W} ${H}`} className="exp__svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {/* J: the week grid */}
          <AnimatePresence>
            {mode === 'j' && (
              <motion.g key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.5, delay: reduce ? 0 : 0.2 }}>
                {DAYS.map((d, i) => (
                  <g key={d}>
                    <text x={GX + i * COL + 10} y={130} className="exp__day">
                      {d}
                    </text>
                    <line x1={GX + i * COL} x2={GX + i * COL} y1={112} y2={340} className="exp__gridline" />
                  </g>
                ))}
                <line x1={GX + 7 * COL} x2={GX + 7 * COL} y1={112} y2={340} className="exp__gridline" />
                <line x1={GX} x2={GX + 7 * COL} y1={142} y2={142} className="exp__gridline exp__gridline--strong" />
                <line x1={GX} x2={GX + 7 * COL} y1={340} y2={340} className="exp__gridline" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* P: orbits around now */}
          <AnimatePresence>
            {mode === 'p' && (
              <motion.g key="rings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 }}>
                {[115, 215, 305].map((rad, k) => (
                  <ellipse key={rad} cx={CX} cy={CY} rx={rad * 1.45} ry={rad * 0.82} className={`exp__ring exp__ring--${k}`} />
                ))}
                {['TODAY', 'THIS WEEK, PROBABLY', 'IF IT COMES UP'].map((t, k) => (
                  <text key={t} x={CX} y={CY - [115, 215, 305][k] * 0.82 + 16} textAnchor="middle" className="exp__ring-label">
                    {t}
                  </text>
                ))}
                {L.today.map((idx) => (
                  <motion.line
                    key={idx}
                    x1={CX}
                    y1={CY}
                    x2={L.p[idx].x}
                    y2={L.p[idx].y}
                    className="exp__today"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: reduce ? 0 : 1 }}
                  />
                ))}
                <circle cx={CX} cy={CY} r={9} className="exp__now" />
                <text x={CX} y={CY + 26} textAnchor="middle" className="exp__ring-label">
                  NOW
                </text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* the items: same fourteen, three arrangements */}
          {spec.items.map((text, i) => {
            const pos = mode === 'observe' ? L.raw[i] : mode === 'j' ? L.j[i] : L.p[i]
            const w = mode === 'j' ? COL - 12 : text.length * 8.6 + 26
            const isToday = mode === 'p' && L.today.includes(i)
            const delay = reduce ? 0 : mode === 'j' ? (i % 7) * 0.05 + Math.floor(i / 7) * 0.12 : (i % 5) * 0.04
            return (
              <motion.g
                key={`${spec.id}-${i}`}
                initial={false}
                animate={{ x: pos.x, y: pos.y, rotate: pos.r }}
                transition={
                  mode === 'j'
                    ? { type: 'spring', stiffness: 320, damping: 22, delay }
                    : { type: 'spring', stiffness: 45, damping: 12, delay }
                }
              >
                <rect
                  x={-w / 2}
                  y={-17}
                  width={w}
                  height={34}
                  rx={mode === 'p' ? 17 : 0}
                  className={`exp__chip exp__chip--${mode} ${isToday ? 'exp__chip--today' : ''}`}
                />
                <text x={mode === 'j' ? -w / 2 + 10 : 0} y={5} textAnchor={mode === 'j' ? 'start' : 'middle'} className={`exp__chip-text exp__chip-text--${mode}`}>
                  {text}
                </text>
                {mode === 'j' && (
                  <motion.path
                    d={`M${w / 2 - 20},-2 l4,4 l8,-9`}
                    className="exp__tick"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.25, delay: reduce ? 0 : 0.8 + i * 0.06 }}
                  />
                )}
              </motion.g>
            )
          })}
        </svg>
      </div>

      <div className="exp__overlay" aria-live="polite">
        <AnimatePresence mode="wait">
          {mode === 'observe' && (
            <motion.div key="o" className="exp__read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <p className="label">Specimen {spec.numeral} — unsorted</p>
              <p className="exp__read-text serif">{spec.prompt}</p>
              <p className="label label--muted">Choose a lens.</p>
            </motion.div>
          )}
          {mode === 'j' && (
            <motion.div key={`j-${spec.id}`} className="exp__read exp__read--j" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: reduce ? 0 : 1.1, ease: EASE }}>
              <p className="label">J · 14 items → 14 slots, all ticked</p>
              <p className="exp__read-text serif">{spec.j}</p>
            </motion.div>
          )}
          {mode === 'p' && (
            <motion.div key={`p-${spec.id}`} className="exp__read exp__read--p" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: reduce ? 0 : 1.1, ease: EASE }}>
              <p className="label">P · 3 today, 11 still open</p>
              <p className="exp__read-text serif">{spec.p}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function Experiment() {
  const [specId, setSpecId] = useState(SPECIMENS[0].id)
  const [mode, setMode] = useState<Mode>('observe')
  const spec = SPECIMENS.find((s) => s.id === specId)!

  const modes: { id: Mode; label: string; sub: string }[] = [
    { id: 'observe', label: 'Observe', sub: 'unsorted' },
    { id: 'p', label: 'P', sub: 'keep open' },
    { id: 'j', label: 'J', sub: 'settle it' },
  ]

  return (
    <section className="section exp" id="experiment" aria-labelledby="exp-title">
      <div className="wrap">
        <SectionHead
          index="05"
          name="Experiment"
          title={
            <span id="exp-title">
              Same list. <em>Change the mind</em> holding it.
            </span>
          }
          lede="Pick a situation, then switch lenses. Nothing is added or dropped. Only the relationship to time changes."
        />

        <div className="exp__controls">
          <div className="exp__specs" role="radiogroup" aria-label="Situation">
            {SPECIMENS.map((s) => (
              <button
                key={s.id}
                role="radio"
                aria-checked={s.id === specId}
                className="exp__spec"
                onClick={() => {
                  setSpecId(s.id)
                  setMode('observe')
                }}
              >
                <span className="exp__spec-num display">{s.numeral}</span>
                <span className="label">{s.title}</span>
              </button>
            ))}
          </div>

          <div className="exp__modes" role="radiogroup" aria-label="Lens">
            {modes.map((m) => (
              <button key={m.id} role="radio" aria-checked={mode === m.id} className={`exp__mode exp__mode--${m.id}`} onClick={() => setMode(m.id)}>
                {mode === m.id && <motion.span layoutId="exp-mode-bg" className="exp__mode-bg" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                <span className="exp__mode-label">{m.label}</span>
                <span className="exp__mode-sub label">{m.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <Stage spec={spec} mode={mode} />

        <div className="exp__legend">
          <p className="label label--muted">Fig. 5 — {spec.prompt} Each chip is one thing to do. The lens decides when it gets decided.</p>
        </div>
      </div>
    </section>
  )
}
