import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { Reveal, rng, seg, useFrameValue } from '../components/common'
import { smooth } from '../components/tree'
import './Finale.css'

/*
  The close: a red rule is drawn across the room, milestone by milestone. It has gaps in it —
  doors — and through each door a loose path wanders out. The line gives the room its shape;
  the doors keep it from becoming a wall.
*/

const W = 1400
const H = 800
const LY = 430
const DOORS = [180, 470, 760, 1050, 1290]
const GAP = 44

function useScene() {
  return useMemo(() => {
    const r = rng(55)
    const segs: [number, number][] = []
    let x = -10
    DOORS.forEach((d) => {
      segs.push([x, d - GAP / 2])
      x = d + GAP / 2
    })
    segs.push([x, W + 10])
    const paths = DOORS.flatMap((d, i) =>
      [-1, 1].map((dir, k) => {
        const pts: [number, number][] = [[d, LY]]
        let px = d
        let py = LY
        let ang = (dir * Math.PI) / 2 + (r() - 0.5) * 0.8
        for (let s = 0; s < 6; s++) {
          ang += (r() - 0.5) * 1.4
          px += Math.cos(ang) * (40 + r() * 50)
          py += Math.sin(ang) * (40 + r() * 50)
          pts.push([px, py])
        }
        return { d: smooth(pts), end: pts[pts.length - 1], delay: ((i * 2 + k) / (DOORS.length * 2)) * 0.5 }
      })
    )
    return { segs, paths }
  }, [])
}

export function Finale() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end end'] })
  const t = useFrameValue(scrollYProgress)
  const scene = useScene()

  const lineDraw = seg(t, 0.05, 0.4)
  const wanderDraw = seg(t, 0.35, 0.85)

  const ls1 = useTransform(scrollYProgress, [0.05, 0.45], [0.2, -0.03])
  const y2 = useTransform(scrollYProgress, [0.3, 0.7], [0, -10])
  const r2 = useTransform(scrollYProgress, [0.3, 0.7], [0, -2])
  const l1 = useMotionTemplate`${ls1}em`

  return (
    <section className="fin" id="finale" ref={ref} aria-labelledby="fin-title">
      <div className="fin__sticky">
        <svg className="fin__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {scene.paths.map((p, i) => {
            const k = seg(wanderDraw, p.delay, p.delay + 0.5)
            return (
              <g key={i}>
                <path d={p.d} className="fin__wander" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
                {k >= 1 && <circle cx={p.end[0]} cy={p.end[1]} r={6} className="fin__open" />}
              </g>
            )
          })}
          {scene.segs.map(([a, b], i) => {
            const k = seg(lineDraw, i / scene.segs.length, (i + 1) / scene.segs.length)
            return k > 0 ? <line key={i} x1={a} x2={a + (b - a) * k} y1={LY} y2={LY} className="fin__rule" /> : null
          })}
          {DOORS.map((d, i) => (
            <g key={d} style={{ opacity: seg(lineDraw, (i + 0.9) / scene.segs.length, (i + 1.2) / scene.segs.length) }}>
              <rect x={d - GAP / 2 - 8} y={LY - 8} width={16} height={16} className="fin__post" />
              <rect x={d + GAP / 2 - 8} y={LY - 8} width={16} height={16} className="fin__post" />
            </g>
          ))}
        </svg>

        <div className="fin__inner wrap">
          <p className="label fin__eyebrow">Room 08 / Line & door</p>
          <h2 className="fin__title display" id="fin-title">
            <motion.span className="fin__l1" style={{ letterSpacing: l1 }}>
              One draws the line.
            </motion.span>
            <motion.span className="fin__l2" style={{ y: y2, rotate: r2 }}>
              The other leaves
            </motion.span>
            <motion.span className="fin__l2 fin__l3" style={{ y: y2, rotate: r2 }}>
              the door <span className="fin__open-word">open.</span>
            </motion.span>
          </h2>
        </div>
      </div>

      <footer className="fin__foot">
        <div className="wrap grid">
          <Reveal className="fin__q">
            <p className="serif">
              One last question. As you moved through these rooms, did you want to <span className="j-text">reach the end</span> — or{' '}
              <span className="fin__q-p">see what else was in them?</span>
            </p>
          </Reveal>
          <Reveal className="fin__colophon" delay={0.1}>
            <p className="label">P vs J</p>
            <p className="body">
              An exhibition on closure and openness, in eight rooms. Not a type test: a way of noticing when a question starts to feel finished to
              you, and when it never quite does.
            </p>
            <a className="fin__top label" href="#top">
              ↑ Return to now
            </a>
          </Reveal>
        </div>
      </footer>
    </section>
  )
}
