import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import './Politics.css'

const CLASSES = [
  { en: 'Rulers', gr: 'φύλακες', soul: 'Reason', note: 'Philosophers, trained for decades in mathematics and dialectic' },
  { en: 'Auxiliaries', gr: 'ἐπίκουροι', soul: 'Spirit', note: 'Soldiers who enforce the rulers’ judgements' },
  { en: 'Producers', gr: 'δημιουργοί', soul: 'Appetite', note: 'Farmers and craftsmen who supply the city’s needs' },
]

type Cell = { name: string; gr: string; who: string; good: boolean; text: string }
const CONSTITUTIONS: Cell[] = [
  { name: 'Kingship', gr: 'βασιλεία', who: 'One', good: true, text: 'One person rules, for the common good.' },
  { name: 'Aristocracy', gr: 'ἀριστοκρατία', who: 'Few', good: true, text: 'The few best rule, for the common good.' },
  {
    name: 'Polity',
    gr: 'πολιτεία',
    who: 'Many',
    good: true,
    text: 'The many rule, for the common good. In practice a blend of oligarchy and democracy, steadied by a large middle class, and the best that most cities can reach.',
  },
  { name: 'Tyranny', gr: 'τυραννίς', who: 'One', good: false, text: 'One person rules, for his own advantage.' },
  { name: 'Oligarchy', gr: 'ὀλιγαρχία', who: 'Few', good: false, text: 'The few, in practice the wealthy, rule in their own interest.' },
  { name: 'Democracy', gr: 'δημοκρατία', who: 'Many', good: false, text: 'The many, in practice the poor, rule in their own interest.' },
]

export function Politics() {
  const [cell, setCell] = useState(2)
  const c = CONSTITUTIONS[cell]

  return (
    <section id="politics" className="room room--rule pol" aria-labelledby="politics-title">
      <div className="wrap">
        <RoomHeader
          numeral="VIII"
          name="Politics"
          greek="πόλις"
          greekGloss="polis: the city-state"
          title={<span id="politics-title">The city and the human good.</span>}
          lede={
            <p>
              For both, ethics and politics are one inquiry: the city exists for the sake of living well. They differ over what
              the best city looks like, and over how far any real city can approach it.
            </p>
          }
        />

        <div className="pol__split grid">
          {/* ---------- PLATO ---------- */}
          <article className="pol__col pol__col--plato side-plato">
            <Side who="plato">The Republic</Side>
            <h3 className="pol__h display">An ordered city, the soul writ large.</h3>
            <p className="pol__p">
              Socrates looks for justice first in the city, where it is written in larger letters, then in the soul. The ideal
              city has three classes, matching the three parts of the soul, and it is just when each does its own work.
            </p>

            <div className="pol__classes" role="list">
              {CLASSES.map((k, i) => (
                <Reveal key={k.en} className="pol__class" delay={i * 0.1}>
                  <div role="listitem" className="pol__class-in">
                    <span className="pol__class-en display">{k.en}</span>
                    <span className="greek pol__class-gr">{k.gr}</span>
                    <span className="pol__class-note">{k.note}</span>
                    <span className="pol__class-soul mono">≈ {k.soul.toUpperCase()}</span>
                  </div>
                </Reveal>
              ))}
            </div>

            <blockquote className="quote pol__q">
              “Until philosophers are kings, or the kings and princes of this world have the spirit and power of philosophy …
              cities will never have rest from their evils.”
              <footer>Plato, Republic V, 473c–d (tr. B. Jowett)</footer>
            </blockquote>

            <ul className="pol__facts">
              <li>
                <strong>Philosopher-kings.</strong> Rule belongs to those who know the Good. Guardians hold no private property
                and, in Book V, no private families.
              </li>
              <li>
                <strong>Women among the guardians.</strong> Book V argues that women with the right natures should receive the
                same education and share in rule. <span className="cite">451c–457b</span>
              </li>
              <li>
                <strong>Later dialogues.</strong> The <em>Statesman</em> and the <em>Laws</em> give a larger role to written law
                and mixed institutions, as the best available where perfect knowledge is lacking.{' '}
                <span className="cite">Laws V 739a–e</span>
              </li>
            </ul>
          </article>

          {/* ---------- ARISTOTLE ---------- */}
          <article className="pol__col pol__col--aris side-aris">
            <Side who="aris">The Politics</Side>
            <h3 className="pol__h display">A natural association, many constitutions.</h3>
            <p className="pol__p">
              The polis grows out of household and village. It comes into being for the sake of life, and it exists for the
              sake of the good life. Aristotle had studied the constitutions of many Greek cities, 158 by the ancient count.
            </p>

            <blockquote className="quote pol__q pol__q--aris">
              “Man is by nature a political animal.”
              <footer>Aristotle, Politics I.2, 1253a2–3 (tr. B. Jowett)</footer>
            </blockquote>

            <div className="pol__table" role="group" aria-label="Aristotle's six constitutions">
              <div className="pol__th" aria-hidden="true">
                <span />
                <span className="label label--muted">One</span>
                <span className="label label--muted">Few</span>
                <span className="label label--muted">Many</span>
              </div>
              {[true, false].map((good) => (
                <div className="pol__tr" key={String(good)}>
                  <span className="pol__rowlab label label--muted">{good ? 'For the common good' : 'For the rulers’ own good'}</span>
                  {CONSTITUTIONS.filter((k) => k.good === good).map((k) => {
                    const idx = CONSTITUTIONS.indexOf(k)
                    return (
                      <button
                        key={k.name}
                        className={`pol__cell${good ? '' : ' pol__cell--dev'}${cell === idx ? ' is-on' : ''}`}
                        aria-pressed={cell === idx}
                        onClick={() => setCell(idx)}
                        onMouseEnter={() => setCell(idx)}
                      >
                        <span className="pol__cell-n">{k.name}</span>
                        <span className="pol__cell-g greek">{k.gr}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
              <div className="pol__cellinfo" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.p key={cell} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                    <strong>{c.name}.</strong> {c.text} <span className="cite">Politics III.7 · IV.8–11</span>
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <ul className="pol__facts">
              <li>
                <strong>Civic participation.</strong> A citizen is one who shares in judging and in holding office.{' '}
                <span className="cite">III.1 1275a22–23</span>
              </li>
              <li>
                <strong>Against the Republic’s unity.</strong> Common property and families would weaken the city, which is
                naturally a plurality: what is everyone’s is cared for least. <span className="cite">II.1–5</span>
              </li>
              <li>
                <strong>Flourishing as the aim.</strong> The best constitution is the one under which anyone whatever can act best
                and live happily. <span className="cite">VII.2 1324a23–25</span>
              </li>
            </ul>
          </article>
        </div>

        <Reveal className="pol__context">
          <p className="label label--muted">Historical context</p>
          <p>
            Both works take for granted the institutions of the fourth-century Greek city, slavery included. Aristotle defends
            “natural slavery” (<em>Politics</em> I.4–7) and excludes women from citizenship, positions now widely rejected. Neither
            text maps cleanly onto modern political programmes, and this exhibition does not treat them as though they did.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
