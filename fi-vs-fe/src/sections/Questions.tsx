import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, SectionHead, Tag } from '../components/common'
import { rand } from '../lib/organic'
import './Questions.css'

const FI_WORDS = ['Is', 'this', 'true', 'to', 'what', 'I', 'value?']
const FE_WORDS = ['What', 'does', 'this', 'mean', 'for', 'everyone', 'involved?']

type WordProps = {
  w: string
  p: MotionValue<number>
  dx: number
  dy: number
  rot: number
  accent: boolean
  mode: 'fi' | 'fe'
}

/* Fi words arrive from far apart and gather into one tight, condensed line.
   Fe words start stacked on one another and open outward into a wide one. */
function Word({ w, p, dx, dy, rot, accent, mode }: WordProps) {
  const reduce = useReducedMotion()
  const k = reduce ? () => 0 : (v: number) => 1 - v
  const x = useTransform(p, (v) => `${dx * k(v)}vw`)
  const y = useTransform(p, (v) => `${dy * k(v)}vh`)
  const rotate = useTransform(p, (v) => rot * k(v))
  const wdth = useTransform(p, (v) => (mode === 'fi' ? 125 - 63 * v : 62 + 63 * v))
  const fvs = useTransform(wdth, (v) => `'wdth' ${v.toFixed(1)}`)
  const opacity = useTransform(p, [0, 0.35], [0.12, 1])
  return (
    <motion.span className={`q__word${accent ? ' q__word--accent' : ''}`} style={{ x, y, rotate, fontVariationSettings: fvs, opacity }}>
      {w}
    </motion.span>
  )
}

function Question({ words, mode, accent }: { words: string[]; mode: 'fi' | 'fe'; accent: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 0.55'] })
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22 })
  const r = rand(mode === 'fi' ? 11 : 29)
  const mid = (words.length - 1) / 2

  return (
    <div ref={ref} className={`q q--${mode}`}>
      <div className="q__meta">
        <Tag who={mode}>{mode === 'fi' ? 'Asks inward' : 'Asks outward'}</Tag>
      </div>
      <p className="q__text display" aria-label={words.join(' ')}>
        {words.map((w, i) => {
          const side = i - mid
          // Fi: scattered to the edges. Fe: collapsed into the centre, overlapping.
          const dx = mode === 'fi' ? side * 9 + (r() - 0.5) * 16 : -side * 7
          const dy = mode === 'fi' ? (r() - 0.5) * 30 : (r() - 0.5) * 4
          const rot = mode === 'fi' ? (r() - 0.5) * 24 : 0
          return <Word key={i} w={w} p={p} dx={dx} dy={dy} rot={rot} accent={w === accent} mode={mode} />
        })}
      </p>
      <Reveal className="q__gloss serif">
        {mode === 'fi' ? (
          <>
            A question with <em>one witness.</em> Its answer can be certain even when no one else sees it.
          </>
        ) : (
          <>
            A question with <em>many witnesses.</em> Its answer is only real if it can be lived together.
          </>
        )}
      </Reveal>
    </div>
  )
}

export function Questions() {
  return (
    <section id="questions" className="section questions">
      <div className="wrap">
        <SectionHead n="03" name="Two questions" title="Every value judgement begins with a question." />
        <Question words={FI_WORDS} mode="fi" accent="I" />
        <Question words={FE_WORDS} mode="fe" accent="everyone" />
      </div>
    </section>
  )
}
