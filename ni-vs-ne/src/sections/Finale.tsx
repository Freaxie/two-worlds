import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { Reveal, rng, seg, useFrameValue } from '../components/common'
import './Finale.css'

/*
  The close: a single violet thread is drawn across the room, then a web grows out of it.
  The thread comes first and the web hangs from it — neither stands alone.
*/

const W = 1400
const H = 800

function useWeb() {
  return useMemo(() => {
    const r = rng(101)
    const thread: [number, number][] = Array.from({ length: 13 }, (_, i) => {
      const x = (i / 12) * W
      return [x, 430 + Math.sin(i * 0.7) * 28 - i * 6]
    })
    const threadD = thread
      .map((p, i) => {
        if (i === 0) return `M${p[0]},${p[1]}`
        const prev = thread[i - 1]
        const mx = (prev[0] + p[0]) / 2
        return `C${mx},${prev[1]} ${mx},${p[1]} ${p[0]},${p[1]}`
      })
      .join(' ')
    const nodes: [number, number][] = Array.from({ length: 46 }, () => [r() * W, 40 + r() * (H - 80)])
    const all = [...thread, ...nodes]
    const edges: { a: [number, number]; b: [number, number]; d: number }[] = []
    nodes.forEach((n) => {
      const near = all
        .filter((m) => m !== n)
        .map((m) => ({ m, d: Math.hypot(m[0] - n[0], m[1] - n[1]) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
      near.forEach(({ m }) => edges.push({ a: n, b: m, d: Math.abs(n[1] - 420) / H + r() * 0.3 }))
    })
    return { thread, threadD, nodes, edges }
  }, [])
}

export function Finale() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end end'] })
  const t = useFrameValue(scrollYProgress)
  const web = useWeb()

  const threadDraw = seg(t, 0.05, 0.4)
  const webDraw = seg(t, 0.35, 0.85)

  const ls1 = useTransform(scrollYProgress, [0.05, 0.45], [0.18, -0.02])
  const ls2 = useTransform(scrollYProgress, [0.3, 0.7], [-0.03, 0.02])
  const w2 = useTransform(scrollYProgress, [0.3, 0.7], [70, 112])
  const l1 = useMotionTemplate`${ls1}em`
  const l2 = useMotionTemplate`${ls2}em`
  const f2 = useMotionTemplate`'wdth' ${w2}`

  return (
    <section className="fin" id="thread" ref={ref} aria-labelledby="fin-title">
      <div className="fin__sticky">
        <svg className="fin__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {web.edges.map((e, i) => {
            const k = seg(webDraw, e.d * 0.6, e.d * 0.6 + 0.4)
            return k > 0 ? (
              <line key={i} x1={e.a[0]} y1={e.a[1]} x2={e.a[0] + (e.b[0] - e.a[0]) * k} y2={e.a[1] + (e.b[1] - e.a[1]) * k} className="fin__edge" />
            ) : null
          })}
          {web.nodes.map((n, i) => (
            <rect
              key={i}
              x={n[0] - 3.5}
              y={n[1] - 3.5}
              width={7}
              height={7}
              className="fin__node"
              style={{ opacity: seg(webDraw, 0.2 + (i % 10) * 0.05, 0.5 + (i % 10) * 0.05), transform: `rotate(45deg)`, transformOrigin: `${n[0]}px ${n[1]}px` }}
            />
          ))}
          <path d={web.threadD} className="fin__thread" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - threadDraw} />
          {web.thread.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={4} className="fin__knot" style={{ opacity: seg(threadDraw, i / 13, i / 13 + 0.1) }} />
          ))}
        </svg>

        <div className="fin__inner wrap">
          <p className="label fin__eyebrow">Room 08 / Thread & web</p>
          <h2 className="fin__title display" id="fin-title">
            <motion.span className="fin__l1" style={{ letterSpacing: l1 }}>
              One finds the thread.
            </motion.span>
            <motion.span className="fin__l2" style={{ letterSpacing: l2, fontVariationSettings: f2 }}>
              The other discovers
            </motion.span>
            <motion.span className="fin__l2 fin__l3" style={{ letterSpacing: l2, fontVariationSettings: f2 }}>
              the <span className="fin__web">web.</span>
            </motion.span>
          </h2>
        </div>
      </div>

      <footer className="fin__foot">
        <div className="wrap grid">
          <Reveal className="fin__q">
            <p className="serif">
              One last question. As you moved through these rooms, were you asking <span className="ni-text">where it was leading</span> — or{' '}
              <span className="fin__q-ne">what else it could mean?</span>
            </p>
          </Reveal>
          <Reveal className="fin__colophon" delay={0.1}>
            <p className="label">Ni vs Ne</p>
            <p className="body">
              An exhibition on intuition, in eight rooms. Not a type test: a way of noticing how a mind moves through the unknown — toward a
              point, or out into a field.
            </p>
            <a className="fin__top label" href="#top">
              ↑ Return to the single point
            </a>
          </Reveal>
        </div>
      </footer>
    </section>
  )
}
