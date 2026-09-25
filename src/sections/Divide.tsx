import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import './Divide.css'

/* Helper for sequenced diagram parts */
function useSeq() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })
  const reduce = useReducedMotion()
  const node = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 8 },
    animate: inView ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.8, ease: EASE, delay: reduce ? 0 : 0.2 + i * 0.32 },
  })
  const line = (i: number) => ({
    initial: { pathLength: reduce ? 1 : 0, opacity: 0 },
    animate: inView ? { pathLength: 1, opacity: 1 } : undefined,
    transition: { duration: 0.7, ease: EASE, delay: reduce ? 0 : 0.36 + i * 0.32 },
  })
  return { ref, node, line }
}

const PLATO_LEVELS = [
  { en: 'The One', sup: '†', alt: 'the Good', gr: 'τὸ ἓν · τὸ ἀγαθόν', gloss: 'beyond being' },
  { en: 'Forms', gr: 'εἴδη · ἰδέαι', gloss: 'what each thing is, itself' },
  { en: 'Soul', sup: '‡', gr: 'ψυχή', gloss: 'mover; knower of Forms' },
  { en: 'Sensible world', gr: 'τὰ αἰσθητά', gloss: 'becoming, never being' },
  { en: 'Appearances', gr: 'εἰκόνες', gloss: 'shadows, reflections' },
]

function PlatoLadder() {
  const { ref, node, line } = useSeq()
  const ys = [56, 164, 272, 380, 488]
  return (
    <svg ref={ref} viewBox="0 0 460 560" className="divide__svg" role="img" aria-labelledby="pl-ladder-t">
      <title id="pl-ladder-t">
        Plato's hierarchy as later systematised: the One or the Good, then Forms, Soul, the sensible world, and appearances.
      </title>
      <defs>
        <marker id="pl-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M1 2 L5 8 L9 2" fill="none" stroke="var(--plato)" strokeWidth="1.2" />
        </marker>
      </defs>

      {/* degree-of-reality scale */}
      <motion.g {...node(0)}>
        <line x1="24" y1="40" x2="24" y2="510" stroke="var(--plato)" strokeWidth="1" opacity="0.4" />
        <text x="34" y="46" className="dg-mono" fill="var(--plato)">MORE REAL</text>
        <text x="34" y="512" className="dg-mono" fill="var(--plato)" opacity="0.6">LESS REAL</text>
      </motion.g>

      {PLATO_LEVELS.map((lv, i) => {
        const y = ys[i]
        const fade = 1 - i * 0.14
        return (
          <g key={lv.en}>
            {i > 0 && (
              <motion.path
                d={`M188 ${ys[i - 1] + 26} L188 ${y - 30}`}
                stroke="var(--plato)"
                strokeWidth="1"
                fill="none"
                markerEnd="url(#pl-arrow)"
                strokeDasharray={i >= 4 ? '3 4' : undefined}
                {...line(i - 1)}
              />
            )}
            <motion.g {...node(i)}>
             <g opacity={fade}>
              {i === 0 ? (
                <g>
                  <circle cx="188" cy={y} r="17" fill="none" stroke="var(--plato)" strokeWidth="1.2" />
                  <circle cx="188" cy={y} r="4" fill="var(--plato)" />
                  {Array.from({ length: 12 }).map((_, k) => {
                    const a = (k / 12) * Math.PI * 2
                    return (
                      <line
                        key={k}
                        x1={188 + Math.cos(a) * 22}
                        y1={y + Math.sin(a) * 22}
                        x2={188 + Math.cos(a) * 28}
                        y2={y + Math.sin(a) * 28}
                        stroke="var(--plato)"
                        strokeWidth="1"
                      />
                    )
                  })}
                </g>
              ) : (
                <rect
                  x={188 - 11}
                  y={y - 11}
                  width="22"
                  height="22"
                  transform={`rotate(45 188 ${y})`}
                  fill={i === 1 ? 'var(--plato)' : 'none'}
                  stroke="var(--plato)"
                  strokeWidth="1.2"
                  strokeDasharray={i >= 4 ? '2 3' : undefined}
                />
              )}
              <text x="226" y={y - 2} className="dg-name" fill="var(--ink)">
                {lv.en.toUpperCase()}
                {lv.sup && (
                  <tspan className="dg-sup" dy="-8" fill="var(--plato)">
                    {lv.sup}
                  </tspan>
                )}
              </text>
              <text x="226" y={y + 18} className="dg-greek" fill="var(--plato-deep)">
                {lv.gr}
              </text>
              <text x="226" y={y + 34} className="dg-mono" fill="var(--muted)">
                {lv.gloss.toUpperCase()}
              </text>
             </g>
            </motion.g>
          </g>
        )
      })}
    </svg>
  )
}

function AristotleAnalysis() {
  const { ref, node, line } = useSeq()
  const S = { x: 230, y: 56 }
  const F = { x: 110, y: 196 }
  const M = { x: 350, y: 196 }
  const AP = { x: 230, y: 330 }
  const C = { x: 230, y: 466 }
  return (
    <svg ref={ref} viewBox="0 0 460 560" className="divide__svg" role="img" aria-labelledby="ar-an-t">
      <title id="ar-an-t">
        Aristotle's analysis: substance, analysed into form and matter, understood through actuality and potentiality, realised
        as concrete individual things.
      </title>
      <defs>
        <marker id="ar-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M1 2 L5 8 L9 2" fill="none" stroke="var(--aris)" strokeWidth="1.2" />
        </marker>
      </defs>

      <motion.g {...node(0)}>
        <circle cx={S.x} cy={S.y} r="18" fill="var(--aris)" />
        <text x={S.x} y={S.y - 32} textAnchor="middle" className="dg-name" fill="var(--ink)">
          SUBSTANCE
        </text>
        <text x={S.x + 30} y={S.y + 6} className="dg-greek" fill="var(--aris-deep)">
          οὐσία
        </text>
      </motion.g>

      <motion.path d={`M${S.x - 16} ${S.y + 16} L${F.x + 16} ${F.y - 28}`} {...line(0)} stroke="var(--aris)" fill="none" markerEnd="url(#ar-arrow)" />
      <motion.path d={`M${S.x + 16} ${S.y + 16} L${M.x - 16} ${M.y - 28}`} {...line(0)} stroke="var(--aris)" fill="none" markerEnd="url(#ar-arrow)" />

      <motion.g {...node(1)}>
        <circle cx={F.x} cy={F.y} r="13" fill="none" stroke="var(--aris)" strokeWidth="1.2" />
        <circle cx={F.x} cy={F.y} r="5" fill="var(--aris)" />
        <text x={F.x} y={F.y + 36} textAnchor="middle" className="dg-name" fill="var(--ink)">FORM</text>
        <text x={F.x} y={F.y + 54} textAnchor="middle" className="dg-greek" fill="var(--aris-deep)">εἶδος · μορφή</text>
        <text x={F.x} y={F.y + 70} textAnchor="middle" className="dg-mono" fill="var(--muted)">WHAT IT IS</text>
      </motion.g>
      <motion.g {...node(1)}>
        <circle cx={M.x} cy={M.y} r="13" fill="var(--aris-mist)" stroke="var(--aris)" strokeWidth="1.2" strokeDasharray="2 2.5" />
        <text x={M.x} y={M.y + 36} textAnchor="middle" className="dg-name" fill="var(--ink)">MATTER</text>
        <text x={M.x} y={M.y + 54} textAnchor="middle" className="dg-greek" fill="var(--aris-deep)">ὕλη</text>
        <text x={M.x} y={M.y + 70} textAnchor="middle" className="dg-mono" fill="var(--muted)">WHAT IT IS MADE OF</text>
      </motion.g>

      <motion.path d={`M${F.x + 10} ${F.y + 82} Q${F.x + 30} ${AP.y - 20} ${AP.x - 30} ${AP.y - 12}`} {...line(1)} stroke="var(--aris)" fill="none" markerEnd="url(#ar-arrow)" />
      <motion.path d={`M${M.x - 10} ${M.y + 82} Q${M.x - 30} ${AP.y - 20} ${AP.x + 30} ${AP.y - 12}`} {...line(1)} stroke="var(--aris)" fill="none" markerEnd="url(#ar-arrow)" />

      <motion.g {...node(2)}>
        <circle cx={AP.x - 9} cy={AP.y + 6} r="11" fill="var(--aris)" />
        <circle cx={AP.x + 9} cy={AP.y + 6} r="11" fill="none" stroke="var(--aris)" strokeWidth="1.2" strokeDasharray="2 2.5" />
        <text x={AP.x} y={AP.y + 42} textAnchor="middle" className="dg-name" fill="var(--ink)">ACTUALITY / POTENTIALITY</text>
        <text x={AP.x} y={AP.y + 60} textAnchor="middle" className="dg-greek" fill="var(--aris-deep)">ἐνέργεια · δύναμις</text>
      </motion.g>

      <motion.path d={`M${AP.x} ${AP.y + 74} L${AP.x} ${C.y - 26}`} {...line(2)} stroke="var(--aris)" fill="none" markerEnd="url(#ar-arrow)" />

      <motion.g {...node(3)}>
        {[-72, -36, 0, 36, 72].map((dx, i) => (
          <circle key={dx} cx={C.x + dx} cy={C.y} r={i === 2 ? 12 : 9} fill="var(--aris)" opacity={i === 2 ? 1 : 0.75} />
        ))}
        <line x1="60" x2="400" y1={C.y + 16} y2={C.y + 16} stroke="var(--ink)" strokeWidth="1" />
        <text x={C.x} y={C.y + 44} textAnchor="middle" className="dg-name" fill="var(--ink)">CONCRETE THINGS</text>
        <text x={C.x} y={C.y + 62} textAnchor="middle" className="dg-greek" fill="var(--aris-deep)">τόδε τι · “a this”</text>
        <text x={C.x} y={C.y + 78} textAnchor="middle" className="dg-mono" fill="var(--muted)">THIS MAN, THIS HORSE · CAT. 2A11</text>
      </motion.g>
    </svg>
  )
}

export function Divide() {
  return (
    <section id="divide" className="room divide" aria-labelledby="divide-title">
      <div className="wrap">
        <RoomHeader
          numeral="I"
          name="The Fundamental Divide"
          greek="χωρισμός"
          greekGloss="chōrismos: separation"
          title={<span id="divide-title">Where does reality <em>actually</em> live?</span>}
          lede={
            <p>
              Both agree that to know a thing is to grasp its form: what it is. They part over <em>where</em> that form is found,
              and so over which things are most fully real.
            </p>
          }
        />

        <div className="divide__split grid">
          <article className="divide__col divide__col--plato side-plato">
            <div className="divide__sticky">
              <Side who="plato">The Academy</Side>
            </div>
            <Reveal>
              <h3 className="divide__claim display">Reality has a hierarchy.</h3>
            </Reveal>
            <Reveal delay={0.1} className="prose">
              <p>
                The things we see and touch are always changing and never simply what they are: a beautiful body is also, in
                some respect, not beautiful. They are what they are by <em>participating</em> in eternal, unchanging Forms,
                which are grasped by thought rather than the senses.
              </p>
            </Reveal>
            <figure className="divide__fig">
              <PlatoLadder />
              <figcaption className="note">
                <span className="divide__fn">† </span>
                “The One” at the summit is the later, Neoplatonic systematisation (Plotinus, <em>Enneads</em> V–VI). Plato himself
                speaks of the Form of the Good, “beyond being” (<em>Republic</em> VI, 509b).{' '}
                <span className="divide__fn">‡ </span>
                Soul as the intermediate level draws on the world-soul of the <em>Timaeus</em> (34b–37c).
              </figcaption>
            </figure>
          </article>

          <article className="divide__col divide__col--aris side-aris">
            <div className="divide__sticky">
              <Side who="aris">The Lyceum</Side>
            </div>
            <Reveal>
              <h3 className="divide__claim display">Reality is found in substances.</h3>
            </Reveal>
            <Reveal delay={0.1} className="prose">
              <p>
                What exists in the primary sense is the individual: this man, this horse, this oak. Each is a unity of{' '}
                <em>form</em> and <em>matter</em>, and each is a site of change, of capacities (potentiality) coming to be
                realised (actuality). To understand reality is to understand such things.
              </p>
            </Reveal>
            <figure className="divide__fig">
              <AristotleAnalysis />
              <figcaption className="note">
                Read as an <em>analysis</em>, not as a ladder of degrees of reality. In the <em>Categories</em> the concrete
                individual is primary substance (2a11–14); in <em>Metaphysics</em> Z Aristotle argues that form is substance in
                the primary sense. How the two accounts fit is still debated.
              </figcaption>
            </figure>
          </article>
        </div>

        <Reveal className="divide__coda">
          <p className="display">
            For Plato, what a thing is is found by looking <em className="c-plato">beyond</em> it. For Aristotle, by looking{' '}
            <em className="c-aris">into</em> it.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
