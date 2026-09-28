import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { LivePath, Reveal, SectionHead, Tag, useLiveTime } from '../components/common'
import { blob, C, lerp } from '../lib/organic'
import './Difference.css'

const FI_TERMS = [
  ['Personal values', 'A private order of what is worth protecting, built from lived experience rather than consensus.'],
  ['Inner alignment', 'The felt sense of whether an act matches that order. When it doesn’t, something registers as quietly, stubbornly off.'],
  ['Authenticity', 'The aim is not to be liked but to be real — to act in a way you can stand inside afterwards.'],
]
const FE_TERMS = [
  ['Shared values', 'What a group holds in common: courtesy, fairness, care. Values that live between people, not inside one.'],
  ['Interpersonal harmony', 'Who is included, who is strained, what would restore the balance. Attention tuned to the relation itself.'],
  ['Emotional atmosphere', 'A room has a mood. Fe reads it quickly and shapes its own expression to meet it.'],
]

/* Rings begin scattered and settle onto one axis: alignment is the act of making the layers concentric */
function FiDiagram({ p }: { p: MotionValue<number> }) {
  const ref = useRef<SVGSVGElement>(null)
  const t = useLiveTime(ref, 0.5)
  const offsets: [number, number][] = [[-60, 40], [50, -30], [-30, -55], [40, 50], [0, 0]]
  return (
    <svg ref={ref} viewBox="0 0 400 480" className="diff__svg" aria-hidden="true">
      <motion.line x1={200} x2={200} y1={10} y2={470} stroke={C.fi} strokeWidth={1} style={{ pathLength: p }} />
      {[170, 136, 104, 74].map((r, i) => (
        <RingAt key={r} p={p} off={offsets[i]} r={r} i={i} t={t} />
      ))}
      <LivePath source={t} d={(v) => blob({ cx: 200, cy: 240, r: 40, wobble: 0.12, seed: 9, t: v })} fill={C.fi} />
      <motion.circle cx={200} cy={240} r={4} fill={C.paper} style={{ opacity: p }} />
    </svg>
  )
}

function RingAt({ p, off, r, i, t }: { p: MotionValue<number>; off: [number, number]; r: number; i: number; t: MotionValue<number> }) {
  const x = useTransform(p, (v) => lerp(off[0], 0, v))
  const y = useTransform(p, (v) => lerp(off[1], 0, v))
  return (
    <motion.g style={{ x, y }}>
      <LivePath
        source={t}
        d={(v) => blob({ cx: 200, cy: 240, r, wobble: 0.06, seed: i * 3 + 1, t: v, points: 10 })}
        fill="none"
        stroke={C.fi}
        strokeOpacity={0.3 + i * 0.16}
        strokeWidth={1.1}
      />
    </motion.g>
  )
}

/* People drift in from anywhere and find a common circle; the field between them warms as they do */
const FE_START: [number, number][] = [[40, 60], [360, 30], [390, 300], [220, 470], [10, 360], [300, 140], [80, 200]]
function FeDiagram({ p }: { p: MotionValue<number> }) {
  const ref = useRef<SVGSVGElement>(null)
  const t = useLiveTime(ref, 0.5)
  const n = FE_START.length
  const ring = FE_START.map((_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return [200 + Math.cos(a) * 130, 240 + Math.sin(a) * 130] as [number, number]
  })
  const field = useTransform(p, [0.3, 1], [0, 1])
  return (
    <svg ref={ref} viewBox="0 0 400 480" className="diff__svg" aria-hidden="true">
      <defs>
        <radialGradient id="diff-fe-field">
          <stop offset="0" stopColor={C.fe2} stopOpacity="0.7" />
          <stop offset="0.7" stopColor={C.fe} stopOpacity="0.18" />
          <stop offset="1" stopColor={C.fe} stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.g style={{ opacity: field }}>
        <LivePath source={t} d={(v) => blob({ cx: 200, cy: 240, r: 175, wobble: 0.08, seed: 4, t: v })} fill="url(#diff-fe-field)" />
      </motion.g>
      {ring.map((_, i) => (
        <FeNode key={i} p={p} from={FE_START[i]} to={ring[i]} next={ring[(i + 1) % n]} nextFrom={FE_START[(i + 1) % n]} i={i} t={t} />
      ))}
    </svg>
  )
}

function FeNode({ p, from, to, next, nextFrom, i, t }: { p: MotionValue<number>; from: [number, number]; to: [number, number]; next: [number, number]; nextFrom: [number, number]; i: number; t: MotionValue<number> }) {
  const x = useTransform(p, (v) => lerp(from[0], to[0], v))
  const y = useTransform(p, (v) => lerp(from[1], to[1], v))
  const nx = useTransform(p, (v) => lerp(nextFrom[0], next[0], v))
  const ny = useTransform(p, (v) => lerp(nextFrom[1], next[1], v))
  const linkOpacity = useTransform(p, [0.5, 1], [0, 0.55])
  const d = useTransform([x, y, t] as MotionValue<number>[], ([xx, yy, tt]: number[]) => blob({ cx: xx, cy: yy, r: 22 + (i % 3) * 5, wobble: 0.14, seed: i * 1.7, t: tt, points: 7 }))
  return (
    <>
      <motion.line x1={x} y1={y} x2={nx} y2={ny} stroke={C.feDeep} strokeWidth={1} style={{ opacity: linkOpacity }} />
      <motion.path d={d} fill={i % 2 ? C.fe2 : C.fe} style={{ mixBlendMode: 'multiply' }} />
    </>
  )
}

export function Difference() {
  const fiRef = useRef<HTMLDivElement>(null)
  const feRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: fiRaw } = useScroll({ target: fiRef, offset: ['start 0.95', 'center 0.55'] })
  const { scrollYProgress: feRaw } = useScroll({ target: feRef, offset: ['start 0.95', 'center 0.55'] })
  const fiP = useSpring(fiRaw, { stiffness: 60, damping: 20 })
  const feP = useSpring(feRaw, { stiffness: 60, damping: 20 })

  return (
    <section id="difference" className="section diff">
      <div className="wrap">
        <SectionHead
          n="01"
          name="The core difference"
          title={
            <>
              Same faculty. <span className="diff__shift">Different</span> reference point.
            </>
          }
          lede={
            <>
              Both are ways of <em className="serif">feeling</em> in Jung’s old sense: judging what something is worth. The difference is where the
              measuring stick is kept — inside the self, or out in the space between people.
            </>
          }
        />

        <div className="diff__grid grid">
          <div className="diff__col diff__col--fi" ref={fiRef}>
            <div className="diff__figure">
              <FiDiagram p={fiP} />
            </div>
            <div className="diff__text">
              <Tag who="fi">Introverted feeling</Tag>
              <h3 className="diff__name display">
                Inner
                <br />
                values
              </h3>
              <ol className="diff__terms">
                {FI_TERMS.map(([k, v], i) => (
                  <Reveal as="li" key={k} delay={i * 0.1}>
                    <span className="label">0{i + 1}</span>
                    <strong>{k}</strong>
                    <p>{v}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>

          <div className="diff__col diff__col--fe" ref={feRef}>
            <div className="diff__figure">
              <FeDiagram p={feP} />
            </div>
            <div className="diff__text">
              <Tag who="fe">Extraverted feeling</Tag>
              <h3 className="diff__name display">
                Shared
                <br />
                values
              </h3>
              <ol className="diff__terms">
                {FE_TERMS.map(([k, v], i) => (
                  <Reveal as="li" key={k} delay={i * 0.1}>
                    <span className="label">0{i + 1}</span>
                    <strong>{k}</strong>
                    <p>{v}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
