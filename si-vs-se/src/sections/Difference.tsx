import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EASE, Reveal, RoomHead, Tag } from '../components/common'
import './Difference.css'

type Kind = 'strata' | 'match' | 'baseline' | 'burst' | 'field' | 'contact'

const SI_TERMS: { k: Kind; t: string; d: string }[] = [
  { k: 'strata', t: 'Stored experience', d: 'Sensation is kept. Each impression is filed with its texture, its temperature, the feeling it left behind.' },
  { k: 'match', t: 'Familiarity', d: 'The new is read against the known. Recognition arrives before analysis does.' },
  { k: 'baseline', t: 'Internal sensory reference', d: 'A private baseline of how things should feel: the right firmness of bread, the usual weight of a key in the hand.' },
]

const SE_TERMS: { k: Kind; t: string; d: string }[] = [
  { k: 'burst', t: 'Immediate perception', d: 'Sensation is met at full volume, as it happens, before any precedent can soften it.' },
  { k: 'field', t: 'Present environment', d: 'Attention spreads across the whole field: the movement at the edge, the change in the light, the shift in the room.' },
  { k: 'contact', t: 'Direct engagement', d: 'The fastest route to knowing is to touch, move, try: act on the world and read what comes back.' },
]

const draw = (delay: number, dur = 1.4) => ({
  initial: { pathLength: 0, opacity: 0 },
  whileInView: { pathLength: 1, opacity: 1 },
  viewport: { once: true, margin: '-10%' },
  transition: { pathLength: { duration: dur, ease: EASE, delay }, opacity: { duration: 0.01, delay } },
})

/* Small diagrams — each shows the mechanism the term names. */
function Glyph({ k }: { k: Kind }) {
  const common = { viewBox: '0 0 80 80', className: `glyph glyph--${k}`, 'aria-hidden': true } as const
  switch (k) {
    case 'strata': // layers deposit one after another, oldest at the bottom
      return (
        <svg {...common}>
          {Array.from({ length: 7 }, (_, i) => (
            <motion.path
              key={i}
              d={`M8 ${70 - i * 8} C 26 ${66 - i * 8 - (i % 2) * 4}, 50 ${74 - i * 8}, 72 ${68 - i * 8}`}
              strokeOpacity={0.25 + i * 0.1}
              {...draw(i * 0.18, 1)}
            />
          ))}
        </svg>
      )
    case 'match': // the present outline slides onto the remembered one
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="22" strokeDasharray="2 3" />
          <motion.circle
            cx="40"
            cy="40"
            r="22"
            initial={{ x: -18, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.4, ease: EASE, delay: 0.3 }}
            strokeWidth={2}
          />
        </svg>
      )
    case 'baseline': // a body with an inner reference that the outer signal is compared to
      return (
        <svg {...common}>
          <motion.path d="M6 40 Q 20 22, 40 40 T 74 40" {...draw(0.1)} />
          <line x1="6" x2="74" y1="40" y2="40" strokeDasharray="1 3" />
          <motion.circle cx="40" cy="40" r="3" fill="currentColor" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }} />
        </svg>
      )
    case 'burst': // everything arrives at once
      return (
        <svg {...common}>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2
            return (
              <motion.line
                key={i}
                x1={40 + Math.cos(a) * 6}
                y1={40 + Math.sin(a) * 6}
                x2={40 + Math.cos(a) * (i % 2 ? 26 : 34)}
                y2={40 + Math.sin(a) * (i % 2 ? 26 : 34)}
                {...draw(0.05, 0.25)}
              />
            )
          })}
          <circle cx="40" cy="40" r="3" fill="currentColor" />
        </svg>
      )
    case 'field': // attention spread over the whole surrounding field, flickering where change happens
      return (
        <svg {...common}>
          {Array.from({ length: 49 }, (_, i) => {
            const x = 10 + (i % 7) * 10
            const y = 10 + Math.floor(i / 7) * 10
            const hot = [9, 22, 33, 40].includes(i)
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={hot ? 2.6 : 1.1}
                fill="currentColor"
                stroke="none"
                animate={hot ? { opacity: [1, 0.2, 1] } : undefined}
                transition={hot ? { duration: 0.6 + (i % 3) * 0.3, repeat: Infinity, ease: 'linear' } : undefined}
              />
            )
          })}
        </svg>
      )
    case 'contact': // a gesture meets a surface; the surface answers
      return (
        <svg {...common}>
          <line x1="6" x2="74" y1="56" y2="56" />
          <motion.path d="M40 8 L40 52" {...draw(0, 0.35)} />
          <motion.path d="M34 46 L40 52 L46 46" {...draw(0.3, 0.2)} />
          {[8, 16, 24].map((r, i) => (
            <motion.ellipse
              key={r}
              cx="40"
              cy="56"
              rx={r}
              ry={r / 4}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: [0, 1, 0], scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 1.4, delay: 0.5 + i * 0.12, repeat: Infinity, repeatDelay: 1 }}
            />
          ))}
        </svg>
      )
  }
}

/* Central diagram: one sensing body, two directions of attention. */
function Directions() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'center 45%'] })
  const inward = useTransform(scrollYProgress, [0, 1], [0, 1])
  const outward = useTransform(scrollYProgress, [0.2, 1], [0, 1])

  // Spiral archive: the inward path winds into storage.
  const spiral = Array.from({ length: 160 }, (_, i) => {
    const t = i / 159
    const a = t * Math.PI * 7
    const r = 70 * (1 - t) + 4
    return `${i ? 'L' : 'M'}${(250 + Math.cos(a) * r).toFixed(1)} ${(160 + Math.sin(a) * r).toFixed(1)}`
  }).join(' ')

  return (
    <div className="dir" ref={ref}>
      <svg viewBox="0 0 1000 320" className="dir__svg" role="img" aria-label="Diagram: Si draws sensation inward into a spiral of stored experience; Se radiates attention outward into the surrounding environment.">
        {/* incoming impressions converge on the Si spiral */}
        {[-110, -60, 0, 60, 110].map((dy, i) => (
          <motion.path
            key={dy}
            d={`M500 160 C 440 ${160 + dy}, 380 ${160 + dy * 1.1}, 326 160`}
            className="dir__si"
            style={{ pathLength: inward, opacity: 0.35 + i * 0.1 }}
          />
        ))}
        <motion.path d={spiral} className="dir__si dir__si--spiral" style={{ pathLength: inward }} />
        {/* outward: rays to the world, ending in sharp points of contact */}
        {Array.from({ length: 11 }, (_, i) => {
          const a = ((i - 5) / 5) * 0.8
          const L = 250 + (i % 3) * 60
          const x2 = 500 + Math.cos(a) * L
          const y2 = 160 + Math.sin(a) * L * 0.55
          return (
            <g key={i}>
              <motion.line x1="500" y1="160" x2={x2} y2={y2} className="dir__se" style={{ pathLength: outward }} />
              <motion.circle cx={x2} cy={y2} r="4" className="dir__se-dot" style={{ opacity: outward }} />
            </g>
          )
        })}
        <line x1="500" x2="500" y1="20" y2="300" className="dir__body" />
        <circle cx="500" cy="160" r="7" className="dir__node" />
        <text x="500" y="14" textAnchor="middle" className="dir__label">
          The sensing body
        </text>
        <text x="250" y="300" textAnchor="middle" className="dir__label dir__label--si">
          Inward — into stored experience
        </text>
        <text x="770" y="300" textAnchor="middle" className="dir__label dir__label--se">
          Outward — into the present field
        </text>
      </svg>
    </div>
  )
}

function Terms({ f, items }: { f: 'si' | 'se'; items: typeof SI_TERMS }) {
  return (
    <div className={`terms terms--${f}`}>
      <Reveal>
        <p className={`terms__big ${f}`}>{f === 'si' ? 'Si' : 'Se'}</p>
        <Tag f={f}>{f === 'si' ? 'Introverted sensing' : 'Extraverted sensing'}</Tag>
      </Reveal>
      <ol className="terms__list">
        {items.map((it, i) => (
          <Reveal as="li" key={it.t} delay={f === 'si' ? i * 0.2 : i * 0.05} className="terms__item">
            <Glyph k={it.k} />
            <div>
              <h3 className="terms__t">
                <span className="label muted">0{i + 1}</span> {it.t}
              </h3>
              <p className="terms__d">{it.d}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  )
}

export function Difference() {
  return (
    <section className="room" id="difference" aria-labelledby="difference-title">
      <div className="wrap">
        <RoomHead
          n="01"
          name="Core difference"
          title={
            <span id="difference-title">
              Both sense. They <em>keep</em> different things.
            </span>
          }
          lede="Si and Se are both perceiving functions: both take in the concrete, physical world. What differs is where the sensation is anchored — in the archive of what has been lived, or in the raw field of what is here."
        />
        <Directions />
        <div className="diff grid">
          <Terms f="si" items={SI_TERMS} />
          <Terms f="se" items={SE_TERMS} />
        </div>
      </div>
    </section>
  )
}
