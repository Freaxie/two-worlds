import { useMemo, useRef } from 'react'
import { useAnimationFrame, useInView, useReducedMotion } from 'framer-motion'
import { Reveal, RoomHead, rng } from '../components/common'
import './Together.css'

const N = 48
const NOW_X = 640
const W = 1000
const H = 420
const LIFE = 14 // seconds per particle cycle
const EXP_Y = 150 // the expected path Si projects forward

/* The loop drawn live: moments arrive from the world (red), are registered at the
   line of the present, drift into the past turning green, and settle into strata.
   The strata project an expectation forward, and new moments land on it — or don't. */
function Loop() {
  const reduce = useReducedMotion()
  const wrap = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap, { margin: '10% 0px' })
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const rings = useRef<(SVGCircleElement | null)[]>([])

  const ps = useMemo(() => {
    const r = rng(33)
    return Array.from({ length: N }, (_, i) => {
      const surprise = r() < 0.18
      return {
        offset: (i / N) * LIFE,
        dev: surprise ? (r() < 0.5 ? -1 : 1) * (50 + r() * 50) : (r() - 0.5) * 16,
        surprise,
        depth: 290 + Math.floor(r() * 5) * 22 + r() * 8,
        drift: r(),
      }
    })
  }, [])

  const place = (t: number) => {
    ps.forEach((p, i) => {
      const el = dots.current[i]
      const ring = rings.current[i]
      if (!el || !ring) return
      const a = (t + p.offset) % LIFE
      let x: number, y: number, col: string, op: number, rr: number
      if (a < 3) {
        // arriving: from the edge of the field to the present
        const k = a / 3
        x = W - k * (W - NOW_X)
        y = EXP_Y + p.dev
        col = 'var(--se)'
        op = Math.min(1, k * 3)
        rr = 5
      } else if (a < 8) {
        // becoming past: pulled left and down into the archive
        const k = (a - 3) / 5
        const e = k * k * (3 - 2 * k)
        x = NOW_X - e * (NOW_X - 40 - p.drift * 360)
        y = EXP_Y + p.dev + e * (p.depth - EXP_Y - p.dev)
        col = k < 0.35 ? 'var(--se)' : 'var(--si)'
        op = 1
        rr = 5 - e * 2
      } else {
        // stored: settled, slowly compacting
        const k = (a - 8) / (LIFE - 8)
        x = 40 + p.drift * 360 - k * 20
        y = p.depth
        col = 'var(--si)'
        op = 1 - k * 0.8
        rr = 3
      }
      el.setAttribute('cx', x.toFixed(1))
      el.setAttribute('cy', y.toFixed(1))
      el.setAttribute('r', rr.toFixed(1))
      el.style.fill = col
      el.style.opacity = String(op)
      // a surprise — a moment that departs from expectation — is marked as it crosses the present
      const flag = p.surprise && a > 2.4 && a < 4.2
      ring.setAttribute('cx', x.toFixed(1))
      ring.setAttribute('cy', y.toFixed(1))
      ring.style.opacity = flag ? '1' : '0'
    })
  }

  useAnimationFrame((t) => {
    if (!inView) return
    place(reduce ? 5 : t / 1000)
  })

  return (
    <div className="tg__loop" ref={wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className="tg__svg" role="img" aria-label="Animated diagram: moments arrive from the right in red, cross the line of the present, drift left turning green and settle into layers of stored experience. From those layers, a dashed line of expectation projects forward; most new moments land on it, a few depart from it and are marked.">
        {/* strata */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="20" x2={NOW_X - 40} y1={290 + i * 22 + 10} y2={290 + i * 22 + 10} className="tg__stratum" />
        ))}
        {/* expectation, projected from experience beyond the present */}
        <path d={`M120 ${EXP_Y + 110} C 320 ${EXP_Y + 20}, 480 ${EXP_Y}, ${NOW_X} ${EXP_Y} L ${W - 20} ${EXP_Y}`} className="tg__expect" />
        <line x1={NOW_X} x2={NOW_X} y1="20" y2={H - 10} className="tg__now" />
        <text x={NOW_X + 10} y="34" className="tg__label tg__label--se">
          Now
        </text>
        <text x={W - 20} y={EXP_Y - 70} textAnchor="end" className="tg__label tg__label--se">
          Arriving · Se registers
        </text>
        <text x={W - 20} y={EXP_Y - 12} textAnchor="end" className="tg__label tg__label--si">
          Expectation · Si anticipates
        </text>
        <text x="20" y={H - 4} className="tg__label tg__label--si">
          Stored · Si keeps
        </text>
        {ps.map((_, i) => (
          <g key={i}>
            <circle ref={(el) => void (rings.current[i] = el)} r="14" className="tg__ring" style={{ opacity: 0 }} />
            <circle ref={(el) => void (dots.current[i] = el)} r="5" cx="-20" cy="-20" />
          </g>
        ))}
      </svg>
    </div>
  )
}

const CASES = [
  {
    who: 'The cook',
    se: 'tastes the sauce as it is, now, in this pan.',
    si: 'knows what it tasted like the times it was right.',
  },
  {
    who: 'The cyclist',
    se: 'feels the surface change under the front tyre.',
    si: 'remembers this corner is slick every October.',
  },
  {
    who: 'The musician',
    se: 'hears this room, this audience, this breath.',
    si: 'carries a thousand hours of the piece in the hands.',
  },
]

export function Together() {
  return (
    <section className="room tg" id="together" aria-labelledby="together-title">
      <div className="wrap">
        <RoomHead
          n="07"
          name="Not opposites"
          title={
            <span id="together-title">
              Every present becomes <em>experience.</em>
            </span>
          }
          lede="Si and Se are not rival realities but two phases of one loop. What is sensed now is stored; what is stored decides what the next moment is compared against — and which moments stand out as new."
        />
        <Loop />
        <div className="tg__cases">
          {CASES.map((c, i) => (
            <Reveal key={c.who} className="tg__case" delay={i * 0.1}>
              <p className="label">{c.who}</p>
              <p className="tg__line">
                <span className="tg__fn se">Se</span> {c.se}
              </p>
              <p className="tg__line">
                <span className="tg__fn si">Si</span> {c.si}
              </p>
            </Reveal>
          ))}
        </div>
        <Reveal className="tg__coda">
          <p>
            Experience without presence repeats. Presence without experience forgets. <em className="serif">Together, they learn.</em>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
