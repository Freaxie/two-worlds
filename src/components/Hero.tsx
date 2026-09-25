import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Bust } from './Bust'
import { AristotleField, PlatoSky } from './HeroArt'
import { EASE } from './common'
import './Hero.css'

function TitleLayer({ tone }: { tone: 'light' | 'dark' }) {
  const hidden = tone === 'light'
  const reduce = useReducedMotion()
  const words = ['THE', 'TWO', 'WORLDS']
  return (
    <div className={`hero__type hero__type--${tone}`} aria-hidden={hidden || undefined}>
      <div className="hero__titleblock">
        {hidden ? (
          <p className="hero__title display">
            {words.map((w, i) => (
              <motion.span
                key={w}
                className={`hero__word hero__word--${i}`}
                initial={{ opacity: 0, y: reduce ? 0 : 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, ease: EASE, delay: 0.5 + i * 0.12 }}
              >
                {w}
              </motion.span>
            ))}
          </p>
        ) : (
          <h1 className="hero__title display">
            {words.map((w, i) => (
              <motion.span
                key={w}
                className={`hero__word hero__word--${i}`}
                initial={{ opacity: 0, y: reduce ? 0 : 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, ease: EASE, delay: 0.5 + i * 0.12 }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
        )}
        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 1.1 }}
        >
          Plato and Aristotle on what is real.
        </motion.p>
      </div>
    </div>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const m = reduce ? 0 : 1
  const skyY = useTransform(scrollYProgress, [0, 1], [0, -160 * m])
  const platoY = useTransform(scrollYProgress, [0, 1], [0, -110 * m])
  const fieldX = useTransform(scrollYProgress, [0, 1], [0, 36 * m])
  const arisY = useTransform(scrollYProgress, [0, 1], [0, 24 * m])
  const typeY = useTransform(scrollYProgress, [0, 1], [0, -70 * m])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0.25])

  return (
    <header ref={ref} className="hero" id="top">
      {/* Plato's world */}
      <motion.div
        className="hero__half hero__half--plato side-plato"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.1 }}
      >
        <motion.div className="hero__art" style={{ y: skyY, opacity: fade }}>
          <PlatoSky />
        </motion.div>
        <motion.div
          className="hero__bust hero__bust--plato"
          initial={{ opacity: 0, y: reduce ? 0 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, ease: EASE, delay: 0.6 }}
        >
          <motion.div style={{ y: platoY }}>
            <Bust who="plato" ground="night" />
          </motion.div>
        </motion.div>
        <div className="hero__thesis hero__thesis--plato">
          <div className="hero__who">
            <span className="label">Plato</span>
            <span className="mono">c. 428/7 – 348/7 BCE</span>
          </div>
          <p className="hero__claim">The intelligible is more real than the visible.</p>
          <span className="mono hero__claimnote">Thesis, in summary</span>
        </div>
        <p className="hero__corner hero__corner--plato mono">THE ACADEMY · FOUNDED c. 387 BCE</p>
      </motion.div>

      {/* Aristotle's world */}
      <motion.div
        className="hero__half hero__half--aris side-aris"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.25 }}
      >
        <motion.div className="hero__art" style={{ x: fieldX, opacity: fade }}>
          <AristotleField />
        </motion.div>
        <motion.div
          className="hero__bust hero__bust--aris"
          initial={{ opacity: 0, x: reduce ? 0 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.8, ease: EASE, delay: 0.75 }}
        >
          <motion.div style={{ y: arisY }}>
            <Bust who="aris" ground="paper" />
          </motion.div>
        </motion.div>
        <div className="hero__thesis hero__thesis--aris">
          <div className="hero__who">
            <span className="label">Aristotle</span>
            <span className="mono">384 – 322 BCE</span>
          </div>
          <p className="hero__claim">Form exists in things, not apart from them.</p>
          <span className="mono hero__claimnote">Thesis, in summary</span>
        </div>
        <p className="hero__corner hero__corner--aris mono">THE LYCEUM · FOUNDED 335 BCE</p>
      </motion.div>

      <motion.div
        className="hero__seam"
        aria-hidden="true"
        initial={{ scaleY: 0, scaleX: 0 }}
        animate={{ scaleY: 1, scaleX: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />

      <motion.div className="hero__typewrap" style={{ y: typeY }}>
        <TitleLayer tone="light" />
        <TitleLayer tone="dark" />
      </motion.div>

      <motion.a
        className="hero__enter"
        href="#divide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.8 }}
      >
        <span className="label">Enter the argument</span>
        <span className="hero__arrow" aria-hidden="true">↓</span>
      </motion.a>
    </header>
  )
}
