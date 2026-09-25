import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import './Knowledge.css'

type Stage = { en: string; gr: string; text: string; ref: string }

const PLATO: Stage[] = [
  {
    en: 'Sensation',
    gr: 'αἴσθησις',
    text: 'The senses deliver images and shadows. In the Cave, prisoners take the shadows on the wall for the whole of what is real.',
    ref: 'Republic VII 514a–515c · Line: εἰκασία',
  },
  {
    en: 'Opinion',
    gr: 'δόξα',
    text: 'Belief about visible things can be true, but it is unanchored: it cannot give an account of why, and so it does not stay put.',
    ref: 'Republic V 477e–478d · Meno 97e–98a',
  },
  {
    en: 'Reason',
    gr: 'διάνοια',
    text: 'Mathematical thought uses drawn figures to reason about the square itself and the diagonal itself, but proceeds from assumptions it does not examine.',
    ref: 'Republic VI 510b–511a',
  },
  {
    en: 'Dialectic',
    gr: 'διαλεκτική',
    text: 'Dialectic questions those assumptions, treating them as stepping-stones up to a first principle that depends on no assumption.',
    ref: 'Republic VI 511b–c, VII 533c–d',
  },
  {
    en: 'Knowledge',
    gr: 'νόησις',
    text: 'Understanding grasps the Forms, and last of all the Good, which the Republic compares to the sun: the source of both visibility and growth.',
    ref: 'Republic VI 508a–509b, VII 517b–c',
  },
]

const ARIS: Stage[] = [
  {
    en: 'Sensation',
    gr: 'αἴσθησις',
    text: 'All animals have an innate power of discrimination: perception. Knowledge has to begin here, though it does not end here.',
    ref: 'Posterior Analytics II.19 99b34–35',
  },
  {
    en: 'Memory',
    gr: 'μνήμη',
    text: 'In some animals the percept persists after the object has gone. Memory is the retention of what was perceived.',
    ref: 'Post. An. II.19 99b36–100a3 · Metaphysics A.1',
  },
  {
    en: 'Experience',
    gr: 'ἐμπειρία',
    text: 'Many memories of the same thing make up a single experience: knowing that this remedy helped Callias, and Socrates, and many others.',
    ref: 'Metaphysics A.1 980b28–981a12',
  },
  {
    en: 'Universal',
    gr: 'τὸ καθόλου',
    text: 'From experience the universal "comes to rest in the soul". Aristotle likens it to a rout in battle halted as one soldier makes a stand, then another.',
    ref: 'Post. An. II.19 100a3–b5',
  },
  {
    en: 'Science',
    gr: 'ἐπιστήμη',
    text: 'Scientific knowledge demonstrates why things must be so, from first principles. The principles themselves are grasped by intellect (νοῦς).',
    ref: 'Post. An. I.2 71b9–12, II.19 100b5–17',
  },
]

function PlatoGlyph({ i }: { i: number }) {
  switch (i) {
    case 0:
      return (
        <g className="kg-faint">
          <ellipse cx="-8" cy="4" rx="20" ry="9" />
          <ellipse cx="10" cy="-4" rx="14" ry="7" strokeDasharray="2 3" />
        </g>
      )
    case 1:
      return <path d="M-18 2 C-18 -14 -4 -20 8 -17 C20 -13 20 4 14 12 C6 20 -12 18 -16 10" />
    case 2:
      return (
        <g>
          <rect x="-16" y="-16" width="32" height="32" />
          <line x1="-16" y1="16" x2="16" y2="-16" />
        </g>
      )
    case 3:
      return (
        <g>
          <path d="M-20 -6 Q0 -22 20 -6" />
          <path d="M20 6 Q0 22 -20 6" />
          <path d="M16 -12 L20 -6 L13 -4" />
          <path d="M-16 12 L-20 6 L-13 4" />
        </g>
      )
    default:
      return (
        <g>
          <circle r="11" className="kg-solid" />
          {Array.from({ length: 16 }).map((_, k) => {
            const a = (k / 16) * Math.PI * 2
            return <line key={k} x1={Math.cos(a) * 16} y1={Math.sin(a) * 16} x2={Math.cos(a) * (k % 2 ? 21 : 26)} y2={Math.sin(a) * (k % 2 ? 21 : 26)} />
          })}
        </g>
      )
  }
}

function ArisGlyph({ i }: { i: number }) {
  const pts: [number, number][] = [
    [-14, -8], [0, -14], [14, -6], [-18, 6], [-4, 2], [10, 8], [-10, 16], [4, 16], [18, 16],
  ]
  switch (i) {
    case 0:
      return <circle r="5" className="kg-solid" />
    case 1:
      return (
        <g>
          <circle cx="10" r="5" className="kg-solid" />
          <circle cx="-4" r="4" className="kg-solid" opacity="0.5" />
          <circle cx="-16" r="3" className="kg-solid" opacity="0.25" />
        </g>
      )
    case 2:
      return (
        <g>
          {pts.map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r="3" className="kg-solid" opacity={0.5 + (k % 3) * 0.2} />
          ))}
        </g>
      )
    case 3:
      return (
        <g>
          {[-20, -10, 0, 10, 20].map((x) => (
            <circle key={x} cx={x} cy="0" r="3.5" className="kg-solid" />
          ))}
          <path d="M-26 -10 L-26 -14 L26 -14 L26 -10" />
          <path d="M-26 10 L-26 14 L26 14 L26 10" />
        </g>
      )
    default:
      return (
        <g>
          <path d="M0 -16 L-18 12 L18 12 Z" />
          <circle cx="0" cy="-16" r="4" className="kg-solid" />
          <circle cx="-18" cy="12" r="4" className="kg-solid" />
          <circle cx="18" cy="12" r="4" className="kg-solid" />
        </g>
      )
  }
}

export function Knowledge() {
  const track = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(0)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const s = Math.min(4, Math.max(0, Math.floor(v * 5.2)))
    setStage(s)
  })

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    if (span > 40) window.scrollTo({ top: top + ((i + 0.4) / 5.2) * span, behavior: 'smooth' })
    else setStage(i)
  }

  const px = (i: number) => 100 + i * 200
  const py = (i: number) => 184 - i * 38

  return (
    <section id="knowledge" className="room room--rule room--deep know" aria-labelledby="knowledge-title">
      <div className="wrap">
        <RoomHeader
          numeral="III"
          name="Knowledge"
          greek="ἐπιστήμη"
          greekGloss="epistēmē: knowledge, science"
          title={<span id="knowledge-title">How do we know?</span>}
          lede={
            <p>
              Two routes to knowledge, taken one stage at a time as you scroll. Plato's route is an <em>ascent</em> away from
              appearances. Aristotle's is an <em>abstraction</em> that starts from experience and never leaves it behind.
            </p>
          }
        />
      </div>

      <div ref={track} className="know__track">
        <div className="know__sticky">
          <div className="wrap know__stage">
            <ol className="know__steps" aria-label="Stages">
              {PLATO.map((_, i) => (
                <li key={i}>
                  <button className={`know__step${stage === i ? ' is-on' : ''}${stage > i ? ' is-past' : ''}`} onClick={() => go(i)} aria-current={stage === i ? 'step' : undefined}>
                    <span className="know__stepnum">{['i', 'ii', 'iii', 'iv', 'v'][i]}</span>
                    <span className="sr-only">Stage {i + 1}</span>
                  </button>
                </li>
              ))}
            </ol>

            {/* PLATO — ascent */}
            <div className="know__row know__row--plato side-plato">
              <div className="know__rowhead">
                <Side who="plato" />
                <span className="know__mode label">Ascent ↑</span>
              </div>
              <svg viewBox="0 0 1000 230" className="know__svg" role="img" aria-label={`Plato's ascent, stage ${stage + 1}: ${PLATO[stage].en}`}>
                <line x1="40" y1="214" x2="960" y2="214" className="kg-ground" />
                {PLATO.map((s, i) => (
                  <g key={s.en}>
                    {i < 4 && (
                      <motion.path
                        d={`M${px(i) + 22} ${py(i) + 34} L${px(i + 1) - 30} ${py(i + 1) + 18}`}
                        className="kg-arrow kg-arrow--plato"
                        initial={false}
                        animate={{ pathLength: stage > i ? 1 : 0, opacity: stage > i ? 1 : 0.15 }}
                        transition={{ duration: 0.8, ease: EASE }}
                      />
                    )}
                    <line x1={px(i)} x2={px(i)} y1={py(i) + 30} y2="214" className="kg-riser" />
                    <motion.g
                      transform={`translate(${px(i)} ${py(i)})`}
                      className="kg-glyph kg-glyph--plato"
                      initial={false}
                      animate={{ opacity: stage >= i ? 1 : 0.22 }}
                      transition={{ duration: 0.6 }}
                    >
                      <PlatoGlyph i={i} />
                    </motion.g>
                    <text x={px(i) + 36} y={py(i) - 6} className={`dg-name kg-lab${stage === i ? ' is-on' : ''}`}>
                      {s.en.toUpperCase()}
                    </text>
                    <text x={px(i) + 36} y={py(i) + 13} className="dg-greek kg-gr">
                      {s.gr}
                    </text>
                  </g>
                ))}
              </svg>
              <AnimatePresence mode="wait">
                <motion.p key={stage} className="know__text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  <strong>{PLATO[stage].en}.</strong> {PLATO[stage].text} <span className="cite">{PLATO[stage].ref}</span>
                </motion.p>
              </AnimatePresence>
            </div>

            {/* ARISTOTLE — abstraction */}
            <div className="know__row know__row--aris side-aris">
              <div className="know__rowhead">
                <Side who="aris" />
                <span className="know__mode label">Abstraction from experience →</span>
              </div>
              <svg viewBox="0 0 1000 120" className="know__svg" role="img" aria-label={`Aristotle's abstraction, stage ${stage + 1}: ${ARIS[stage].en}`}>
                <line x1="40" y1="46" x2="960" y2="46" className="kg-ground kg-ground--aris" />
                {ARIS.map((s, i) => (
                  <g key={s.en}>
                    {i < 4 && (
                      <motion.path
                        d={`M${px(i) + 36} 46 L${px(i + 1) - 36} 46`}
                        className="kg-arrow kg-arrow--aris"
                        initial={false}
                        animate={{ pathLength: stage > i ? 1 : 0, opacity: stage > i ? 1 : 0.15 }}
                        transition={{ duration: 0.8, ease: EASE }}
                      />
                    )}
                    <motion.g
                      transform={`translate(${px(i)} 46)`}
                      className="kg-glyph kg-glyph--aris"
                      initial={false}
                      animate={{ opacity: stage >= i ? 1 : 0.22 }}
                      transition={{ duration: 0.6 }}
                    >
                      <ArisGlyph i={i} />
                    </motion.g>
                    <text x={px(i)} y="92" textAnchor="middle" className={`dg-name kg-lab${stage === i ? ' is-on' : ''}`}>
                      {s.en.toUpperCase()}
                    </text>
                    <text x={px(i)} y="111" textAnchor="middle" className="dg-greek kg-gr">
                      {s.gr}
                    </text>
                  </g>
                ))}
              </svg>
              <AnimatePresence mode="wait">
                <motion.p key={stage} className="know__text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  <strong>{ARIS[stage].en}.</strong> {ARIS[stage].text} <span className="cite">{ARIS[stage].ref}</span>
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="know__panel grid">
          <Reveal className="know__start know__start--plato side-plato">
            <p className="label label--plato">Where Plato begins</p>
            <p className="display">Plato begins by asking what must be true beyond appearances.</p>
          </Reveal>
          <Reveal delay={0.1} className="know__start know__start--aris side-aris">
            <p className="label label--aris">Where Aristotle begins</p>
            <p className="display">Aristotle begins by asking what can be learned from things as they are.</p>
          </Reveal>
          <Reveal delay={0.15} className="know__caveat">
            <p className="label label--muted">A necessary simplification</p>
            <p>
              Neither thinker fits the later labels "rationalist" and "empiricist". Plato gives perception a real role: in the{' '}
              <em>Phaedo</em>, seeing equal sticks <em>reminds</em> us of the Equal itself, and the <em>Meno</em> presents learning
              as recollection prompted by questions about a drawn figure. Aristotle, for his part, holds that first principles are
              grasped by intellect (<span className="greek">νοῦς</span>), not simply generalised from cases. Both agree that
              knowledge in the strict sense is of what is universal and cannot be otherwise.
            </p>
            <p className="cite">Phaedo 74a–75b · Meno 81c–86b · Posterior Analytics II.19 · Nicomachean Ethics VI.3, 6</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
