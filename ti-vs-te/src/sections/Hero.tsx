import { useEffect, useState } from 'react'
import { motion, type MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { EASE, Guides, Mark } from '../lib/ui'
import './Hero.css'

/* The pointer's horizontal position is the visitor's attention.
   Leaning toward one function inflates it and starves the other:
   the whole exhibition is about where analytical attention goes. */

export function Hero() {
  const reduce = useReducedMotion()
  const lean = useMotionValue(0.5)
  const s = useSpring(lean, { stiffness: 60, damping: 18, mass: 0.8 })
  const [pct, setPct] = useState(50)

  useEffect(() => {
    if (reduce) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      lean.set(Math.min(1, Math.max(0, e.clientX / window.innerWidth)))
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [lean, reduce])

  useMotionValueEvent(s, 'change', (v) => setPct(Math.round((1 - v) * 100)))

  const tiVar = useTransform(s, (v) => `'wdth' ${125 - v * 63}, 'wght' ${900 - v * 620}`)
  const teVar = useTransform(s, (v) => `'wdth' ${62 + v * 63}, 'wght' ${280 + v * 620}`)
  const ringScale = useTransform(s, [0, 1], [1.08, 0.9])
  const flowX = useTransform(s, [0, 1], [-40, 30])

  return (
    <header className="hero" id="top">
      <Guides />
      <HeroField ringScale={ringScale} flowX={flowX} />

      <div className="hero__top wrap grid">
        <motion.p
          className="hero__kicker label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          An exhibition in eight parts
        </motion.p>
        <motion.p
          className="hero__kicker hero__kicker--r label label--muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.35 }}
        >
          On two operations of analytical thought
        </motion.p>
      </div>

      <h1 className="hero__title wrap" aria-label="Ti versus Te">
        <span className="hero__mask">
          <motion.span
            className="hero__word hero__word--ti"
            style={{ fontVariationSettings: tiVar }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.1 }}
          >
            Ti
          </motion.span>
        </span>
        <motion.span
          className="hero__vs serif"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.9 }}
        >
          vs
        </motion.span>
        <span className="hero__mask">
          <motion.span
            className="hero__word hero__word--te"
            style={{ fontVariationSettings: teVar }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.25 }}
          >
            Te
          </motion.span>
        </span>
      </h1>

      <div className="hero__foot wrap grid">
        <motion.p
          className="hero__sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 1.1 }}
        >
          Two ways of making sense <span className="serif">of the world.</span>
        </motion.p>

        <motion.dl
          className="hero__defs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        >
          <div className="hero__def">
            <dt className="label ti">
              <Mark who="ti" size={11} /> Ti — Internal coherence
            </dt>
            <dd className="serif">“Does this make sense?”</dd>
          </div>
          <div className="hero__def">
            <dt className="label te">
              <Mark who="te" size={11} /> Te — External effectiveness
            </dt>
            <dd className="serif">“Does this work?”</dd>
          </div>
        </motion.dl>

        <motion.div
          className="hero__meter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
          aria-hidden="true"
        >
          <span className="label ti">{pct}%</span>
          <span className="hero__meter-track">
            <span className="hero__meter-ti" style={{ width: `${pct}%` }} />
          </span>
          <span className="label te">{100 - pct}%</span>
          <span className="hero__meter-cap label label--muted">Move the cursor — attention is finite</span>
        </motion.div>
      </div>

    </header>
  )
}

/* Background field: nested rings on the Ti side (thought closing on itself),
   parallel vectors on the Te side (thought leaving for the world). */
function HeroField({
  ringScale,
  flowX,
}: {
  ringScale: MotionValue<number>
  flowX: MotionValue<number>
}) {
  const reduce = useReducedMotion()
  const rings = [60, 120, 180, 240, 300, 360]
  const rows = Array.from({ length: 13 }, (_, i) => 150 + i * 50)
  return (
    <svg className="hero__field" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <motion.g style={{ scale: ringScale, originX: '360px', originY: '480px' }}>
        {rings.map((r, i) => (
          <motion.circle
            key={r}
            cx="360"
            cy="480"
            r={r}
            fill="none"
            stroke="var(--ti)"
            strokeWidth="1"
            strokeDasharray={i % 2 ? '2 6' : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.12 + (rings.length - i) * 0.05 }}
            transition={{ duration: 2.2, ease: EASE, delay: 0.3 + i * 0.12 }}
          />
        ))}
        <motion.circle
          cx="360"
          cy="480"
          r="4"
          fill="var(--ti)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2 }}
        />
      </motion.g>

      <motion.g style={{ x: flowX }}>
        {rows.map((y, i) => (
            <motion.line
              key={y}
              x1="900"
              x2="1440"
              y1={y}
              y2={y}
              stroke="var(--te)"
              strokeWidth="1"
              strokeDasharray="36 14"
              initial={{ opacity: 0 }}
              animate={
                reduce ? { opacity: 0.35 } : { opacity: 0.35, strokeDashoffset: [0, -100] }
              }
              transition={{
                opacity: { duration: 1, delay: 0.5 + i * 0.05 },
                strokeDashoffset: { duration: 2.4 + (i % 3) * 0.4, repeat: Infinity, ease: 'linear' },
              }}
            />
        ))}
      </motion.g>
    </svg>
  )
}
