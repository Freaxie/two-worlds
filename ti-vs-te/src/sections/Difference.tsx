import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Chip, Reveal, SectionHead, rng, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import { ease, easeInOut } from '../components/tree'
import './Difference.css'

/* ---------- Kinetic words ---------- */

/* PRECISION: irregular letters settle into exact, equal cells, then each cell is drawn */
function TiLetter({ p, ch, i }: { p: MotionValue<number>; ch: string; i: number }) {
  const r = rng(300 + i)
  const x = useTransform(p, [0, 0.8], [`${(r() - 0.5) * 0.25}em`, '0em'])
  const y = useTransform(p, [0, 0.8], [`${(r() - 0.5) * 0.3}em`, '0em'])
  const rotate = useTransform(p, [0, 0.8], [(r() - 0.5) * 8, 0])
  const box = useTransform(p, [0.75 + i * 0.02, 0.9 + i * 0.02], [0, 1])
  return (
    <motion.span className="kword__cell" style={{ x, y, rotate }}>
      <motion.span className="kword__box" style={{ opacity: box, scale: box }} aria-hidden="true" />
      {ch}
    </motion.span>
  )
}

function TiWord({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 45%'] })
  return (
    <div ref={ref} className="kword kword--ti">
      <h3 className="kword__text display" aria-label={word}>
        {word.split('').map((ch, i) => (
          <TiLetter key={i} p={scrollYProgress} ch={ch} i={i} />
        ))}
      </h3>
    </div>
  )
}

/* EFFICIENCY: the gaps between letters are waste, and they are taken out */
function TeWord({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 45%'] })
  const ls = useTransform(scrollYProgress, [0, 1], [0.32, -0.02])
  const letterSpacing = useMotionTemplate`${ls}em`
  const bar = useTransform(scrollYProgress, [0.7, 1], [0, 1])
  return (
    <div ref={ref} className="kword kword--te">
      <motion.h3 className="kword__text display" style={{ letterSpacing }}>
        {word}
        <motion.span className="kword__arrow" style={{ opacity: bar }} aria-hidden="true">
          →
        </motion.span>
      </motion.h3>
      <motion.span className="kword__bar" style={{ scaleX: bar }} aria-hidden="true" />
    </div>
  )
}

/* ---------- Ti field: loose claims organised into a proof, the contradiction removed ---------- */

type Claim = { id: string; level: number; x: number; y: number; parents: number[]; bad?: boolean }

const CLAIMS: Claim[] = [
  { id: 'A1', level: 0, x: 140, y: 50, parents: [] },
  { id: 'A2', level: 0, x: 280, y: 50, parents: [] },
  { id: 'L1', level: 1, x: 70, y: 130, parents: [0] },
  { id: 'L2', level: 1, x: 170, y: 130, parents: [0, 1] },
  { id: 'L3', level: 1, x: 260, y: 130, parents: [1] },
  { id: 'L4', level: 1, x: 350, y: 130, parents: [1] },
  { id: 'T1', level: 2, x: 110, y: 210, parents: [2, 3] },
  { id: 'T2', level: 2, x: 215, y: 210, parents: [3, 4] },
  { id: 'T3', level: 2, x: 310, y: 210, parents: [4, 5] },
  { id: 'C1', level: 3, x: 160, y: 290, parents: [6, 7] },
  { id: 'C2', level: 3, x: 270, y: 290, parents: [7, 8] },
  { id: 'X?', level: 2, x: 390, y: 220, parents: [], bad: true },
]

function TiField() {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMedia('(min-width: 861px)')
  const p = useDiagramProgress(ref, wide, ['start end', 'center center'], 3.4)
  const t = useFrameValue(p)
  const raw = useMemo(() => {
    const r = rng(17)
    return CLAIMS.map(() => [40 + r() * 340, 40 + r() * 260] as [number, number])
  }, [])

  const pos = CLAIMS.map((c, i) => {
    const k = easeInOut(seg(t, 0.05 + c.level * 0.07, 0.4 + c.level * 0.07))
    return [raw[i][0] + (c.x - raw[i][0]) * k, raw[i][1] + (c.y - raw[i][1]) * k] as [number, number]
  })
  const strike = seg(t, 0.7, 0.85)
  const gone = seg(t, 0.85, 1)
  const consistent = CLAIMS.filter((c, i) => !c.bad && seg(t, 0.35 + c.level * 0.1, 0.5 + c.level * 0.1) >= 1 && i >= 0).length

  return (
    <div className="field" ref={ref}>
      <svg viewBox="0 0 420 340" className="field__svg" role="img" aria-label="Twelve loose claims arrange into a proof: two axioms at the top, lemmas and theorems below, each linked to what it follows from. One claim contradicts the rest and is struck out.">
        {CLAIMS.map((c, i) =>
          c.parents.map((pi) => {
            const k = seg(t, 0.35 + c.level * 0.1, 0.5 + c.level * 0.1)
            if (k <= 0) return null
            const [x1, y1] = pos[pi]
            const [x2, y2] = pos[i]
            return <line key={`${i}-${pi}`} x1={x1} y1={y1 + 11} x2={x1 + (x2 - x1) * k} y2={y1 + 11 + (y2 - 11 - y1 - 11) * k} className="field__ti-edge" />
          })
        )}
        {CLAIMS.map((c, i) => {
          const [x, y] = pos[i]
          const o = c.bad ? 1 - gone : 1
          return (
            <g key={c.id} style={{ opacity: o, transform: c.bad ? `translate(${gone * 30}px, ${gone * 20}px)` : undefined }}>
              <rect x={x - 17} y={y - 11} width={34} height={22} className={c.level === 0 ? 'field__ti-axiom' : c.bad ? 'field__ti-bad' : 'field__ti-node'} />
              <text x={x} y={y + 4} textAnchor="middle" className={c.level === 0 ? 'field__ti-label field__ti-label--axiom' : 'field__ti-label'}>
                {c.id}
              </text>
              {c.bad && strike > 0 && <path d={`M${x - 17},${y - 11} l${34 * strike},${22 * strike}`} className="field__ti-strike" />}
            </g>
          )
        })}
        <text x={410} y={330} textAnchor="end" className="field__cap">
          FOLLOWS FROM AXIOMS {String(consistent).padStart(2, '0')}/11 · CONTRADICTIONS {gone >= 1 ? 0 : 1}
        </text>
      </svg>
    </div>
  )
}

/* ---------- Te field: work moving through a line and shipping ---------- */

const STATIONS = [
  { x: 110, label: 'INTAKE' },
  { x: 200, label: 'BUILD' },
  { x: 290, label: 'CHECK' },
]
const ITEMS = 20

function TeField() {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMedia('(min-width: 861px)')
  const p = useDiagramProgress(ref, wide, ['start end', 'center center'], 3.4)
  const t = useFrameValue(p)
  let shipped = 0

  return (
    <div className="field" ref={ref}>
      <svg viewBox="0 0 420 340" className="field__svg" role="img" aria-label="Twenty work items move through intake, build and check stations and stack up as shipped output.">
        <line x1={0} x2={340} y1={170} y2={170} className="field__te-belt" />
        {STATIONS.map((s) => (
          <g key={s.label}>
            <rect x={s.x - 18} y={120} width={36} height={100} className="field__te-station" />
            <text x={s.x} y={108} textAnchor="middle" className="field__te-label">
              {s.label}
            </text>
          </g>
        ))}
        {/* shipped stack */}
        <rect x={352} y={58} width={56} height={252} className="field__te-bin" />
        <text x={380} y={48} textAnchor="middle" className="field__te-label">
          SHIPPED
        </text>
        {Array.from({ length: ITEMS }, (_, i) => {
          const k = seg(t, i * 0.035, i * 0.035 + 0.3)
          if (k <= 0) return null
          const done = k >= 1
          if (done) shipped++
          const slot = i
          const sx = 362 + (slot % 3) * 13
          const sy = 296 - Math.floor(slot / 3) * 13
          const x = done ? sx : -10 + ease(k) * 350
          const y = done ? sy : 164
          return <rect key={i} x={x} y={y} width={11} height={11} className={done ? 'field__te-done' : 'field__te-item'} />
        })}
        <text x={10} y={330} className="field__cap">
          SHIPPED {String(shipped).padStart(2, '0')}/{ITEMS} · CYCLE TIME 0.3
        </text>
      </svg>
    </div>
  )
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
              Both are logic. One checks the <em>model,</em> the other checks the <em>world.</em>
            </span>
          }
          lede="Ti and Te are both thinking functions: ways of judging by reason rather than by value. Ti holds an argument up against its own internal framework. Te holds a plan up against outcomes you can measure."
        />
      </div>

      <article className="diff__row diff__row--ti" aria-label="Ti, internal logic">
        <div className="wrap">
          <TiWord word="Precision" />
          <div className="diff__grid grid">
            <Reveal className="diff__intro">
              <Chip who="ti">Ti — Introverted thinking</Chip>
              <p className="diff__q serif">“Does this make sense?”</p>
            </Reveal>
            <div className="diff__fig">
              <TiField />
              <p className="label label--muted diff__figcap">Fig. 1.1 — Derivation. Loose claims are ordered by what follows from what.</p>
            </div>
            <Reveal className="diff__text" delay={0.1}>
              <ul className="diff__terms">
                <li>Definition</li>
                <li>Consistency</li>
                <li>Mechanism</li>
                <li>First principles</li>
              </ul>
              <p className="body">
                Ti builds a private model of how things work and tests every new idea against it. A claim is accepted when it fits, and a single
                contradiction is enough to stop everything until it is resolved. Being understood matters more than being agreed with.
              </p>
            </Reveal>
          </div>
        </div>
      </article>

      <div className="wrap">
        <Reveal className="diff__hinge">
          <span className="diff__hinge-line" aria-hidden="true" />
          <p className="serif">Same reasoning. Different court of appeal.</p>
          <span className="diff__hinge-line" aria-hidden="true" />
        </Reveal>
      </div>

      <article className="diff__row diff__row--te" aria-label="Te, external logic">
        <div className="wrap">
          <TeWord word="Efficiency" />
          <div className="diff__grid grid">
            <Reveal className="diff__intro">
              <Chip who="te">Te — Extraverted thinking</Chip>
              <p className="diff__q serif">“Does this work?”</p>
            </Reveal>
            <div className="diff__fig">
              <TeField />
              <p className="label label--muted diff__figcap">Fig. 1.2 — Throughput. Work flows through a line and comes out done.</p>
            </div>
            <Reveal className="diff__text" delay={0.1}>
              <ul className="diff__terms">
                <li>Results</li>
                <li>Organisation</li>
                <li>Evidence</li>
                <li>Execution</li>
              </ul>
              <p className="body">
                Te organises the world outside: people, resources, steps, numbers. A method is accepted when it produces results others can see
                and check. If it works and keeps working, the full explanation can come later, or not at all.
              </p>
            </Reveal>
          </div>
        </div>
      </article>
    </section>
  )
}
