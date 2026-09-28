import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Reveal, SectionHead, rng, seg, useFrameValue } from '../components/common'
import { makeTree } from '../components/tree'
import './Failure.css'

/*
  Each strength, pushed past its limit by scroll.
  Ni: the cone of attention narrows until almost all evidence falls outside it — while certainty climbs.
  Ne: the tree keeps forking past the edge of the frame — while decisions stay at zero.
*/

function CrushWord({ p, text }: { p: MotionValue<number>; text: string }) {
  const ls = useTransform(p, [0, 1], [0.02, -0.16])
  const w = useTransform(p, [0, 1], [92, 62])
  const letterSpacing = useMotionTemplate`${ls}em`
  const fontVariationSettings = useMotionTemplate`'wdth' ${w}`
  return (
    <motion.p className="fail__word fail__word--ni display" style={{ letterSpacing, fontVariationSettings }}>
      {text}
    </motion.p>
  )
}

function DriftWord({ p, text }: { p: MotionValue<number>; text: string }) {
  const letters = text.split('')
  return (
    <p className="fail__word fail__word--ne display" aria-label={text}>
      {letters.map((ch, i) => (
        <DriftLetter key={i} p={p} ch={ch} i={i} n={letters.length} />
      ))}
    </p>
  )
}

function DriftLetter({ p, ch, i, n }: { p: MotionValue<number>; ch: string; i: number; n: number }) {
  const r = rng(90 + i)
  const x = useTransform(p, [0, 1], ['0em', `${(i - n / 2) * 0.09 + (r() - 0.3) * 0.25}em`])
  const y = useTransform(p, [0, 1], ['0em', `${(r() - 0.5) * 0.9}em`])
  const rotate = useTransform(p, [0, 1], [0, (r() - 0.5) * 40])
  const opacity = useTransform(p, [0.5, 1], [1, 0.35 + r() * 0.5])
  return (
    <motion.span className="fail__letter" style={{ x, y, rotate, opacity }} aria-hidden="true">
      {ch === ' ' ? ' ' : ch}
    </motion.span>
  )
}

/* ---------- Ni: tunnel ---------- */

const EYE: [number, number] = [36, 250]

function Tunnel({ e }: { e: number }) {
  const dots = useMemo(() => {
    const r = rng(12)
    return Array.from({ length: 64 }, () => ({ x: 90 + r() * 390, y: 30 + r() * 440, contra: r() < 0.12 }))
  }, [])
  const half = ((42 - 39 * e) * Math.PI) / 180
  const len = 470
  const tx = EYE[0] + Math.cos(half) * len
  const ty1 = EYE[1] - Math.sin(half) * len
  const ty2 = EYE[1] + Math.sin(half) * len
  let inside = 0

  return (
    <svg viewBox="0 0 500 500" className="fail__svg" role="img" aria-label="A cone of attention narrowing until most evidence falls outside it.">
      <path d={`M${EYE[0]},${EYE[1]} L${tx},${ty1} L${tx},${ty2} Z`} className="fail__cone" />
      <line x1={EYE[0]} y1={EYE[1]} x2={500} y2={EYE[1]} className="fail__axis" />
      {dots.map((d, i) => {
        const ang = Math.abs(Math.atan2(d.y - EYE[1], d.x - EYE[0]))
        const inCone = ang <= half
        if (inCone) inside++
        const fade = inCone ? 1 : 1 - e * 0.8
        return d.contra && !inCone ? (
          <g key={i} style={{ opacity: 0.25 + e * 0.75 }}>
            <path d={`M${d.x - 4},${d.y - 4} l8,8 M${d.x + 4},${d.y - 4} l-8,8`} className="fail__contra" />
          </g>
        ) : (
          <circle key={i} cx={d.x} cy={d.y} r={inCone ? 3.6 : 3} className={inCone ? 'fail__in' : 'fail__out'} style={{ opacity: fade }} />
        )
      })}
      <circle cx={EYE[0]} cy={EYE[1]} r={9} className="fail__eye" />
      <circle cx={EYE[0]} cy={EYE[1]} r={3} className="fail__pupil" />
      {e > 0.55 && (
        <g style={{ opacity: seg(e, 0.55, 0.8) }}>
          <line x1={340} y1={70} x2={392} y2={48} className="fail__callout" />
          <text x={396} y={46} className="fail__note">
            disconfirming
          </text>
          <text x={396} y={60} className="fail__note">
            data, unseen
          </text>
        </g>
      )}
      <text x={0} y={494} className="fail__meter">
        EVIDENCE IN VIEW {String(inside).padStart(2, '0')}/64 · CERTAINTY {Math.round(60 + 39 * e)}%
      </text>
    </svg>
  )
}

/* ---------- Ne: sprawl ---------- */

function Sprawl({ e }: { e: number }) {
  const nodes = useMemo(
    () =>
      makeTree({
        seed: 77,
        x: 40,
        y: 250,
        angle: 0,
        len: 120,
        depth: 7,
        spread: 2.6,
        shrink: 0.74,
        kids: (d, r) => (d === 0 ? 3 : 2 + (r() < 0.25 ? 1 : 0)),
      }),
    []
  )
  const whispers = ['and', 'or', 'what if', 'also', 'unless', 'or maybe', 'and then', 'but also']
  const reach = 1 + e * 6.4
  const visible = nodes.filter((n) => n.depth <= reach).length

  return (
    <svg viewBox="0 0 500 500" className="fail__svg" role="img" aria-label="A tree of options that keeps branching past the edge of the frame.">
      <line x1={0} y1={250} x2={500} y2={250} className="fail__axis" />
      {nodes.map((n, i) => {
        if (n.parent < 0) return null
        const vis = seg(reach, n.depth - 1, n.depth)
        if (vis <= 0) return null
        const p = nodes[n.parent]
        return (
          <line
            key={i}
            x1={p.x}
            y1={p.y}
            x2={p.x + (n.x - p.x) * vis}
            y2={p.y + (n.y - p.y) * vis}
            className="fail__branch"
            style={{ strokeWidth: Math.max(0.35, 2 - n.depth * 0.26) }}
          />
        )
      })}
      {nodes.map((n, i) =>
        n.depth > 0 && n.depth <= reach - 0.5 && n.depth < 5 ? <circle key={`c${i}`} cx={n.x} cy={n.y} r={Math.max(1.5, 5 - n.depth)} className="fail__node" /> : null
      )}
      <circle cx={40} cy={250} r={7} className="fail__root" />
      {whispers.map((w, i) => {
        const on = seg(e, 0.25 + i * 0.08, 0.35 + i * 0.08)
        const n = nodes[(i * 37 + 11) % nodes.length]
        return on > 0 ? (
          <text key={w} x={Math.min(470, n.x + 6)} y={n.y - 6} className="fail__whisper" style={{ opacity: on }}>
            {w}…
          </text>
        ) : null
      })}
      <text x={500} y={494} className="fail__meter" textAnchor="end">
        OPTIONS {visible} · DECISIONS 0
      </text>
    </svg>
  )
}

function Panel({ who }: { who: 'ni' | 'ne' }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] })
  const excess = useTransform(scrollYProgress, [0.1, 0.85], [0, 1], { clamp: true })
  const e = useFrameValue(excess)

  const ni = who === 'ni'
  return (
    <article ref={ref} className={`fail__panel fail__panel--${who}`} aria-labelledby={`fail-${who}`}>
      <div className="fail__panel-head">
        <span className="chip label">
          <span className={`chip__mark chip__mark--${who}`} aria-hidden="true" />
          {ni ? 'Ni in excess' : 'Ne in excess'}
        </span>
        <span className="fail__gauge label" aria-hidden="true">
          <span className="fail__gauge-track">
            <span className="fail__gauge-fill" style={{ transform: `scaleX(${e})` }} />
          </span>
          {e < 0.35 ? 'healthy' : e < 0.7 ? 'strained' : 'failure'}
        </span>
      </div>

      <h3 className="fail__title" id={`fail-${who}`}>
        {ni ? 'Tunnel vision' : 'Endless possibility'}
      </h3>
      {ni ? <CrushWord p={excess} text="Over-convergence" /> : <DriftWord p={excess} text="No closure" />}

      <div className="fail__fig">{ni ? <Tunnel e={e} /> : <Sprawl e={e} />}</div>

      <div className="fail__body">
        <ul className="fail__symptoms">
          {(ni
            ? ['Certainty arrives before the evidence does', 'Disconfirming data is filtered out as noise', 'One future, defended against all others', 'The vision becomes a prophecy that fulfils itself']
            : ['Every door opened, no room entered', 'Ten beginnings, no endings', 'Novelty used as a way out of commitment', 'The next idea always more exciting than this one']
          ).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="fail__remedy serif">
          {ni ? (
            <>
              <span className="label">What it needs</span>Contact with data it didn’t predict.
            </>
          ) : (
            <>
              <span className="label">What it needs</span>One thing, finished.
            </>
          )}
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
          lede="Scroll to push each function past its limit. The same motion that made it useful starts to make it blind."
        />
        <div className="fail__grid">
          <Panel who="ni" />
          <Panel who="ne" />
        </div>
        <Reveal className="fail__coda">
          <p className="serif">Too much convergence mistakes a guess for a destiny. Too much divergence mistakes motion for progress.</p>
        </Reveal>
      </div>
    </section>
  )
}
