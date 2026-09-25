import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import './Causality.css'

type Cause = 'material' | 'formal' | 'efficient' | 'final'
type Obj = 'house' | 'oak'

const CAUSES: { id: Cause; name: string; mark: string; q: string; gr: string; tr: string; pos: [number, number] }[] = [
  { id: 'formal', name: 'Formal', mark: 'Ε', q: 'What makes it what it is?', gr: 'τὸ εἶδος καὶ τὸ παράδειγμα', tr: 'the form and the pattern', pos: [400, 64] },
  { id: 'final', name: 'Final', mark: 'Τ', q: 'What is it for?', gr: 'τὸ οὗ ἕνεκα', tr: 'that for the sake of which', pos: [700, 316] },
  { id: 'material', name: 'Material', mark: 'Υ', q: 'What is it made of?', gr: 'τὸ ἐξ οὗ', tr: 'that out of which', pos: [400, 574] },
  { id: 'efficient', name: 'Efficient', mark: 'Α', q: 'What brought it about?', gr: 'ὅθεν ἡ ἀρχὴ τῆς κινήσεως', tr: 'the source of the change', pos: [100, 316] },
]

const ANSWERS: Record<Obj, Record<Cause, string>> = {
  house: {
    material: 'Stones, bricks and timbers. Each is itself matter already shaped: clay formed into brick, trees cut into beams.',
    formal: 'The plan: the arrangement that makes these materials a house and not a heap. Its definition says what a house is, a shelter for people and their goods.',
    efficient: 'The builder. More precisely, Aristotle says, the art of building in the builder: that is what moves the materials into shape.',
    final: 'Shelter. The house exists for the sake of protecting bodies and belongings, and that purpose governs every choice of material and plan.',
  },
  oak: {
    material: 'Wood and sap, and the earth and water the tree draws in. Matter in nature is always matter for a particular kind of form.',
    formal: 'The oak’s nature: what it is to be an oak, its organised life. For living things, the form is the soul.',
    efficient: 'A parent oak, by way of the acorn. “Man generates man,” runs Aristotle’s formula. A living kind reproduces its own form.',
    final: 'The mature oak. The acorn develops for the sake of becoming a fully realised oak. Growth has a direction, which is not the same as having a designer.',
  },
}

function House({ c }: { c: Cause | null }) {
  return (
    <g className="cz-obj">
      {/* stylobate */}
      <path d="M-120 86 L120 86 M-112 76 L112 76 M-104 66 L104 66" />
      {/* columns */}
      {[-78, -26, 26, 78].map((x) => (
        <g key={x}>
          <path d={`M${x - 9} 66 L${x - 7} -22 L${x + 7} -22 L${x + 9} 66`} />
          <path d={`M${x - 11} -22 L${x + 11} -22 L${x + 11} -28 L${x - 11} -28 Z`} />
          <line x1={x - 2} x2={x - 2} y1="62" y2="-18" opacity="0.4" />
          <line x1={x + 3} x2={x + 3} y1="62" y2="-18" opacity="0.4" />
        </g>
      ))}
      {/* entablature and pediment */}
      <path d="M-104 -28 L104 -28 L104 -44 L-104 -44 Z" />
      <path d="M-112 -44 L0 -92 L112 -44 Z" />
      <path d="M-86 -50 L0 -84 L86 -50 Z" opacity="0.45" />

      <AnimatePresence>
        {c === 'material' && (
          <motion.g key="m" className="cz-hl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {Array.from({ length: 7 }).map((_, r) =>
              Array.from({ length: 6 }).map((__, k) => (
                <rect key={`${r}-${k}`} x={-104 + k * 36 + (r % 2) * 18} y={-44 + r * 16} width="34" height="14" className="cz-block" />
              ))
            )}
          </motion.g>
        )}
        {c === 'formal' && (
          <motion.g key="f" className="cz-hl cz-hl--plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <rect x="-120" y="-92" width="240" height="178" strokeDasharray="4 4" />
            <line x1="-120" y1="104" x2="120" y2="104" />
            <path d="M-120 98 L-120 110 M120 98 L120 110" />
            <text x="0" y="122" textAnchor="middle" className="dg-mono">
              PLAN · PROPORTION · DEFINITION
            </text>
            <line x1="0" y1="-92" x2="0" y2="86" strokeDasharray="2 4" />
          </motion.g>
        )}
        {c === 'efficient' && (
          <motion.g key="e" className="cz-hl" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <path d="M-210 20 C-180 0 -150 -4 -128 0" markerEnd="url(#cz-ar)" />
            <text x="-214" y="44" className="dg-mono">
              THE ART OF BUILDING
            </text>
          </motion.g>
        )}
        {c === 'final' && (
          <motion.g key="t" className="cz-hl" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <path d="M-100 0 C-60 -10 -40 30 0 20 C40 10 60 -20 100 -10" strokeDasharray="3 4" opacity="0.6" />
            <path d="M128 0 C150 -4 180 0 208 20" markerEnd="url(#cz-ar)" />
            <text x="136" y="44" className="dg-mono">
              SHELTER
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  )
}

function Oak({ c }: { c: Cause | null }) {
  const crown = [
    [-60, -40, 42],
    [0, -70, 50],
    [60, -40, 42],
    [-30, -10, 40],
    [30, -10, 40],
  ]
  return (
    <g className="cz-obj">
      <line x1="-130" y1="86" x2="130" y2="86" />
      {/* trunk and boughs */}
      <path d="M-12 86 C-10 50 -14 30 -8 4 M12 86 C10 50 14 30 8 4" />
      <path d="M-8 20 C-30 0 -50 -14 -62 -34 M8 14 C30 -6 48 -18 60 -36 M0 4 C0 -30 2 -50 0 -70" opacity="0.7" />
      {crown.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} className="cz-leaf" />
      ))}
      {/* the acorn it came from, at its foot */}
      <g transform="translate(64 78)">
        <ellipse cx="0" cy="2" rx="5" ry="7" />
        <path d="M-6 -2 Q0 -8 6 -2 Z" className="cz-solid" />
      </g>

      <AnimatePresence>
        {c === 'material' && (
          <motion.g key="m" className="cz-hl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {Array.from({ length: 26 }).map((_, i) => (
              <circle key={i} cx={-110 + ((i * 37) % 220)} cy={96 + ((i * 13) % 22)} r="1.8" className="cz-solid" />
            ))}
            {[-6, -2, 2, 6].map((x) => (
              <line key={x} x1={x} x2={x} y1="84" y2="10" strokeDasharray="1 4" />
            ))}
          </motion.g>
        )}
        {c === 'formal' && (
          <motion.g key="f" className="cz-hl cz-hl--plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <path d="M0 86 L0 -110 M0 20 L-70 -50 M0 10 L70 -60 M-35 -15 L-60 -80 M35 -25 L60 -96 M0 -50 L-24 -104 M0 -60 L26 -110" strokeDasharray="3 3" />
            <text x="0" y="122" textAnchor="middle" className="dg-mono">
              A NATURE: ORGANISED LIFE
            </text>
          </motion.g>
        )}
        {c === 'efficient' && (
          <motion.g key="e" className="cz-hl" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <g transform="translate(-196 40) scale(0.35)">
              <circle cx="0" cy="-60" r="48" className="cz-leaf" />
              <line x1="0" y1="-12" x2="0" y2="46" />
            </g>
            <path d="M-176 40 C-150 30 -130 40 -116 60" markerEnd="url(#cz-ar)" />
            <text x="-222" y="84" className="dg-mono">
              PARENT OAK
            </text>
          </motion.g>
        )}
        {c === 'final' && (
          <motion.g key="t" className="cz-hl" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <ellipse cx="0" cy="-40" rx="118" ry="84" strokeDasharray="4 5" />
            <path d="M128 -10 C150 -14 180 -10 208 10" markerEnd="url(#cz-ar)" />
            <text x="136" y="36" className="dg-mono">
              THE MATURE OAK
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  )
}

export function Causality() {
  const [obj, setObj] = useState<Obj>('oak')
  const [cause, setCause] = useState<Cause>('final')
  const active = CAUSES.find((c) => c.id === cause)!

  return (
    <section id="causality" className="room room--rule room--deep cz" aria-labelledby="causality-title">
      <div className="wrap">
        <RoomHeader
          numeral="V"
          name="Causality"
          greek="αἰτία"
          greekGloss="aitia: cause, reason, explanation"
          title={<span id="causality-title">Why does a thing exist?</span>}
          lede={
            <p>
              For Aristotle, to know a thing is to know its <em>causes</em>, the several answers to the question “why?” He
              distinguishes four. Choose an object and a cause.
            </p>
          }
        />

        <div className="cz__stage grid side-aris">
          <div className="cz__diagram">
            <div className="cz__objects" role="group" aria-label="Choose an object">
              {(['oak', 'house'] as Obj[]).map((o) => (
                <button key={o} className={`cz__obj${obj === o ? ' is-on' : ''}`} aria-pressed={obj === o} onClick={() => setObj(o)}>
                  {o === 'oak' ? 'An oak (nature)' : 'A house (art)'}
                </button>
              ))}
            </div>
            <svg viewBox="0 0 800 640" className="cz__svg" role="img" aria-label={`The four causes of ${obj === 'oak' ? 'an oak' : 'a house'}; ${active.name} cause selected`}>
              <defs>
                <marker id="cz-ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M2 1 L8 5 L2 9" fill="none" stroke="var(--aris)" strokeWidth="1.2" />
                </marker>
              </defs>
              <circle cx="400" cy="316" r="170" className="cz-ring" />
              <circle cx="400" cy="316" r="232" className="cz-ring cz-ring--outer" />
              {CAUSES.map((c) => {
                const [x, y] = c.pos
                const on = c.id === cause
                const dx = x - 400
                const dy = y - 316
                const L = Math.hypot(dx, dy)
                const ux = dx / L
                const uy = dy / L
                return (
                  <g key={c.id}>
                    <line
                      x1={400 + ux * 172}
                      y1={316 + uy * 172}
                      x2={x - ux * 30}
                      y2={y - uy * 30}
                      className={`cz-spoke${on ? ' is-on' : ''}`}
                    />
                    <g
                      className={`cz-node${on ? ' is-on' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={on}
                      aria-label={`${c.name} cause: ${c.q}`}
                      onClick={() => setCause(c.id)}
                      onMouseEnter={() => setCause(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setCause(c.id)
                        }
                      }}
                    >
                      <circle cx={x} cy={y} r="44" className="cz-hit" />
                      <circle cx={x} cy={y} r="22" className="cz-dot" />
                      <text x={x} y={y + 5} textAnchor="middle" className="cz-initial">
                        {c.mark}
                      </text>
                      <text
                        x={x + (c.id === 'efficient' ? -34 : c.id === 'final' ? 34 : 0)}
                        y={c.id === 'formal' ? y - 34 : c.id === 'material' ? y + 44 : y - 30}
                        textAnchor={c.id === 'efficient' ? 'end' : c.id === 'final' ? 'start' : 'middle'}
                        className="dg-name"
                      >
                        {c.name.toUpperCase()}
                      </text>
                    </g>
                  </g>
                )
              })}
              <g transform="translate(400 322) scale(1.22)">
                <AnimatePresence mode="wait">
                  <motion.g key={obj} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    {obj === 'oak' ? <Oak c={cause} /> : <House c={cause} />}
                  </motion.g>
                </AnimatePresence>
              </g>
            </svg>
          </div>

          <div className="cz__detail" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={`${obj}-${cause}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4, ease: EASE }}>
                <p className="label label--aris">{active.name} cause</p>
                <h3 className="cz__q display">{active.q}</h3>
                <p className="cz__gr">
                  <span className="greek" lang="grc">
                    {active.gr}
                  </span>
                  <span className="mono">{active.tr}</span>
                </p>
                <p className="cz__a">{ANSWERS[obj][cause]}</p>
              </motion.div>
            </AnimatePresence>
            <ul className="cz__list">
              {CAUSES.map((c) => (
                <li key={c.id}>
                  <button className={`cz__li${cause === c.id ? ' is-on' : ''}`} aria-pressed={cause === c.id} onClick={() => setCause(c.id)}>
                    <span>{c.name}</span>
                    <span className="cz__li-q">{c.q}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="note">
              In natural things the formal, efficient and final causes often coincide: the form an oak passes on is the form it
              grows toward. <span className="cite">Physics II.3 194b16–195a3 · II.7 198a24–27</span>
            </p>
          </div>
        </div>

        {/* ---------- Plato ---------- */}
        <div className="cz__plato side-plato">
          <Reveal className="cz__plato-head">
            <Side who="plato">Explanation by the intelligible and the Good</Side>
            <h3 className="display cz__plato-title">Plato did not lack causes. He looked for the best one.</h3>
          </Reveal>
          <div className="cz__plato-grid">
            <Reveal className="cz__pcol">
              <p className="cz__pnum">i</p>
              <h4>The disappointment with Anaxagoras</h4>
              <p>
                In the <em>Phaedo</em>, Socrates hoped that an account of the world by Mind would show why each thing is
                arranged as it is <em>best</em> for it to be. He distinguishes the real cause from the physical conditions
                without which it could not operate: bones and sinews are not why he sits in prison.
              </p>
              <p className="cite">Phaedo 97b–99d</p>
            </Reveal>
            <Reveal className="cz__pcol" delay={0.08}>
              <p className="cz__pnum">ii</p>
              <h4>The Forms as causes</h4>
              <p>
                His “safe” answer: beautiful things are beautiful because of the Beautiful. Forms are <em>aitiai</em>, the reasons
                things are as they are, and in this sense Plato's theory of Forms is itself a theory of explanation.
              </p>
              <p className="cite">Phaedo 100b–e</p>
            </Reveal>
            <Reveal className="cz__pcol" delay={0.16}>
              <p className="cz__pnum">iii</p>
              <h4>The craftsman and the model</h4>
              <p>
                In the <em>Timaeus</em>, a divine craftsman, being good, makes the cosmos as good as possible, looking to an
                eternal model. Intelligent causes are set apart from necessity's “auxiliary causes.” Maker, pattern, purpose and
                a receptacle are all present.
              </p>
              <p className="cite">Timaeus 28a–30b, 46c–e, 48a</p>
            </Reveal>
          </div>
          <Reveal className="cz__good grid">
            <blockquote className="quote cz__goodq">
              “The good may be said to be not only the author of knowledge to all things known, but of their being and essence,
              and yet the good is not essence, but far exceeds essence in dignity and power.”
              <footer>Plato, Republic VI, 509b (tr. B. Jowett)</footer>
            </blockquote>
            <p className="note cz__goodnote">
              Aristotle's summary that Plato used only two causes, the formal and the material, is Aristotle's own reading of
              his teacher (<em>Metaphysics</em> A.6, 988a8–10). Many interpreters find more in the dialogues, above all the Good
              as the ultimate reason why things are as they are.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
