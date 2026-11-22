import { useRef } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { EASE, Mark } from '../lib/ui'
import { Ridge, type RidgeSignal } from '../lib/fx'
import './Final.css'

export function Final() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  /* The old question is struck out; the better one is underlined in both colours. */
  const strike = useTransform(scrollYProgress, [0.35, 0.55], [0, 1])
  const fade = useTransform(scrollYProgress, [0.4, 0.6], [1, 0.35])
  const under = useTransform(scrollYProgress, [0.6, 0.85], [0, 1])
  /* The field behind the coda settles as you read to the end of it */
  const signal = useRef<RidgeSignal>({ stress: 0.6, focus: 0.62 })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    signal.current.stress = 0.6 * Math.max(0, 1 - v * 1.15)
  })

  return (
    <section ref={ref} id="final" className="part final" aria-labelledby="final-title">
      <Ridge signal={signal} ground="ink" rows={26} split={0.5} className="final__ridge" />
      <div className="wrap final__wrap">
        <p className="label final__eyebrow">Part 08 — Coda</p>
        <h2 id="final-title" className="final__text display">
          <motion.span className="final__old" style={{ opacity: fade }}>
            The interesting question isn’t{' '}
            <span className="final__struck">
              how anxious you are.
              <motion.span className="final__strike" style={{ scaleX: strike }} aria-hidden="true" />
            </span>
          </motion.span>
          <span className="final__new">
            It’s what your alarm{' '}
            <span className="final__opt">
              is calibrated to.
              <motion.span className="final__under final__under--tu" style={{ scaleX: under }} aria-hidden="true" />
              <motion.span className="final__under final__under--as" style={{ scaleX: under }} aria-hidden="true" />
            </span>
          </span>
        </h2>

        <motion.div
          className="final__pair"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        >
          <p>
            <Mark who="tu" size={14} />
            <span>
              <b className="final__tu">Turbulent</b> — a mind that notices.
            </span>
          </p>
          <p>
            <Mark who="as" size={14} />
            <span>
              <b className="final__as">Assertive</b> — a mind that recovers.
            </span>
          </p>
          <p className="final__q serif">Is this worry pointing at something real?</p>
        </motion.div>

        <footer className="final__colophon">
          <span className="label">Turbulent vs Assertive — an exhibition in eight parts</span>
          <span className="label final__muted">
            Neuroticism is one of the Big Five personality traits, not a diagnosis; it tends to ease with age. “Turbulent” and “assertive”
            are popular names for its high and low ends. If worry is running your life rather than informing it, that is worth
            talking to a professional about.
          </span>
          <a className="label final__top" href="#top">
            Back to the beginning ↑
          </a>
        </footer>
      </div>
    </section>
  )
}
