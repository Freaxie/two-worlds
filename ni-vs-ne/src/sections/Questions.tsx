import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, rng } from '../components/common'
import './Questions.css'

/*
  Two questions, set as type that behaves like its question.
  Ni's words arrive from far apart and lock together, ending on a point.
  Ne's words start as one block and drift apart, throwing off echoes of themselves.
*/

function NiWord({ p, word, i, n }: { p: MotionValue<number>; word: string; i: number; n: number }) {
  const spread = (i - (n - 1) / 2) * 22
  const x = useTransform(p, [0, 1], [`${spread}vw`, '0vw'])
  const o = useTransform(p, [0, 0.5], [0.25, 1])
  return (
    <motion.span className="q__word" style={{ x, opacity: o }}>
      {word}
    </motion.span>
  )
}

function NeWord({ p, word, i }: { p: MotionValue<number>; word: string; i: number }) {
  const r = rng(40 + i)
  const dx = (r() - 0.5) * 7
  const dy = (r() - 0.5) * 0.35
  const rot = (r() - 0.5) * 7
  const x = useTransform(p, [0, 1], ['0vw', `${dx}vw`])
  const y = useTransform(p, [0, 1], ['0em', `${dy}em`])
  const rotate = useTransform(p, [0, 1], [0, rot])
  const echoes = [0, 1].map((k) => {
    const ex = (r() - 0.5) * 34
    const ey = (r() - 0.5) * 1.6
    return { ex, ey, k }
  })
  return (
    <span className="q__word-wrap">
      {echoes.map((e) => (
        <Echo key={e.k} p={p} word={word} ex={e.ex} ey={e.ey} k={e.k} />
      ))}
      <motion.span className="q__word" style={{ x, y, rotate }}>
        {word}
      </motion.span>
    </span>
  )
}

function Echo({ p, word, ex, ey, k }: { p: MotionValue<number>; word: string; ex: number; ey: number; k: number }) {
  const x = useTransform(p, [0, 1], ['0vw', `${ex}vw`])
  const y = useTransform(p, [0, 1], ['0em', `${ey}em`])
  const opacity = useTransform(p, [0, 0.3, 1], [0, 0.4 - k * 0.12, 0.32 - k * 0.1])
  return (
    <motion.span className="q__echo" style={{ x, y, opacity }} aria-hidden="true">
      {word}
    </motion.span>
  )
}

export function Questions() {
  const niRef = useRef<HTMLDivElement>(null)
  const neRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: pNi } = useScroll({ target: niRef, offset: ['start end', 'center 55%'] })
  const { scrollYProgress: pNe } = useScroll({ target: neRef, offset: ['start 70%', 'end 30%'] })
  const pointScale = useTransform(pNi, [0.85, 1], [0, 1])
  const lineScale = useTransform(pNi, [0.7, 1], [0, 1])

  const niWords = ['Where', 'is', 'this', 'leading?']
  const neWords = ['What', 'else', 'could', 'this', 'mean?']

  return (
    <section className="q" id="questions" aria-labelledby="q-title">
      <h2 className="visually-hidden" id="q-title">
        Room 03 — Two questions
      </h2>

      <div className="q__block q__block--ni" ref={niRef}>
        <div className="wrap">
          <div className="q__meta">
            <span className="label">03 / Two questions</span>
            <span className="label">Q.1 — Ni</span>
          </div>
          <p className="q__text display" aria-label="Where is this leading?">
            {niWords.map((w, i) => (
              <NiWord key={w} p={pNi} word={w} i={i} n={niWords.length} />
            ))}
          </p>
          <div className="q__arrive" aria-hidden="true">
            <motion.span className="q__arrive-line" style={{ scaleX: lineScale }} />
            <motion.span className="q__arrive-point" style={{ scale: pointScale }} />
          </div>
          <div className="q__foot grid">
            <Reveal className="q__note">
              <p className="serif">A question that narrows the field until one answer can bear weight.</p>
            </Reveal>
            <Reveal className="q__sub" delay={0.1}>
              <p className="label">It asks about</p>
              <ul className="q__list">
                <li>trajectory</li>
                <li>consequence</li>
                <li>what lies beneath</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="q__block q__block--ne" ref={neRef}>
        <div className="wrap">
          <div className="q__meta">
            <span className="label">03 / Two questions</span>
            <span className="label">Q.2 — Ne</span>
          </div>
          <p className="q__text display" aria-label="What else could this mean?">
            {neWords.map((w, i) => (
              <NeWord key={w + i} p={pNe} word={w} i={i} />
            ))}
          </p>
          <div className="q__foot grid">
            <Reveal className="q__note">
              <p className="serif">A question that widens the field until the answer you had is one of many.</p>
            </Reveal>
            <Reveal className="q__sub" delay={0.1}>
              <p className="label">It asks about</p>
              <ul className="q__list">
                <li>alternatives</li>
                <li>resemblance</li>
                <li>what’s next door</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
