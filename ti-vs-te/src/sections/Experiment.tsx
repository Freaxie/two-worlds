import { useReducer, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE, Guides, Mark, PartHead, Tag } from '../lib/ui'
import {
  ACTIONS,
  HOURS,
  INSIGHT,
  SHUTDOWN,
  TARGET,
  available,
  initial,
  step,
  verdict,
  type ActionId,
  type State,
  type Who,
} from '../data/experiment'
import './Experiment.css'

type Ev = { type: 'act'; id: ActionId } | { type: 'reset' }
const reducer = (s: State, e: Ev) => (e.type === 'reset' ? initial : step(s, e.id))

export function Experiment() {
  const [s, dispatch] = useReducer(reducer, initial)
  const [mode, setMode] = useState<Who>('ti')
  const last = s.log[s.log.length - 1]
  const fix = ACTIONS.find((a) => a.id === 'e-fix')!
  const fixReady = available(s, fix)

  return (
    <section id="experiment" className="part part--rule part--deep exp" aria-labelledby="experiment-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="experiment"
          n="06"
          name="Interactive experiment"
          title={['The loop', 'is overheating.']}
          lede={
            <>
              A data hall’s cooling loop is climbing toward shutdown at {SHUTDOWN}°C. You have {HOURS} hours before the
              maintenance window closes. Every move costs an hour. Switch between the two functions as often as you like —
              they see the same system, but they do not see the same things.
            </>
          }
        />

        <div className="exp__lab">
          <div className="exp__main">
            <div className="exp__bar">
              <ModeSwitch mode={mode} setMode={setMode} />
              <span className="label label--muted exp__lens-note">
                {mode === 'ti' ? 'Lens: structure, definitions, contradictions' : 'Lens: readings, levers, results'}
              </span>
            </div>
            <Loop s={s} mode={mode} />
            <Gauges s={s} />
          </div>

          <aside className="exp__side" aria-label="Moves">
            <div className="exp__insight" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={last ? `${last.id}-${s.log.length}` : 'brief'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {last ? (
                    <>
                      <Tag who={last.who}>Hour {last.hour}</Tag>
                      <p>{INSIGHT[last.id]}</p>
                    </>
                  ) : (
                    <>
                      <span className="label label--muted">Briefing</span>
                      <p>Temperature {s.temp}°C and rising 2°C an hour. Target: ≤ {TARGET}°C, stable. Load has not changed. Nobody knows why.</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {s.status === 'running' ? (
              <>
                <ul className="exp__moves">
                  {ACTIONS.filter((a) => a.who === mode).map((a) => {
                    const ok = available(s, a)
                    const used = !a.repeatable && s.done.includes(a.id)
                    const locked = !ok && !used
                    return (
                      <li key={a.id}>
                        <button
                          className={`exp__move exp__move--${a.who}${used ? ' is-used' : ''}`}
                          disabled={!ok}
                          onClick={() => dispatch({ type: 'act', id: a.id })}
                        >
                          <span className="exp__move-label">{locked && a.lockedLabel ? a.lockedLabel : a.label}</span>
                          <span className="exp__move-hint">
                            {used
                              ? 'Done'
                              : locked
                                ? a.needsUnderstanding
                                  ? `No target yet — needs ${a.needsUnderstanding}% understanding`
                                  : 'Requires the previous insight'
                                : a.hint}
                          </span>
                          <span className="exp__move-cost mono" aria-hidden="true">
                            +1h
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <Nudge s={s} mode={mode} fixReady={fixReady} setMode={setMode} />
              </>
            ) : (
              <Outcome s={s} onReset={() => dispatch({ type: 'reset' })} />
            )}
          </aside>
        </div>

        <Trace s={s} onReset={() => dispatch({ type: 'reset' })} />
      </div>
    </section>
  )
}

/* ---------- Mode switch ---------- */

function ModeSwitch({ mode, setMode }: { mode: Who; setMode: (m: Who) => void }) {
  return (
    <div className="exp__switch" role="group" aria-label="Thinking mode">
      {(['ti', 'te'] as const).map((m) => (
        <button key={m} className={`exp__switch-btn${mode === m ? ' is-on' : ''}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
          {mode === m && (
            <motion.span layoutId="exp-switch" className={`exp__switch-bg exp__switch-bg--${m}`} transition={{ duration: 0.5, ease: EASE }} />
          )}
          <span className="exp__switch-inner">
            <Mark who={m} size={14} />
            <b>{m === 'ti' ? 'Ti' : 'Te'}</b>
            <span className="exp__switch-sub">{m === 'ti' ? 'Does it make sense?' : 'Does it work?'}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function Nudge({ s, mode, fixReady, setMode }: { s: State; mode: Who; fixReady: boolean; setMode: (m: Who) => void }) {
  let text: string | null = null
  let to: Who | null = null
  if (mode === 'ti' && fixReady && !s.valveClosed) {
    text = 'The model now points at a component. Understanding alone will not cool it.'
    to = 'te'
  } else if (mode === 'te' && !fixReady && s.log.filter((e) => e.who === 'te').length >= 2) {
    text = 'Te is pulling levers without a target. Something has to say where the fault is.'
    to = 'ti'
  }
  return (
    <AnimatePresence>
      {text && to && (
        <motion.p
          className={`exp__nudge exp__nudge--${to}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {text}{' '}
          <button className="textbtn exp__nudge-btn" onClick={() => setMode(to)}>
            Switch to {to === 'ti' ? 'Ti' : 'Te'} →
          </button>
        </motion.p>
      )}
    </AnimatePresence>
  )
}

function Outcome({ s, onReset }: { s: State; onReset: () => void }) {
  const v = verdict(s)
  return (
    <motion.div
      className={`exp__outcome exp__outcome--${s.status}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <span className="label label--muted">Result</span>
      <p className="exp__outcome-head display">{v.head}</p>
      <p className="exp__outcome-body">{v.body}</p>
      <button className="exp__reset label" onClick={onReset}>
        Run it again ↺
      </button>
    </motion.div>
  )
}

/* ---------- Gauges ---------- */

function Gauges({ s }: { s: State }) {
  const tPct = ((s.temp - 60) / (SHUTDOWN - 60)) * 100
  const targetPct = ((TARGET - 60) / (SHUTDOWN - 60)) * 100
  return (
    <div className="exp__gauges">
      <div className="exp__g exp__g--hours">
        <span className="label label--muted">Hour</span>
        <span className="exp__g-num">
          {s.hour}
          <small>/{HOURS}</small>
        </span>
        <span className="exp__ticks" aria-hidden="true">
          {Array.from({ length: HOURS }, (_, i) => {
            const e = s.log[i]
            return <span key={i} className={e ? `on ${e.who}` : ''} />
          })}
        </span>
      </div>
      <div className="exp__g exp__g--temp">
        <span className="label label--muted">Temperature</span>
        <motion.span className="exp__g-num" key={s.temp} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }}>
          {s.temp}
          <small>°C</small>
        </motion.span>
        <span className="exp__scale" aria-hidden="true">
          <span className="exp__scale-target" style={{ left: `${targetPct}%` }} />
          <motion.span className="exp__scale-dot" animate={{ left: `${Math.max(0, Math.min(100, tPct))}%` }} transition={{ duration: 0.8, ease: EASE }} />
        </span>
        <span className="exp__scale-legend mono" aria-hidden="true">
          <span>60</span>
          <span>{SHUTDOWN} off</span>
        </span>
      </div>
      <Meter label="Understanding" value={s.understanding} who="ti" />
      <Meter label="Throughput" value={s.throughput} who="te" />
    </div>
  )
}

function Meter({ label, value, who }: { label: string; value: number; who: Who }) {
  return (
    <div className="exp__g">
      <span className={`label ${who}`}>{label}</span>
      <span className="exp__g-num">
        {value}
        <small>%</small>
      </span>
      <span className="exp__meter" aria-hidden="true">
        <motion.span className={`exp__meter-fill ${who}`} animate={{ scaleX: value / 100 }} transition={{ duration: 0.8, ease: EASE }} />
      </span>
    </div>
  )
}

/* ---------- Trace: the record of which function did what ---------- */

function Trace({ s, onReset }: { s: State; onReset: () => void }) {
  const ti = s.log.filter((e) => e.who === 'ti').length
  const te = s.log.length - ti
  return (
    <div className="exp__trace">
      <div className="exp__trace-head">
        <span className="label">Your trace</span>
        <span className="label label--muted">
          <span className="ti">{ti} Ti</span> · <span className="te">{te} Te</span>
        </span>
        {s.log.length > 0 && s.status === 'running' && (
          <button className="textbtn label label--muted exp__trace-reset" onClick={onReset}>
            Reset ↺
          </button>
        )}
      </div>
      <ol className="exp__trace-row">
        {Array.from({ length: HOURS }, (_, i) => {
          const e = s.log[i]
          const a = e && ACTIONS.find((x) => x.id === e.id)
          return (
            <li key={i} className={`exp__trace-cell${e ? ` is-${e.who}` : ''}`}>
              <span className="mono">h{i + 1}</span>
              <AnimatePresence>
                {e && a && (
                  <motion.span
                    className="exp__trace-mark"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <Mark who={e.who} size={16} />
                    <span>{a.label}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------- The cooling loop schematic, seen through two lenses ---------- */

function Flow({ d, rate, dir = 1 }: { d: string; rate: number; dir?: 1 | -1 }) {
  const reduce = useReducedMotion()
  if (rate <= 0) return <path d={d} className="loop__pipe" />
  return (
    <>
      <path d={d} className="loop__pipe" />
      <motion.path
        d={d}
        className="loop__flow"
        style={{ opacity: 0.25 + rate * 0.75 }}
        animate={reduce ? undefined : { strokeDashoffset: [0, -24 * dir] }}
        transition={{ duration: 1.4 / (0.3 + rate), repeat: Infinity, ease: 'linear' }}
      />
    </>
  )
}

function Loop({ s, mode }: { s: State; mode: Who }) {
  const reduce = useReducedMotion()
  const has = (id: ActionId) => s.done.includes(id)
  const hxRate = s.valveClosed ? 1 : 0.55
  const heat = Math.max(0, Math.min(1, (s.temp - 60) / 40))

  return (
    <svg className="loop" viewBox="0 0 640 360" role="img" aria-label={`Cooling loop schematic. Temperature ${s.temp} degrees. Bypass valve ${s.valveClosed ? 'closed' : 'open'}.`}>
      {/* pipes & flow */}
      <Flow d="M170 130 H380" rate={1} />
      <Flow d="M380 130 H480" rate={hxRate} />
      <Flow d="M480 250 H380" rate={hxRate} />
      <Flow d="M380 250 H170" rate={1} />
      <Flow d="M380 130 V250" rate={s.valveClosed ? 0 : 0.45} />

      {/* racks */}
      <g>
        <rect x="40" y="96" width="130" height="188" className="loop__box" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={54 + i * 29} y="112" width="18" height="156" fill="var(--ink)" fillOpacity={0.08 + heat * 0.5 * (s.throughput / 100)} />
        ))}
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${72 + i * 28} 86 q 6 -8 0 -16 q -6 -8 0 -16`}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.2"
            animate={reduce ? { opacity: heat } : { opacity: [0, heat, 0], y: [4, -6, -12] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
        <text x="105" y="304" textAnchor="middle" className="svg-mono" fill="var(--ink)">
          racks
        </text>
      </g>

      {/* exchanger */}
      <g>
        <rect x="480" y="96" width="120" height="188" className="loop__box" />
        <path d="M480 130 H500 V 250 M500 150 H580 M500 170 H580 M500 190 H580 M500 210 H580 M500 230 H580 M580 150 V230" fill="none" stroke="var(--ink)" strokeOpacity={0.25 + hxRate * 0.6} />
        <text x="540" y="304" textAnchor="middle" className="svg-mono" fill="var(--ink)">
          exchanger
        </text>
      </g>

      {/* pumps */}
      {[0, 1].map((i) =>
        i < s.pumps ? (
          <motion.g key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: `${250 + i * 60}px`, originY: '250px' }}>
            <circle cx={250 + i * 60} cy="250" r="16" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
            <path d={`M${243 + i * 60} 250 l12 -7 v14 z`} fill="var(--ink)" />
          </motion.g>
        ) : null
      )}
      <text x="250" y="286" textAnchor="middle" className="svg-mono" fill="var(--ink)">
        pump
      </text>

      {/* bypass valve */}
      <g>
        <motion.path
          d="M368 178 L392 202 L392 178 L368 202 Z"
          stroke="var(--ink)"
          strokeWidth="1.5"
          animate={{ fill: s.valveClosed ? 'var(--ink)' : 'var(--paper)' }}
          transform="rotate(90 380 190)"
        />
        <text x="398" y="186" className="svg-mono" fill="var(--ink)">
          bypass
        </text>
        <text x="398" y="200" className="svg-mono" fill="var(--muted)">
          {s.valveClosed ? 'closed' : 'open?'}
        </text>
      </g>

      {/* ---------- Ti lens ---------- */}
      <AnimatePresence>
        {mode === 'ti' && (
          <motion.g key="ti" className="loop__lens" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <Known on={has('t-define')} x={20} y={46}>
              <rect x="20" y="60" width="600" height="262" fill="none" stroke="var(--ti)" strokeDasharray="4 6" />
              <text x="28" y="52" className="svg-mono" fill="var(--ti)">
                system: Q_in &gt; Q_out
              </text>
            </Known>
            <Known on={has('t-model')} x={540} y={82}>
              <path d="M540 36 V88 M534 80 l6 8 6 -8" fill="none" stroke="var(--ti)" strokeWidth="1.5" />
              <text x="548" y="42" className="svg-mono" fill="var(--ti)">
                only exit for heat
              </text>
            </Known>
            <Known on={has('t-contradict')} x={430} y={120}>
              <text x="250" y="226" textAnchor="middle" className="svg-mono" fill="var(--ti)">
                100%
              </text>
              <text x="430" y="122" textAnchor="middle" className="svg-mono" fill="var(--ti)">
                55%
              </text>
              <text x="340" y="226" textAnchor="middle" className="loop__neq" fill="var(--ti)">
                ≠
              </text>
            </Known>
            <Known on={has('t-derive')} x={330} y={190}>
              <motion.circle cx="380" cy="190" r="30" fill="none" stroke="var(--ti)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
              <text x="344" y="194" textAnchor="end" className="svg-mono" fill="var(--ti)">
                cause
              </text>
            </Known>
          </motion.g>
        )}

        {/* ---------- Te lens ---------- */}
        {mode === 'te' && (
          <motion.g key="te" className="loop__lens" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <Reading x={105} y={40} label={`${s.temp}°C`} sub={`load ${s.throughput}%`} />
            <Reading x={250} y={340} label={has('e-measure') ? '100%' : '—'} sub={s.pumps > 1 ? 'pump flow ×2' : 'pump flow'} />
            <Reading x={540} y={40} label={has('e-measure') ? `${Math.round(hxRate * 100)}%` : '—'} sub="exchanger inflow" />
            <text x="620" y="346" textAnchor="end" className="svg-mono" fill="var(--te)">
              target ≤ {TARGET}°C
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

function Known({ on, x, y, children }: { on: boolean; x: number; y: number; children: ReactNode }) {
  return on ? (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {children}
    </motion.g>
  ) : (
    <text x={x} y={y} className="loop__unknown" fill="var(--ti)">
      ?
    </text>
  )
}

function Reading({ x, y, label, sub }: { x: number; y: number; label: string; sub: string }) {
  return (
    <g>
      <text x={x} y={y - 12} textAnchor="middle" className="loop__reading" fill="var(--te)">
        {label}
      </text>
      <text x={x} y={y + 2} textAnchor="middle" className="svg-mono" fill="var(--te)" fillOpacity="0.8">
        {sub}
      </text>
    </g>
  )
}
