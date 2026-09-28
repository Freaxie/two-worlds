import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import { EASE, LivePath, SectionHead, figurePath, useLiveTime } from '../components/common'
import { blob, C, lerp, mix } from '../lib/organic'
import './Experiment.css'

type Mode = 'none' | 'fi' | 'fe'

type Reading = { notice: string; question: string; voice: string; move: string }

type Scenario = {
  id: string
  title: string
  setup: string
  /* people around you: position and what Fe reads in them */
  others: { x: number; y: number; read: string }[]
  /* what Fi finds when it looks inside */
  values: string[]
  fi: Reading
  fe: Reading
}

const SCENARIOS: Scenario[] = [
  {
    id: 'message',
    title: 'The unanswered message',
    setup:
      'Two days ago you sent a close friend a long, honest message about something that has been hurting. No reply. This morning they posted photos from a party, smiling.',
    others: [
      { x: 610, y: 170, read: 'overwhelmed?' },
      { x: 660, y: 360, read: 'unsure what to say' },
      { x: 180, y: 420, read: 'mutual friends' },
    ],
    values: ['being met', 'honesty', 'self-respect'],
    fi: {
      notice: 'The gap between what I offered and what came back.',
      question: 'Is this friendship still true to what I need from one?',
      voice: '“I said something real. I won’t pretend it didn’t matter.”',
      move: 'Wait — then say plainly that the silence hurt.',
    },
    fe: {
      notice: 'The friend’s state, the timing, the circle you share.',
      question: 'What might be happening for them — and what does the friendship need now?',
      voice: '“Maybe it landed heavily. A light check-in could open the door.”',
      move: 'Send something warm and easy to answer.',
    },
  },
  {
    id: 'vote',
    title: 'The meeting that moved on',
    setup:
      'Your team votes on a plan you argued against. The room exhales; the mood turns relieved, almost festive. Your manager looks round: “Everyone happy with that?”',
    others: [
      { x: 230, y: 150, read: 'relieved' },
      { x: 400, y: 110, read: 'wants closure' },
      { x: 570, y: 150, read: 'relieved' },
      { x: 640, y: 330, read: 'quietly doubtful' },
      { x: 160, y: 330, read: 'tired' },
    ],
    values: ['integrity', 'candour', 'the work itself'],
    fi: {
      notice: 'A small internal “no” that hasn’t gone away.',
      question: 'Can I say yes here and still recognise myself?',
      voice: '“I can accept the decision. I can’t say I agree with it.”',
      move: 'Name the reservation briefly, then commit.',
    },
    fe: {
      notice: 'Relief in the room — and one colleague who looks unsure.',
      question: 'What keeps this team together as it moves forward?',
      voice: '“The group needs this settled. My doubt can go to the right person later.”',
      move: 'Say yes now; find the doubtful colleague after.',
    },
  },
  {
    id: 'funeral',
    title: 'The borrowed grief',
    setup:
      'At the funeral of a colleague you barely knew, everyone around you is crying. You feel respectful — but calm. Someone takes your hand.',
    others: [
      { x: 250, y: 160, read: 'grieving' },
      { x: 560, y: 150, read: 'grieving' },
      { x: 640, y: 360, read: 'needs to be held' },
      { x: 170, y: 380, read: 'numb' },
    ],
    values: ['sincerity', 'not performing', 'quiet respect'],
    fi: {
      notice: 'The distance between what I feel and what is expected.',
      question: 'Would performing sorrow betray the real, smaller thing I feel?',
      voice: '“My calm is honest. I won’t manufacture tears.”',
      move: 'Stay present, and let quiet be your form of respect.',
    },
    fe: {
      notice: 'Grief moving through the room; a hand reaching for yours.',
      question: 'What do the people here need from me right now?',
      voice: '“This isn’t about my feeling. It’s about holding theirs.”',
      move: 'Hold the hand. Let the room’s grief set the tone.',
    },
  },
]

const YOU: [number, number] = [400, 300]

export function Experiment() {
  const [si, setSi] = useState(0)
  const [mode, setMode] = useState<Mode>('none')
  const s = SCENARIOS[si]
  const reading = mode === 'none' ? null : s[mode]

  return (
    <section id="experiment" className="section exp" aria-labelledby="exp-title">
      <div className="wrap">
        <SectionHead
          n="05"
          name="Interactive experiment"
          title={<span id="exp-title">Read the same moment twice.</span>}
          lede="Choose a situation. Then switch the lens and watch the scene reorganise — what grows, what fades, what becomes the question."
        />

        <div className="exp__body grid">
          <div className="exp__side">
            <p className="label label--muted">Situation</p>
            <div className="exp__tabs" role="tablist" aria-label="Situations">
              {SCENARIOS.map((sc, i) => (
                <button
                  key={sc.id}
                  role="tab"
                  aria-selected={i === si}
                  className="exp__tab"
                  onClick={() => {
                    setSi(i)
                    setMode('none')
                  }}
                >
                  <span className="label">0{i + 1}</span>
                  <span>{sc.title}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={s.id}
                className="exp__setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                {s.setup}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="exp__stage">
            <div className="exp__lens" role="group" aria-label="Choose a lens">
              {(['none', 'fi', 'fe'] as Mode[]).map((m) => (
                <button key={m} className="exp__lens-btn" data-mode={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                  {mode === m && <motion.span layoutId="lens-pill" className="exp__lens-pill" data-mode={m} transition={{ duration: 0.5, ease: EASE }} />}
                  <span className="exp__lens-text">{m === 'none' ? 'The facts' : m === 'fi' ? 'Through Fi' : 'Through Fe'}</span>
                </button>
              ))}
            </div>

            <Scene scenario={s} mode={mode} />

            <div className="exp__reading" aria-live="polite">
              <AnimatePresence mode="wait">
                {reading ? (
                  <motion.dl
                    key={s.id + mode}
                    className={`exp__dl exp__dl--${mode}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <div>
                      <dt className="label">What stands out</dt>
                      <dd>{reading.notice}</dd>
                    </div>
                    <div>
                      <dt className="label">The question</dt>
                      <dd>{reading.question}</dd>
                    </div>
                    <div className="exp__voice">
                      <dt className="label">Inner voice</dt>
                      <dd className="serif">{reading.voice}</dd>
                    </div>
                    <div>
                      <dt className="label">A likely move</dt>
                      <dd>{reading.move}</dd>
                    </div>
                  </motion.dl>
                ) : (
                  <motion.p
                    key="hint"
                    className="exp__hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    The facts don’t tell you what matters. Choose a lens.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- The scene: one set of facts, two interpretations ---------- */

function Scene({ scenario, mode }: { scenario: Scenario; mode: Mode }) {
  const ref = useRef<SVGSVGElement>(null)
  const reduce = useReducedMotion()
  const t = useLiveTime(ref, 0.8)
  const fi = useMotionValue(0)
  const fe = useMotionValue(0)

  useEffect(() => {
    const o = { duration: reduce ? 0 : 1.1, ease: EASE }
    const a = animate(fi, mode === 'fi' ? 1 : 0, o)
    const b = animate(fe, mode === 'fe' ? 1 : 0, o)
    return () => {
      a.stop()
      b.stop()
    }
  }, [mode, fi, fe, reduce])

  const bg = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => (a > b ? mix('#f3eee5', '#ecd8d4', a) : mix('#f3eee5', '#f7dfc6', b)))
  const innerR = useTransform(fi, (v) => lerp(54, 200, v))
  const ringsOpacity = useTransform(fi, [0, 0.4], [0.25, 1])
  const valuesOpacity = useTransform(fi, [0.5, 1], [0, 1])
  const fieldOpacity = useTransform(fe, [0, 1], [0, 1])
  const youScale = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => 1 + a * 0.35 - b * 0.35)
  const youColor = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => (a > 0.02 ? mix(C.ink, C.fi, a) : mix(C.ink, C.feDeep, b)))

  return (
    <motion.svg ref={ref} className="exp__svg" viewBox="0 0 800 560" style={{ backgroundColor: bg }} role="img" aria-label={`Scene: ${scenario.title}. ${mode === 'fi' ? 'Fi view: the inner values grow; the other people recede.' : mode === 'fe' ? 'Fe view: the others come forward with their feelings; you become one node among them.' : 'Neutral view: you and the people around you.'}`}>
      <defs>
        <radialGradient id="exp-core" cx="45%" cy="40%">
          <stop offset="0" stopColor={C.fi2} stopOpacity="0.85" />
          <stop offset="1" stopColor={C.fi} stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="exp-field">
          <stop offset="0" stopColor={C.fe2} stopOpacity="0.65" />
          <stop offset="1" stopColor={C.fe} stopOpacity="0" />
        </radialGradient>
        <filter id="exp-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Fe: the shared atmosphere */}
      <motion.g style={{ opacity: fieldOpacity }}>
        <LivePath source={t} d={(v) => blob({ cx: 400, cy: 280, r: 300, sx: 1.15, sy: 0.85, wobble: 0.07, seed: 3, t: v * 0.6, points: 11 })} fill="url(#exp-field)" />
      </motion.g>

      {/* Fe: lines of relation between everyone, you included */}
      {scenario.others.map((o, i) => (
        <Link key={`${scenario.id}-l${i}`} from={YOU} to={[o.x, o.y]} fe={fe} fi={fi} />
      ))}

      {/* Fi: the inner world opens */}
      <motion.g style={{ opacity: ringsOpacity }}>
        {[1, 0.78, 0.58].map((k, i) => (
          <InnerRing key={i} k={k} i={i} t={t} innerR={innerR} />
        ))}
        <InnerCore t={t} innerR={innerR} />
      </motion.g>

      {/* Fi: the values it finds there, slowly orbiting */}
      <motion.g style={{ opacity: valuesOpacity }}>
        {scenario.values.map((v, i) => (
          <Orbit key={`${scenario.id}-${v}`} word={v} i={i} n={scenario.values.length} t={t} />
        ))}
      </motion.g>

      {/* The others */}
      {scenario.others.map((o, i) => (
        <Other key={`${scenario.id}-${i}`} x={o.x} y={o.y} read={o.read} i={i} fi={fi} fe={fe} t={t} />
      ))}

      {/* You */}
      <motion.g style={{ x: YOU[0], y: YOU[1], scale: youScale, color: youColor }}>
        <circle cx={0} cy={-30} r={14} fill="currentColor" />
        <path d={figurePath(0, -30, 1.05)} fill="currentColor" />
        <text y={52} textAnchor="middle" className="exp__you">
          you
        </text>
      </motion.g>
    </motion.svg>
  )
}

function InnerRing({ k, i, t, innerR }: { k: number; i: number; t: MotionValue<number>; innerR: MotionValue<number> }) {
  const d = useTransform([t, innerR] as MotionValue<number>[], ([tt, r]: number[]) => blob({ cx: 400, cy: 290, r: r * k, wobble: 0.07, seed: i * 2 + 4, t: tt * (1 + i * 0.3), points: 10 }))
  return <motion.path d={d} fill="none" stroke={C.fi} strokeOpacity={0.35 + i * 0.2} strokeWidth={1.2} />
}

function InnerCore({ t, innerR }: { t: MotionValue<number>; innerR: MotionValue<number> }) {
  const d = useTransform([t, innerR] as MotionValue<number>[], ([tt, r]: number[]) => blob({ cx: 400, cy: 290, r: r * 0.42, wobble: 0.12, seed: 1, t: tt }))
  return <motion.path d={d} fill="url(#exp-core)" />
}

function Orbit({ word, i, n, t }: { word: string; i: number; n: number; t: MotionValue<number> }) {
  const x = useTransform(t, (tt) => 400 + Math.cos(tt * 0.18 + (i / n) * Math.PI * 2) * 150)
  const y = useTransform(t, (tt) => 290 + Math.sin(tt * 0.18 + (i / n) * Math.PI * 2) * 112)
  return (
    <motion.text x={x} y={y} textAnchor="middle" className="exp__value">
      {word}
    </motion.text>
  )
}

function Link({ from, to, fi, fe }: { from: [number, number]; to: [number, number]; fi: MotionValue<number>; fe: MotionValue<number> }) {
  const opacity = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => 0.14 * (1 - a) + b * 0.55)
  return <motion.line x1={from[0]} y1={from[1] - 20} x2={to[0]} y2={to[1]} stroke={C.feDeep} strokeWidth={1.2} strokeDasharray="2 5" style={{ opacity }} />
}

type OtherProps = { x: number; y: number; read: string; i: number; fi: MotionValue<number>; fe: MotionValue<number>; t: MotionValue<number> }

function Other({ x, y, read, i, fi, fe, t }: OtherProps) {
  // Fi pushes others outward and out of focus; Fe brings them close and warm
  const cx = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => x + (x - 400) * (a * 0.28 - b * 0.08))
  const cy = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => y + (y - 290) * (a * 0.28 - b * 0.08))
  const scale = useTransform([fi, fe] as MotionValue<number>[], ([a, b]: number[]) => 1 - a * 0.3 + b * 0.25)
  const opacity = useTransform(fi, (a) => 1 - a * 0.65)
  const color = useTransform(fe, (b) => mix('#3a3632', C.feDeep, b))
  const halo = useTransform([t, fe] as MotionValue<number>[], ([tt, b]: number[]) => blob({ cx: 0, cy: 0, r: 20 + b * 38, wobble: 0.16, seed: i * 3, t: tt * 1.3, points: 8 }))
  const haloOpacity = useTransform(fe, [0, 1], [0, 0.42])
  const readOpacity = useTransform(fe, [0.55, 1], [0, 1])
  const filter = useTransform(fi, (a) => (a > 0.5 ? 'url(#exp-blur)' : 'none'))

  return (
    <motion.g style={{ x: cx, y: cy }}>
      <motion.g style={{ scale, opacity, color, filter }}>
        <motion.path d={halo} fill={C.fe2} style={{ opacity: haloOpacity, mixBlendMode: 'multiply' }} />
        <circle cx={0} cy={-18} r={10} fill="currentColor" />
        <path d={figurePath(0, -18, 0.78)} fill="currentColor" />
      </motion.g>
      <motion.text y={54} textAnchor="middle" className="exp__read" style={{ opacity: readOpacity }}>
        {read}
      </motion.text>
    </motion.g>
  )
}
