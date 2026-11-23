import { useRef } from 'react'
import { motion, useReducedMotion, useTransform } from 'framer-motion'
import { ColorBars, Crops, RegMark, useScrollIn } from '../components/print'
import './BackCover.css'

/* The last page brings the two lines into register: the blue line slides in from the left,
   the pink from the right, and where their letters cross they overprint. */
export function BackCover() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const p = useScrollIn(ref, ['start 0.95', 'center 0.55'])
  const inX = useTransform(p, (v) => (reduce ? '0%' : `${-14 * (1 - v)}%`))
  const outX = useTransform(p, (v) => (reduce ? '0%' : `${14 * (1 - v)}%`))

  return (
    <section id="back" className="back" aria-label="Page 16: back cover">
      <div className="back__sheet sheet">
        <Crops />
        <div className="back__top">
          <span className="caps">p. 16</span>
          <ColorBars />
        </div>

        <div ref={ref} className="back__lines">
          <motion.p className="back__line back__line--fi poster rough" style={{ x: inX }}>
            One asks what is true <span className="back__key">within.</span>
          </motion.p>
          <motion.p className="back__line back__line--fe poster rough" style={{ x: outX }}>
            The other asks what resonates <span className="back__key">between us.</span>
          </motion.p>
        </div>

        <div className="back__foot">
          <div className="back__colophon">
            <p className="caps">Colophon</p>
            <p>
              Printed in two inks, Inner Blue for Fi and Shared Pink for Fe, with black for the facts. Sixteen pages, folded and stapled.
            </p>
            <p>
              Fi and Fe, introverted and extraverted feeling, come from C. G. Jung’s account of how people weigh what matters. They are treated
              here as two directions any of us can look, not boxes to sort people into. An essay in ink, not a test.
            </p>
          </div>
          <div className="back__end">
            <div className="back__cut type" aria-hidden="true">
              <span>✂</span>
              <span className="back__dash" />
            </div>
            <a className="back__top-link caps" href="#cover">
              Back to the cover ↑
            </a>
          </div>
        </div>

        <div className="back__reg">
          <RegMark />
        </div>
      </div>
    </section>
  )
}
