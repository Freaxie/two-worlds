import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE, SectionHead, rng } from '../components/common'
import './Experiment.css'

/*
  The same twelve observations about a messy situation, re-read on demand.
  Observe: a loose pile.
  Ti: sorted into three defined categories — what kind of thing each one is.
  Te: ranked by impact, with the top three marked to do first.
*/

type Mode = 'observe' | 'ti' | 'te'
type Item = { text: string; cat: number; impact: number }

type Specimen = {
  id: string
  numeral: string
  title: string
  prompt: string
  seed: number
  cats: { name: string; def: string }[]
  items: Item[]
  ti: string
  te: string
}

const SPECIMENS: Specimen[] = [
  {
    id: 'team',
    numeral: 'I',
    title: 'A late team',
    prompt: 'A team that misses its deadline every single sprint.',
    seed: 6,
    cats: [
      { name: 'PLANNING', def: 'the plan was wrong before work began' },
      { name: 'OWNERSHIP', def: 'nobody owned the decision' },
      { name: 'CAPACITY', def: 'the plan was right, the time wasn’t there' },
    ],
    items: [
      { text: 'estimates are guesses', cat: 0, impact: 7 },
      { text: 'scope grows mid-sprint', cat: 0, impact: 9 },
      { text: 'no one owns testing', cat: 1, impact: 8 },
      { text: 'too many meetings', cat: 2, impact: 5 },
      { text: 'unclear priorities', cat: 1, impact: 10 },
      { text: 'waiting on approvals', cat: 1, impact: 6 },
      { text: 'context switching', cat: 2, impact: 7 },
      { text: 'old code slows changes', cat: 0, impact: 6 },
      { text: 'late client feedback', cat: 0, impact: 8 },
      { text: 'a tired team', cat: 2, impact: 4 },
      { text: 'tools keep breaking', cat: 2, impact: 3 },
      { text: 'handoffs between teams', cat: 1, impact: 5 },
    ],
    ti: 'Not twelve problems. Three kinds of cause. Fix the kind, and its symptoms go with it.',
    te: 'Ranked by impact. Fix the top three this sprint, then measure again.',
  },
  {
    id: 'kitchen',
    numeral: 'II',
    title: 'A messy kitchen',
    prompt: 'A shared kitchen that is never quite clean.',
    seed: 12,
    cats: [
      { name: 'NO HOME', def: 'the thing has no fixed place' },
      { name: 'NO HABIT', def: 'the place exists, the routine doesn’t' },
      { name: 'NO ROOM', def: 'more stuff than the space can hold' },
    ],
    items: [
      { text: 'post on the counter', cat: 0, impact: 6 },
      { text: 'dishes in the sink', cat: 1, impact: 10 },
      { text: 'spices everywhere', cat: 0, impact: 4 },
      { text: 'too many mugs', cat: 2, impact: 5 },
      { text: 'appliances left out', cat: 2, impact: 7 },
      { text: 'a bag full of bags', cat: 2, impact: 3 },
      { text: 'nobody wipes surfaces', cat: 1, impact: 8 },
      { text: 'keys and chargers', cat: 0, impact: 5 },
      { text: 'expired food', cat: 1, impact: 6 },
      { text: 'recycling overflowing', cat: 1, impact: 9 },
      { text: 'trays that won’t fit', cat: 2, impact: 4 },
      { text: 'odd container lids', cat: 0, impact: 2 },
    ],
    ti: 'Twelve messes, three causes. Each cause needs a different kind of fix.',
    te: 'Dishes, recycling, surfaces. Three habits clear most of the mess.',
  },
  {
    id: 'game',
    numeral: 'III',
    title: 'A new board game',
    prompt: 'A board game you have never played, and a thick rulebook.',
    seed: 30,
    cats: [
      { name: 'CORE RULES', def: 'what the game actually is' },
      { name: 'EXCEPTIONS', def: 'where the rules bend' },
      { name: 'STRATEGY', def: 'how you win, not how you play' },
    ],
    items: [
      { text: 'turn order', cat: 0, impact: 10 },
      { text: 'how scoring works', cat: 0, impact: 9 },
      { text: 'setting up', cat: 0, impact: 8 },
      { text: 'trading', cat: 0, impact: 6 },
      { text: 'the thief card', cat: 1, impact: 4 },
      { text: 'breaking ties', cat: 1, impact: 3 },
      { text: 'when the game ends', cat: 0, impact: 7 },
      { text: 'longest-road bonus', cat: 1, impact: 5 },
      { text: 'hoard wood early', cat: 2, impact: 5 },
      { text: 'block the leader', cat: 2, impact: 6 },
      { text: 'don’t over-trade', cat: 2, impact: 4 },
      { text: 'two-player variant', cat: 1, impact: 2 },
    ],
    ti: 'Read it as a system: core, exceptions, strategy. Then every rule has somewhere to live.',
    te: 'Turn order, scoring, setup. Start playing; pick up the rest in round two.',
  },
]

const W = 1000
const H = 640
const COLX = [180, 500, 820]
const CHIP_W = 250

type Pos = { x: number; y: number; r: number }

function layout(spec: Specimen) {
  const r = rng(spec.seed)
  const raw: Pos[] = spec.items.map(() => ({ x: 140 + r() * (W - 280), y: 80 + r() * (H - 200), r: (r() - 0.5) * 18 }))
  const seen = [0, 0, 0]
  const ti: Pos[] = spec.items.map((it) => ({ x: COLX[it.cat], y: 176 + seen[it.cat]++ * 44, r: 0 }))
  const order = spec.items.map((it, i) => ({ i, v: it.impact })).sort((a, b) => b.v - a.v)
  const rank: number[] = new Array(spec.items.length)
  order.forEach((o, k) => (rank[o.i] = k))
  const te: Pos[] = spec.items.map((_, i) => ({ x: 270, y: 58 + rank[i] * 36, r: 0 }))
  return { raw, ti, te, rank }
}

const BG = { observe: '#e7e4db', ti: '#06362f', te: '#f2a024' }

function Stage({ spec, mode }: { spec: Specimen; mode: Mode }) {
  const reduce = useReducedMotion()
  const L = useMemo(() => layout(spec), [spec])

  return (
    <motion.div className={`exp__stage exp__stage--${mode}`} animate={{ backgroundColor: BG[mode] }} transition={{ duration: reduce ? 0 : 0.8, ease: EASE }}>
      <div className="exp__canvas">
        <svg viewBox={`0 0 ${W} ${H}`} className="exp__svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {/* Ti: category frames with their definitions */}
          <AnimatePresence>
            {mode === 'ti' && (
              <motion.g key="cats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.5, delay: reduce ? 0 : 0.15 }}>
                {spec.cats.map((c, k) => (
                  <g key={c.name}>
                    <motion.rect
                      x={COLX[k] - 150}
                      y={70}
                      width={300}
                      height={330}
                      className="exp__cat"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : k * 0.12 }}
                    />
                    <text x={COLX[k] - 136} y={98} className="exp__cat-name">
                      {String(k + 1).padStart(2, '0')} {c.name}
                    </text>
                    <text x={COLX[k] - 136} y={124} className="exp__cat-def">
                      = {c.def}
                    </text>
                    <line x1={COLX[k] - 150} x2={COLX[k] + 150} y1={142} y2={142} className="exp__cat-rule" />
                  </g>
                ))}
              </motion.g>
            )}
          </AnimatePresence>

          {/* Te: impact scale */}
          <AnimatePresence>
            {mode === 'te' && (
              <motion.g key="scale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.5, delay: reduce ? 0 : 0.2 }}>
                <text x={420} y={34} className="exp__te-head">
                  IMPACT →
                </text>
                <text x={86} y={34} className="exp__te-head">
                  RANK
                </text>
                <line x1={60} x2={940} y1={58 + 3 * 36 - 18} y2={58 + 3 * 36 - 18} className="exp__cut" />
                <text x={940} y={58 + 3 * 36 - 26} textAnchor="end" className="exp__te-head">
                  ↑ DO FIRST
                </text>
              </motion.g>
            )}
          </AnimatePresence>

          {spec.items.map((it, i) => {
            const pos = mode === 'observe' ? L.raw[i] : mode === 'ti' ? L.ti[i] : L.te[i]
            const w = mode === 'observe' ? it.text.length * 8.4 + 28 : CHIP_W
            const top = mode === 'te' && L.rank[i] < 3
            const delay = reduce ? 0 : mode === 'te' ? L.rank[i] * 0.04 : mode === 'ti' ? it.cat * 0.1 + (i % 4) * 0.03 : (i % 5) * 0.03
            return (
              <motion.g
                key={`${spec.id}-${i}`}
                initial={false}
                animate={{ x: pos.x, y: pos.y, rotate: pos.r }}
                transition={mode === 'te' ? { type: 'spring', stiffness: 260, damping: 26, delay } : { type: 'spring', stiffness: 90, damping: 18, delay }}
              >
                <motion.rect
                  initial={false}
                  animate={{ x: -w / 2, width: w }}
                  transition={{ duration: reduce ? 0 : 0.5, delay }}
                  y={-15}
                  height={30}
                  className={`exp__chip exp__chip--${mode} ${top ? 'exp__chip--top' : ''}`}
                />
                <text x={0} y={5} textAnchor="middle" className={`exp__chip-text exp__chip-text--${mode} ${top ? 'exp__chip-text--top' : ''}`}>
                  {it.text}
                </text>
                {mode === 'te' && (
                  <>
                    <text x={-CHIP_W / 2 - 40} y={5} textAnchor="middle" className="exp__rank">
                      {String(L.rank[i] + 1).padStart(2, '0')}
                    </text>
                    <motion.rect
                      x={CHIP_W / 2 + 22}
                      y={-9}
                      height={18}
                      className="exp__impact"
                      initial={{ width: 0 }}
                      animate={{ width: it.impact * 54 }}
                      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.6 + L.rank[i] * 0.04, ease: EASE }}
                    />
                  </>
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
          {mode === 'ti' && (
            <motion.div key={`ti-${spec.id}`} className="exp__read exp__read--ti" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: reduce ? 0 : 1, ease: EASE }}>
              <p className="label">Ti · 12 observations → 3 defined kinds</p>
              <p className="exp__read-text serif">{spec.ti}</p>
            </motion.div>
          )}
          {mode === 'te' && (
            <motion.div key={`te-${spec.id}`} className="exp__read exp__read--te" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: reduce ? 0 : 1, ease: EASE }}>
              <p className="label">Te · 12 observations → 1 ranked list</p>
              <p className="exp__read-text serif">{spec.te}</p>
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
    { id: 'ti', label: 'Ti', sub: 'classify' },
    { id: 'te', label: 'Te', sub: 'prioritise' },
  ]

  return (
    <section className="section exp" id="experiment" aria-labelledby="exp-title">
      <div className="wrap">
        <SectionHead
          index="05"
          name="Experiment"
          title={
            <span id="exp-title">
              Same mess. <em>Change the logic</em> applied to it.
            </span>
          }
          lede="Pick a situation, then switch lenses. Ti asks what kind of thing each observation is. Te asks which one to deal with first."
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
          <p className="label label--muted">Fig. 5 — {spec.prompt} Each chip is one observation. The lens decides what it is for.</p>
        </div>
      </div>
    </section>
  )
}
