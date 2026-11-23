import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { EASE, LivePath, useLiveTime, usePointer } from '../components/common'
import { blob, C } from '../lib/organic'
import './Hero.css'

/* The Fe constellation: people held loosely in relation */
const FE_NODES: [number, number, number][] = [
  [1040, 520, 46],
  [1190, 430, 30],
  [1262, 590, 38],
  [1118, 676, 24],
  [940, 660, 28],
  [1320, 470, 18],
  [990, 400, 20],
]
const FE_LINKS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 5], [2, 5], [2, 3], [4, 3], [0, 6], [6, 1],
]

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const t = useLiveTime(ref, 0.6)
  const p = usePointer()
  const px = useSpring(p.x, { stiffness: 40, damping: 18 })
  const py = useSpring(p.y, { stiffness: 40, damping: 18 })

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  /* Scrolling away: Fi draws further in on itself, Fe opens further out */
  const fiW = useTransform(scrollYProgress, [0, 1], [80, 62])
  const feW = useTransform(scrollYProgress, [0, 1], [112, 125])
  const fiVar = useTransform(fiW, (w) => `'wdth' ${w}`)
  const feVar = useTransform(feW, (w) => `'wdth' ${w}`)
  const fiY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80])
  const feY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120])
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160])

  /* Pointer: the inner form resists (moves against the hand), the shared form follows it */
  const fiArtX = useTransform(px, (v) => v * -14)
  const fiArtY = useTransform(py, (v) => v * -10)
  const feArtX = useTransform(px, (v) => v * 26)
  const feArtY = useTransform(py, (v) => v * 18)

  return (
    <section ref={ref} className="hero" id="top" aria-labelledby="hero-title">
      <motion.svg className="hero__art" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ y: artY }}>
        <defs>
          <radialGradient id="hero-fi-core" cx="45%" cy="40%" r="60%">
            <stop offset="0" stopColor={C.fi2} />
            <stop offset="1" stopColor={C.fiDeep} />
          </radialGradient>
          <radialGradient id="hero-fe-air" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={C.fe2} stopOpacity="0.55" />
            <stop offset="1" stopColor={C.fe2} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Fi — a dense interior: rings closing around one core */}
        <motion.g style={{ x: fiArtX, y: fiArtY }}>
          {[250, 205, 162, 122].map((r, i) => (
            <LivePath
              key={r}
              source={t}
              d={(v) => blob({ cx: 470, cy: 360, r, wobble: 0.07 + i * 0.012, seed: 3 + i, t: v * (1 + i * 0.25), points: 10 })}
              fill="none"
              stroke={C.fi}
              strokeWidth={1}
              strokeOpacity={0.25 + i * 0.14}
            />
          ))}
          <LivePath source={t} d={(v) => blob({ cx: 470, cy: 360, r: 84, wobble: 0.14, seed: 7, t: v * 1.4 })} fill="url(#hero-fi-core)" />
        </motion.g>

        {/* Fe — an atmosphere: several presences, a field between them */}
        <motion.g style={{ x: feArtX, y: feArtY }}>
          <circle cx={1120} cy={540} r={330} fill="url(#hero-fe-air)" />
          {FE_LINKS.map(([a, b], i) => (
            <line key={i} x1={FE_NODES[a][0]} y1={FE_NODES[a][1]} x2={FE_NODES[b][0]} y2={FE_NODES[b][1]} stroke={C.feDeep} strokeOpacity={0.35} strokeWidth={1} />
          ))}
          {FE_NODES.map(([x, y, r], i) => (
            <LivePath
              key={i}
              source={t}
              d={(v) => blob({ cx: x, cy: y, r, wobble: 0.12, seed: i * 2.1, t: v * 1.1, points: 7 })}
              fill={i === 0 ? C.fe : i % 2 ? C.fe2 : C.fe}
              fillOpacity={i === 0 ? 0.95 : 0.8}
              style={{ mixBlendMode: 'multiply' }}
            />
          ))}
        </motion.g>
      </motion.svg>

      <div className="hero__inner wrap">
        <motion.p
          className="hero__kicker label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          An exhibition in eight rooms <span className="hero__kicker-rule" aria-hidden="true" /> <span className="hero__kicker-more">On values, emotion &amp; relation</span>
        </motion.p>

        <h1 id="hero-title" className="hero__title">
          <span className="sr-only">Fi versus Fe</span>
          <motion.span
            aria-hidden="true"
            className="hero__word hero__word--fi"
            style={{ fontVariationSettings: fiVar, y: fiY }}
            initial={{ opacity: 0, x: reduce ? 0 : -60, letterSpacing: reduce ? '-0.06em' : '0.04em' }}
            animate={{ opacity: 1, x: 0, letterSpacing: '-0.06em' }}
            transition={{ duration: 1.6, ease: EASE }}
          >
            Fi
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="hero__vs serif"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.7 }}
          >
            vs
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="hero__word hero__word--fe"
            style={{ fontVariationSettings: feVar, y: feY }}
            initial={{ opacity: 0, x: reduce ? 0 : 60, letterSpacing: reduce ? '-0.02em' : '-0.12em' }}
            animate={{ opacity: 1, x: 0, letterSpacing: '-0.02em' }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.15 }}
          >
            Fe
          </motion.span>
        </h1>

        <motion.p
          className="hero__sub serif"
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.9 }}
        >
          Two ways of navigating <em>what matters.</em>
        </motion.p>

        <motion.dl
          className="hero__pair"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.3 }}
        >
          <div className="hero__def hero__def--fi">
            <dt>
              <span className="label">Fi</span> <span className="label label--muted">Inner values</span>
            </dt>
            <dd className="serif">“What feels true to me?”</dd>
          </div>
          <div className="hero__def hero__def--fe">
            <dt>
              <span className="label">Fe</span> <span className="label label--muted">Shared values</span>
            </dt>
            <dd className="serif">“What matters to us?”</dd>
          </div>
        </motion.dl>

        <motion.a
          href="#difference"
          className="hero__cue label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          <span>Enter</span>
          <span className="hero__cue-line" aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  )
}
