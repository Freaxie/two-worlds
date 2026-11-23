import { useRef, type RefObject } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { LivePath, Reveal, SectionHead, useLiveTime } from '../components/common'
import { blob, C, mix } from '../lib/organic'
import './NotOpposites.css'

/* A lemniscate: one continuous line that passes through both worlds */
const A = 330
const CX = 500
const CY = 300
function loopPoint(u: number): [number, number] {
  const s = Math.sin(u)
  const c = Math.cos(u)
  const k = 1 + s * s
  return [CX + (A * c) / k, CY + (A * s * c) / k * 1.35]
}
const LOOP = (() => {
  let d = ''
  for (let i = 0; i <= 240; i++) {
    const [x, y] = loopPoint((i / 240) * Math.PI * 2)
    d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1)
  }
  return d + 'Z'
})()

const EXCHANGES = [
  { from: 'fi', head: 'Conviction gives care a spine.', body: 'Without an inner line, harmony becomes agreement with whoever is loudest. A peace worth keeping has to include the truth.' },
  { from: 'fe', head: 'Awareness gives conviction a place to land.', body: 'A value that cannot be heard is only half expressed. Reading the room is how a personal truth finds a form others can receive.' },
  { from: 'fi', head: 'Fi asks Fe: is this harmony honest?', body: 'It notices when a group’s warmth is covering something no one will say.' },
  { from: 'fe', head: 'Fe asks Fi: is this truth kind enough to be heard?', body: 'It notices when being right is costing the relationship the right is meant to protect.' },
]

function Traveller({ t, offset, size }: { t: MotionValue<number>; offset: number; size: number }) {
  const u = useTransform(t, (v) => v * 0.45 + offset)
  const x = useTransform(u, (v) => loopPoint(v)[0])
  const y = useTransform(u, (v) => loopPoint(v)[1])
  // Crimson on the left lobe, amber on the right, mixed as it crosses the centre
  const fill = useTransform(x, (v) => mix(C.fi, C.fe, Math.min(1, Math.max(0, (v - CX + 120) / 240))))
  return <motion.circle cx={x} cy={y} r={size} style={{ fill }} />
}

export function NotOpposites() {
  const ref = useRef<SVGSVGElement>(null)
  const t = useLiveTime(ref, 1)
  const { scrollYProgress } = useScroll({ target: ref as unknown as RefObject<HTMLElement>, offset: ['start 0.9', 'center 0.5'] })
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1])
  const lobes = useTransform(scrollYProgress, [0.4, 1], [0, 1])
  const fiLobe = useTransform(t, (v) => blob({ cx: CX - A * 0.58, cy: CY, r: 140, sx: 1.05, sy: 0.8, wobble: 0.08, seed: 2, t: v * 0.7 }))
  const feLobe = useTransform(t, (v) => blob({ cx: CX + A * 0.58, cy: CY, r: 140, sx: 1.05, sy: 0.8, wobble: 0.08, seed: 6, t: v * 0.7 }))

  return (
    <section id="not-opposites" className="section notopp">
      <div className="wrap">
        <SectionHead
          n="07"
          name="Not opposites"
          title={
            <>
              Not two sides. <span className="serif notopp__it">One loop.</span>
            </>
          }
          lede="Personal conviction and collective awareness are not rivals for the same ground. Followed far enough, each line passes through the other."
        />

        <svg ref={ref} className="notopp__svg" viewBox="0 0 1000 600" role="img" aria-label="A figure-eight loop: a crimson lobe for Fi and an amber lobe for Fe, joined by one continuous line with points of colour travelling through both.">
          <defs>
            <radialGradient id="no-fi">
              <stop offset="0" stopColor={C.fi2} stopOpacity="0.55" />
              <stop offset="1" stopColor={C.fi} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="no-fe">
              <stop offset="0" stopColor={C.fe2} stopOpacity="0.75" />
              <stop offset="1" stopColor={C.fe} stopOpacity="0" />
            </radialGradient>
          </defs>
          <motion.g style={{ opacity: lobes }}>
            <motion.path d={fiLobe} fill="url(#no-fi)" style={{ mixBlendMode: 'multiply' }} />
            <motion.path d={feLobe} fill="url(#no-fe)" style={{ mixBlendMode: 'multiply' }} />
          </motion.g>
          <motion.path d={LOOP} fill="none" stroke={C.ink} strokeWidth={1.2} style={{ pathLength: draw }} />
          <motion.g style={{ opacity: lobes }}>
            {[0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4].map((o, i) => (
              <Traveller key={o} t={t} offset={o} size={i % 2 ? 4 : 6} />
            ))}
          </motion.g>
          <text x={CX - A * 0.62} y={CY + 6} textAnchor="middle" className="notopp__lobe notopp__lobe--fi">
            within
          </text>
          <text x={CX + A * 0.62} y={CY + 6} textAnchor="middle" className="notopp__lobe notopp__lobe--fe">
            between
          </text>
          <LivePath source={t} d={(v) => blob({ cx: CX, cy: CY, r: 9, wobble: 0.2, seed: 1, t: v * 2 })} fill={C.ink} />
          <line x1={CX} y1={CY + 22} x2={CX} y2={CY + 196} stroke={C.ink} strokeOpacity={0.5} />
          <text x={CX} y={CY + 222} textAnchor="middle" className="notopp__cross">
            where they inform each other
          </text>
        </svg>

        <div className="notopp__grid">
          {EXCHANGES.map((e, i) => (
            <Reveal key={e.head} className={`notopp__card notopp__card--${e.from}`} delay={(i % 2) * 0.1}>
              <span className="label">{e.from === 'fi' ? 'Fi → Fe' : 'Fe → Fi'}</span>
              <h3>{e.head}</h3>
              <p>{e.body}</p>
            </Reveal>
          ))}
        </div>

        <figure className="notopp__both">
          <Reveal as="blockquote" className="notopp__quote serif">
            “I love that you’re brave enough to do this. Can I tell you my worries over coffee this week?”
          </Reveal>
          <Reveal as="span" className="notopp__cap" delay={0.15}>
            <span className="label label--muted">Back at the dinner table</span>
            <span>
              — <span className="fi-c">true within</span>, and <span className="fe-c">resonant between</span>.
            </span>
          </Reveal>
        </figure>
      </div>
    </section>
  )
}
