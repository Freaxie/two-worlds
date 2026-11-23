import { useRef, useState } from 'react'
import { motion, useInView, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { Head, Spread, useScrollIn } from '../components/print'
import './Stamps.css'

/* A stamp lands fast and stops dead */
const THUMP = { duration: 0.2, ease: [0.55, 0, 0.9, 0.3] as const }

function FiStamp() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '0px 0px -25% 0px' })
  return (
    <div ref={ref} className="stamps__pad">
      <motion.div
        className="stamp stamp--blue rough"
        initial={false}
        animate={inView || reduce ? { opacity: 1, scale: 1, rotate: -4 } : { opacity: 0, scale: 1.7, rotate: -12 }}
        transition={reduce ? { duration: 0 } : THUMP}
      >
        <span className="stamp__line stamp__wide">Is this</span>
        <span className="stamp__line stamp__wide">true to</span>
        <span className="stamp__line">what</span>
        <span className="stamp__i">I</span>
        <span className="stamp__line">value?</span>
      </motion.div>
    </div>
  )
}

/* The Fe question is stamped again and again: one impression for every person involved */
const IMPRESSIONS = [
  { x: 0, y: 2, r: -8, o: 0.22 },
  { x: 40, y: 0, r: 6, o: 0.28 },
  { x: 8, y: 52, r: 7, o: 0.25 },
  { x: 44, y: 40, r: -5, o: 0.3 },
  { x: 30, y: 66, r: -3, o: 0.24 },
  { x: 52, y: 70, r: 4, o: 0.2 },
  { x: 16, y: 22, r: -2, o: 1 },
]

function FeStamps() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const p = useScrollIn(ref, ['start 0.85', 'end 0.55'], false)
  const [count, setCount] = useState(reduce ? IMPRESSIONS.length : 0)
  useMotionValueEvent(p, 'change', (v) => {
    if (!reduce) setCount((c) => Math.max(c, Math.ceil(v * IMPRESSIONS.length)))
  })
  return (
    <div ref={ref} className="stamps__field" aria-hidden="true">
      {IMPRESSIONS.map((m, i) => (
        <motion.div
          key={i}
          className={`stamp stamp--pink rough ${i === IMPRESSIONS.length - 1 ? 'stamp--top' : ''}`}
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          initial={false}
          animate={i < count ? { opacity: m.o, scale: 1, rotate: m.r } : { opacity: 0, scale: 1.6, rotate: m.r * 2 }}
          transition={reduce ? { duration: 0 } : THUMP}
        >
          <span className="stamp__line">What does this</span>
          <span className="stamp__line">mean for</span>
          <span className="stamp__line stamp__every">everyone</span>
          <span className="stamp__line">involved?</span>
        </motion.div>
      ))}
    </div>
  )
}

export function Stamps() {
  return (
    <Spread
      id="stamps"
      label="Pages 6 and 7: two questions"
      folios={[6, 7]}
      left={
        <>
          <Head pp="6–7" title="Two questions" />
          <p className="stamps__kicker type">
            <span className="mark mark--blue">Fi</span> asks inward
          </p>
          <h2 className="sr-only">Fi asks: Is this true to what I value?</h2>
          <FiStamp />
          <p className="stamps__gloss">
            <strong>One stamp. One witness.</strong> Its answer can be certain even when no one else sees it.
          </p>
        </>
      }
      right={
        <>
          <p className="stamps__kicker type stamps__kicker--fe">
            <span className="mark mark--pink">Fe</span> asks outward
          </p>
          <h2 className="sr-only">Fe asks: What does this mean for everyone involved?</h2>
          <FeStamps />
          <p className="stamps__gloss">
            <strong>Many stamps. Many witnesses.</strong> Its answer is only real if it can be lived together.
          </p>
        </>
      }
    />
  )
}
