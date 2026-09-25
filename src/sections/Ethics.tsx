import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import './Ethics.css'

type Node = { en: string; gr: string; text: string; ref: string; quote?: { q: string; src: string }; mean?: boolean }

const PLATO: Node[] = [
  {
    en: 'Rule of reason',
    gr: 'τὸ λογιστικὸν ἄρχειν',
    text: 'Reason knows what is good for the whole soul, so it should rule. Spirit is its ally, and appetite, the largest part, is governed rather than obeyed.',
    ref: 'Republic IV 441e–442d',
  },
  {
    en: 'Harmony of the soul',
    gr: 'ἁρμονία',
    text: 'The just person brings the three parts into concord, as a musician tunes the high, low and middle notes of a scale, and becomes one instead of many.',
    ref: 'Republic IV 443d–e',
  },
  {
    en: 'Justice',
    gr: 'δικαιοσύνη',
    text: 'Justice is each part doing its own work. It is an inner order of the soul before it is a pattern of actions, and the just life is the happier life.',
    ref: 'Republic IV 433a–b, 443c–444a · IX 580b–c',
  },
  {
    en: 'Orientation toward the Good',
    gr: 'τὸ ἀγαθόν',
    text: 'The Form of the Good is “the greatest study”. In the Symposium, love climbs from one beautiful body to all beauty, to beautiful knowledge, to the Beautiful itself.',
    ref: 'Republic VI 505a · Symposium 210a–212a',
  },
]

const ARIS: Node[] = [
  {
    en: 'Habit',
    gr: 'ἔθος',
    text: 'Virtue of character comes from habituation. Its very name, ēthikē, derives from ethos, habit. We are born able to acquire it, and practice completes the capacity.',
    ref: 'Nicomachean Ethics II.1 1103a14–26',
    quote: {
      q: 'We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.',
      src: 'Nicomachean Ethics II.1, 1103a34–b2 (tr. W. D. Ross)',
    },
  },
  {
    en: 'Virtue',
    gr: 'ἀρετή · ἕξις',
    text: 'Virtue is a settled state (hexis) of choosing well. It is not a feeling or a bare capacity. The virtuous person does the right thing gladly, knowingly, and from a stable character.',
    ref: 'NE II.4–6, 1105a28–33, 1106b36–1107a2',
  },
  {
    en: 'The doctrine of the mean',
    gr: 'μεσότης',
    text: 'Each virtue lies between an excess and a deficiency, a mean “relative to us”, not an arithmetic midpoint. The right amount of food for the wrestler Milo is not the right amount for a beginner.',
    ref: 'NE II.6–7, 1106a26–b7',
    mean: true,
  },
  {
    en: 'Practical wisdom',
    gr: 'φρόνησις',
    text: 'The capacity to deliberate well about what is good for a human life as a whole. There is no full virtue of character without it, and no practical wisdom without virtue.',
    ref: 'NE VI.5 1140a24–b7 · VI.13 1144b30–32',
  },
  {
    en: 'Eudaimonia',
    gr: 'εὐδαιμονία',
    text: 'Flourishing: activity of the soul in accordance with virtue, across a complete life. It is something done and sustained, not a mood or a possession.',
    ref: 'NE I.7 1097b22–1098a20',
    quote: { q: 'For one swallow does not make a summer, nor does one day.', src: 'Nicomachean Ethics I.7, 1098a18 (tr. W. D. Ross)' },
  },
]

/* Plato: a switchback climb, as straight segments so node positions along the path are exact */
const P_PTS: [number, number][] = [
  [210, 690],
  [110, 590],
  [330, 450],
  [110, 300],
  [300, 130],
  [210, 48],
]
const P_NODES = [1, 2, 3, 4]

function polyFractions(pts: [number, number][]) {
  const L = [0]
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return L.map((l) => l / L[L.length - 1])
}

/* Aristotle: a prolate cycloid, forward motion made of repeated loops */
function coil() {
  let d = ''
  const N = 400
  for (let k = 0; k <= N; k++) {
    const th = (k / N) * 10 * Math.PI
    const x = 40 + (700 / (10 * Math.PI)) * th + 34 * Math.sin(th)
    const y = 170 + 34 * Math.cos(th)
    d += `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `
  }
  return d
}
const A_NODES = [0, 1, 2, 3, 4].map((i) => ({ x: 40 + 70 + 140 * i, y: 136, f: (i + 0.5) / 5 }))

export function Ethics() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.55'] })
  const prog = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.5 })
  const [p, setP] = useState(0)
  useMotionValueEvent(prog, 'change', (v) => setP(v))

  const pf = useMemo(() => polyFractions(P_PTS), [])
  const coilD = useMemo(() => coil(), [])

  const plReached = P_NODES.filter((n) => p >= pf[n] - 0.01).length - 1
  const arReached = A_NODES.filter((n) => p >= n.f - 0.01).length - 1
  const [plPick, setPlPick] = useState<number | null>(null)
  const [arPick, setArPick] = useState<number | null>(null)
  const pl = plPick ?? Math.max(0, plReached)
  const ar = arPick ?? Math.max(0, arReached)

  return (
    <section id="ethics" className="room room--rule room--deep eth" aria-labelledby="ethics-title">
      <div className="wrap">
        <RoomHeader
          numeral="VII"
          name="Ethics"
          greek="ἀρετή"
          greekGloss="aretē: excellence, virtue"
          title={<span id="ethics-title">How should a human live?</span>}
          lede={
            <p>
              Both answer with virtue, and both hold that the virtuous life is the happy one. The paths differ in shape. Plato's
              climbs toward what is highest. Aristotle's moves forward through practice repeated until it becomes character.
            </p>
          }
        />

        <div ref={ref} className="eth__paths grid">
          {/* ---------- PLATO ---------- */}
          <div className="eth__col eth__col--plato side-plato">
            <Side who="plato">Upward</Side>
            <svg viewBox="0 0 440 720" className="eth__svg eth__svg--plato" role="img" aria-label="Plato's path of ascent">
              {/* the sun of the Good */}
              <g transform="translate(210 48)" className={`eth__sun${pl === 3 && p >= pf[4] - 0.01 ? ' is-on' : ''}`}>
                <circle r="16" />
                {Array.from({ length: 16 }).map((_, k) => {
                  const a = (k / 16) * Math.PI * 2
                  return <line key={k} x1={Math.cos(a) * 22} y1={Math.sin(a) * 22} x2={Math.cos(a) * (k % 2 ? 28 : 34)} y2={Math.sin(a) * (k % 2 ? 28 : 34)} />
                })}
              </g>
              <polyline points={P_PTS.map((q) => q.join(',')).join(' ')} className="eth__trace" />
              <motion.polyline points={P_PTS.map((q) => q.join(',')).join(' ')} className="eth__line eth__line--plato" style={{ pathLength: prog }} />
              {P_NODES.map((n, i) => {
                const [x, y] = P_PTS[n]
                const on = p >= pf[n] - 0.01
                const left = x < 220
                return (
                  <g
                    key={i}
                    className={`eth__node eth__node--plato${on ? ' is-reached' : ''}${pl === i ? ' is-on' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={pl === i}
                    aria-label={PLATO[i].en}
                    onClick={() => setPlPick(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPlPick(i)
                      }
                    }}
                  >
                    <circle cx={x} cy={y} r="30" className="eth__hit" />
                    <rect x={x - 9} y={y - 9} width="18" height="18" transform={`rotate(45 ${x} ${y})`} className="eth__mark" />
                    <text x={left ? x + 26 : x - 26} y={y - 4} textAnchor={left ? 'start' : 'end'} className="dg-name">
                      {PLATO[i].en.toUpperCase()}
                    </text>
                    <text x={left ? x + 26 : x - 26} y={y + 14} textAnchor={left ? 'start' : 'end'} className="dg-greek eth__gk">
                      {PLATO[i].gr}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* ---------- ARISTOTLE ---------- */}
          <div className="eth__col eth__col--aris side-aris">
            <Side who="aris">Forward, by repetition</Side>
            <svg viewBox="0 0 800 300" className="eth__svg eth__svg--aris" role="img" aria-label="Aristotle's path of habituation">
              <line x1="20" y1="214" x2="780" y2="214" className="eth__ground" />
              {Array.from({ length: 39 }).map((_, i) => (
                <line key={i} x1={20 + i * 20} x2={20 + i * 20} y1="214" y2={i % 5 ? 219 : 224} className="eth__ground" />
              ))}
              <path d={coilD} className="eth__trace" />
              <motion.path d={coilD} className="eth__line eth__line--aris" style={{ pathLength: prog }} />
              {A_NODES.map((n, i) => {
                const on = p >= n.f - 0.01
                return (
                  <g
                    key={i}
                    className={`eth__node eth__node--aris${on ? ' is-reached' : ''}${ar === i ? ' is-on' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={ar === i}
                    aria-label={ARIS[i].en}
                    onClick={() => setArPick(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setArPick(i)
                      }
                    }}
                  >
                    <rect x={n.x - 60} y={n.y - 30} width="120" height="160" className="eth__hit" />
                    <circle cx={n.x} cy={n.y} r="9" className="eth__mark" />
                    <text x={n.x} y="252" textAnchor="middle" className="dg-name eth__alab">
                      {ARIS[i].en === 'The doctrine of the mean' ? 'THE MEAN' : ARIS[i].en.toUpperCase()}
                    </text>
                    <text x={n.x} y="272" textAnchor="middle" className="dg-greek eth__gk">
                      {ARIS[i].gr.split(' · ')[0]}
                    </text>
                  </g>
                )
              })}
              <text x="780" y="292" textAnchor="end" className="dg-mono eth__cap">
                EACH LOOP: THE SAME KIND OF ACT, DONE AGAIN
              </text>
            </svg>

            <div className="eth__details">
              <Detail node={PLATO[pl]} who="plato" />
              <Detail node={ARIS[ar]} who="aris" />
            </div>
          </div>
        </div>

        <Reveal className="eth__coda grid">
          <p className="eth__coda-l label label--muted">Not simply opposed</p>
          <p className="eth__coda-t">
            Aristotle's path also turns upward at its end. In <em>Nicomachean Ethics</em> X.7–8 the happiest life is
            contemplation, the activity in us that is most divine. Plato, for his part, insists that the soul's order has to be
            built into character through upbringing, music and gymnastic (<em>Republic</em> II–III). What differs is the
            source of the standard: a Good that transcends human life, or the good of a human life lived well.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Detail({ node, who }: { node: Node; who: 'plato' | 'aris' }) {
  return (
    <div className={`eth__detail eth__detail--${who} side-${who}`} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div key={node.en} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <p className={`label label--${who}`}>{who === 'plato' ? 'Plato' : 'Aristotle'}</p>
          <h3 className="eth__dt display">{node.en}</h3>
          <p className="eth__dd">{node.text}</p>
          {node.mean && (
            <div className="eth__mean" aria-label="Courage as a mean between cowardice and rashness">
              <span>Cowardice</span>
              <span className="eth__mean-mid">Courage</span>
              <span>Rashness</span>
            </div>
          )}
          {node.quote && (
            <blockquote className="quote eth__q">
              “{node.quote.q}”<footer>{node.quote.src}</footer>
            </blockquote>
          )}
          <p className="cite">{node.ref}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
