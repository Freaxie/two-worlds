import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Clock, EASE, Reveal, RoomHead, Tag } from '../components/common'
import './Questions.css'

const SI_Q = ['What', 'does', 'this', 'remind', 'me', 'of?']
const SE_Q = ['What', 'is', 'happening', 'right', 'now?']

/* A Si word: it arrives slowly, and scrolling deposits more echoes behind it —
   the longer you stay with it, the more past it carries. */
function SiWord({ w, i, p }: { w: string; i: number; p: MotionValue<number> }) {
  const reduce = useReducedMotion()
  const spread = useTransform(p, [0, 1], [0, 1])
  return (
    <span className="q__word">
      {!reduce &&
        [1, 2, 3, 4].map((k) => (
          <SiEcho key={k} k={k} w={w} spread={spread} />
        ))}
      <motion.span
        className="q__main"
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 1.8, delay: i * 0.22, ease: EASE }}
      >
        {w}
      </motion.span>
    </span>
  )
}

function SiEcho({ k, w, spread }: { k: number; w: string; spread: MotionValue<number> }) {
  const x = useTransform(spread, (s) => -s * k * 0.05 + 'em')
  const y = useTransform(spread, (s) => s * k * 0.035 + 'em')
  const opacity = useTransform(spread, (s) => Math.min(1, s * 2) * (0.5 - k * 0.1))
  return (
    <motion.span className="q__echo" aria-hidden="true" style={{ x, y, opacity }}>
      {w}
    </motion.span>
  )
}

export function Questions() {
  const siRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: siRef, offset: ['start 80%', 'end 20%'] })

  return (
    <section className="room q" id="questions" aria-labelledby="questions-title">
      <div className="wrap">
        <RoomHead
          n="03"
          name="Two questions"
          title={
            <span id="questions-title">
              Every perception <em>begins</em> with a question.
            </span>
          }
        />

        <div className="q__block q__block--si" ref={siRef}>
          <Tag f="si">turns toward the archive</Tag>
          <p className="q__line q__line--si" aria-label="What does this remind me of?">
            {SI_Q.map((w, i) => (
              <SiWord key={i} w={w} i={i} p={scrollYProgress} />
            ))}
          </p>
          <Reveal className="q__note" delay={0.6}>
            <p>
              The present is a <em className="serif">cue</em>. The answer is a precedent — a remembered texture, a familiar sequence, a
              way this has gone before.
            </p>
          </Reveal>
        </div>

        <div className="q__block q__block--se">
          <Tag f="se">turns toward the field</Tag>
          {/* All words land in the same frame: no stagger, no fade. */}
          <motion.p
            className="q__line q__line--se"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0 }}
          >
            {SE_Q.map((w, i) => (
              <motion.span
                key={i}
                className={`q__word q__se-word ${i >= 3 ? 'q__now' : ''}`}
                whileHover={{ x: [0, -6, 5, -2, 0], transition: { duration: 0.18 } }}
              >
                {w}
              </motion.span>
            ))}
            <span className="q__stamp label" aria-hidden="true">
              <Clock />
            </span>
          </motion.p>
          <Reveal className="q__note q__note--se" delay={0} y={0}>
            <p>
              The present is the <em className="serif">answer</em>. There is nothing to look up: the information is already here, in the
              light, the sound, the weight of the thing in your hand.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
