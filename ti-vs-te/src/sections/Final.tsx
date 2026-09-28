import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EASE, Mark } from '../lib/ui'
import './Final.css'

export function Final() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  /* The old question gets struck out; the better one gets underlined in both colours. */
  const strike = useTransform(scrollYProgress, [0.35, 0.55], [0, 1])
  const fade = useTransform(scrollYProgress, [0.4, 0.6], [1, 0.35])
  const under = useTransform(scrollYProgress, [0.6, 0.85], [0, 1])

  return (
    <section ref={ref} id="final" className="part final" aria-labelledby="final-title">
      <div className="wrap">
        <p className="label final__eyebrow">Part 08 — Coda</p>
        <h2 id="final-title" className="final__text display">
          <motion.span className="final__old" style={{ opacity: fade }}>
            The interesting question isn’t{' '}
            <span className="final__struck">
              which one are you.
              <motion.span className="final__strike" style={{ scaleX: strike }} aria-hidden="true" />
            </span>
          </motion.span>
          <span className="final__new">
            It’s what your thinking{' '}
            <span className="final__opt">
              is optimizing for.
              <motion.span className="final__under final__under--ti" style={{ scaleX: under }} aria-hidden="true" />
              <motion.span className="final__under final__under--te" style={{ scaleX: under }} aria-hidden="true" />
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
            <Mark who="ti" size={14} />
            <span>
              <b className="final__ti">Coherence</b> — an idea that holds together.
            </span>
          </p>
          <p>
            <Mark who="te" size={14} />
            <span>
              <b className="final__te">Effectiveness</b> — an idea that holds up.
            </span>
          </p>
          <p className="final__q serif">Which one does this problem need right now?</p>
        </motion.div>

        <footer className="final__colophon">
          <span className="label">Ti vs Te — an exhibition in eight parts</span>
          <span className="label final__muted">
            Ti and Te come from Jungian cognitive-function theory. Here they are used as lenses on reasoning, not as labels for people.
          </span>
          <a className="label final__top" href="#top">
            Back to the beginning ↑
          </a>
        </footer>
      </div>
    </section>
  )
}
