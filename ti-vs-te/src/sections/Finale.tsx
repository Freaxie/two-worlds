import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { Reveal, seg, useFrameValue, useMedia } from '../components/common'
import './Finale.css'

/*
  The close: a set of gears is drafted in teal hairlines, with centres and pitch circles marked —
  the machine understood. Then the gears fill with amber and begin to turn — the machine running.
  Same machine. First the drawing, then the motion.
*/

const W = 1400
const H = 800

function gearPath(cx: number, cy: number, teeth: number, rOut: number, rIn: number) {
  let d = ''
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const pts: [number, number][] = [
      [a, rIn],
      [a + step * 0.12, rOut],
      [a + step * 0.48, rOut],
      [a + step * 0.6, rIn],
    ]
    pts.forEach(([ang, r], k) => {
      d += `${i === 0 && k === 0 ? 'M' : 'L'}${(cx + Math.cos(ang) * r).toFixed(1)},${(cy + Math.sin(ang) * r).toFixed(1)}`
    })
  }
  return d + 'Z'
}

/* three meshing gears; speed is inverse to tooth count so they turn together */
const GEARS = [
  { cx: 1090, cy: 250, teeth: 24, r: 190, dir: 1 },
  { cx: 1090 + Math.cos((200 * Math.PI) / 180) * 288, cy: 250 + Math.sin((200 * Math.PI) / 180) * 288, teeth: 14, r: 110, dir: -1 },
  { cx: 260, cy: 600, teeth: 18, r: 145, dir: 1 },
]

export function Finale() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end end'] })
  const t = useFrameValue(scrollYProgress)
  const wide = useMedia('(min-width: 861px)')
  const paths = useMemo(() => GEARS.map((g) => gearPath(g.cx, g.cy, g.teeth, g.r, g.r - 22)), [])

  const draft = seg(t, 0.05, 0.42)
  const fill = seg(t, 0.4, 0.62)
  const turn = seg(t, 0.45, 1) * 220

  const ls1 = useTransform(scrollYProgress, [0.05, 0.45], [0.18, 0.01])
  const l1 = useMotionTemplate`${ls1}em`
  const x2 = useTransform(scrollYProgress, [0.35, 0.7], ['-6%', '0%'])

  return (
    <section className="fin" id="finale" ref={ref} aria-labelledby="fin-title">
      <div className="fin__sticky">
        <svg className="fin__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={wide ? 'xMidYMid slice' : 'xMidYMax meet'} aria-hidden="true">
          {GEARS.map((g, i) => {
            const angle = (turn * g.dir * 24) / g.teeth
            return (
              <g key={i}>
                {/* drafting marks: centre lines and pitch circle */}
                <g style={{ opacity: draft * (1 - fill * 0.6) }}>
                  <line x1={g.cx - g.r - 30} x2={g.cx + g.r + 30} y1={g.cy} y2={g.cy} className="fin__centre" />
                  <line x1={g.cx} x2={g.cx} y1={g.cy - g.r - 30} y2={g.cy + g.r + 30} className="fin__centre" />
                  <circle cx={g.cx} cy={g.cy} r={g.r - 11} className="fin__pitch" />
                  <text x={g.cx + g.r + 12} y={g.cy - 8} className="fin__dim">
                    Z={g.teeth}
                  </text>
                </g>
                <g transform={`rotate(${angle} ${g.cx} ${g.cy})`}>
                  <path
                    d={paths[i]}
                    className="fin__gear"
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - seg(draft, i * 0.2, i * 0.2 + 0.6)}
                    style={{ fillOpacity: fill }}
                  />
                  <circle cx={g.cx} cy={g.cy} r={g.r * 0.22} className="fin__hub" style={{ fillOpacity: fill }} />
                  <line x1={g.cx} x2={g.cx + g.r * 0.6} y1={g.cy} y2={g.cy} className="fin__spoke" style={{ opacity: fill }} />
                </g>
              </g>
            )
          })}
        </svg>

        <div className="fin__inner wrap">
          <p className="label fin__eyebrow">Room 08 / Model & machine</p>
          <h2 className="fin__title display" id="fin-title">
            <motion.span className="fin__l1" style={{ letterSpacing: l1 }}>
              One asks why it works.
            </motion.span>
            <motion.span className="fin__l2" style={{ x: x2 }}>
              The other makes
            </motion.span>
            <motion.span className="fin__l2 fin__l3" style={{ x: x2 }}>
              it <span className="fin__work">work.</span>
            </motion.span>
          </h2>
        </div>
      </div>

      <footer className="fin__foot">
        <div className="wrap grid">
          <Reveal className="fin__q">
            <p className="serif">
              One last question. Scrolling through this page, did you want to know <span className="ti-text">how it was built</span> — or were you{' '}
              <span className="fin__q-te">glad that it worked?</span>
            </p>
          </Reveal>
          <Reveal className="fin__colophon" delay={0.1}>
            <p className="label">Ti vs Te</p>
            <p className="body">
              An exhibition on two kinds of logic, in eight rooms. Not a type test: a way of noticing whether a thing feels finished to you when it
              is understood, or when it runs.
            </p>
            <a className="fin__top label" href="#top">
              ↑ Return to the drawing
            </a>
          </Reveal>
        </div>
      </footer>
    </section>
  )
}
