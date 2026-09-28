import { useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, RoomHead, SE_SPRING, SI_SPRING, rng, useNow } from '../components/common'
import './Experiment.css'

type Mode = 'plain' | 'si' | 'se'

/* ---------- Scene objects (drawn in greys; the mode decides everything else) ---------- */

const Mug = () => (
  <g>
    <path d="M618 424 q30 2 28 26 q-2 22 -28 24" fill="none" stroke="#d8d5ca" strokeWidth="9" />
    <rect x="548" y="414" width="74" height="70" rx="7" fill="#e9e6dc" />
    <ellipse cx="585" cy="416" rx="37" ry="7" fill="#3a2d26" />
  </g>
)

const Plant = () => (
  <g>
    <path d="M834 416h70l-8 64h-54Z" fill="#6f6c64" />
    {[-60, -35, -12, 12, 35, 58].map((a, i) => (
      <ellipse key={a} cx="869" cy={372 - (i % 2) * 14} rx="10" ry="44" fill={i % 2 ? '#4a4843' : '#5b5953'} transform={`rotate(${a} 869 416)`} />
    ))}
  </g>
)

const Chair = () => (
  <g fill="#3a3935">
    <rect x="1050" y="300" width="14" height="260" />
    <rect x="1134" y="300" width="14" height="260" />
    <rect x="1050" y="300" width="98" height="16" />
    <rect x="1050" y="350" width="98" height="10" />
    <path d="M1036 480h126l10 20H1026Z" />
    <rect x="1030" y="500" width="12" height="180" />
    <rect x="1156" y="500" width="12" height="180" />
  </g>
)

const Keys = () => (
  <g fill="none" stroke="#2b2a27" strokeWidth="3">
    <circle cx="700" cy="492" r="9" />
    <path d="M708 494l30 4m-10 -1v6m8 -5v6" />
  </g>
)

function ClockFace({ live }: { live: boolean }) {
  const now = useNow(1000, live)
  // Si's clock shows the time it always is at breakfast; Se's shows this very second.
  const h = live ? now.getHours() % 12 : 8
  const m = live ? now.getMinutes() : 14
  const s = live ? now.getSeconds() : 0
  return (
    <g>
      <circle cx="760" cy="170" r="48" fill="#efede6" stroke="#2a2926" strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="760" y1="128" x2="760" y2="134" stroke="#2a2926" strokeWidth="2" transform={`rotate(${i * 30} 760 170)`} />
      ))}
      <line x1="760" y1="170" x2="760" y2="146" stroke="#2a2926" strokeWidth="4" transform={`rotate(${h * 30 + m / 2} 760 170)`} />
      <line x1="760" y1="170" x2="760" y2="134" stroke="#2a2926" strokeWidth="3" transform={`rotate(${m * 6} 760 170)`} />
      {live && <line x1="760" y1="178" x2="760" y2="130" className="ex__second" transform={`rotate(${s * 6} 760 170)`} />}
    </g>
  )
}

function Room({ mode }: { mode: Mode }) {
  return (
    <g>
      <rect width="1200" height="560" fill="#bdbab1" />
      <rect y="560" width="1200" height="190" fill="#8c8981" />
      <line x1="0" y1="560" x2="1200" y2="560" stroke="#6d6a62" strokeWidth="2" />
      {/* window, with the garden beyond */}
      <rect x="110" y="80" width="320" height="360" fill="#f4f3ee" />
      <path d="M110 330 q60 -70 120 -20 q40 -60 110 -10 q50 -30 90 10 V440H110Z" fill="#d6d4cb" />
      <path d="M110 80h320v360H110Z M270 80v360 M110 260h320" fill="none" stroke="#54524c" strokeWidth="10" />
      {/* hanging lamp */}
      <line x1="560" y1="0" x2="560" y2="96" stroke="#2a2926" strokeWidth="2" />
      <path d="M522 130 q38 -44 76 0Z" fill="#2a2926" />
      <ClockFace live={mode === 'se'} />
      {/* table */}
      <path d="M300 480h680l60 44H240Z" fill="#6d6a62" />
      <rect x="240" y="524" width="800" height="18" fill="#4b4944" />
      <rect x="268" y="542" width="16" height="190" fill="#4b4944" />
      <rect x="996" y="542" width="16" height="190" fill="#4b4944" />
      {/* folded paper */}
      <path d="M410 486l118 -6l14 22l-120 6Z" fill="#dedbd1" />
      <Chair />
    </g>
  )
}

/* ---------- Si layer: echoes and annotations from memory ---------- */

function Note({ x, y, tx, ty, children, anchor = 'start', delay = 0 }: { x: number; y: number; tx: number; ty: number; children: ReactNode; anchor?: 'start' | 'end'; delay?: number }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, delay, ease: EASE }}>
      <line x1={x} y1={y} x2={tx} y2={ty} className="ex__si-line" />
      <circle cx={x} cy={y} r="4" className="ex__si-pin" />
      <text x={tx + (anchor === 'start' ? 8 : -8)} y={ty + 6} textAnchor={anchor} className="ex__si-note">
        {children}
      </text>
    </motion.g>
  )
}

function Ghost({ dx, dy, r = 0, children, delay = 0 }: { dx: number; dy: number; r?: number; children: ReactNode; delay?: number }) {
  return (
    <motion.g
      className="ex__ghost"
      initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
      animate={{ x: dx, y: dy, rotate: r, opacity: 1 }}
      exit={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
      transition={{ ...SI_SPRING, delay }}
    >
      {children}
    </motion.g>
  )
}

function SiLayer() {
  return (
    <g>
      <Ghost dx={-46} dy={4} delay={0.1}>
        <Mug />
      </Ghost>
      <Ghost dx={34} dy={-6} delay={0.4}>
        <Mug />
      </Ghost>
      <Ghost dx={-18} dy={0} r={-6} delay={0.6}>
        <Chair />
      </Ghost>
      <Ghost dx={-40} dy={2} delay={0.3}>
        <Keys />
      </Ghost>
      {/* where the plant has always stood */}
      <motion.g className="ex__ghost ex__ghost--usual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, delay: 1 }}>
        <g transform="translate(-72 0)">
          <Plant />
        </g>
      </motion.g>
      <Note x={585} y={470} tx={470} ty={640} delay={0.5}>
        The same weight as Grandmother’s.
      </Note>
      <Note x={430} y={250} tx={470} ty={90} delay={0.8}>
        October light, 08:14 — like every October.
      </Note>
      <Note x={1100} y={470} tx={1170} ty={250} anchor="end" delay={1.1}>
        Creaks on the left.
      </Note>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, delay: 1.6 }}>
        <path d="M806 350 C 820 320, 850 320, 862 350" className="ex__si-arrow" markerEnd="url(#ex-arrow)" />
        <rect x="712" y="258" width="250" height="52" className="ex__si-card" />
        <text x="724" y="280" className="ex__si-flag">
          △ PLANT MOVED 12 CM
        </text>
        <text x="724" y="299" className="ex__si-note ex__si-note--sm">
          Something is off.
        </text>
      </motion.g>
      <Note x={795} y={150} tx={880} ty={110} delay={1.3}>
        Always eight minutes fast.
      </Note>
    </g>
  )
}

/* ---------- Se layer: live registration ---------- */

function Track({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="ex__se-box" />
      <path d={`M${x} ${y + 12}V${y}h12M${x + w - 12} ${y}h12v12M${x + w} ${y + h - 12}v12h-12M${x + 12} ${y + h}H${x}v-12`} className="ex__se-corner" />
      <rect x={x} y={y - 22} width={label.length * 8.4 + 14} height={20} className="ex__se-tagbg" />
      <text x={x + 7} y={y - 7} className="ex__se-tag">
        {label}
      </text>
    </g>
  )
}

function SeLayer() {
  const dust = useMemo(() => {
    const r = rng(21)
    return Array.from({ length: 46 }, () => ({ x: 160 + r() * 520, y: 260 + r() * 360, d: r() }))
  }, [])
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.06 }}>
      {/* steam, rising now */}
      {[565, 585, 605].map((x, i) => (
        <motion.path
          key={x}
          d={`M${x} 404 q -12 -24 0 -48 q 12 -24 0 -48`}
          className="ex__steam"
          animate={{ y: [8, -26], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* dust in the light */}
      {dust.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={1.2 + p.d * 2}
          className="ex__dust"
          animate={{ x: [0, 18 * (p.d - 0.3), 0], y: [0, -12 * p.d, 0], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + p.d * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* draft from the window */}
      {[200, 250, 300].map((y, i) => (
        <motion.path
          key={y}
          d={`M300 ${y} h60 l-10 -6 m10 6 l-10 6`}
          className="ex__se-draft"
          animate={{ x: [0, 50], opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, delay: i * 0.25, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <Track x={536} y={330} w={100} h={164} label="STEAM · 64 °C" />
      <Track x={814} y={316} w={110} h={172} label="LEAF · MOVING" />
      <Track x={704} y={114} w={112} h={112} label="00:00:01 TICK" />
      <Track x={120} y={96} w={180} h={120} label="DRAFT 0.3 M/S" />
      <g transform="translate(40 690)">
        <rect x="-8" y="-40" width="190" height="20" className="ex__se-tagbg" />
        <text x="0" y="-25" className="ex__se-tag">
          FRIDGE HUM · 42 dB
        </text>
        {Array.from({ length: 36 }, (_, i) => (
          <motion.rect
            key={i}
            x={i * 5}
            width="3"
            height="4"
            y="-2"
            className="ex__wave"
            animate={{ height: [4, 8 + ((i * 7) % 22), 4], y: [-2, -4 - ((i * 7) % 22) / 2, -2] }}
            transition={{ duration: 0.3 + (i % 5) * 0.08, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </g>
    </motion.g>
  )
}

/* ---------- Section ---------- */

const MODES: { id: Mode; label: string }[] = [
  { id: 'plain', label: 'Scene' },
  { id: 'si', label: 'Si' },
  { id: 'se', label: 'Se' },
]

const CAPTION: Record<Mode, ReactNode> = {
  plain: 'A kitchen, 08:14. A table, a mug, a window, a chair, a plant. Nothing is happening. Choose a way of seeing it.',
  si: 'Through Si, the room is thick with precedent. Each object carries its history, and the one thing that departs from the pattern stands out.',
  se: 'Through Se, the room is alive. Steam, dust, draft, the second hand: every change is registered the instant it happens.',
}

export function Experiment() {
  const [mode, setMode] = useState<Mode>('plain')
  const stage = useRef<HTMLDivElement>(null)

  const onMove = (e: React.PointerEvent) => {
    const el = stage.current
    if (!el) return
    const b = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - b.left}px`)
    el.style.setProperty('--my', `${e.clientY - b.top}px`)
  }

  return (
    <section className="room ex" id="experiment" aria-labelledby="experiment-title">
      <div className="wrap">
        <RoomHead
          n="05"
          name="Interactive experiment"
          title={
            <span id="experiment-title">
              An ordinary room. <em>Switch</em> the lens.
            </span>
          }
        />

        <div className="ex__bar">
          <div className="switch" role="group" aria-label="Way of perceiving">
            {MODES.map((m) => (
              <button key={m.id} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                {mode === m.id && (
                  <motion.span
                    layoutId="ex-pill"
                    className="switch__pill"
                    style={{ background: m.id === 'si' ? 'var(--si)' : m.id === 'se' ? 'var(--se)' : 'var(--ink)' }}
                    transition={m.id === 'se' ? SE_SPRING : m.id === 'si' ? SI_SPRING : { duration: 0.4 }}
                  />
                )}
                {m.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              className="ex__caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: mode === 'se' ? 0.08 : 0.6 }}
              aria-live="polite"
            >
              {CAPTION[mode]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className={`ex__stage ex__stage--${mode}`} ref={stage} onPointerMove={onMove}>
          <svg viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice" className="ex__svg" role="img" aria-label={`Kitchen scene, ${mode === 'plain' ? 'unfiltered' : mode === 'si' ? 'seen through Si' : 'seen through Se'}`}>
            <defs>
              <marker id="ex-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10" fill="none" stroke="#f1ede4" strokeWidth="1.5" />
              </marker>
              <filter id="ex-grain" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="4" />
                <feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.6 0" />
              </filter>
            </defs>
            <g className="ex__photo">
              <Room mode={mode} />
              <polygon points="110,440 430,440 820,660 300,740" className="ex__beam" />
              <g className="ex__keys">
                <Keys />
              </g>
              <motion.g
                animate={mode === 'se' ? { rotate: [0, 2.5, -1.5, 0] } : { rotate: 0 }}
                transition={mode === 'se' ? { duration: 1.6, repeat: Infinity } : { duration: 1 }}
                style={{ transformOrigin: '869px 416px' }}
              >
                <Plant />
              </motion.g>
              <Mug />
              <rect width="1200" height="750" filter="url(#ex-grain)" className="ex__grain" />
            </g>
            <AnimatePresence>
              {mode === 'si' && <SiLayer key="si" />}
              {mode === 'se' && <SeLayer key="se" />}
            </AnimatePresence>
          </svg>
          <div className="ex__tint" aria-hidden="true" />
          <div className="ex__focus" aria-hidden="true" />
        </div>
        <div className="ex__legend label">
          <span>Plate 05 — Kitchen, weekday</span>
          <span className="muted">{mode === 'se' ? 'Move the pointer: attention follows it' : mode === 'si' ? 'Nothing here is new; one thing is different' : 'Unfiltered'}</span>
        </div>
      </div>
    </section>
  )
}
