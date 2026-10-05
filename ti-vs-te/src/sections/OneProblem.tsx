import { useRef } from 'react'
import { SectionHead, seg, useDiagramProgress, useFrameValue, useMedia } from '../components/common'
import { ease } from '../components/tree'
import './OneProblem.css'

/*
  One problem, two ways through it, scrubbed by scroll.
  Ti: gathers the facts, rejects the easy explanation, and builds the mechanism that explains all of them.
  Te: takes actions, measures each one, and drives the number to zero.
*/

const PROBLEM = 'The office printer jams every Monday morning.'

/* ---------- Ti: the mechanism ---------- */

type Box = { text: string; x: number; y: number; w: number }

const FACTS: Box[] = [
  { text: 'only Mondays', x: 80, y: 60, w: 118 },
  { text: 'only before 10:00', x: 220, y: 60, w: 140 },
  { text: 'worse in winter', x: 368, y: 60, w: 128 },
  { text: 'only tray 2', x: 510, y: 60, w: 100 },
]

const MECH: Box[] = [
  { text: 'heating off at weekends', x: 150, y: 180, w: 196 },
  { text: 'tray 2 sits by the window', x: 430, y: 180, w: 206 },
  { text: 'paper takes on damp', x: 290, y: 290, w: 170 },
  { text: 'damp sheets curl', x: 290, y: 380, w: 146 },
  { text: 'JAM', x: 290, y: 466, w: 70 },
]
const MECH_EDGES: [number, number][] = [
  [0, 2],
  [1, 2],
  [2, 3],
  [3, 4],
]
const FACT_LINKS: [number, number][] = [
  [0, 0],
  [2, 0],
  [3, 1],
  [1, 3],
]
const REJECTED: Box = { text: 'Mondays = more printing?', x: 500, y: 330, w: 190 }

function TiStage({ t }: { t: number }) {
  const facts = seg(t, 0.02, 0.2)
  const rej = seg(t, 0.14, 0.26)
  const strike = seg(t, 0.42, 0.52)
  const mech = seg(t, 0.24, 0.66)
  const links = seg(t, 0.62, 0.82)
  const reading = seg(t, 0.82, 0.98)
  const explained = Math.round(4 * links)

  const node = (b: Box, k: number, cls: string) => (
    <g style={{ opacity: k, transform: `translateY(${(1 - ease(k)) * 8}px)` }}>
      <rect x={b.x - b.w / 2} y={b.y - 15} width={b.w} height={30} className={cls} />
      <text x={b.x} y={b.y + 5} textAnchor="middle" className={`${cls}-text`}>
        {b.text}
      </text>
    </g>
  )

  return (
    <svg viewBox="0 0 640 600" className="opb__svg" role="img" aria-labelledby="opb-ti-desc">
      <desc id="opb-ti-desc">
        Ti: four facts are collected: only Mondays, only before ten, worse in winter, only tray two. The easy explanation, more printing on
        Mondays, is struck out because it does not explain the rest. A mechanism is built: heating off at weekends and tray two by the window make
        the paper take on damp, damp sheets curl, and curled sheets jam.
      </desc>
      <text x={14} y={24} className="opb__lane">
        FACTS
      </text>
      <text x={14} y={150} className="opb__lane">
        MECHANISM
      </text>

      {/* links from facts down to the causes they point at */}
      {FACT_LINKS.map(([f, m], i) => {
        const k = seg(links, i / 4, (i + 1) / 4)
        const F = FACTS[f]
        const M = MECH[m]
        return k > 0 ? (
          <line key={i} x1={F.x} y1={F.y + 15} x2={F.x + (M.x - F.x) * k} y2={F.y + 15 + (M.y - 15 - F.y - 15) * k} className="opb__link" />
        ) : null
      })}

      {MECH_EDGES.map(([a, b], i) => {
        const k = seg(mech, (i + 1) / 5, (i + 2) / 5)
        const A = MECH[a]
        const B = MECH[b]
        return k > 0 ? <line key={i} x1={A.x} y1={A.y + 15} x2={A.x + (B.x - A.x) * k} y2={A.y + 15 + (B.y - 15 - A.y - 15) * k} className="opb__edge" /> : null
      })}

      {FACTS.map((f, i) => (
        <g key={f.text}>{node(f, seg(facts, i / 4, i / 4 + 0.4), 'opb__fact')}</g>
      ))}
      {MECH.map((m, i) => (
        <g key={m.text}>{node(m, seg(mech, i / 5, i / 5 + 0.25), i === 4 ? 'opb__out' : 'opb__mech')}</g>
      ))}

      <g style={{ opacity: rej * (1 - strike * 0.6) }}>
        {node(REJECTED, 1, 'opb__rej')}
        {strike > 0 && (
          <line x1={REJECTED.x - REJECTED.w / 2} x2={REJECTED.x - REJECTED.w / 2 + REJECTED.w * strike} y1={REJECTED.y} y2={REJECTED.y} className="opb__strike" />
        )}
        {strike >= 1 && (
          <text x={REJECTED.x} y={REJECTED.y + 32} textAnchor="middle" className="opb__note">
            DOESN’T EXPLAIN WINTER OR TRAY 2
          </text>
        )}
      </g>

      <g style={{ opacity: reading }}>
        <text x={14} y={540} className="opb__reading">
          <tspan x={14}>Cold, damp paper in tray 2 curls overnight.</tspan>
          <tspan x={14} dy="1.25em">Now every fact has a reason.</tspan>
        </text>
      </g>

      <text x={626} y={596} textAnchor="end" className="opb__count">
        FACTS EXPLAINED {explained}/4
      </text>
    </svg>
  )
}

/* ---------- Te: actions and the number ---------- */

const WEEKS = [6, 6, 5, 3, 3, 1, 1, 0]
const ACTIONS = [
  { week: 1, text: 'Call the vendor', owner: 'Office mgr', effect: '−1' },
  { week: 2, text: 'Move big print runs to Tuesday', owner: 'Team leads', effect: '−2' },
  { week: 4, text: 'Store the paper in the cupboard', owner: 'Reception', effect: '−2' },
  { week: 6, text: 'Fan the paper: Monday checklist', owner: 'First in', effect: '−1' },
]
const CX0 = 70
const CW = 62
const CY0 = 280
const UNIT = 32

function TeStage({ t }: { t: number }) {
  const shown = seg(t, 0.06, 0.86) * WEEKS.length
  const current = WEEKS[Math.min(WEEKS.length - 1, Math.max(0, Math.floor(shown) - 1))]

  return (
    <svg viewBox="0 0 640 600" className="opb__svg" role="img" aria-labelledby="opb-te-desc">
      <desc id="opb-te-desc">
        Te: a bar chart of jams per week falls from six to zero over eight weeks, annotated with four actions: call the vendor, move big print runs
        to Tuesday, store the paper in the cupboard, and add fanning the paper to the Monday checklist.
      </desc>
      <text x={14} y={24} className="opb__lane opb__lane--te">
        JAMS PER WEEK
      </text>
      {[0, 2, 4, 6].map((v) => (
        <g key={v}>
          <line x1={CX0 - 10} x2={CX0 + CW * 8} y1={CY0 - v * UNIT} y2={CY0 - v * UNIT} className={v === 0 ? 'opb__axis' : 'opb__grid'} />
          <text x={CX0 - 18} y={CY0 - v * UNIT + 4} textAnchor="end" className="opb__tick">
            {v}
          </text>
        </g>
      ))}
      {WEEKS.map((v, i) => {
        const k = ease(seg(shown, i, i + 1))
        return (
          <g key={i}>
            <rect x={CX0 + i * CW + 8} width={CW - 16} y={CY0 - v * UNIT * k} height={v * UNIT * k} className={i === WEEKS.length - 1 ? 'opb__bar opb__bar--last' : 'opb__bar'} />
            {v === 0 && k >= 1 && <rect x={CX0 + i * CW + 8} width={CW - 16} y={CY0 - 3} height={3} className="opb__bar" />}
            <text x={CX0 + i * CW + CW / 2} y={CY0 + 18} textAnchor="middle" className="opb__tick">
              W{i + 1}
            </text>
          </g>
        )
      })}
      {ACTIONS.map((a, i) => {
        const k = seg(shown, a.week + 0.4, a.week + 1)
        const x = CX0 + a.week * CW + CW
        return k > 0 ? (
          <g key={i} style={{ opacity: k }}>
            <line x1={x} x2={x} y1={CY0 - 6.5 * UNIT} y2={CY0} className="opb__marker" />
            <path d={`M${x - 6},${CY0 - 6.5 * UNIT} l12,0 l-6,9 Z`} className="opb__marker-head" />
            <text x={x} y={CY0 - 6.5 * UNIT - 8} textAnchor="middle" className="opb__tick opb__tick--strong">
              {String.fromCharCode(65 + i)}
            </text>
          </g>
        ) : null
      })}

      {/* action log */}
      <text x={14} y={336} className="opb__lane opb__lane--te">
        ACTION LOG
      </text>
      {ACTIONS.map((a, i) => {
        const k = seg(shown, a.week + 0.4, a.week + 1)
        const y = 362 + i * 42
        return (
          <g key={a.text} style={{ opacity: 0.25 + k * 0.75 }}>
            <line x1={14} x2={626} y1={y + 18} y2={y + 18} className="opb__grid" />
            <rect x={14} y={y - 12} width={22} height={22} className={k >= 1 ? 'opb__check opb__check--done' : 'opb__check'} />
            {k >= 1 && <path d={`M19,${y - 1} l4,4 l8,-9`} className="opb__tickmark" />}
            <text x={48} y={y + 4} className="opb__log">
              {String.fromCharCode(65 + i)} · {a.text}
            </text>
            <text x={540} y={y + 4} textAnchor="end" className="opb__tick">
              {a.owner.toUpperCase()}
            </text>
            <text x={626} y={y + 4} textAnchor="end" className="opb__effect">
              {a.effect}
            </text>
          </g>
        )
      })}

      <g style={{ opacity: seg(t, 0.86, 0.98) }}>
        <text x={14} y={556} className="opb__reading opb__reading--te">
          <tspan x={14}>Six jams a week to zero in seven weeks.</tspan>
          <tspan x={14} dy="1.25em">Fixed. The why can wait.</tspan>
        </text>
      </g>
      <text x={626} y={596} textAnchor="end" className="opb__count">
        JAMS THIS WEEK {current ?? 6}
      </text>
    </svg>
  )
}

/* ---------- Room ---------- */

export function OneProblem() {
  const wide = useMedia('(min-width: 961px)')
  const trackRef = useRef<HTMLDivElement>(null)
  const tiRef = useRef<HTMLDivElement>(null)
  const teRef = useRef<HTMLDivElement>(null)

  const pTrack = useDiagramProgress(trackRef, wide, ['start start', 'end end'])
  const pTi = useDiagramProgress(tiRef, false, undefined, 5)
  const pTe = useDiagramProgress(teRef, false, undefined, 5)
  const tTrack = useFrameValue(pTrack)
  const tTi = useFrameValue(pTi)
  const tTe = useFrameValue(pTe)

  return (
    <section className="opb" id="one-problem" aria-labelledby="opb-title">
      <div className="wrap section opb__head">
        <SectionHead
          index="02"
          name="One problem, two minds"
          title={
            <span id="opb-title">
              Give them the same <em>broken printer.</em>
            </span>
          }
          lede="Watch what each one counts as solved. One is done when the problem is understood. The other is done when the problem is gone."
        />
      </div>

      <div className={wide ? 'opb__track' : 'opb__flow'} ref={trackRef}>
        <div className="opb__sticky">
          <div className="opb__stage wrap">
            <div className="opb__col opb__col--ti" ref={tiRef}>
              <div className="opb__col-head">
                <span className="chip label">
                  <span className="chip__mark chip__mark--ti" aria-hidden="true" />
                  Ti explains
                </span>
                <span className="label label--muted">Solved when every fact has a reason.</span>
              </div>
              <TiStage t={wide ? tTrack : tTi} />
            </div>

            <div className="opb__obs">
              <div className="opb__printer" aria-hidden="true">
                <span className="opb__printer-paper" />
                <span className="opb__printer-body" />
              </div>
              <p className="label label--muted">Problem</p>
              <p className="opb__obs-text serif">{PROBLEM}</p>
              <div className="opb__meter" aria-hidden="true">
                <span style={{ transform: `scaleX(${wide ? tTrack : 1})` }} />
              </div>
            </div>

            <div className="opb__col opb__col--te" ref={teRef}>
              <div className="opb__col-head">
                <span className="chip label">
                  <span className="chip__mark chip__mark--te" aria-hidden="true" />
                  Te fixes
                </span>
                <span className="label label--muted">Solved when the number reaches zero.</span>
              </div>
              <TeStage t={wide ? tTrack : tTe} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
