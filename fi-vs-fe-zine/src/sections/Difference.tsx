import { useRef } from 'react'
import { motion, useTransform } from 'framer-motion'
import { Figure, Head, Reveal, Spread, useScrollIn } from '../components/print'
import { C } from '../lib/organic'
import { FE_TERMS, FI_TERMS } from '../lib/content'
import './Difference.css'

/* Fi: the ink pools in one chest. Density is highest at the centre of a single person. */
function FiPlate() {
  const ref = useRef<SVGSVGElement>(null)
  const p = useScrollIn(ref)
  const r = useTransform(p, [0, 1], [20, 190])
  return (
    <svg ref={ref} viewBox="0 0 400 400" className="diff__plate" role="img" aria-label="One figure, with blue ink densest at the centre of their chest and thinning outward.">
      <g filter="url(#ht-blue)">
        <motion.circle cx="200" cy="262" r={r} fill="url(#soft)" />
      </g>
      <Figure x={200} y={196} s={2.2} fill="none" stroke={C.ink} strokeWidth={3} />
      <motion.circle cx="200" cy="262" r="9" fill={C.blue} style={{ scale: p }} />
    </svg>
  )
}

/* Fe: the ink gathers between people. Density is highest in the spaces where they meet. */
const RING: [number, number][] = [
  [200, 80],
  [330, 170],
  [290, 320],
  [110, 320],
  [70, 170],
]
function FePlate() {
  const ref = useRef<SVGSVGElement>(null)
  const p = useScrollIn(ref)
  const r = useTransform(p, [0, 1], [10, 96])
  const rc = useTransform(p, [0, 1], [10, 120])
  return (
    <svg ref={ref} viewBox="0 0 400 400" className="diff__plate" role="img" aria-label="Five figures in a loose circle, with pink ink densest in the spaces between them.">
      <g filter="url(#ht-pink)">
        {RING.map(([x, y], i) => {
          const [nx, ny] = RING[(i + 1) % RING.length]
          return <motion.circle key={i} cx={(x + nx) / 2} cy={(y + ny) / 2 + 20} r={r} fill="url(#soft-flat)" />
        })}
        <motion.circle cx="200" cy="220" r={rc} fill="url(#soft-flat)" />
      </g>
      {RING.map(([x, y], i) => (
        <Figure key={i} x={x} y={y} s={0.95} fill={C.ink} />
      ))}
    </svg>
  )
}

function Glossary({ terms, ink }: { terms: [string, string, string][]; ink: 'blue' | 'pink' }) {
  return (
    <dl className="gloss">
      {terms.map(([k, pos, v], i) => (
        <Reveal key={k} delay={i * 0.08} className="gloss__item">
          <dt>
            <span className={`gloss__term mark mark--${ink}`}>{k}</span> <i className="gloss__pos">{pos}</i>
          </dt>
          <dd>{v}</dd>
        </Reveal>
      ))}
    </dl>
  )
}

export function Difference() {
  return (
    <Spread
      id="difference"
      label="Pages 2 and 3: the core difference"
      folios={[2, 3]}
      left={
        <>
          <Head pp="2–3" title="Same feeling, different compass" />
          <p className="diff__lede">
            Both are ways of <em>feeling</em> in Jung’s sense: weighing what something is worth. The difference is where the measuring stick
            is kept. Inside one person, or out in the space between people.
          </p>
          <h2 className="diff__title poster rough ink-blue">
            Inner
            <br />
            values
          </h2>
          <p className="type diff__kind">Fi · introverted feeling · printed in Inner Blue</p>
          <FiPlate />
          <Glossary terms={FI_TERMS} ink="blue" />
        </>
      }
      right={
        <>
          <div className="diff__spacer" aria-hidden="true" />
          <h2 className="diff__title poster rough ink-pink">
            Shared
            <br />
            values
          </h2>
          <p className="type diff__kind">Fe · extraverted feeling · printed in Shared Pink</p>
          <FePlate />
          <Glossary terms={FE_TERMS} ink="pink" />
        </>
      }
    />
  )
}
