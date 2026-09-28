import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { EASE, Guides, Mark } from '../lib/ui'
import './Questions.css'

const TI_SUB = ['Is it defined?', 'Is it consistent?', 'Does it follow?', 'What is the principle?', 'What would contradict it?']
const TE_SUB = ['Is it measurable?', 'What is the fastest path?', 'Who owns it?', 'When does it ship?', 'Did the number move?']

export function Questions() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  /* Ti's letters converge — a question that tightens around its own terms.
     Te's line travels outward — a question that only resolves out there. */
  const tiSpacing = useTransform(scrollYProgress, [0.1, 0.45], reduce ? ['-0.04em', '-0.04em'] : ['0.14em', '-0.04em'])
  const teX = useTransform(scrollYProgress, [0.3, 0.7], reduce ? ['0%', '0%'] : ['-8%', '0%'])
  const arrow = useTransform(scrollYProgress, [0.45, 0.72], [0, 1])

  return (
    <section ref={ref} id="questions" className="part part--rule qs" aria-labelledby="questions-title">
      <Guides />
      <div className="wrap">
        <header className="qs__head">
          <span className="label">Part 04</span>
          <span className="qs__rule" aria-hidden="true" />
          <h2 id="questions-title" className="label">
            Two questions
          </h2>
        </header>

        <div className="qs__block qs__block--ti">
          <p className="qs__who label ti">
            <Mark who="ti" size={11} /> Ti asks
          </p>
          <motion.p className="qs__q qs__q--ti display" style={{ letterSpacing: tiSpacing }}>
            Does this make sense?
          </motion.p>
          <div className="qs__meta">
            <Cycler items={TI_SUB} who="ti" />
            <p className="qs__test mono">
              <span className="label label--muted">Test</span>
              pass ⇔ no claim contradicts another
            </p>
          </div>
        </div>

        <div className="qs__between" aria-hidden="true">
          <span className="serif">or</span>
        </div>

        <div className="qs__block qs__block--te">
          <p className="qs__who label te">
            Te asks <Mark who="te" size={11} />
          </p>
          <div className="qs__te-line">
            <motion.p className="qs__q qs__q--te display" style={{ x: teX }}>
              Does this work?
            </motion.p>
            <svg className="qs__arrow" viewBox="0 0 120 40" aria-hidden="true">
              <motion.path d="M0 20 H112 M98 6 L112 20 L98 34" fill="none" stroke="var(--te)" strokeWidth="3" style={{ pathLength: arrow }} />
            </svg>
          </div>
          <div className="qs__meta qs__meta--te">
            <Cycler items={TE_SUB} who="te" />
            <p className="qs__test mono">
              <span className="label label--muted">Test</span>
              pass ⇔ observed ≥ target
            </p>
          </div>
        </div>

        <p className="qs__foot note">
          Neither question is naïve. Each one is a filter, and each filter lets different things through: Ti will pass an elegant idea
          that has never been tried; Te will pass an ugly fix that nobody can explain.
        </p>
      </div>
    </section>
  )
}

function Cycler({ items, who }: { items: string[]; who: 'ti' | 'te' }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 2200)
    return () => clearInterval(t)
  }, [inView, reduce, items.length])
  return (
    <div ref={ref} className={`qs__cycler qs__cycler--${who}`}>
      <span className="label label--muted">Also asks</span>
      <span className="qs__cycle-window" aria-live="off">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={i}
            className="qs__cycle-item"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {items[i]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="qs__dots" aria-hidden="true">
        {items.map((_, n) => (
          <span key={n} className={n === i ? 'on' : ''} />
        ))}
      </span>
    </div>
  )
}
