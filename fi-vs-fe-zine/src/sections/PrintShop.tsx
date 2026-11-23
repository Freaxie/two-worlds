import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE, Head, Spread, figurePath } from '../components/print'
import { C } from '../lib/organic'
import { SCENARIOS, type Scenario } from '../lib/content'
import './PrintShop.css'

const YOU: [number, number] = [400, 250]

/* Where the values Fi finds sit around the self */
const VALUE_SPOTS: [number, number, 'start' | 'middle' | 'end'][] = [
  [400, 106, 'middle'],
  [356, 446, 'end'],
  [444, 446, 'start'],
]

function Scene({ s, fi, fe }: { s: Scenario; fi: boolean; fe: boolean }) {
  const othersFaint = fi && !fe
  return (
    <svg viewBox="0 0 800 460" className="shop__svg" role="img" aria-label={`${s.title}, printed with ${fi && fe ? 'both drums' : fi ? 'the Fi drum' : fe ? 'the Fe drum' : 'black only'}.`}>
      {/* Pink drum: everyone else's state, and the lines between you */}
      {fe && (
        <g>
          <g filter="url(#ht-pink)">
            {s.others.map((o, i) => (
              <circle key={i} cx={o.x} cy={o.y + 10} r="86" fill="url(#soft-flat)" />
            ))}
          </g>
          {s.others.map((o, i) => (
            <path
              key={i}
              d={`M${YOU[0]},${YOU[1] - 6} Q${(YOU[0] + o.x) / 2},${(YOU[1] + o.y) / 2 - 40} ${o.x},${o.y + 26}`}
              fill="none"
              stroke={C.pink}
              strokeWidth="2.4"
              strokeDasharray="3 6"
            />
          ))}
        </g>
      )}

      {/* Blue drum: the inner world opens around the self */}
      {fi && (
        <g style={{ mixBlendMode: 'multiply' }}>
          <g filter="url(#ht-blue)">
            <circle cx={YOU[0]} cy={YOU[1] + 20} r="170" fill="url(#soft)" />
          </g>
          {[150, 118, 88].map((r) => (
            <ellipse key={r} cx={YOU[0]} cy={YOU[1] + 20} rx={r * 1.2} ry={r} fill="none" stroke={C.blue} strokeWidth="2" />
          ))}
        </g>
      )}

      {/* Black drum: the facts. Who is there. */}
      {s.others.map((o, i) => (
        <g key={i} fill={C.ink} opacity={othersFaint ? 0.28 : 1}>
          <circle cx={o.x} cy={o.y} r="13" />
          <path d={figurePath(o.x, o.y, 0.85)} />
        </g>
      ))}
      <g fill={C.ink} transform={fe && !fi ? `translate(${YOU[0]} ${YOU[1]}) scale(0.8) translate(${-YOU[0]} ${-YOU[1]})` : undefined}>
        <circle cx={YOU[0]} cy={YOU[1] - 20} r="17" />
        <path d={figurePath(YOU[0], YOU[1] - 20, 1.25)} />
      </g>
      <text x={YOU[0]} y={YOU[1] + 78} textAnchor="middle" className="shop__you">
        YOU
      </text>

      {fi &&
        s.values.map((v, i) => {
          const [x, y, a] = VALUE_SPOTS[i]
          return (
            <text key={v} x={x} y={y} textAnchor={a} className="shop__value">
              {v}
            </text>
          )
        })}

      {fe &&
        s.others.map((o, i) => (
          <g key={i}>
            <rect x={o.x - o.read.length * 5.4 - 7} y={o.y + 50} width={o.read.length * 10.8 + 14} height="26" fill={C.pink} opacity="0.6" style={{ mixBlendMode: 'multiply' }} />
            <text x={o.x} y={o.y + 69} textAnchor="middle" className="shop__read">
              {o.read}
            </text>
          </g>
        ))}
    </svg>
  )
}

function Receipt({ s, fi, fe }: { s: Scenario; fi: boolean; fe: boolean }) {
  if (!fi && !fe)
    return (
      <div className="receipt">
        <p className="receipt__empty">Only the black drum is inked. The facts say who is there, not what matters. Switch on a drum.</p>
      </div>
    )
  if (fi && fe)
    return (
      <div className="receipt receipt--both">
        <p className="caps">Both drums · overprint</p>
        <dl>
          <div>
            <dt className="caps">
              <span className="mark mark--blue">Fi</span> hears
            </dt>
            <dd>{s.fi.voice}</dd>
          </div>
          <div>
            <dt className="caps">
              <span className="mark mark--pink">Fe</span> hears
            </dt>
            <dd>{s.fe.voice}</dd>
          </div>
          <div className="receipt__over">
            <dt className="caps">Printed together</dt>
            <dd>{s.both}</dd>
          </div>
        </dl>
      </div>
    )
  const r = fi ? s.fi : s.fe
  const ink = fi ? 'blue' : 'pink'
  return (
    <div className={`receipt receipt--${ink}`}>
      <p className="caps">
        <span className={`mark mark--${ink}`}>{fi ? 'Fi · blue drum' : 'Fe · pink drum'}</span>
      </p>
      <dl>
        <div>
          <dt className="caps">What stands out</dt>
          <dd>{r.notice}</dd>
        </div>
        <div>
          <dt className="caps">The question</dt>
          <dd>{r.question}</dd>
        </div>
        <div>
          <dt className="caps">Inner voice</dt>
          <dd className="receipt__voice">{r.voice}</dd>
        </div>
        <div>
          <dt className="caps">A likely move</dt>
          <dd>{r.move}</dd>
        </div>
      </dl>
    </div>
  )
}

function Drum({ on, ink, label, sub, onToggle, locked }: { on: boolean; ink: 'ink' | 'blue' | 'pink'; label: string; sub: string; onToggle?: () => void; locked?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-disabled={locked}
      className={`drum drum--${ink}`}
      data-on={on}
      onClick={locked ? undefined : onToggle}
    >
      <span className="drum__roller" aria-hidden="true">
        <span className="drum__ink" />
      </span>
      <span className="drum__text">
        <span className="drum__label">{label}</span>
        <span className="drum__sub">{locked ? 'always inked' : on ? 'inked · on' : 'dry · off'}</span>
      </span>
      <span className="sr-only">{sub}</span>
    </button>
  )
}

export function PrintShop() {
  const reduce = useReducedMotion()
  const [si, setSi] = useState(0)
  const [fi, setFi] = useState(true)
  const [fe, setFe] = useState(false)
  const s = SCENARIOS[si]
  const job = `${s.id}-${fi}-${fe}`

  return (
    <Spread
      id="printshop"
      label="Pages 10 and 11: the print shop, an interactive experiment"
      folios={[10, 11]}
      left={
        <>
          <Head pp="10–11" title="Interactive experiment" />
          <h2 className="shop__title poster rough">The print shop</h2>
          <p className="shop__lede">
            One set of facts, printed with different drums. Pick a job, ink a drum, and watch what the sheet decides to show.
          </p>

          <p className="caps shop__step">1 · Choose a job</p>
          <div className="tickets" role="tablist" aria-label="Situations">
            {SCENARIOS.map((sc, i) => (
              <button key={sc.id} role="tab" aria-selected={i === si} className="ticket" onClick={() => setSi(i)}>
                <span className="ticket__no">Job {String(i + 1).padStart(3, '0')}</span>
                <span className="ticket__title">{sc.title}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={s.id}
              className="shop__setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {s.setup}
            </motion.p>
          </AnimatePresence>

          <p className="caps shop__step">2 · Ink the drums</p>
          <div className="drums">
            <Drum on ink="ink" label="K · the facts" sub="Black drum, always printing" locked />
            <Drum on={fi} ink="blue" label="Fi · Inner Blue" sub="Blue drum: inner values" onToggle={() => setFi((v) => !v)} />
            <Drum on={fe} ink="pink" label="Fe · Shared Pink" sub="Pink drum: shared values" onToggle={() => setFe((v) => !v)} />
          </div>
        </>
      }
      right={
        <div className="shop__out">
          <div className="press" aria-live="polite">
            <div className="press__roller" aria-hidden="true" />
            <div className="press__bed">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={job}
                  className="press__sheet"
                  initial={{ y: reduce ? 0 : '-104%' }}
                  animate={{ y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: reduce ? 0 : 0.85, ease: EASE }}
                >
                  <Scene s={s} fi={fi} fe={fe} />
                  <span className="press__job">
                    Job {String(si + 1).padStart(3, '0')} · {fi && fe ? 'K + Fi + Fe' : fi ? 'K + Fi' : fe ? 'K + Fe' : 'K only'}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={job}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.35 }}
            >
              <Receipt s={s} fi={fi} fe={fe} />
            </motion.div>
          </AnimatePresence>
        </div>
      }
    />
  )
}
