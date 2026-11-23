import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { LivePath, Reveal, useLiveTime } from '../components/common'
import { blob, C } from '../lib/organic'
import './Coda.css'

/* An inward spiral: attention gathering towards a centre */
const SPIRAL = (() => {
  let d = ''
  for (let i = 0; i <= 300; i++) {
    const k = i / 300
    const a = k * Math.PI * 2 * 4.5
    const r = 230 * (1 - k)
    d += (i ? 'L' : 'M') + (330 + Math.cos(a) * r).toFixed(1) + ',' + (380 + Math.sin(a) * r).toFixed(1)
  }
  return d
})()

/* Ripples: feeling travelling outward from between two people */
function Ripple({ t, i }: { t: MotionValue<number>; i: number }) {
  const phase = useTransform(t, (v) => ((v * 0.12 + i / 5) % 1))
  const d = useTransform([t, phase] as MotionValue<number>[], ([tt, ph]: number[]) => blob({ cx: 1110, cy: 380, r: 30 + ph * 330, wobble: 0.05, seed: i, t: tt * 0.6, points: 10 }))
  const opacity = useTransform(phase, (ph) => (1 - ph) * 0.8)
  return <motion.path d={d} fill="none" stroke={C.fe} strokeWidth={1.4} style={{ opacity }} />
}

export function Coda() {
  const ref = useRef<HTMLElement>(null)
  const t = useLiveTime(ref, 1)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const draw = useTransform(scrollYProgress, [0.1, 0.7], [0, 1])
  const within = useTransform(scrollYProgress, [0.2, 0.8], [110, 62])
  const between = useTransform(scrollYProgress, [0.2, 0.8], [-0.04, 0.12])
  const withinVar = useTransform(within, (w) => `'wdth' ${w}`)
  const betweenLs = useTransform(between, (v) => `${v}em`)

  return (
    <section ref={ref} id="coda" className="coda" aria-label="Coda">
      <svg className="coda__art" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <motion.path d={SPIRAL} fill="none" stroke={C.fi} strokeWidth={1.2} style={{ pathLength: draw }} />
        <LivePath source={t} d={(v) => blob({ cx: 330, cy: 380, r: 22, wobble: 0.15, seed: 3, t: v })} fill={C.fi} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Ripple key={i} t={t} i={i} />
        ))}
        <LivePath source={t} d={(v) => blob({ cx: 1090, cy: 380, r: 18, wobble: 0.15, seed: 5, t: v })} fill={C.fe} style={{ mixBlendMode: 'multiply' }} />
        <LivePath source={t} d={(v) => blob({ cx: 1130, cy: 380, r: 18, wobble: 0.15, seed: 8, t: v })} fill={C.fe2} style={{ mixBlendMode: 'multiply' }} />
      </svg>

      <div className="wrap coda__inner">
        <span className="label label--muted coda__n">08 — Coda</span>
        <p className="coda__line coda__line--fi display">
          <Reveal as="span" className="coda__lead">One asks what is true</Reveal>{' '}
          <motion.span className="coda__key coda__key--fi" style={{ fontVariationSettings: withinVar }}>
            within.
          </motion.span>
        </p>
        <p className="coda__line coda__line--fe display">
          <Reveal as="span" className="coda__lead" delay={0.1}>The other asks what resonates</Reveal>{' '}
          <motion.span className="coda__key coda__key--fe serif" style={{ letterSpacing: betweenLs }}>
            between us.
          </motion.span>
        </p>
      </div>

      <footer className="wrap coda__foot">
        <p className="coda__note">
          <span className="label">Colophon</span>
          Fi and Fe — introverted and extraverted feeling — come from C. G. Jung’s account of how people weigh what matters. Here they are treated not
          as boxes to sort people into, but as two directions any of us can look. This is an essay in forms, not a test.
        </p>
        <a className="coda__top label" href="#top">
          Return to the beginning ↑
        </a>
      </footer>
    </section>
  )
}
