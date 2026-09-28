import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, SectionHead, rng, seg, useFrameValue } from '../components/common'
import { smooth } from '../components/tree'
import './Failure.css'

/*
  Each strength, pushed past its limit by scroll.
  P: the path keeps looping through options while the deadline sweeps past.
  J: the plan keeps being executed, box by box, while reality bends away from it.
*/

function CrushWord({ p, text }: { p: MotionValue<number>; text: string }) {
  const ls = useTransform(p, [0, 1], [0.02, -0.14])
  const w = useTransform(p, [0, 1], [96, 62])
  const letterSpacing = useMotionTemplate`${ls}em`
  const fontVariationSettings = useMotionTemplate`'wdth' ${w}`
  return (
    <motion.p className="fail__word fail__word--j display" style={{ letterSpacing, fontVariationSettings }}>
      {text}
    </motion.p>
  )
}

function DriftWord({ p, text }: { p: MotionValue<number>; text: string }) {
  const letters = text.split('')
  return (
    <p className="fail__word fail__word--p display" aria-label={text}>
      {letters.map((ch, i) => (
        <DriftLetter key={i} p={p} ch={ch} i={i} n={letters.length} />
      ))}
    </p>
  )
}

function DriftLetter({ p, ch, i, n }: { p: MotionValue<number>; ch: string; i: number; n: number }) {
  const r = rng(90 + i)
  const x = useTransform(p, [0, 1], ['0em', `${(i - n / 2) * 0.07 + (r() - 0.3) * 0.25}em`])
  const y = useTransform(p, [0, 1], ['0em', `${(r() - 0.5) * 0.9}em`])
  const rotate = useTransform(p, [0, 1], [0, (r() - 0.5) * 40])
  const opacity = useTransform(p, [0.5, 1], [1, 0.35 + r() * 0.5])
  return (
    <motion.span className="fail__letter" style={{ x, y, rotate, opacity }} aria-hidden="true">
      {ch === ' ' ? ' ' : ch}
    </motion.span>
  )
}

/* ---------- P: the loop that never lands ---------- */

const START: [number, number] = [40, 250]
const FLAG: [number, number] = [455, 250]

function Loops({ e }: { e: number }) {
  const path = useMemo(() => {
    const r = rng(31)
    const pts: [number, number][] = [START]
    let x = START[0]
    let y = START[1]
    for (let i = 0; i < 26; i++) {
      /* drawn toward the flag at first, then pulled into ever wider loops */
      const pull = Math.max(0, 1 - i / 9)
      const ang = Math.atan2(FLAG[1] - y, FLAG[0] - x) * pull + (1 - pull) * (i * 1.35 + r() * 1.4)
      const len = 38 + r() * 36
      x = Math.min(470, Math.max(30, x + Math.cos(ang) * len))
      y = Math.min(460, Math.max(40, y + Math.sin(ang) * len))
      pts.push([x, y])
    }
    return smooth(pts)
  }, [])
  const options = useMemo(() => {
    const r = rng(8)
    return Array.from({ length: 16 }, () => [60 + r() * 400, 50 + r() * 400] as [number, number])
  }, [])
  const deadlineX = 30 + e * 440
  const opened = Math.round(3 + e * 13)

  return (
    <svg viewBox="0 0 500 500" className="fail__svg" role="img" aria-label="A path that starts toward a flag, then loops among options while a deadline line sweeps past.">
      <rect x={30} y={30} width={deadlineX - 30} height={440} className="fail__elapsed" />
      <line x1={deadlineX} x2={deadlineX} y1={30} y2={470} className="fail__deadline" />
      <text x={Math.min(deadlineX + 6, 420)} y={46} className="fail__note">
        {e > 0.92 ? 'DEADLINE PASSED' : 'TIME'}
      </text>
      {options.slice(0, opened).map((o, i) => (
        <circle key={i} cx={o[0]} cy={o[1]} r={6} className="fail__option" />
      ))}
      <path d={path} className="fail__loop" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - (0.18 + e * 0.82)} />
      <circle cx={START[0]} cy={START[1]} r={7} className="fail__start" />
      <g className="fail__flag">
        <line x1={FLAG[0]} x2={FLAG[0]} y1={FLAG[1] - 30} y2={FLAG[1] + 8} />
        <path d={`M${FLAG[0]},${FLAG[1] - 30} l22,8 l-22,8 Z`} />
      </g>
      <text x={0} y={494} className="fail__meter">
        OPTIONS OPEN {String(opened).padStart(2, '0')} · DECIDED 00
      </text>
    </svg>
  )
}

/* ---------- J: the plan that no longer fits ---------- */

function Plan({ e }: { e: number }) {
  const steps = 8
  const x = (i: number) => 50 + i * 55
  const planY = 250
  const reality = (i: number) => planY + Math.pow(i / steps, 1.6) * e * 190
  const done = Math.min(steps, Math.round(2 + e * 6))
  const fit = Math.round(100 - e * 78)
  let rd = ''
  for (let i = 0; i <= steps; i++) rd += `${i ? 'L' : 'M'}${x(i)},${reality(i).toFixed(1)}`

  return (
    <svg viewBox="0 0 500 500" className="fail__svg" role="img" aria-label="A ruled plan executed step by step while the line of what actually happens bends further and further away from it.">
      <path d={rd} className="fail__reality" />
      {e > 0.45 && (
        <text x={x(steps) - 4} y={reality(steps) + 26} textAnchor="end" className="fail__whisper" style={{ opacity: seg(e, 0.45, 0.7) }}>
          what actually happened
        </text>
      )}
      <line x1={x(0)} x2={x(steps)} y1={planY} y2={planY} className="fail__plan" />
      {Array.from({ length: steps }, (_, i) => {
        const cx = x(i + 0.5)
        const isDone = i < done
        return (
          <g key={i}>
            <rect x={cx - 11} y={planY - 11} width={22} height={22} className={isDone ? 'fail__box fail__box--done' : 'fail__box'} />
            {isDone && <path d={`M${cx - 5},${planY} l4,4 l7,-8`} className="fail__tick" />}
            {isDone && e > 0.3 && <line x1={cx} x2={cx} y1={planY + 12} y2={reality(i + 0.5) - 4} className="fail__gap" style={{ opacity: seg(e, 0.3, 0.6) }} />}
          </g>
        )
      })}
      <text x={x(0)} y={planY - 26} className="fail__note fail__note--j">
        THE PLAN, STILL FOLLOWED
      </text>
      <text x={500} y={494} className="fail__meter" textAnchor="end">
        ON PLAN 100% · FIT TO REALITY {fit}%
      </text>
    </svg>
  )
}

function Panel({ who }: { who: 'p' | 'j' }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] })
  const excess = useTransform(scrollYProgress, [0.1, 0.85], [0, 1], { clamp: true })
  const e = useFrameValue(excess)
  const j = who === 'j'

  return (
    <article ref={ref} className={`fail__panel fail__panel--${who}`} aria-labelledby={`fail-${who}`}>
      <div className="fail__panel-head">
        <span className="chip label">
          <span className={`chip__mark chip__mark--${who}`} aria-hidden="true" />
          {j ? 'J in excess' : 'P in excess'}
        </span>
        <span className="fail__gauge label" aria-hidden="true">
          <span className="fail__gauge-track">
            <span className="fail__gauge-fill" style={{ transform: `scaleX(${e})` }} />
          </span>
          {e < 0.35 ? 'healthy' : e < 0.7 ? 'strained' : 'failure'}
        </span>
      </div>

      <h3 className="fail__title" id={`fail-${who}`}>
        {j ? 'Rigidity' : 'Drift'}
      </h3>
      {j ? <CrushWord p={excess} text="Premature closure" /> : <DriftWord p={excess} text="Never decided" />}

      <div className="fail__fig">{j ? <Plan e={e} /> : <Loops e={e} />}</div>

      <div className="fail__body">
        <ul className="fail__symptoms">
          {(j
            ? ['Deciding before the facts are in', 'Changing the plan feels like failing', 'Surprises read as threats, not information', 'Finishing the list instead of the work']
            : ['Every option kept warm, none chosen', 'Other people waiting on your maybe', 'The deadline makes the decision instead', 'Starting again when it gets hard']
          ).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="fail__remedy serif">
          <span className="label">What it needs</span>
          {j ? 'Permission to change the plan when the facts change.' : 'One decision, made before it is made for you.'}
        </p>
      </div>
    </article>
  )
}

export function Failure() {
  return (
    <section className="section fail" id="failure" aria-labelledby="fail-title">
      <div className="wrap">
        <SectionHead
          index="06"
          name="Failure modes"
          title={
            <span id="fail-title">
              Every strength, <em>overdone,</em> becomes its own trap.
            </span>
          }
          lede="Scroll to push each one past its limit. Openness turns into drift. Closure turns into a plan followed long after it stopped fitting."
        />
        <div className="fail__grid">
          <Panel who="p" />
          <Panel who="j" />
        </div>
        <Reveal className="fail__coda">
          <p className="serif">Too much openness mistakes waiting for freedom. Too much closure mistakes the plan for the world.</p>
        </Reveal>
      </div>
    </section>
  )
}
