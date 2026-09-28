import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { EASE, Guides, Mark, type Who } from '../lib/ui'
import './Voices.css'

const TU_SUB = ['Did they sound annoyed?', 'Should I have said that?', 'What am I missing?', 'Is this my fault?', 'What’s the worst case?']
const AS_SUB = ['Next.', 'Not a problem yet.', 'We’ll handle it.', 'That went fine.', 'Sleep on it.']

const seed = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function Voices() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  /* The longer the question stays on screen, the harder it shakes: worry feeds on attention.
     The answer glides in once and then does nothing at all. */
  const amp = useTransform(scrollYProgress, [0.1, 0.5], [0.3, 1.6])
  const asX = useTransform(scrollYProgress, [0.3, 0.62], reduce ? ['0%', '0%'] : ['6%', '0%'])
  const level = useTransform(scrollYProgress, [0.45, 0.7], [0, 1])

  return (
    <section ref={ref} id="voices" className="part part--rule qs" aria-labelledby="voices-title">
      <Guides />
      <div className="wrap">
        <header className="qs__head">
          <span className="label">Part 04</span>
          <span className="qs__rule" aria-hidden="true" />
          <h2 id="voices-title" className="label">
            Two voices
          </h2>
        </header>

        <div className="qs__block qs__block--tu">
          <p className="qs__who label tu">
            <Mark who="tu" size={11} /> The turbulent voice
          </p>
          <motion.p className="qs__q qs__q--tu display" style={{ '--amp': amp } as unknown as CSSProperties} aria-label="What if it goes wrong?">
            {'What if it goes wrong?'.split(' ').map((w, wi, words) => (
              <Fragment key={wi}>
              <span className="qs__word" aria-hidden="true">
                {w.split('').map((c, ci) => {
                  const i = wi * 10 + ci
                  return (
                    <span
                      key={ci}
                      className="qs__ch"
                      style={
                        {
                          '--dx': `${(seed(i) - 0.5) * 4}px`,
                          '--dy': `${(seed(i + 7) - 0.5) * 4}px`,
                          '--dr': `${(seed(i + 3) - 0.5) * 4}deg`,
                          animationDelay: `${-seed(i + 11) * 0.4}s`,
                          animationDuration: `${0.18 + seed(i + 5) * 0.2}s`,
                        } as CSSProperties
                      }
                    >
                      {c}
                    </span>
                  )
                })}
              </span>
              {wi < words.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
          </motion.p>
          <div className="qs__meta">
            <Cycler items={TU_SUB} who="tu" />
            <p className="qs__test mono">
              <span className="label label--muted">Alarm threshold · low</span>
              small signal ⇒ full alert
            </p>
          </div>
        </div>

        <div className="qs__between" aria-hidden="true">
          <span className="serif">or</span>
        </div>

        <div className="qs__block qs__block--as">
          <p className="qs__who label as">
            The assertive voice <Mark who="as" size={11} />
          </p>
          <div className="qs__as-line">
            <motion.p className="qs__q qs__q--as display" style={{ x: asX }}>
              It’ll be fine.
            </motion.p>
          </div>
          <div className="qs__level" aria-hidden="true">
            <motion.span className="qs__level-line" style={{ scaleX: level }} />
            <span className="qs__level-bubble" />
          </div>
          <div className="qs__meta qs__meta--as">
            <Cycler items={AS_SUB} who="as" />
            <p className="qs__test mono">
              <span className="label label--muted">Alarm threshold · high</span>
              only a large signal ⇒ alert
            </p>
          </div>
        </div>

        <p className="qs__foot note">
          Everyone hears both voices. What differs is the volume knob. The turbulent voice is often right about what could go wrong
          and wrong about how likely it is. The assertive voice is often right about the odds and blind to the one case that matters.
        </p>
      </div>
    </section>
  )
}

function Cycler({ items, who }: { items: string[]; who: Who }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    /* The turbulent voice cycles faster */
    const t = setInterval(() => setI((n) => (n + 1) % items.length), who === 'tu' ? 1500 : 2800)
    return () => clearInterval(t)
  }, [inView, reduce, items.length, who])
  return (
    <div ref={ref} className={`qs__cycler qs__cycler--${who}`}>
      <span className="label label--muted">{who === 'tu' ? 'Also asks' : 'Also says'}</span>
      <span className="qs__cycle-window" aria-live="off">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={i}
            className="qs__cycle-item"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: who === 'tu' ? 0.35 : 0.9, ease: EASE }}
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
