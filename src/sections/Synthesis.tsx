import { motion, useReducedMotion } from 'framer-motion'
import { EASE, Reveal, RoomHeader } from '../components/common'
import { STATE_X, TIMELINE, type StrandState } from '../data/timeline'
import './Synthesis.css'

const TOP = 40 /* px height of the transition part of each row's spine */

function Spine({ from, to, side, era }: { from: StrandState; to: StrandState; side?: 'P' | 'A' | 'B'; era?: boolean }) {
  const reduce = useReducedMotion()
  const f = STATE_X[from]
  const t = STATE_X[to]
  const draw = {
    initial: { pathLength: reduce ? 1 : 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, margin: '0px 0px -10% 0px' },
    transition: { duration: 1.1, ease: EASE },
  }
  const run = {
    initial: { scaleY: reduce ? 1 : 0 },
    whileInView: { scaleY: 1 },
    viewport: { once: true, margin: '0px 0px -10% 0px' },
    transition: { duration: 1.1, ease: EASE, delay: reduce ? 0 : 0.5 },
  }
  const aFrom = to === 'emerge' ? f.p : f.a
  const curve = (x1: number, x2: number) => `M${x1} 0 C${x1} ${TOP * 0.55} ${x2} ${TOP * 0.45} ${x2} ${TOP}`

  return (
    <div className="tl-spine" aria-hidden="true">
      <svg className="tl-spine__top" viewBox={`0 0 120 ${TOP}`} preserveAspectRatio="none">
        <motion.path d={curve(f.p, t.p)} className="tl-strand tl-strand--p" {...draw} />
        {t.a !== null && aFrom !== null && <motion.path d={curve(aFrom, t.a)} className="tl-strand tl-strand--a" {...draw} />}
      </svg>
      {/* straight runs are plain rules, so they stretch to any row height without distortion */}
      <motion.span className="tl-run tl-run--p" style={{ left: `${(t.p / 120) * 100}%`, top: TOP }} {...run} />
      {t.a !== null && <motion.span className="tl-run tl-run--a" style={{ left: `${(t.a / 120) * 100}%`, top: TOP }} {...run} />}
      {!era && (side === 'P' || side === 'B') && (
        <span className="tl-mark tl-mark--p" style={{ left: `${(t.p / 120) * 100}%`, top: TOP }} />
      )}
      {!era && (side === 'A' || side === 'B') && t.a !== null && (
        <span className="tl-mark tl-mark--a" style={{ left: `${(t.a / 120) * 100}%`, top: TOP }} />
      )}
    </div>
  )
}

export function Synthesis() {
  /* resolve each row's strand state, eras inheriting from the row before */
  let prev: StrandState = 'solo'
  const rows = TIMELINE.map((r) => {
    const from = prev
    const to = r.kind === 'entry' ? r.state : prev
    prev = to
    return { r, from, to }
  })

  return (
    <section id="synthesis" className="room room--rule syn" aria-labelledby="synthesis-title">
      <div className="wrap">
        <RoomHeader
          numeral="X"
          name="The Synthesis"
          greek="παράδοσις"
          greekGloss="paradosis: transmission, tradition"
          title={<span id="synthesis-title">Two traditions. One philosophical problem.</span>}
          lede={
            <p>
              There is no verdict here. For twenty-three centuries, later thinkers have tried to reconcile the two, to transform
              them, or to set one against the other. Follow the two strands, the <span className="c-plato">Platonic</span> and the{' '}
              <span className="c-aris">Aristotelian</span>, as they separate, run close, and cross.
            </p>
          }
        />

        <div className="tl-legend">
          <span className="tl-legend__i">
            <span className="tl-mark tl-mark--p tl-mark--static" /> Platonic lineage
          </span>
          <span className="tl-legend__i">
            <span className="tl-mark tl-mark--a tl-mark--static" /> Aristotelian lineage
          </span>
          <span className="tl-legend__i">
            <span className="tl-legend__cross" aria-hidden="true" /> Strands close or crossing: reconciliation, harmonisation, synthesis
          </span>
        </div>

        <ol className="tl" aria-label="Timeline of transmission">
          {rows.map(({ r, from, to }, i) =>
            r.kind === 'era' ? (
              <li key={i} className="tl-row tl-row--era">
                <div className="tl-cell tl-cell--left">
                  <Reveal>
                    <h3 className="tl-era display">{r.label}</h3>
                  </Reveal>
                </div>
                <Spine from={from} to={to} era />
                <div className="tl-cell tl-cell--right">
                  <span className="tl-era-rule" />
                </div>
              </li>
            ) : (
              <li key={i} className={`tl-row tl-row--${r.col} tl-row--${r.side}`}>
                <div className="tl-cell tl-cell--left">{r.col === 'left' && <Entry e={r} />}</div>
                <Spine from={from} to={to} side={r.side} />
                <div className="tl-cell tl-cell--right">{r.col === 'right' && <Entry e={r} />}</div>
              </li>
            )
          )}
        </ol>
      </div>
    </section>
  )
}

function Entry({ e }: { e: Extract<(typeof TIMELINE)[number], { kind: 'entry' }> }) {
  const tag = e.side === 'P' ? 'Platonic' : e.side === 'A' ? 'Aristotelian' : 'Both'
  return (
    <Reveal className={`tl-entry tl-entry--${e.side}${e.side === 'P' ? ' side-plato' : e.side === 'A' ? ' side-aris' : ''}`} y={12}>
      <p className="tl-date mono">
        {e.date}
        <span className="tl-tag">{tag}</span>
      </p>
      <h4 className="tl-name">{e.name}</h4>
      <p className="tl-text">{e.text}</p>
      {e.quote && (
        <blockquote className="tl-quote">
          “{e.quote.q}”<footer className="cite">{e.quote.src}</footer>
        </blockquote>
      )}
    </Reveal>
  )
}
