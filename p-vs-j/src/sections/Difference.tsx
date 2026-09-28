import { useMemo, useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Chip, Reveal, SectionHead, rng, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import { easeInOut } from '../components/tree'
import './Difference.css'

/* ---------- Kinetic words: CLOSURE snaps into line, OPENNESS comes loose ---------- */

function Letter({ p, ch, i, who }: { p: MotionValue<number>; ch: string; i: number; who: 'j' | 'p' }) {
  const r = rng(200 + i + (who === 'j' ? 0 : 50))
  const loose = { y: (r() - 0.5) * 0.7, rot: (r() - 0.5) * 26, x: (r() - 0.5) * 0.18 }
  /* J goes loose → set; P goes set → loose */
  const from = who === 'j' ? 1 : 0
  const to = who === 'j' ? 0 : 1
  const k = useTransform(p, [0, 1], [from, to])
  const y = useTransform(k, (v) => `${loose.y * v}em`)
  const x = useTransform(k, (v) => `${loose.x * v + (who === 'p' ? i * 0.03 * v : 0)}em`)
  const rotate = useTransform(k, (v) => loose.rot * v)
  return (
    <motion.span className="kword__ch" style={{ y, x, rotate }}>
      {ch}
    </motion.span>
  )
}

function KineticWord({ who, word }: { who: 'j' | 'p'; word: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 45%'] })
  const rule = useTransform(scrollYProgress, [0.75, 1], [0, 1])
  return (
    <div ref={ref} className={`kword kword--${who}`}>
      <h3 className="kword__text display" aria-label={word}>
        {word.split('').map((ch, i) => (
          <Letter key={i} p={scrollYProgress} ch={ch} i={i} who={who} />
        ))}
      </h3>
      {who === 'j' && <motion.span className="kword__rule" style={{ scaleX: rule }} aria-hidden="true" />}
    </div>
  )
}

/* ---------- The field: one set of items, sorted or released ---------- */

const COLS = 7
const ROWS = 4
const N = COLS * ROWS

function useItems(seed: number) {
  return useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: N }, (_, i) => ({
      grid: [46 + (i % COLS) * 50, 70 + Math.floor(i / COLS) * 58] as [number, number],
      free: [24 + r() * 372, 22 + r() * 296] as [number, number],
      round: r() < 0.5,
      d: r(),
    }))
  }, [seed])
}

function Field({ who }: { who: 'j' | 'p' }) {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMedia('(min-width: 861px)')
  const p = useDiagramProgress(ref, wide, ['start end', 'center center'], 3.2)
  const t = useFrameValue(p)
  const items = useItems(who === 'j' ? 7 : 8)
  let settled = 0

  return (
    <div className="field" ref={ref}>
      <svg
        viewBox="0 0 420 340"
        className="field__svg"
        role="img"
        aria-label={
          who === 'j'
            ? 'Twenty-eight scattered items snap into a grid and are checked off one by one.'
            : 'Twenty-eight items sorted in a grid come loose and drift into an open field.'
        }
      >
        {/* the grid is always there as a faint ledger */}
        {items.map((it, i) => (
          <rect key={`g${i}`} x={it.grid[0] - 16} y={it.grid[1] - 16} width={32} height={32} className="field__slot" />
        ))}
        {items.map((it, i) => {
          const local = who === 'j' ? seg(t, 0.05 + it.d * 0.45, 0.35 + it.d * 0.45) : seg(t, 0.05 + it.d * 0.4, 0.45 + it.d * 0.4)
          const k = who === 'j' ? backOut(local) : easeInOut(local)
          const [a, b] = who === 'j' ? [it.free, it.grid] : [it.grid, it.free]
          const x = a[0] + (b[0] - a[0]) * k
          const y = a[1] + (b[1] - a[1]) * k
          const done = who === 'j' && local >= 1
          if (done) settled++
          if (who === 'p' && local > 0.5) settled++
          return who === 'j' ? (
            <g key={i}>
              <rect x={x - 11} y={y - 11} width={22} height={22} className={done ? 'field__j-done' : 'field__j-item'} />
              {done && <path d={`M${x - 5},${y} l4,4 l7,-8`} className="field__check" />}
            </g>
          ) : (
            <g key={i}>
              {it.round ? (
                <circle cx={x} cy={y} r={10} className="field__p-item" />
              ) : (
                <rect x={x - 10} y={y - 10} width={20} height={20} rx={10 * k} className="field__p-item" />
              )}
              {local > 0.9 && <circle cx={x} cy={y} r={18} className="field__p-halo" />}
            </g>
          )
        })}
        <text x={410} y={330} textAnchor="end" className="field__cap">
          {who === 'j' ? `DECIDED ${String(settled).padStart(2, '0')}/${N}` : `STILL OPEN ${String(settled).padStart(2, '0')}/${N}`}
        </text>
      </svg>
    </div>
  )
}

const backOut = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

/* ---------- Room ---------- */

export function Difference() {
  return (
    <section className="section diff" id="difference" aria-labelledby="difference-title">
      <div className="wrap">
        <SectionHead
          index="01"
          name="The core difference"
          title={
            <span id="difference-title">
              Not tidy versus messy. A question of <em>when</em> something feels finished.
            </span>
          }
          lede="In type theory, P and J describe how a person meets the outer world: by continuing to take it in, or by coming to conclusions about it. Both get things done. They disagree about when to stop looking."
        />
      </div>

      <article className="diff__row diff__row--p" aria-label="P, openness">
        <div className="wrap">
          <KineticWord who="p" word="Openness" />
          <div className="diff__grid grid">
            <Reveal className="diff__intro">
              <Chip who="p">P — Perceiving</Chip>
              <p className="diff__q serif">“What if we keep it open?”</p>
            </Reveal>
            <div className="diff__fig">
              <Field who="p" />
              <p className="label label--muted diff__figcap">Fig. 1.1 — Release. Sorted items return to a field of options.</p>
            </div>
            <Reveal className="diff__text" delay={0.1}>
              <ul className="diff__terms">
                <li>Exploration</li>
                <li>Adaptation</li>
                <li>Responsiveness</li>
                <li>Deferral</li>
              </ul>
              <p className="body">
                P leads outwardly with a perceiving function. Out in the world it keeps taking things in: sampling, adjusting, noticing what just
                changed. A decision is a door closing, so it waits until the information stops arriving.
              </p>
            </Reveal>
          </div>
        </div>
      </article>

      <div className="wrap">
        <Reveal className="diff__hinge">
          <span className="diff__hinge-line" aria-hidden="true" />
          <p className="serif">Same unfinished world. Opposite reflexes.</p>
          <span className="diff__hinge-line" aria-hidden="true" />
        </Reveal>
      </div>

      <article className="diff__row diff__row--j" aria-label="J, closure">
        <div className="wrap">
          <KineticWord who="j" word="Closure" />
          <div className="diff__grid grid">
            <Reveal className="diff__intro">
              <Chip who="j">J — Judging</Chip>
              <p className="diff__q serif">“Is this decided?”</p>
            </Reveal>
            <div className="diff__fig">
              <Field who="j" />
              <p className="label label--muted diff__figcap">Fig. 1.2 — Settlement. Loose items are placed, then checked off.</p>
            </div>
            <Reveal className="diff__text" delay={0.1}>
              <ul className="diff__terms">
                <li>Decision</li>
                <li>Structure</li>
                <li>Planning</li>
                <li>Completion</li>
              </ul>
              <p className="body">
                J leads outwardly with a judging function. Out in the world it wants things settled: named, scheduled, done. A decision is a load
                set down, and the attention it frees goes straight to the next thing.
              </p>
            </Reveal>
          </div>
        </div>
      </article>
    </section>
  )
}
