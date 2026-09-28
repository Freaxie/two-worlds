import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Figure, LivePath, Reveal, SectionHead, useLiveTime } from '../components/common'
import { blob, C } from '../lib/organic'
import './Situation.css'

/* The people at the table. The friend stands; the partner sits beside them. */
const PEOPLE = [
  { x: 190, y: 380, s: 1, who: 'a guest', halo: 0.5 },
  { x: 330, y: 372, s: 1.05, who: 'the partner', halo: 0.9, tense: true },
  { x: 500, y: 290, s: 1.3, who: 'the friend', halo: 1 },
  { x: 670, y: 372, s: 1.05, who: 'a guest', halo: 0.6 },
  { x: 810, y: 380, s: 1, who: 'a guest', halo: 0.45 },
]
const YOU = { x: 500, y: 560, s: 1.5 }

/* An inward spiral that ends at the chest of the one who is deciding */
function spiral(cx: number, cy: number, turns = 3.2, r0 = 150) {
  let d = ''
  const steps = 160
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    const a = k * turns * Math.PI * 2 - Math.PI / 2
    const r = r0 * (1 - k) ** 1.1
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r * 0.8
    d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1)
  }
  return d
}

const STEPS = [
  {
    key: 'scene',
    tag: 'The situation',
    body: (
      <>
        A dinner for eight. Your oldest friend stands and announces they are leaving a secure job to open a restaurant — with their savings, and their
        partner’s. The table breaks into applause. Then they turn to you: <em>“You’re quiet. What do you think?”</em> You think it is a mistake.
      </>
    ),
  },
  {
    key: 'fi',
    tag: 'Fi — looking inward',
    body: (
      <>
        The room goes quiet in the mind. Attention folds back toward a private question: would <em>“It’s wonderful”</em> be a sentence I have to carry
        home? What I owe this friend may be exactly the thing no one else at the table will say.
      </>
    ),
  },
  {
    key: 'fe',
    tag: 'Fe — looking outward',
    body: (
      <>
        Attention spreads across the table. Their hope is in the air; the partner’s smile is a little fixed; everyone is waiting. What does this
        moment need to stay whole — and where could the honest conversation happen instead?
      </>
    ),
  },
]

export function Situation() {
  const ref = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const t = useLiveTime(svgRef, 0.6)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(p, 'change', (v) => setStep(v < 0.3 ? 0 : v < 0.64 ? 1 : 2))

  const fi = useTransform(p, [0.24, 0.36, 0.56, 0.66], [0, 1, 1, 0])
  const fe = useTransform(p, [0.62, 0.76, 1], [0, 1, 1])
  const others = useTransform(fi, (v) => 1 - v * 0.82)
  const spiralLen = useTransform(p, [0.26, 0.5], [0, 1])
  const youTint = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => (a > b ? C.fi : b > 0.05 ? C.feDeep : C.ink))

  return (
    <section id="situation" className="sit" aria-labelledby="sit-title">
      <div className="wrap sit__intro">
        <SectionHead
          n="02"
          name="One situation, two perspectives"
          title={<span id="sit-title">One table. Two directions of attention.</span>}
          lede="The same moment can be navigated by looking in or by looking around. Scroll through it twice."
        />
      </div>

      <div className="sit__track" ref={ref}>
        <div className="sit__sticky">
          <div className="wrap sit__stage grid">
            <div className="sit__captions" aria-live="polite">
              <ol className="sit__steps" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <li key={s.key} data-on={i === step} data-who={s.key} />
                ))}
              </ol>
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.key}
                  className={`sit__cap sit__cap--${s.key}`}
                  animate={{ opacity: i === step ? 1 : 0, y: i === step ? 0 : i < step ? -24 : 24 }}
                  transition={{ duration: 0.7, ease: [0.2, 0.7, 0.1, 1] }}
                  aria-hidden={i !== step}
                >
                  <p className="label">{s.tag}</p>
                  <p className="sit__body">{s.body}</p>
                </motion.div>
              ))}
            </div>

            <svg ref={svgRef} className="sit__svg" viewBox="0 0 1000 720" role="img" aria-label="A dinner table: five people facing you. In the Fi reading your attention spirals inward; in the Fe reading lines of attention reach out to each person.">
              <defs>
                <radialGradient id="sit-halo">
                  <stop offset="0" stopColor={C.fe2} stopOpacity="0.85" />
                  <stop offset="1" stopColor={C.fe2} stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sit-inner">
                  <stop offset="0" stopColor={C.fi2} stopOpacity="0.9" />
                  <stop offset="1" stopColor={C.fi} stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Fe: each person gets an atmosphere proportional to how much is at stake for them */}
              <motion.g style={{ opacity: fe }}>
                {PEOPLE.map((q, i) => (
                  <LivePath
                    key={i}
                    source={t}
                    d={(v) => blob({ cx: q.x, cy: q.y + 20 * q.s, r: 70 * q.halo * q.s + 20, wobble: q.tense ? 0.22 : 0.1, seed: i * 2, t: v * (q.tense ? 2.4 : 1), points: q.tense ? 11 : 8 })}
                    fill="url(#sit-halo)"
                  />
                ))}
              </motion.g>

              {/* Fe: lines of attention reaching out */}
              <motion.g style={{ opacity: fe }}>
                {PEOPLE.map((q, i) => (
                  <motion.path
                    key={i}
                    d={`M${YOU.x},${YOU.y - 14} Q${(YOU.x + q.x) / 2},${(YOU.y + q.y) / 2 - 60} ${q.x},${q.y + 30}`}
                    fill="none"
                    stroke={C.feDeep}
                    strokeWidth={1.2}
                    strokeDasharray="2 6"
                    style={{ pathLength: fe }}
                  />
                ))}
                <text x={500} y={200} textAnchor="middle" className="sit__note sit__note--fe">their hope</text>
                <text x={250} y={300} textAnchor="middle" className="sit__note sit__note--fe">the partner’s nerves</text>
                <text x={830} y={315} textAnchor="middle" className="sit__note sit__note--fe">the table’s joy</text>
              </motion.g>

              {/* The table */}
              <ellipse cx={500} cy={470} rx={400} ry={62} fill="none" stroke={C.ink} strokeOpacity={0.5} strokeWidth={1} />
              <line x1={100} x2={900} y1={470} y2={470} stroke={C.ink} strokeOpacity={0.12} />

              {PEOPLE.map((q, i) => (
                <Figure key={i} x={q.x} y={q.y} s={q.s} fill={i === 2 ? C.ink : '#3a3632'} opacity={others} />
              ))}
              <motion.g style={{ opacity: others }}>
                <text x={500} y={250} textAnchor="middle" className="sit__who">
                  the friend
                </text>
                <text x={330} y={338} textAnchor="middle" className="sit__who">
                  partner
                </text>
              </motion.g>

              {/* Fi: attention folds back to the self */}
              <motion.g style={{ opacity: fi }}>
                <LivePath source={t} d={(v) => blob({ cx: YOU.x, cy: YOU.y + 30, r: 120, wobble: 0.1, seed: 5, t: v })} fill="url(#sit-inner)" />
                <motion.path d={spiral(YOU.x, YOU.y + 38)} fill="none" stroke={C.fi} strokeWidth={1.4} style={{ pathLength: spiralLen }} />
                <text x={YOU.x - 190} y={YOU.y - 30} className="sit__note sit__note--fi">honesty</text>
                <text x={YOU.x + 150} y={YOU.y - 10} className="sit__note sit__note--fi">loyalty</text>
                <text x={YOU.x + 170} y={YOU.y + 110} className="sit__note sit__note--fi">what I actually believe</text>
              </motion.g>

              {/* You — seen from behind, facing the table */}
              <motion.g style={{ color: youTint }}>
                <Figure x={YOU.x} y={YOU.y} s={YOU.s} fill="currentColor" />
              </motion.g>
              <text x={YOU.x} y={YOU.y + 110} textAnchor="middle" className="sit__who sit__who--you">
                you
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="wrap">
        <Reveal className="sit__coda serif">
          Neither reading is the cold one. Each carries <em>a different idea of kindness.</em>
        </Reveal>
      </div>
    </section>
  )
}
