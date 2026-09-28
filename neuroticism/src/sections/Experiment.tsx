import { useReducer, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, Guides, Mark, PartHead, type Who } from '../lib/ui'
import { COST, DAYS, START_CALM, initial, tally, verdict, type State } from '../data/week'
import './Experiment.css'

type Ev = { type: 'choose'; who: Who } | { type: 'next' } | { type: 'reset' }
function reducer(s: State, e: Ev): State {
  if (e.type === 'reset') return initial
  if (e.type === 'choose') {
    if (s.revealed || s.day >= DAYS.length) return s
    return { ...s, revealed: true, choices: [...s.choices, { who: e.who, real: DAYS[s.day].real }] }
  }
  if (!s.revealed) return s
  return { ...s, day: s.day + 1, revealed: false }
}

export function Experiment() {
  const [s, dispatch] = useReducer(reducer, initial)
  const [lens, setLens] = useState<Who>('tu')
  const finished = s.day >= DAYS.length
  const day = DAYS[Math.min(s.day, DAYS.length - 1)]
  const last = s.choices[s.choices.length - 1]
  const t = tally(s)

  return (
    <section id="experiment" className="part part--rule part--deep exp" aria-labelledby="experiment-title">
      <Guides />
      <div className="wrap">
        <PartHead
          id="experiment"
          n="06"
          name="Interactive experiment"
          title={['One week,', 'seven worries.']}
          lede={
            <>
              Three of this week’s worries are real problems. Four are nothing. Each day, choose whether to take the worry seriously
              or let it pass. Switch between the two voices as often as you like: they will tell you how loud the worry feels. The
              facts on the card tell you whether it is real.
            </>
          }
        />

        <div className="exp__lab">
          <div className="exp__main">
            <div className="exp__bar">
              <LensSwitch lens={lens} setLens={setLens} />
              <span className="label label--muted exp__lens-note">Which voice do you hear first?</span>
            </div>

            <div className="wk__card" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={finished ? 'end' : s.day}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="wk__card-inner"
                >
                  {finished ? (
                    <Outcome s={s} onReset={() => dispatch({ type: 'reset' })} />
                  ) : (
                    <>
                      <div className="wk__card-head">
                        <span className="label">
                          Day {s.day + 1} · {day.day}
                        </span>
                        <span className="label label--muted">The facts</span>
                      </div>
                      <p className="wk__facts">{day.facts}</p>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={lens}
                          className={`wk__voice wk__voice--${lens}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Mark who={lens} size={14} />
                          <span>{day.voice[lens]}</span>
                        </motion.p>
                      </AnimatePresence>

                      {!s.revealed ? (
                        <div className="wk__btns">
                          <button className="wk__btn wk__btn--tu" onClick={() => dispatch({ type: 'choose', who: 'tu' })}>
                            <span className="wk__btn-label">Take it seriously</span>
                            <span className="wk__btn-hint">Check, call, fix — tonight</span>
                          </button>
                          <button className="wk__btn wk__btn--as" onClick={() => dispatch({ type: 'choose', who: 'as' })}>
                            <span className="wk__btn-label">Let it pass</span>
                            <span className="wk__btn-hint">Carry on with the evening</span>
                          </button>
                        </div>
                      ) : (
                        last && <Reveal real={day.real} who={last.who} truth={day.truth} ifIgnored={day.ifIgnored} onNext={() => dispatch({ type: 'next' })} lastDay={s.day === DAYS.length - 1} />
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <aside className="exp__side" aria-label="Your week so far">
            <div className="exp__gauges wk__gauges">
              <div className="exp__g">
                <span className="label label--muted">Day</span>
                <span className="exp__g-num">
                  {Math.min(s.day + 1, DAYS.length)}
                  <small>/7</small>
                </span>
              </div>
              <div className="exp__g">
                <span className="label label--muted">Calm left</span>
                <span className="exp__g-num">
                  {t.calm}
                  <small>/{START_CALM}</small>
                </span>
              </div>
              <div className="exp__g">
                <span className="label tu">False alarms</span>
                <span className="exp__g-num">{t.falses}</span>
              </div>
              <div className="exp__g">
                <span className="label as">Real, caught</span>
                <span className="exp__g-num">
                  {t.hits}
                  <small>/3</small>
                </span>
              </div>
            </div>
            <CalmChart s={s} />
            <p className="note wk__rule">
              Taking a real problem seriously costs {COST.hit} calm. Worrying about a false one costs {COST.falseAlarm}: it has nowhere to
              go. Letting a real one pass costs {COST.miss}, later.
            </p>
          </aside>
        </div>

        <Trace s={s} />
      </div>
    </section>
  )
}

function LensSwitch({ lens, setLens }: { lens: Who; setLens: (w: Who) => void }) {
  return (
    <div className="exp__switch" role="group" aria-label="Inner voice">
      {(['tu', 'as'] as const).map((m) => (
        <button key={m} className={`exp__switch-btn${lens === m ? ' is-on' : ''}`} aria-pressed={lens === m} onClick={() => setLens(m)}>
          {lens === m && <motion.span layoutId="wk-switch" className={`exp__switch-bg exp__switch-bg--${m}`} transition={{ duration: 0.5, ease: EASE }} />}
          <span className="exp__switch-inner">
            <Mark who={m} size={14} />
            <b>{m === 'tu' ? 'Turbulent' : 'Assertive'}</b>
            <span className="exp__switch-sub">voice</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function Reveal({ real, who, truth, ifIgnored, onNext, lastDay }: { real: boolean; who: Who; truth: string; ifIgnored?: string; onNext: () => void; lastDay: boolean }) {
  const kind = real ? (who === 'tu' ? 'caught' : 'missed') : who === 'tu' ? 'false alarm' : 'let go'
  const good = kind === 'caught' || kind === 'let go'
  return (
    <motion.div className={`wk__reveal${good ? ' is-good' : ' is-bad'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
      <span className="label">
        {real ? 'Real problem' : 'Nothing'} · {kind}
      </span>
      <p>{real && who === 'as' ? ifIgnored : truth}</p>
      {!real && who === 'tu' && <p className="wk__cost">Cost: an evening spent on it anyway.</p>}
      <button className="exp__reset label" onClick={onNext}>
        {lastDay ? 'See the week →' : 'Next day →'}
      </button>
    </motion.div>
  )
}

function Outcome({ s, onReset }: { s: State; onReset: () => void }) {
  const v = verdict(s)
  const t = tally(s)
  return (
    <div className={`exp__outcome wk__outcome${t.hits === 3 && t.falses <= 1 ? ' exp__outcome--solved' : ''}`}>
      <span className="label label--muted">Your week</span>
      <p className="exp__outcome-head display">{v.head}</p>
      <p className="exp__outcome-body">{v.body}</p>
      <button className="exp__reset label" onClick={onReset}>
        Live the week again ↺
      </button>
    </div>
  )
}

/* Calm over the week: a step line that drops by the price of each choice */
function CalmChart({ s }: { s: State }) {
  const W = 360
  const Hh = 150
  const x = (i: number) => 24 + (i / 7) * (W - 40)
  const y = (v: number) => 14 + (1 - v / START_CALM) * (Hh - 34)
  let calm = START_CALM
  const pts: { x: number; y: number; who?: Who; real?: boolean }[] = [{ x: x(0), y: y(calm) }]
  s.choices.forEach((c, i) => {
    calm -= c.who === 'tu' ? (c.real ? COST.hit : COST.falseAlarm) : c.real ? COST.miss : 0
    pts.push({ x: x(i + 1), y: y(Math.max(0, calm)), who: c.who, real: c.real })
  })
  const d = pts.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `H${p.x} V${p.y}`)).join(' ')
  return (
    <svg className="wk__chart" viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label={`Calm over the week: ${Math.max(0, calm)} of ${START_CALM} left`}>
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line x1="24" x2={W - 16} y1={y(v)} y2={y(v)} stroke="var(--rule)" />
          <text x="16" y={y(v) + 4} textAnchor="end" className="svg-mono" fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      {DAYS.map((dd, i) => (
        <text key={dd.day} x={(x(i) + x(i + 1)) / 2} y={Hh - 4} textAnchor="middle" className="svg-mono" fill="var(--muted)">
          {dd.day}
        </text>
      ))}
      <motion.path d={d} fill="none" stroke="var(--ink)" strokeWidth="2" initial={false} animate={{ d }} transition={{ duration: 0.6, ease: EASE }} />
      {pts.slice(1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill={p.who === 'tu' ? 'var(--tu)' : 'var(--as)'} stroke="var(--paper)" strokeWidth="1.5" />
      ))}
    </svg>
  )
}

function Trace({ s }: { s: State }) {
  return (
    <div className="exp__trace">
      <div className="exp__trace-head">
        <span className="label">Your week</span>
        <span className="label label--muted">
          <span className="tu">{s.choices.filter((c) => c.who === 'tu').length} taken seriously</span> ·{' '}
          <span className="as">{s.choices.filter((c) => c.who === 'as').length} let pass</span>
        </span>
      </div>
      <ol className="exp__trace-row">
        {DAYS.map((d, i) => {
          const c = s.choices[i]
          const shown = c && (i < s.day || s.revealed || s.day >= DAYS.length)
          const kind = c ? (c.real ? (c.who === 'tu' ? 'Caught' : 'Missed') : c.who === 'tu' ? 'False alarm' : 'Let go') : ''
          return (
            <li key={d.day} className={`exp__trace-cell${c ? ` is-${c.who}` : ''}`}>
              <span className="mono">{d.day}</span>
              <AnimatePresence>
                {shown && (
                  <motion.span className="exp__trace-mark" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                    <Mark who={c.who} size={16} />
                    <span>{kind}</span>
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

