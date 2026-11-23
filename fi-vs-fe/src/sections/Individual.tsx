import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { LivePath, SectionHead, useLiveTime } from '../components/common'
import { blob, C, lerp, mix, range, smooth } from '../lib/organic'
import './Individual.css'

/* The collective, relative to its own centre */
const NODES: [number, number, number][] = [
  [0, 0, 26], [-120, -110, 18], [-150, 40, 20], [-90, 160, 16], [40, 190, 22], [150, 120, 18],
  [190, -20, 24], [120, -150, 16], [10, -210, 14], [-230, -60, 12], [260, 90, 13], [-40, 90, 15],
  [80, 60, 12], [-60, -40, 14], [230, -140, 11], [-200, 140, 10],
]
const LINKS: [number, number][] = [
  [0, 1], [0, 2], [0, 11], [0, 12], [0, 13], [0, 6], [1, 13], [1, 8], [1, 9], [2, 9], [2, 3], [2, 15],
  [3, 11], [3, 4], [4, 12], [4, 5], [5, 10], [5, 6], [6, 7], [6, 10], [7, 8], [7, 14], [6, 14], [12, 5], [11, 2], [13, 2],
]
/* The nodes nearest the individual — the ones that make contact */
const CONTACT = [9, 2, 15, 1]

const STAGES = [
  ['Apart', 'An inner world, dense and self-contained. A web of people, busy with each other.'],
  ['Contact', 'They drift within reach. The first threads cross the gap.'],
  ['Exchange', 'Conviction flows out into the group; the group’s warmth flows in. Each is tinted by the other.'],
  ['Held', 'A self that belongs to a “we” without dissolving into it — and a “we” that has room for a self.'],
]

const IND_Y = 400
const NET_Y = 400

export function Individual() {
  const track = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const t = useLiveTime(svgRef, 0.7)
  const { scrollYProgress: p } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const [stage, setStage] = useState(0)
  useMotionValueEvent(p, 'change', (v) => setStage(Math.min(3, Math.floor(v * 4.2))))

  /* Where the two forms sit as the viewer scrolls */
  const approach = useTransform(p, (v) => smooth(range(v, 0.18, 0.5)))
  const indX = useTransform(approach, (a) => lerp(320, 480, a))
  const netX = useTransform(approach, (a) => lerp(1090, 1000, a))
  const exchange = useTransform(p, (v) => range(v, 0.5, 0.72))
  const held = useTransform(p, (v) => smooth(range(v, 0.74, 0.95)))

  /* The individual's rings: closed tight when alone, opening a little when met */
  const openness = useTransform(p, (v) => 0.6 + 0.4 * range(v, 0.2, 0.6))

  return (
    <section id="individual" className="indiv" aria-labelledby="indiv-title">
      <div className="wrap">
        <SectionHead
          n="04"
          name="The individual / the collective"
          title={<span id="indiv-title">An inner world meets a web of people.</span>}
          lede="Fi is most at home in the depth of one; Fe in the connections of many. Watch what happens when they come close."
        />
      </div>

      <div className="indiv__track" ref={track}>
        <div className="indiv__sticky">
          <svg ref={svgRef} className="indiv__svg" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A layered crimson form, the individual, and an amber network of people drift together, exchange colour along threads, and settle with the individual held at the edge of the network.">
            <defs>
              <radialGradient id="indiv-core" cx="45%" cy="40%">
                <stop offset="0" stopColor={C.fi2} />
                <stop offset="1" stopColor={C.fiDeep} />
              </radialGradient>
              <radialGradient id="indiv-air">
                <stop offset="0" stopColor={C.fe2} stopOpacity="0.4" />
                <stop offset="1" stopColor={C.fe2} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* The collective: an atmosphere, then threads, then people */}
            <motion.g style={{ x: netX, y: NET_Y }}>
              <circle r={330} fill="url(#indiv-air)" />
              {LINKS.map(([a, b], i) => (
                <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke={C.feDeep} strokeOpacity={0.4} strokeWidth={1} />
              ))}
            </motion.g>

            {/* Contact threads — computed in world space, since both ends move */}
            {CONTACT.map((ni, k) => (
              <Thread key={ni} ni={ni} k={k} indX={indX} netX={netX} p={p} t={t} exchange={exchange} />
            ))}

            <motion.g style={{ x: netX, y: NET_Y }}>
              {NODES.map(([x, y, r], i) => (
                <NetNode key={i} x={x} y={y} r={r} i={i} t={t} exchange={exchange} contact={CONTACT.includes(i)} />
              ))}
            </motion.g>

            {/* The individual: many layers, one centre */}
            <motion.g style={{ x: indX, y: IND_Y }}>
              {[190, 160, 132, 106, 82].map((r, i) => (
                <IndRing key={r} r={r} i={i} t={t} openness={openness} exchange={exchange} />
              ))}
              <LivePath source={t} d={(v) => blob({ cx: 0, cy: 0, r: 58, wobble: 0.12, seed: 2, t: v })} fill="url(#indiv-core)" />
            </motion.g>

            {/* Held: a faint shared boundary drawn around both */}
            <motion.g style={{ opacity: held }}>
              <LivePath
                source={t}
                d={(v) => blob({ cx: 775, cy: 400, r: 440, sx: 1.25, sy: 0.82, wobble: 0.05, seed: 8, t: v * 0.5, points: 12 })}
                fill="none"
                stroke={C.ink}
                strokeOpacity={0.35}
                strokeDasharray="1 7"
                strokeWidth={1.2}
              />
            </motion.g>
          </svg>

          <div className="wrap indiv__legend">
            <ol className="indiv__stages">
              {STAGES.map(([name, text], i) => (
                <li key={name} data-on={i === stage} data-past={i < stage}>
                  <span className="label">0{i + 1}</span>
                  <strong>{name}</strong>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function IndRing({ r, i, t, openness, exchange }: { r: number; i: number; t: MotionValue<number>; openness: MotionValue<number>; exchange: MotionValue<number> }) {
  const d = useTransform([t, openness] as MotionValue<number>[], ([tt, o]: number[]) => blob({ cx: 0, cy: 0, r: r * o + (1 - o) * 60, wobble: 0.07, seed: i * 2 + 1, t: tt * (1 + i * 0.2), points: 10 }))
  // The outermost rings pick up the group's warmth during the exchange
  const stroke = useTransform(exchange, (e) => mix(C.fi, C.fe, i < 2 ? e * (i === 0 ? 0.85 : 0.5) : 0))
  return <motion.path d={d} fill="none" stroke={stroke} strokeOpacity={0.35 + i * 0.14} strokeWidth={1.2} />
}

function NetNode({ x, y, r, i, t, exchange, contact }: { x: number; y: number; r: number; i: number; t: MotionValue<number>; exchange: MotionValue<number>; contact: boolean }) {
  const d = useTransform(t, (tt) => blob({ cx: x + Math.sin(tt * 0.8 + i) * 5, cy: y + Math.cos(tt * 0.7 + i * 1.3) * 5, r, wobble: 0.14, seed: i * 1.3, t: tt, points: 7 }))
  // Nodes that touched the individual keep a trace of crimson
  const fill = useTransform(exchange, (e) => mix(i % 3 ? C.fe2 : C.fe, C.fi2, contact ? e * 0.75 : 0))
  return <motion.path d={d} fill={fill} fillOpacity={0.9} style={{ mixBlendMode: 'multiply' }} />
}

type ThreadProps = {
  ni: number
  k: number
  indX: MotionValue<number>
  netX: MotionValue<number>
  p: MotionValue<number>
  t: MotionValue<number>
  exchange: MotionValue<number>
}

function Thread({ ni, k, indX, netX, p, t, exchange }: ThreadProps) {
  const [nx, ny, nr] = NODES[ni]
  const draw = useTransform(p, (v) => range(v, 0.3 + k * 0.03, 0.5 + k * 0.03))
  const d = useTransform([indX, netX] as MotionValue<number>[], ([ix, cx]: number[]) => {
    const x2 = cx + nx - nr
    const y2 = NET_Y + ny
    const x1 = ix + 150
    const y1 = IND_Y + (ny * 0.4)
    return `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`
  })
  // Two travellers per thread: crimson going out, amber coming in
  const [ox, oy] = useTraveller(indX, netX, t, ni, 1, k * 0.23)
  const [ix, iy] = useTraveller(indX, netX, t, ni, -1, k * 0.23 + 0.5)
  const travel = useTransform(exchange, (e) => (e > 0 && e < 1 ? 1 : e >= 1 ? 0.5 : 0))

  return (
    <>
      <motion.path d={d} fill="none" stroke={C.ink} strokeOpacity={0.55} strokeWidth={1} style={{ pathLength: draw }} />
      <motion.circle r={4.5} cx={ox} cy={oy} fill={C.fi} style={{ opacity: travel }} />
      <motion.circle r={4.5} cx={ix} cy={iy} fill={C.fe} style={{ opacity: travel }} />
    </>
  )
}

/* A point riding the contact thread between the individual and node `ni` */
function useTraveller(indX: MotionValue<number>, netX: MotionValue<number>, t: MotionValue<number>, ni: number, dir: 1 | -1, offset: number) {
  const [nx, ny, nr] = NODES[ni]
  const pos = useTransform([indX, netX, t] as MotionValue<number>[], ([ix, cx, tt]: number[]) => {
    let f = (tt * 0.35 + offset) % 1
    if (dir < 0) f = 1 - f
    const x1 = ix + 150
    const y1 = IND_Y + ny * 0.4
    const x2 = cx + nx - nr
    const y2 = NET_Y + ny
    const mx = (x1 + x2) / 2
    const u = 1 - f
    const x = u * u * u * x1 + 3 * u * u * f * mx + 3 * u * f * f * mx + f * f * f * x2
    const y = u * u * u * y1 + 3 * u * u * f * y1 + 3 * u * f * f * y2 + f * f * f * y2
    return [x, y]
  })
  return [useTransform(pos, (v) => v[0]), useTransform(pos, (v) => v[1])] as const
}
