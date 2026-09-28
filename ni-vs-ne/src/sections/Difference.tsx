import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { Chip, Reveal, SectionHead, rng, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import { easeInOut, fitTree, makeTree, treePos, treeVisible } from '../components/tree'
import './Difference.css'

/* ---------- Kinetic word: the word does what it names ---------- */

function KineticWord({ who, word }: { who: 'ni' | 'ne'; word: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 40%'] })
  const from = who === 'ni' ? [125, 0.14] : [62, -0.02]
  const to = who === 'ni' ? [62, -0.03] : [125, 0.09]
  const w = useTransform(scrollYProgress, [0, 1], [from[0], to[0]])
  const ls = useTransform(scrollYProgress, [0, 1], [from[1], to[1]])
  const fv = useMotionTemplate`'wdth' ${w}`
  const lsv = useMotionTemplate`${ls}em`
  return (
    <div ref={ref} className={`kword kword--${who}`}>
      <motion.h3 className="kword__text display" style={{ fontVariationSettings: fv, letterSpacing: lsv }}>
        {word}
      </motion.h3>
    </div>
  )
}

/* ---------- Ni: scattered marks drawn to a single point ---------- */

const NI_FOCUS: [number, number] = [372, 170]

function NiField() {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMedia('(min-width: 861px)')
  const p = useDiagramProgress(ref, wide, ['start end', 'center center'], 3.2)
  const t = useFrameValue(p)
  const dots = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: 34 }, () => ({ x: 20 + r() * 300, y: 20 + r() * 300, d: r() }))
  }, [])

  return (
    <div className="field" ref={ref}>
      <svg viewBox="0 0 420 340" className="field__svg" role="img" aria-label="Thirty-four scattered points drawn together into one point.">
        <line x1={0} y1={NI_FOCUS[1]} x2={420} y2={NI_FOCUS[1]} className="field__axis" />
        {/* where each signal started: the many stay visible as a trace */}
        {dots.map((d, i) => (
          <circle key={`g${i}`} cx={d.x} cy={d.y} r={3} className="field__ni-ghost" style={{ opacity: seg(t, 0.1, 0.5) }} />
        ))}
        {dots.map((d, i) => {
          const k = easeInOut(seg(t, 0.05 + d.d * 0.3, 0.6 + d.d * 0.35))
          const x = d.x + (NI_FOCUS[0] - d.x) * k
          const y = d.y + (NI_FOCUS[1] - d.y) * k
          return (
            <g key={i}>
              <line x1={d.x} y1={d.y} x2={NI_FOCUS[0]} y2={NI_FOCUS[1]} className="field__ni-line" style={{ opacity: 0.08 + k * 0.4 }} />
              <circle cx={x} cy={y} r={3.2 - k * 1.4} className="field__ni-dot" />
            </g>
          )
        })}
        <circle cx={NI_FOCUS[0]} cy={NI_FOCUS[1]} r={4 + seg(t, 0.7, 1) * 10} className="field__ni-focus" />
        <text x={NI_FOCUS[0]} y={NI_FOCUS[1] + 40} className="field__cap" textAnchor="middle">
          {Math.max(1, Math.round(34 - 33 * seg(t, 0.1, 0.95)))} → 1
        </text>
      </svg>
    </div>
  )
}

/* ---------- Ne: one mark opening into a web ---------- */

function NeField() {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMedia('(min-width: 861px)')
  const p = useDiagramProgress(ref, wide, ['start end', 'center center'], 3.2)
  const t = useFrameValue(p)
  const nodes = useMemo(
    () =>
      fitTree(makeTree({ seed: 5, x: 48, y: 170, angle: 0, len: 88, depth: 4, spread: 2.1, shrink: 0.74 }), {
        x0: 20,
        y0: 18,
        x1: 404,
        y1: 322,
      }),
    []
  )
  /* a few lateral links between distant branches: Ne connects, not just splits */
  const links = useMemo(() => {
    const r = rng(3)
    const leaves = nodes.map((n, i) => ({ n, i })).filter((o) => o.n.depth >= 3)
    return Array.from({ length: 7 }, () => {
      const a = leaves[Math.floor(r() * leaves.length)].i
      const b = leaves[Math.floor(r() * leaves.length)].i
      return [a, b] as const
    }).filter(([a, b]) => a !== b)
  }, [nodes])

  const pos = nodes.map((_, i) => treePos(nodes, i, t, 4))
  const linkT = seg(t, 0.8, 1)

  return (
    <div className="field" ref={ref}>
      <svg viewBox="0 0 420 340" className="field__svg" role="img" aria-label="One point opening into a branching web of many points, with cross-links between branches.">
        <line x1={0} y1={170} x2={420} y2={170} className="field__axis" />
        {links.map(([a, b], i) => (
          <line
            key={`l${i}`}
            x1={pos[a][0]}
            y1={pos[a][1]}
            x2={pos[b][0]}
            y2={pos[b][1]}
            className="field__ne-link"
            style={{ opacity: linkT * 0.7 }}
          />
        ))}
        {nodes.map((n, i) =>
          n.parent < 0 ? null : (
            <line
              key={`e${i}`}
              x1={pos[n.parent][0]}
              y1={pos[n.parent][1]}
              x2={pos[i][0]}
              y2={pos[i][1]}
              className="field__ne-line"
              style={{ opacity: treeVisible(n, t, 4) }}
            />
          )
        )}
        {nodes.map((n, i) => (
          <circle
            key={`n${i}`}
            cx={pos[i][0]}
            cy={pos[i][1]}
            r={n.depth === 0 ? 6 : 4.2 - n.depth * 0.5}
            className={n.depth === 0 ? 'field__ne-origin' : 'field__ne-dot'}
            style={{ opacity: treeVisible(n, t, 4) }}
          />
        ))}
        <text x={48} y={210} className="field__cap" textAnchor="middle">
          1 → {Math.max(1, Math.round(1 + (nodes.length - 1) * seg(t, 0.05, 0.9)))}
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
              Both perceive what isn’t there <em>yet.</em> They travel in opposite directions.
            </span>
          }
          lede="Intuition is the perception of the not-yet: patterns, implications, possibilities. Ni draws them inward toward one meaning. Ne carries them outward into many."
        />
      </div>

      <article className="diff__row diff__row--ni" aria-label="Ni, convergence">
        <div className="wrap">
          <KineticWord who="ni" word="Convergence" />
          <div className="diff__grid grid">
            <Reveal className="diff__intro">
              <Chip who="ni">Ni — Introverted intuition</Chip>
              <p className="diff__q serif">“Where is this all leading?”</p>
            </Reveal>
            <div className="diff__fig">
              <NiField />
              <p className="label label--muted diff__figcap">Fig. 1.1 — Compression. Many signals, one point of arrival.</p>
            </div>
            <Reveal className="diff__text" delay={0.1}>
              <ul className="diff__terms">
                <li>Synthesis</li>
                <li>Underlying pattern</li>
                <li>Implication</li>
                <li>Inevitability</li>
              </ul>
              <p className="body">
                Ni works beneath the surface of events, folding scattered impressions into a single, often wordless sense of what they amount to.
                It does not collect options. It removes them until what remains feels less like a choice than a recognition.
              </p>
            </Reveal>
          </div>
        </div>
      </article>

      <div className="wrap">
        <Reveal className="diff__hinge">
          <span className="diff__hinge-line" aria-hidden="true" />
          <p className="serif">Same raw material. Opposite vectors.</p>
          <span className="diff__hinge-line" aria-hidden="true" />
        </Reveal>
      </div>

      <article className="diff__row diff__row--ne" aria-label="Ne, divergence">
        <div className="wrap">
          <KineticWord who="ne" word="Divergence" />
          <div className="diff__grid grid">
            <Reveal className="diff__intro">
              <Chip who="ne">Ne — Extraverted intuition</Chip>
              <p className="diff__q serif">“What else could this become?”</p>
            </Reveal>
            <div className="diff__fig">
              <NeField />
              <p className="label label--muted diff__figcap">Fig. 1.2 — Expansion. One signal, a web of connections.</p>
            </div>
            <Reveal className="diff__text" delay={0.1}>
              <ul className="diff__terms">
                <li>Association</li>
                <li>Connection</li>
                <li>Possibility</li>
                <li>Reframing</li>
              </ul>
              <p className="body">
                Ne works across the surface of the world, catching the resemblance between things that were never meant to meet. A detail is
                never only itself: it is a doorway, and behind every doorway there are three more.
              </p>
            </Reveal>
          </div>
        </div>
      </article>
    </section>
  )
}
