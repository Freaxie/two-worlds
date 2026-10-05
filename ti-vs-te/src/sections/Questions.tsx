import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, rng } from '../components/common'
import './Questions.css'

/*
  Two questions, set as type that behaves like its question.
  Ti's words arrive slightly out of true and are measured into place: baseline, cap line and
  dimension ticks are drawn around them. Te's words come in on a belt, left to right, and a
  progress bar runs to 100%.
*/

function TiWord({ p, word, i }: { p: MotionValue<number>; word: string; i: number }) {
  const r = rng(500 + i)
  const x = useTransform(p, [0, 0.75], [`${(r() - 0.5) * 0.4}em`, '0em'], { clamp: true })
  const y = useTransform(p, [0, 0.75], [`${(r() - 0.5) * 0.5}em`, '0em'], { clamp: true })
  const rotate = useTransform(p, [0, 0.75], [(r() - 0.5) * 12, 0], { clamp: true })
  const tick = useTransform(p, [0.75, 0.95], [0, 1])
  return (
    <span className="q__ti-word">
      <motion.span className="q__word" style={{ x, y, rotate }}>
        {word}
      </motion.span>
      <motion.span className="q__dim" style={{ scaleX: tick, opacity: tick }} aria-hidden="true" />
    </span>
  )
}

function TeWord({ p, word, i, n }: { p: MotionValue<number>; word: string; i: number; n: number }) {
  const start = (i / n) * 0.5
  const x = useTransform(p, [start, start + 0.35], ['-110vw', '0vw'], { clamp: true })
  return (
    <motion.span className="q__word" style={{ x }}>
      {word}
    </motion.span>
  )
}

export function Questions() {
  const tiRef = useRef<HTMLDivElement>(null)
  const teRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: pTi } = useScroll({ target: tiRef, offset: ['start end', 'center 55%'] })
  const { scrollYProgress: pTe } = useScroll({ target: teRef, offset: ['start end', 'center 55%'] })
  const lines = useTransform(pTi, [0.7, 0.95], [0, 1])
  const progress = useTransform(pTe, [0.6, 1], [0, 1])
  const pct = useTransform(progress, (v) => `${Math.round(v * 100)}%`)

  const tiWords = ['But', 'why', 'does', 'it', 'work?']
  const teWords = ['Does', 'it', 'work?']

  return (
    <section className="q" id="questions" aria-labelledby="q-title">
      <h2 className="visually-hidden" id="q-title">
        Room 03 — Two questions
      </h2>

      <div className="q__block q__block--ti" ref={tiRef}>
        <div className="wrap">
          <div className="q__meta">
            <span className="label">03 / Two questions</span>
            <span className="label">Q.1 — Ti</span>
          </div>
          <div className="q__ruled">
            <motion.span className="q__guide q__guide--cap" style={{ scaleX: lines }} aria-hidden="true" />
            <p className="q__text display" aria-label="But why does it work?">
              {tiWords.map((w, i) => (
                <TiWord key={w} p={pTi} word={w} i={i} />
              ))}
            </p>
            <motion.span className="q__guide q__guide--base" style={{ scaleX: lines }} aria-hidden="true" />
          </div>
          <div className="q__foot grid">
            <Reveal className="q__note">
              <p className="serif">A question that is not satisfied by a result. It wants the mechanism, stated so precisely that it could not be otherwise.</p>
            </Reveal>
            <Reveal className="q__sub" delay={0.1}>
              <p className="label">It asks for</p>
              <ul className="q__list">
                <li>the definition</li>
                <li>the underlying principle</li>
                <li>the case where it breaks</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="q__block q__block--te" ref={teRef}>
        <div className="wrap">
          <div className="q__meta">
            <span className="label">03 / Two questions</span>
            <span className="label">Q.2 — Te</span>
          </div>
          <p className="q__text display" aria-label="Does it work?">
            {teWords.map((w, i) => (
              <TeWord key={w} p={pTe} word={w} i={i} n={teWords.length} />
            ))}
          </p>
          <div className="q__progress" aria-hidden="true">
            <motion.span className="q__progress-fill" style={{ scaleX: progress }} />
            <motion.span className="q__progress-pct label">{pct}</motion.span>
          </div>
          <div className="q__foot grid">
            <Reveal className="q__note">
              <p className="serif">A question answered by the world, not the whiteboard. Run it, measure it, keep what holds up.</p>
            </Reveal>
            <Reveal className="q__sub" delay={0.1}>
              <p className="label">It asks for</p>
              <ul className="q__list">
                <li>the result</li>
                <li>the evidence</li>
                <li>the next step</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
