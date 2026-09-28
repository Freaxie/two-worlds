import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Reveal, RoomHead, Tag, rng } from '../components/common'
import './Modes.css'

const EXCESS = 72

/* Si: precedent as tree rings. A new impression arrives from outside.
   In balance it passes in and becomes another ring; in excess the rings close into a wall. */
function SiRings({ dose }: { dose: number }) {
  const reduce = useReducedMotion()
  const rings = 4 + Math.round(dose / 8)
  const walled = dose >= EXCESS
  const wallR = 14 + (rings - 1) * 9
  return (
    <svg viewBox="0 0 400 300" className="md__svg" aria-hidden="true">
      {Array.from({ length: rings }, (_, i) => {
        const r = 14 + i * 9
        const last = i === rings - 1
        return (
          <motion.circle
            key={i}
            cx="160"
            cy="150"
            r={r}
            className="md__ring"
            initial={false}
            animate={{
              strokeWidth: walled && last ? 6 + (dose - EXCESS) / 3 : 1 + (i / rings) * (dose / 60),
              opacity: 0.35 + (i / rings) * 0.65,
            }}
            transition={{ duration: 1.2 }}
          />
        )
      })}
      {!reduce && (
        <motion.circle
          key={walled ? 'bounce' : 'enter'}
          r="6"
          cy="150"
          className={walled ? 'md__new md__new--rejected' : 'md__new'}
          initial={{ cx: 390, opacity: 0 }}
          animate={
            walled
              ? { cx: [390, 160 + wallR + 8, 360], opacity: [0, 1, 0] }
              : { cx: [390, 160], opacity: [0, 1, 0], r: [6, 6, 2] }
          }
          transition={{ duration: walled ? 2.2 : 3, repeat: Infinity, repeatDelay: 0.6, ease: [0.4, 0, 0.2, 1], times: walled ? [0, 0.45, 1] : undefined }}
        />
      )}
      <text x="390" y="136" textAnchor="end" className="md__svg-label">
        new input
      </text>
      {walled && (
        <text x="160" y={150 + wallR + 24} textAnchor="middle" className="md__svg-label md__svg-label--warn">
          “That’s not how it’s done.”
        </text>
      )}
    </svg>
  )
}

/* Se: a field of stimuli and one point of attention.
   In balance attention moves cleanly from change to change; in excess everything flashes and it cannot settle. */
function SeField({ dose }: { dose: number }) {
  const reduce = useReducedMotion()
  const pts = useMemo(() => {
    const r = rng(12)
    return Array.from({ length: 60 }, () => ({ x: 20 + r() * 360, y: 20 + r() * 260, d: r() }))
  }, [])
  const active = Math.round(2 + (dose / 100) * 58)
  const over = dose >= EXCESS
  const path = useMemo(() => {
    const r = rng(over ? 99 : 5)
    const n = over ? 14 : 4
    return {
      x: Array.from({ length: n }, () => 30 + r() * 340),
      y: Array.from({ length: n }, () => 30 + r() * 240),
    }
  }, [over])

  return (
    <svg viewBox="0 0 400 300" className={`md__svg ${over ? 'is-over' : ''}`} aria-hidden="true">
      {pts.map((p, i) => {
        const on = i < active
        return (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={on ? 2.5 + p.d * 3 : 1.5}
            className={on ? 'md__stim md__stim--on' : 'md__stim'}
            animate={on && !reduce ? { opacity: [1, 0.15, 1] } : { opacity: on ? 1 : 0.4 }}
            transition={on ? { duration: (over ? 0.25 : 1.4) + p.d * (over ? 0.3 : 1.2), repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
          />
        )
      })}
      {!reduce && (
        <motion.g
          key={over ? 'over' : 'ok'}
          animate={{ x: path.x, y: path.y }}
          transition={{ duration: over ? 2.4 : 6, repeat: Infinity, repeatType: 'mirror', ease: over ? 'linear' : [0.7, 0, 0.2, 1] }}
        >
          <circle r="16" className="md__attn" />
          <circle r="4" className="md__attn-core" />
        </motion.g>
      )}
      {over && (
        <text x="200" y="290" textAnchor="middle" className="md__svg-label md__svg-label--warn">
          everything, all at once
        </text>
      )}
    </svg>
  )
}

type Col = {
  f: 'si' | 'se'
  strengths: [string, string][]
  failure: [string, string]
}

const COLS: Col[] = [
  {
    f: 'si',
    strengths: [
      ['Consistency', 'Does it the way that worked, every time. Reliable under pressure.'],
      ['Familiarity', 'Knows the terrain, the people, the signs that something is slightly wrong.'],
      ['Detailed recall', 'Keeps sensory specifics others lose: the exact taste, the exact sequence.'],
    ],
    failure: ['Excessive attachment to precedent', 'The archive stops being a reference and becomes a wall. What does not match the past is filtered out, or felt as a threat.'],
  },
  {
    f: 'se',
    strengths: [
      ['Responsiveness', 'Acts in the moment the moment asks for it. Fast, physical, unhesitating.'],
      ['Awareness', 'Registers the whole field: the shift in the room, the opening in the game.'],
      ['Real-time adaptation', 'Changes course as reality changes. No plan is held above the facts.'],
    ],
    failure: ['Impulsivity or sensory overstimulation', 'Every signal arrives as urgent and none is weighed. Attention is pulled to the next thing before the last one lands.'],
  },
]

function Meter({ col }: { col: Col }) {
  const [dose, setDose] = useState(45)
  const over = dose >= EXCESS
  const id = `dose-${col.f}`
  return (
    <div className={`md__col md__col--${col.f} ${over ? 'is-over' : ''}`}>
      <Tag f={col.f} />
      <div className="md__vis">{col.f === 'si' ? <SiRings dose={dose} /> : <SeField dose={dose} />}</div>
      <div className="md__control">
        <label htmlFor={id} className="label">
          Intensity <span className="md__val">{dose}</span>
        </label>
        <input
          id={id}
          type="range"
          className="dose"
          min={0}
          max={100}
          value={dose}
          onChange={(e) => setDose(+e.target.value)}
          style={{ ['--thumb' as string]: col.f === 'si' ? 'var(--si)' : 'var(--se)' }}
          aria-valuetext={`${dose} — ${over ? 'failure mode' : 'in balance'}`}
        />
        <div className="md__scale label muted">
          <span>Muted</span>
          <span>In balance</span>
          <span className={over ? col.f : ''}>Excess</span>
        </div>
      </div>
      <div className="md__text">
        <div className={`md__block ${over ? 'is-dim' : ''}`}>
          <p className="label md__h">Strengths</p>
          <ul>
            {col.strengths.map(([t, d]) => (
              <li key={t}>
                <strong>{t}</strong>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`md__block md__block--fail ${over ? 'is-on' : ''}`}>
          <p className="label md__h">Failure mode</p>
          <p className="md__fail-t">{col.failure[0]}</p>
          <p className="md__fail-d">{col.failure[1]}</p>
        </div>
      </div>
    </div>
  )
}

export function Modes() {
  return (
    <section className="room md" id="modes" aria-labelledby="modes-title">
      <div className="wrap">
        <RoomHead
          n="06"
          name="Strengths & failure modes"
          title={
            <span id="modes-title">
              A strength, <em>turned up</em> too far.
            </span>
          }
          lede="Each function’s gift and its distortion are the same mechanism at a different intensity. Push the dials."
        />
        <Reveal className="md__grid">
          {COLS.map((c) => (
            <Meter key={c.f} col={c} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}
