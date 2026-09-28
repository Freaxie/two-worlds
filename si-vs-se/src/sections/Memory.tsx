import { useMemo, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { RoomHead, SI_SPRING, rng } from '../components/common'
import './Memory.css'

/* One cup, drawn once, seen twice. */
const CUP = 'M120 170 L280 170 L266 318 Q264 334 248 334 L152 334 Q136 334 134 318 Z'
const HANDLE = 'M276 200 Q326 204 322 246 Q318 284 268 290'

const PAST = [
  'Grandmother’s kitchen, 1998',
  'School trip, the thermos',
  'First flat, chipped rim',
  'Hospital corridor, 2009',
  'The café by the station',
  'Sunday, the blue set',
  'Office, 07:50, every day',
  'The one that broke',
  'Hotel in Porto',
  'Mother’s hands around it',
  'Winter 2016',
  'Too hot — always too hot',
  'Friend’s balcony',
  'Every morning since',
]

function SiSide({ count }: { count: number }) {
  const layers = useMemo(() => {
    const r = rng(42)
    return PAST.map((label, i) => ({
      label,
      dx: (r() - 0.5) * 90,
      dy: (r() - 0.5) * 60,
      rot: (r() - 0.5) * 16,
      sc: 0.82 + r() * 0.3,
      shade: i % 3,
    }))
  }, [])

  return (
    <div className="mem__half mem__half--si">
      <svg viewBox="0 0 400 400" className="mem__svg" role="img" aria-label={`A cup, overlaid with ${count} remembered cups.`}>
        {layers.map((l, i) => {
          const on = i < count
          return (
            <motion.g
              key={i}
              initial={false}
              // each recalled cup drifts toward the present, but never quite lands on it
              animate={{
                x: on ? l.dx * 0.55 : l.dx * 2,
                y: on ? l.dy * 0.55 : l.dy * 2,
                rotate: on ? l.rot * 0.6 : l.rot * 1.5,
                scale: on ? 0.96 + (l.sc - 0.96) * 0.7 : l.sc,
                opacity: on ? 0.75 - (count - i) * 0.035 : 0,
              }}
              transition={SI_SPRING}
              style={{ transformOrigin: '200px 250px' }}
            >
              <path d={CUP} className={`mem__past mem__past--${l.shade}`} />
              <path d={HANDLE} className={`mem__past mem__past--${l.shade}`} />
            </motion.g>
          )
        })}
        {/* the composite: what "a cup" has come to mean */}
        <motion.path d={CUP} className="mem__composite" animate={{ opacity: Math.min(0.5, count * 0.04) }} transition={SI_SPRING} />
        <path d={CUP} className="mem__present" />
        <path d={HANDLE} className="mem__present" />
      </svg>
      <ol className="mem__list" aria-label="Recalled experiences">
        {PAST.map((p, i) => (
          <motion.li
            key={p}
            className="label"
            initial={false}
            animate={{ opacity: i < count ? 1 : 0.18, x: i < count ? 0 : -8 }}
            transition={{ duration: 1.2, ease: [0.2, 0.7, 0.1, 1] }}
          >
            <span className="mem__dot" /> {p}
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

/* Micro-detail placed around the focal point; revealed only at high magnification. */
const FX = 186
const FY = 172

function SeSide({ zoom }: { zoom: MotionValue<number> }) {
  const g = useRef<SVGGElement>(null)
  const scale = useTransform(zoom, (p) => Math.pow(48, p))
  const lvl2 = useTransform(scale, [2, 5], [0, 1])
  const lvl3 = useTransform(scale, [9, 18], [0, 1])
  const lvl1 = useTransform(scale, [4, 9], [1, 0])
  // SVG attribute transform keeps the zoom anchored exactly on the focal point
  useMotionValueEvent(scale, 'change', (s) => g.current?.setAttribute('transform', `translate(${FX} ${FY}) scale(${s}) translate(${-FX} ${-FY})`))

  const micro = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 70 }, () => ({ x: FX + (r() - 0.5) * 7, y: FY + (r() - 0.5) * 5, r: 0.02 + r() * 0.09, d: r() }))
  }, [])
  const bubbles = useMemo(() => {
    const r = rng(4)
    return Array.from({ length: 26 }, () => ({ x: FX + (r() - 0.3) * 40, y: FY + (r() - 0.5) * 9, r: 0.3 + r() * 1.2 }))
  }, [])

  return (
    <div className="mem__half mem__half--se">
      <svg viewBox="0 0 400 400" className="mem__svg" role="img" aria-label="The same cup, magnified until the surface of the coffee and its moving particles fill the view.">
        <defs>
          <clipPath id="mem-clip">
            <rect width="400" height="400" />
          </clipPath>
        </defs>
        <g clipPath="url(#mem-clip)">
          <g ref={g}>
            <motion.g style={{ opacity: lvl1 }}>
              <path d={CUP} className="mem__se-cup" />
              <path d={HANDLE} className="mem__se-cup" />
              {[170, 200, 230].map((x, i) => (
                <motion.path
                  key={x}
                  d={`M${x} 150 q -10 -20 0 -40 q 10 -20 0 -40`}
                  className="mem__steam"
                  animate={{ y: [0, -14], opacity: [0, 1, 0] }}
                  transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: 'linear' }}
                />
              ))}
            </motion.g>
            <ellipse cx="200" cy="172" rx="78" ry="14" className="mem__surface" />
            <motion.g style={{ opacity: lvl2 }}>
              {[2, 4, 6.5, 9.5, 13].map((rx, i) => (
                <motion.ellipse
                  key={rx}
                  cx={FX}
                  cy={FY}
                  rx={rx}
                  ry={rx * 0.22}
                  className="mem__ring"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.3, delay: i * 0.18, repeat: Infinity }}
                />
              ))}
              {bubbles.map((b, i) => (
                <circle key={i} cx={b.x} cy={b.y} r={b.r * 0.4} className="mem__bubble" />
              ))}
              <text x={FX + 3} y={FY - 3.2} className="mem__micro-t" style={{ fontSize: 1.1 }}>
                SURFACE 71.8 °C
              </text>
            </motion.g>
            <motion.g style={{ opacity: lvl3 }}>
              {micro.map((m, i) => (
                <motion.circle
                  key={i}
                  cx={m.x}
                  cy={m.y}
                  r={m.r}
                  className="mem__particle"
                  animate={{ x: [0, (m.d - 0.5) * 0.8, 0], y: [0, -m.d * 0.6, 0] }}
                  transition={{ duration: 0.7 + m.d, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
              <text x={FX - 3.2} y={FY + 2.3} className="mem__micro-t" style={{ fontSize: 0.34 }}>
                convection cell · 0.4 mm · rising
              </text>
              <text x={FX - 3.2} y={FY - 1.9} className="mem__micro-t" style={{ fontSize: 0.34 }}>
                aroma: bitter → sweet, 3 s
              </text>
            </motion.g>
          </g>
        </g>
        <path d={`M${FX - 16} ${FY}h32M${FX} ${FY - 16}v32`} className="mem__reticle" />
      </svg>
    </div>
  )
}

export function Memory() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const zoom = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const [count, setCount] = useState(0)
  const [mag, setMag] = useState(1)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setCount(Math.round(Math.min(1, v * 1.15) * PAST.length))
    setMag(Math.pow(48, v))
  })

  return (
    <section className="room mem" id="memory" aria-labelledby="memory-title">
      <div className="wrap">
        <RoomHead
          tone="ink"
          n="04"
          name="Memory vs presence"
          title={
            <span id="memory-title">
              More past. <em>More</em> present.
            </span>
          }
          lede="Scroll to go deeper. On the left, every earlier cup is called up and laid over this one. On the right, this cup is entered until only the present remains."
        />
      </div>
      <div className="mem__track" ref={ref}>
        <div className="mem__sticky">
          <div className="wrap mem__grid">
            <SiSide count={count} />
            <div className="mem__axis" aria-hidden="true">
              <span />
            </div>
            <SeSide zoom={zoom} />
            <div className="mem__read mem__read--si">
              <span className="label">Si · Layers recalled</span>
              <span className="mem__num">{String(count).padStart(2, '0')}</span>
              <span className="label mem__sub">Accumulation — the present is read through a composite</span>
            </div>
            <div className="mem__read mem__read--se">
              <span className="label">Se · Magnification</span>
              <span className="mem__num">×{mag < 10 ? mag.toFixed(1) : Math.round(mag)}</span>
              <span className="label mem__sub">Immersion — the present becomes richer the closer you get</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
