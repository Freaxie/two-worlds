import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE, SectionHead, rng } from '../components/common'
import './Experiment.css'

/*
  The same forty-two marks, re-read on demand.
  Observe: raw, unassigned.
  Ni: every mark is pulled into one spiral closing on its centre — one form, one reading.
  Ne: the marks split into six constellations, each a different world, bridged to one another.
*/

type Mode = 'observe' | 'ni' | 'ne'

type Specimen = {
  id: string
  numeral: string
  title: string
  prompt: string
  seed: number
  ni: string
  niWhy: string
  ne: string[]
}

const SPECIMENS: Specimen[] = [
  {
    id: 'marks',
    numeral: 'I',
    title: 'Forty-two marks',
    prompt: 'Forty-two marks on a page. No legend, no title.',
    seed: 4,
    ni: 'One form, caught before it finishes: a spiral closing on its centre.',
    niWhy: 'The scatter is read as a stage of something. The question is what it is becoming.',
    ne: ['a flock turning', 'a city from the air', 'a musical score', 'spilled seeds', 'a star chart', 'a crowd leaving'],
  },
  {
    id: 'door',
    numeral: 'II',
    title: 'An open door',
    prompt: 'You come home at night. The door is already open.',
    seed: 19,
    ni: 'Someone expected you. The open door is the message.',
    niWhy: 'Details are weighed for intent. Everything points to a single “why”.',
    ne: ['a burglary', 'a draught', 'a surprise party', 'a ghost story', 'an image of grief', 'the cat, again'],
  },
  {
    id: 'thread',
    numeral: 'III',
    title: 'A thread on a lamp post',
    prompt: 'A red thread tied around a lamp post. Nothing else.',
    seed: 33,
    ni: 'Someone is marking the way back.',
    niWhy: 'A thread implies a path; a path implies a return. The reading follows the line.',
    ne: ['a lost kite', 'an art project', 'a quiet protest', 'a wish ritual', 'a trail for a game', 'evidence'],
  },
]

const W = 1000
const H = 640
const CX = W / 2
const CY = H / 2
const N = 42

type Mark = {
  raw: [number, number]
  rawR: number
  ring: boolean
  ni: [number, number]
  niOrder: number
  ne: [number, number]
  cluster: number
}

type Layout = {
  marks: Mark[]
  hubs: [number, number][]
  bridges: [number, number][]
  spiral: string
}

function buildLayout(seed: number): Layout {
  const r = rng(seed)
  /* raw: clumpy scatter (sum of two uniforms), a few rings among the dots */
  const raw = Array.from({ length: N }, () => {
    const x = 90 + ((r() + r() + r()) / 3) * (W - 180)
    const y = 60 + ((r() + r()) / 2) * (H - 120)
    return { x, y, rr: 2.5 + r() * 5, ring: r() < 0.28 }
  })

  /* Ni: order marks by distance from centre (far → near) and lay them on one spiral */
  const byDist = raw
    .map((p, i) => ({ i, d: Math.hypot(p.x - CX, p.y - CY), a: Math.atan2(p.y - CY, p.x - CX) }))
    .sort((a, b) => b.d - a.d)
  const niPos: [number, number][] = new Array(N)
  const niOrder: number[] = new Array(N)
  const turns = 3.2
  const a0 = byDist[0].a
  byDist.forEach((o, k) => {
    const u = k / (N - 1)
    const rad = 285 * Math.pow(1 - u, 1.25) + 4
    const ang = a0 + u * turns * Math.PI * 2
    niPos[o.i] = [CX + Math.cos(ang) * rad * 1.15, CY + Math.sin(ang) * rad * 0.92]
    niOrder[o.i] = k
  })
  const spiralPts = byDist.map((o) => niPos[o.i])
  const spiral = spiralPts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

  /* Ne: six hubs on a loose ring; marks join the hub nearest their raw angle */
  const hubs: [number, number][] = Array.from({ length: 6 }, (_, k) => {
    const ang = -Math.PI / 2 + (k / 6) * Math.PI * 2 + (r() - 0.5) * 0.35
    return [CX + Math.cos(ang) * (330 + r() * 50), CY + Math.sin(ang) * (205 + r() * 30)]
  })
  const cluster = raw.map((p) => {
    let best = 0
    let bd = Infinity
    hubs.forEach((h, k) => {
      const d = Math.hypot((p.x - CX) / 1.2 - (h[0] - CX) / 1.2, p.y - CY - (h[1] - CY))
      if (d < bd) {
        bd = d
        best = k
      }
    })
    return best
  })
  /* guarantee every hub at least four marks so each world is visible */
  for (let k = 0; k < 6; k++) {
    let count = cluster.filter((c) => c === k).length
    for (let i = 0; count < 4 && i < N; i++) {
      const c = cluster[i]
      if (c !== k && cluster.filter((x) => x === c).length > 5) {
        cluster[i] = k
        count++
      }
    }
  }
  const nePos: [number, number][] = raw.map((_, i) => {
    const h = hubs[cluster[i]]
    const ang = r() * Math.PI * 2
    const rad = 26 + r() * 62
    return [h[0] + Math.cos(ang) * rad * 1.2, h[1] + Math.sin(ang) * rad * 0.8]
  })
  const bridges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [0, 3],
    [1, 4],
    [2, 5],
  ]

  return {
    marks: raw.map((p, i) => ({
      raw: [p.x, p.y],
      rawR: p.rr,
      ring: p.ring,
      ni: niPos[i],
      niOrder: niOrder[i],
      ne: nePos[i],
      cluster: cluster[i],
    })),
    hubs,
    bridges,
    spiral,
  }
}

const COLORS = {
  observe: { bg: '#e7e4db', mark: '#0d0d0c', faint: 'rgba(13,13,12,0.35)' },
  ni: { bg: '#1c0d57', mark: '#f1efe9', faint: 'rgba(241,239,233,0.35)' },
  ne: { bg: '#c6f02e', mark: '#0d0d0c', faint: 'rgba(13,13,12,0.45)' },
}

function Stage({ spec, mode }: { spec: Specimen; mode: Mode }) {
  const reduce = useReducedMotion()
  const L = useMemo(() => buildLayout(spec.seed), [spec.seed])
  const c = COLORS[mode]

  return (
    <motion.div
      className={`exp__stage exp__stage--${mode}`}
      animate={{ backgroundColor: c.bg }}
      transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
    >
      <div className="exp__canvas">
      <svg viewBox={`0 0 ${W} ${H}`} className="exp__svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Ni: the thread through every mark */}
        <AnimatePresence>
          {mode === 'ni' && (
            <motion.path
              key={`spiral-${spec.id}`}
              d={L.spiral}
              className="exp__spiral"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: reduce ? 0 : 1.8, ease: 'easeInOut', delay: reduce ? 0 : 0.9 }}
            />
          )}
        </AnimatePresence>

        {/* Ne: the web — spokes inside each world, bridges between worlds */}
        <AnimatePresence>
          {mode === 'ne' && (
            <motion.g key={`web-${spec.id}`} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
              {L.bridges.map(([a, b], i) => (
                <motion.line
                  key={`b${i}`}
                  x1={L.hubs[a][0]}
                  y1={L.hubs[a][1]}
                  x2={L.hubs[b][0]}
                  y2={L.hubs[b][1]}
                  className={i < 6 ? 'exp__bridge' : 'exp__bridge exp__bridge--chord'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 1 + i * 0.08, ease: EASE }}
                />
              ))}
              {L.marks.map((m, i) => (
                <motion.line
                  key={`s${i}`}
                  x1={L.hubs[m.cluster][0]}
                  y1={L.hubs[m.cluster][1]}
                  x2={m.ne[0]}
                  y2={m.ne[1]}
                  className="exp__spoke"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.75 + m.cluster * 0.07 }}
                />
              ))}
              {L.hubs.map((h, k) => (
                <motion.rect
                  key={`h${k}`}
                  x={h[0] - 6}
                  y={h[1] - 6}
                  width={12}
                  height={12}
                  className="exp__hub"
                  initial={{ scale: 0, rotate: 45 }}
                  animate={{ scale: 1, rotate: 45 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.7 + k * 0.07 }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        {/* the marks themselves: same forty-two, three arrangements */}
        {L.marks.map((m, i) => {
          const pos = mode === 'observe' ? m.raw : mode === 'ni' ? m.ni : m.ne
          const rr = mode === 'observe' ? m.rawR : mode === 'ni' ? 2 + (m.niOrder / N) * 4.5 : 4.5
          const delay = reduce ? 0 : mode === 'ni' ? (m.niOrder / N) * 0.5 : mode === 'ne' ? m.cluster * 0.07 + (i % 5) * 0.02 : (i % 7) * 0.03
          const hollow = mode === 'observe' ? m.ring : false
          return (
            <motion.circle
              key={i}
              initial={false}
              animate={{
                cx: pos[0],
                cy: pos[1],
                r: rr,
                fill: hollow ? 'rgba(0,0,0,0)' : c.mark,
                stroke: c.mark,
              }}
              strokeWidth={1.3}
              transition={{
                cx: { type: 'spring', stiffness: 60, damping: 14, delay },
                cy: { type: 'spring', stiffness: 60, damping: 14, delay },
                r: { duration: 0.6, delay },
                fill: { duration: 0.6 },
                stroke: { duration: 0.6 },
              }}
            />
          )
        })}

        <AnimatePresence>
          {mode === 'ni' && (
            <motion.circle
              key="core"
              cx={CX}
              cy={CY}
              r={14}
              className="exp__core"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 1.9 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>

        {/* Ne labels: each constellation named as a different world */}
        <AnimatePresence>
          {mode === 'ne' &&
            L.hubs.map((h, k) => (
              <motion.text
                key={`${spec.id}-lab-${k}`}
                x={h[0] + (h[0] > CX + 200 ? -14 : 14)}
                y={h[1] - 16}
                textAnchor={h[0] > CX + 200 ? 'end' : 'start'}
                className="exp__hub-label"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 1.1 + k * 0.09, ease: EASE }}
              >
                {spec.ne[k]}
              </motion.text>
            ))}
        </AnimatePresence>
      </svg>

      </div>

      {/* readings */}
      <div className="exp__overlay" aria-live="polite">
        <AnimatePresence mode="wait">
          {mode === 'observe' && (
            <motion.div key="o" className="exp__read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <p className="label">Specimen {spec.numeral} — unread</p>
              <p className="exp__read-text serif">{spec.prompt}</p>
              <p className="label label--muted">Choose a lens.</p>
            </motion.div>
          )}
          {mode === 'ni' && (
            <motion.div
              key={`ni-${spec.id}`}
              className="exp__read exp__read--ni"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 1.3, ease: EASE }}
            >
              <p className="label">Ni reading · 42 marks → 1 form</p>
              <p className="exp__read-text serif">{spec.ni}</p>
              <p className="exp__why">{spec.niWhy}</p>
            </motion.div>
          )}
          {mode === 'ne' && (
            <motion.div
              key={`ne-${spec.id}`}
              className="exp__read exp__read--ne"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 1.6, ease: EASE }}
            >
              <p className="label">Ne readings · 42 marks → 6 worlds, 9 bridges</p>
              <p className="exp__read-text serif">None of them is wrong. All of them are interesting.</p>
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
    { id: 'observe', label: 'Observe', sub: 'raw' },
    { id: 'ni', label: 'Ni', sub: 'converge' },
    { id: 'ne', label: 'Ne', sub: 'diverge' },
  ]

  return (
    <section className="section exp" id="experiment" aria-labelledby="exp-title">
      <div className="wrap">
        <SectionHead
          index="05"
          name="Experiment"
          title={
            <span id="exp-title">
              Same marks. <em>Change the mind</em> looking at them.
            </span>
          }
          lede="Pick a specimen, then switch lenses. Nothing is added or removed — only rearranged by the question being asked."
        />

        <div className="exp__controls">
          <div className="exp__specs" role="radiogroup" aria-label="Specimen">
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
              <button
                key={m.id}
                role="radio"
                aria-checked={mode === m.id}
                className={`exp__mode exp__mode--${m.id}`}
                onClick={() => setMode(m.id)}
              >
                {mode === m.id && <motion.span layoutId="exp-mode-bg" className="exp__mode-bg" transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                <span className="exp__mode-label">{m.label}</span>
                <span className="exp__mode-sub label">{m.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <Stage spec={spec} mode={mode} />

        <div className="exp__legend">
          <p className="label label--muted">
            Fig. 5 — {spec.prompt} Each dot is one impression. The lens decides what they belong to.
          </p>
        </div>
      </div>
    </section>
  )
}
