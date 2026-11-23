import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import { Head, RegMark, WideSpread, figurePath, useMedia, useScrollIn } from '../components/print'
import { C, range, smooth } from '../lib/organic'
import './Plates.css'

/* The collective, on plate B: people on the right half, so the individual on plate A
   lands at the network's edge when the two plates come into register */
const NODES: [number, number][] = [
  [212, 88], [282, 56], [340, 112], [252, 164], [318, 214], [206, 238], [366, 250], [184, 168],
]
const LINKS: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [2, 3], [3, 4], [4, 6], [2, 6], [3, 5], [5, 4], [0, 7], [7, 3], [7, 5],
]

const STAGES = [
  ['Two plates', 'An inner world on one sheet. A web of people on the other.'],
  ['Sliding together', 'Neither plate changes. Only the distance between them does.'],
  ['Overprint', 'Where blue meets pink a third colour appears, one neither drum can print alone.'],
  ['In register', 'A self held at the edge of a we, still itself, and not alone.'],
]

function PlateA() {
  return (
    <svg viewBox="0 0 400 300" className="plate__art" aria-hidden="true">
      <g filter="url(#ht-blue)">
        <circle cx="150" cy="150" r="140" fill="url(#soft)" />
      </g>
      {[96, 74, 54].map((r) => (
        <circle key={r} cx="150" cy="150" r={r} fill="none" stroke={C.blue} strokeWidth="2.2" />
      ))}
      <g fill={C.paper} stroke={C.blue} strokeWidth="2.5">
        <circle cx="150" cy="128" r="15" />
        <path d={figurePath(150, 128, 1.1)} />
      </g>
    </svg>
  )
}

function PlateB() {
  return (
    <svg viewBox="0 0 400 300" className="plate__art" aria-hidden="true">
      <g filter="url(#ht-pink)">
        {LINKS.map(([a, b], i) => (
          <circle key={i} cx={(NODES[a][0] + NODES[b][0]) / 2} cy={(NODES[a][1] + NODES[b][1]) / 2} r="46" fill="url(#soft-flat)" />
        ))}
      </g>
      {LINKS.map(([a, b], i) => (
        <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke={C.pink} strokeWidth="2" />
      ))}
      {NODES.map(([x, y], i) => (
        <g key={i} fill={C.pink}>
          <circle cx={x} cy={y - 8} r="7" />
          <path d={figurePath(x, y - 8, 0.5)} />
        </g>
      ))}
    </svg>
  )
}

export function Plates() {
  const track = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const narrow = useMedia('(max-width: 860px)')
  const p = useScrollIn(track, ['start start', 'end end'], false)
  const [stage, setStage] = useState(0)
  useMotionValueEvent(p, 'change', (v) => setStage(Math.min(3, Math.floor(v * 4.2))))

  // q: 0 = plates apart, 1 = in register
  const q = useTransform(p, (v) => (reduce ? 1 : smooth(range(v, 0.12, 0.78))))
  const off = useTransform(q, (v) => `${(narrow ? 58 : 56) * (1 - v)}%`)
  const neg = useTransform(q, (v) => `${-(narrow ? 58 : 56) * (1 - v)}%`)
  const tilt = useTransform(q, (v) => (1 - v) * 3)
  const tiltNeg = useTransform(q, (v) => -(1 - v) * 3)
  const note = useTransform(p, [0.55, 0.7], [0, 1])

  return (
    <WideSpread id="plates" folios={[8, 9]} label="Pages 8 and 9: the individual and the collective">
      <div className="plates__intro">
        <Head pp="8–9" title="The individual / the collective" />
        <h2 className="plates__title poster rough">Two plates, one print</h2>
        <p className="plates__lede">
          Fi is most at home in the depth of one person; Fe in the connections of many. Here each is etched on its own plate. Scroll to slide
          them together.
        </p>
      </div>

      <div className="plates__track" ref={track}>
        <div className="plates__sticky">
          <div className={`plates__stage ${narrow ? 'plates__stage--v' : ''}`}>
            <motion.div className="plate plate--a" style={narrow ? { y: neg, rotate: tiltNeg } : { x: neg, rotate: tiltNeg }}>
              <span className="plate__label caps">
                Plate A · Fi<span className="plate__more"> · Inner Blue</span>
              </span>
              <PlateA />
              <RegMark color={C.blue} style={{ position: 'absolute', left: 8, top: 8 }} />
              <RegMark color={C.blue} style={{ position: 'absolute', right: 8, bottom: 8 }} />
            </motion.div>
            <motion.div className="plate plate--b" style={narrow ? { y: off, rotate: tilt } : { x: off, rotate: tilt }}>
              <span className="plate__label plate__label--b caps">
                Plate B · Fe<span className="plate__more"> · Shared Pink</span>
              </span>
              <PlateB />
              <RegMark color={C.pink} style={{ position: 'absolute', left: 8, top: 8 }} />
              <RegMark color={C.pink} style={{ position: 'absolute', right: 8, bottom: 8 }} />
            </motion.div>
            <motion.p className="plates__note slip" style={{ opacity: note }}>
              The third colour exists only where they meet.
            </motion.p>
          </div>

          <ol className="plates__stages">
            {STAGES.map(([name, text], i) => (
              <li key={name} data-on={i === stage} data-past={i < stage}>
                <strong className="caps">{name}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </WideSpread>
  )
}
