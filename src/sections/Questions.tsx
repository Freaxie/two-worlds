import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { EASE } from '../components/common'
import './Questions.css'

const PAIRS: [string, string][] = [
  ['Is reality behind appearances?', 'Or is reality within things themselves?'],
  ['Can reason reach truths that experience cannot?', 'Or does knowledge begin with experience?'],
  ['Is the good something eternal?', 'Or something realised through human activity?'],
  ['Does form transcend matter?', 'Or does form organise matter?'],
]
const NUM = ['I', 'II', 'III', 'IV']

export function Questions() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [pair, setPair] = useState(0)
  const [second, setSecond] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const x = Math.min(3.999, Math.max(0, v * 4))
    setPair(Math.floor(x))
    setSecond(x % 1 > 0.42)
  })
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])
  const drift = useTransform(scrollYProgress, [0, 1], ['4%', '-14%'])

  return (
    <section ref={ref} id="questions" className="qs" aria-labelledby="questions-title">
      <div className="qs__sticky">
        <motion.span className="qs__bg greek" aria-hidden="true" style={{ x: drift }}>
          ἀπορίαι
        </motion.span>

        <header className="qs__head wrap">
          <span className="label">Room IX</span>
          <h2 id="questions-title" className="label">
            The Big Questions
          </h2>
          <span className="qs__count mono" aria-hidden="true">
            {NUM[pair]} / IV
          </span>
        </header>

        <div className="qs__stage wrap" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={pair}
              className="qs__pair"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <motion.p
                className="qs__q qs__q--plato"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: EASE }}
              >
                <span className="qs__tag label">After Plato</span>
                {PAIRS[pair][0]}
              </motion.p>
              <motion.p
                className="qs__q qs__q--aris"
                initial={false}
                animate={{ opacity: second ? 1 : 0.06, y: second ? 0 : 16 }}
                transition={{ duration: 1, ease: EASE }}
              >
                <span className="qs__tag label">After Aristotle</span>
                {PAIRS[pair][1]}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="qs__foot wrap">
          <div className="qs__track" aria-hidden="true">
            <motion.div className="qs__bar" style={{ scaleX: bar }} />
          </div>
          <span className="mono qs__hint">Keep scrolling</span>
        </div>

        {/* the full list, for screen readers and for anyone who wants it all at once */}
        <ol className="sr-only">
          {PAIRS.flat().map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}
