import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, rng } from '../components/common'
import './Questions.css'

/*
  Two questions, set as type that behaves like its question.
  P's words start on one line and loosen, drifting off the baseline as the question stays open.
  J's words arrive scattered and snap onto a ruled baseline; a rule draws under them and a box is ticked.
*/

function PWord({ p, word, i }: { p: MotionValue<number>; word: string; i: number }) {
  const r = rng(60 + i)
  const x = useTransform(p, [0, 1], ['0em', `${i * 0.05 + r() * 0.08}em`])
  const y = useTransform(p, [0, 1], ['0em', `${(r() - 0.5) * 0.55}em`])
  const rotate = useTransform(p, [0, 1], [0, (r() - 0.5) * 10])
  return (
    <motion.span className="q__word" style={{ x, y, rotate }}>
      {word}
    </motion.span>
  )
}

function JWord({ p, word, i }: { p: MotionValue<number>; word: string; i: number }) {
  const r = rng(80 + i)
  const x = useTransform(p, [0, 0.85], [`${(r() - 0.5) * 30}vw`, '0vw'], { clamp: true })
  const y = useTransform(p, [0, 0.85], [`${(r() - 0.5) * 1.6}em`, '0em'], { clamp: true })
  const rotate = useTransform(p, [0, 0.85], [(r() - 0.5) * 40, 0], { clamp: true })
  return (
    <motion.span className="q__word" style={{ x, y, rotate }}>
      {word}
    </motion.span>
  )
}

export function Questions() {
  const pRef = useRef<HTMLDivElement>(null)
  const jRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: pP } = useScroll({ target: pRef, offset: ['start 70%', 'end 30%'] })
  const { scrollYProgress: pJ } = useScroll({ target: jRef, offset: ['start end', 'center 55%'] })
  const rule = useTransform(pJ, [0.85, 1], [0, 1])
  const box = useTransform(pJ, [0.93, 1], [0, 1])

  const pWords = ['What', 'if', 'something', 'better', 'turns', 'up?']
  const jWords = ['What’s', 'the', 'plan?']

  return (
    <section className="q" id="questions" aria-labelledby="q-title">
      <h2 className="visually-hidden" id="q-title">
        Room 03 — Two questions
      </h2>

      <div className="q__block q__block--p" ref={pRef}>
        <div className="wrap">
          <div className="q__meta">
            <span className="label">03 / Two questions</span>
            <span className="label">Q.1 — P</span>
          </div>
          <p className="q__text display" aria-label="What if something better turns up?">
            {pWords.map((w, i) => (
              <PWord key={w} p={pP} word={w} i={i} />
            ))}
          </p>
          <div className="q__foot grid">
            <Reveal className="q__note">
              <p className="serif">A question that keeps the decision warm, in case the world has more to say.</p>
            </Reveal>
            <Reveal className="q__sub" delay={0.1}>
              <p className="label">It protects</p>
              <ul className="q__list">
                <li>flexibility</li>
                <li>new information</li>
                <li>the chance to improvise</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="q__block q__block--j" ref={jRef}>
        <div className="wrap">
          <div className="q__meta">
            <span className="label">03 / Two questions</span>
            <span className="label">Q.2 — J</span>
          </div>
          <div className="q__jrow">
            <p className="q__text display" aria-label="What’s the plan?">
              {jWords.map((w, i) => (
                <JWord key={w} p={pJ} word={w} i={i} />
              ))}
            </p>
            <motion.span className="q__box" style={{ scale: box }} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </motion.span>
          </div>
          <motion.span className="q__rule" style={{ scaleX: rule }} aria-hidden="true" />
          <div className="q__foot grid">
            <Reveal className="q__note">
              <p className="serif">A question that wants the decision made, so the rest of the day can move.</p>
            </Reveal>
            <Reveal className="q__sub" delay={0.1}>
              <p className="label">It protects</p>
              <ul className="q__list">
                <li>commitments</li>
                <li>other people’s time</li>
                <li>a mind free for the next thing</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
