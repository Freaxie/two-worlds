import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import { Cuttlefish } from '../components/HeroArt'
import './Soul.css'

const PLATO_LEVELS = [
  {
    en: 'Body',
    gr: 'σῶμα',
    text: 'Mortal and composite. In the Phaedo, philosophy is a practice for dying: loosening the soul from the body’s pleasures and distractions.',
    ref: 'Phaedo 64a–67e',
  },
  {
    en: 'Soul',
    gr: 'ψυχή',
    text: 'Immortal, self-moving, and akin to the unchanging Forms. In the Republic it has three parts: reason, spirit and appetite.',
    ref: 'Phaedo 78b–80b · Phaedrus 245c–e · Republic IV 436a–441c',
  },
  {
    en: 'Reason',
    gr: 'τὸ λογιστικόν',
    text: 'The part that loves learning. It should rule, with spirit as its ally, over appetite. In the Phaedrus it is a charioteer driving two horses.',
    ref: 'Republic IV 441e–442b · Phaedrus 246a–254e',
  },
  {
    en: 'Apprehension of the Good',
    gr: 'ἡ τοῦ ἀγαθοῦ ἰδέα',
    text: 'Education turns the whole soul around, from what becomes to what is, until it can look at the brightest of beings, the Good.',
    ref: 'Republic VII 518b–d',
  },
]

const ARIS_LEVELS = [
  {
    en: 'Nutritive soul',
    gr: 'τὸ θρεπτικόν',
    who: 'All living things, plants included',
    text: 'Nourishment, growth and reproduction. It is the most widely shared capacity of life, and the one on which the others depend.',
    ref: 'De Anima II.4 415a22–b7',
  },
  {
    en: 'Sensitive soul',
    gr: 'τὸ αἰσθητικόν',
    who: 'Animals',
    text: 'Perception, and with it pleasure, pain and desire. Most animals can also move themselves. Aristotle dissected and described hundreds of species.',
    ref: 'De Anima II.5–III.2 · History of Animals',
  },
  {
    en: 'Rational soul',
    gr: 'τὸ νοητικόν',
    who: 'Human beings',
    text: 'Thought, both practical and theoretical. Whether intellect can exist apart from the body is the question Aristotle leaves most open. De Anima III.5 remains one of the most disputed passages in philosophy.',
    ref: 'De Anima III.4–8',
  },
]

/* the Timaeus locates reason in the head, spirit in the chest, appetite below the midriff (69c–71a) */
const ZONES = [
  { id: 'reason', label: 'Reason', gr: 'λογιστικόν', d: 'M150 36 A52 52 0 1 1 149.9 36 Z', y: 84 },
  { id: 'spirit', label: 'Spirit', gr: 'θυμοειδές', d: 'M150 168 C196 168 222 190 222 214 C222 238 196 260 150 260 C104 260 78 238 78 214 C78 190 104 168 150 168 Z', y: 212 },
  { id: 'appetite', label: 'Appetite', gr: 'ἐπιθυμητικόν', d: 'M150 292 C204 292 236 316 236 342 C236 368 204 392 150 392 C96 392 64 368 64 342 C64 316 96 292 150 292 Z', y: 340 },
]

export function Soul() {
  const [pl, setPl] = useState(2)
  const [ar, setAr] = useState(2)
  const zoneOn = (id: string) => pl === 1 || (pl >= 2 && id === 'reason')

  return (
    <section id="soul" className="room room--rule soul" aria-labelledby="soul-title">
      <div className="wrap">
        <RoomHeader
          numeral="VI"
          name="The Soul"
          greek="ψυχή"
          greekGloss="psychē: soul, the principle of life"
          title={<span id="soul-title">What is a human being?</span>}
          lede={
            <p>
              For both, soul (<span className="greek">ψυχή</span>) is what makes a living thing alive. For Plato it is a distinct,
              immortal self, imprisoned in the body and able to rise above it. For Aristotle it is the <em>form</em> of a living
              body: its organised capacity to live.
            </p>
          }
        />

        <div className="soul__split grid">
          {/* ---------- PLATO ---------- */}
          <article className="soul__col soul__col--plato side-plato">
            <Side who="plato">A self that rises</Side>
            <div className="soul__body">
              <svg viewBox="0 -44 300 464" className="soul__fig" role="img" aria-label="The tripartite soul located in the body, after the Timaeus">
                {/* the body as the soul's housing: an axis with head, chest and belly (Timaeus 69c–71a) */}
                <g className={`soul__torso${pl === 0 ? ' is-on' : ''}`}>
                  <line x1="150" y1="20" x2="150" y2="400" />
                  <line x1="96" y1="152" x2="204" y2="152" />
                  <line x1="110" y1="276" x2="190" y2="276" />
                  <text x="246" y="156" className="dg-mono">NECK</text>
                  <text x="246" y="280" className="dg-mono">MIDRIFF</text>
                  <text x="150" y="416" textAnchor="middle" className="dg-mono">TIMAEUS 69C–71A</text>
                </g>
                {ZONES.map((z, i) => (
                  <g key={z.id}>
                    <motion.path
                      d={z.d}
                      className={`soul__zone${zoneOn(z.id) ? ' is-on' : ''}`}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.2, ease: EASE }}
                    />
                    <text x="150" y={z.y} textAnchor="middle" className="dg-name soul__zl">
                      {z.label.toUpperCase()}
                    </text>
                    <text x="150" y={z.y + 17} textAnchor="middle" className="dg-greek soul__zg">
                      {z.gr}
                    </text>
                  </g>
                ))}
                {/* the upward orientation */}
                <motion.path
                  d="M150 20 L150 -30"
                  className={`soul__up${pl === 3 ? ' is-on' : ''}`}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.9, ease: EASE }}
                  markerEnd="url(#soul-up)"
                />
                <defs>
                  <marker id="soul-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <path d="M2 1 L8 5 L2 9" fill="none" stroke="var(--plato)" strokeWidth="1.2" />
                  </marker>
                </defs>
              </svg>
              <ol className="soul__ladder soul__ladder--up" aria-label="Plato: from body to the Good">
                {PLATO_LEVELS.map((l, i) => (
                  <li key={l.en}>
                    <button className={`soul__lvl${pl === i ? ' is-on' : ''}`} aria-pressed={pl === i} onClick={() => setPl(i)} onMouseEnter={() => setPl(i)}>
                      <span className="soul__lvl-en">{l.en}</span>
                      <span className="soul__lvl-gr greek">{l.gr}</span>
                    </button>
                    {i < PLATO_LEVELS.length - 1 && <span className="soul__arrow" aria-hidden="true">↓</span>}
                  </li>
                ))}
              </ol>
            </div>
            <div className="soul__text" aria-live="polite">
              <motion.p key={pl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                {PLATO_LEVELS[pl].text} <span className="cite">{PLATO_LEVELS[pl].ref}</span>
              </motion.p>
            </div>
          </article>

          {/* ---------- ARISTOTLE ---------- */}
          <article className="soul__col soul__col--aris side-aris">
            <Side who="aris">A form that lives</Side>
            <div className="soul__body">
              <svg viewBox="0 0 300 420" className="soul__fig" role="img" aria-label="Nested capacities of soul: nutritive within sensitive within rational">
                {(() => {
                  const poly = (n: number, r: number, cy = 220) =>
                    Array.from({ length: n }, (_, k) => {
                      const a = -Math.PI / 2 + (k / n) * Math.PI * 2
                      return `${150 + Math.cos(a) * r},${cy + Math.sin(a) * r}`
                    }).join(' ')
                  const shapes = [
                    { n: 3, r: 62, i: 0 },
                    { n: 4, r: 104, i: 1 },
                    { n: 5, r: 142, i: 2 },
                  ]
                  return shapes
                    .slice()
                    .reverse()
                    .map((s) => (
                      <motion.polygon
                        key={s.n}
                        points={poly(s.n, s.r)}
                        className={`soul__poly${ar >= s.i ? ' is-in' : ''}${ar === s.i ? ' is-on' : ''}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + s.i * 0.25, ease: EASE }}
                        style={{ transformOrigin: '150px 220px' }}
                      />
                    ))
                })()}
                <text x="150" y="232" textAnchor="middle" className="dg-mono soul__pl">NUTRITIVE</text>
                <text x="227" y="223" textAnchor="middle" className="dg-mono soul__pl soul__pl--s">SENSITIVE</text>
                <text x="150" y="106" textAnchor="middle" className="dg-mono soul__pl soul__pl--s">RATIONAL</text>
                <text x="150" y="408" textAnchor="middle" className="dg-mono soul__cap">
                  FIGURE WITHIN FIGURE · AFTER DE ANIMA II.3
                </text>
              </svg>
              <ol className="soul__ladder" aria-label="Aristotle: capacities of soul">
                {ARIS_LEVELS.map((l, i) => (
                  <li key={l.en}>
                    <button className={`soul__lvl${ar === i ? ' is-on' : ''}`} aria-pressed={ar === i} onClick={() => setAr(i)} onMouseEnter={() => setAr(i)}>
                      <span className="soul__lvl-en">{l.en}</span>
                      <span className="soul__lvl-gr greek">{l.gr}</span>
                      <span className="soul__lvl-who mono">{l.who}</span>
                    </button>
                    {i < ARIS_LEVELS.length - 1 && <span className="soul__arrow" aria-hidden="true">↓</span>}
                  </li>
                ))}
              </ol>
            </div>
            <div className="soul__text" aria-live="polite">
              <motion.p key={ar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                {ARIS_LEVELS[ar].text} <span className="cite">{ARIS_LEVELS[ar].ref}</span>
              </motion.p>
            </div>
          </article>
        </div>

        <div className="soul__foot grid">
          <Reveal className="soul__def side-aris">
            <blockquote className="quote">
              “The soul is the first grade of actuality of a natural body having life potentially in it.”
              <footer>Aristotle, De Anima II.1, 412a27–28 (tr. J. A. Smith)</footer>
            </blockquote>
            <p className="note">
              Hence Aristotle's image: if the eye were an animal, sight would be its soul. Soul is not a thing lodged in the
              body but what the body, as alive, is doing (412b18–19).
            </p>
          </Reveal>
          <Reveal className="soul__specimen side-aris" delay={0.1}>
            <Cuttlefish className="soul__cuttle" />
            <p className="cite">
              The Lyceum's evidence: sensitive souls observed. Aristotle's account of the cuttlefish, <em>History of Animals</em>{' '}
              IV.1.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
