import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Clock, EASE, RoomHead, SI_SPRING, Tag } from '../components/common'
import { Cyclist, H, Street, W } from '../components/Street'
import './Moment.css'

const STEPS = [
  '17:42. A street corner in the rain. One scene, taken in by two perceiving systems.',
  'Si lays the present over every previous evening spent here. Se locks onto whatever is moving.',
  'Si registers the deviation from precedent: the awning is gone. Se registers the horn, the cold, the splash — as they occur.',
  'Same light, same rain. One reality is measured against the archive; the other against the instant.',
]

/* Earlier evenings on this corner, each slightly out of register with the present. */
const MEMORIES = [
  { seed: 3, lit: 0.21, dx: -26, dy: -14, label: 'Oct 2019 — same rain', lx: 60, ly: 70 },
  { seed: 5, lit: 0.47, dx: 22, dy: 10, label: 'Every Tuesday, 17:40', lx: 250, ly: 40 },
  { seed: 9, lit: 0.73, dx: -10, dy: 24, label: 'Winter 2021 — the bakery open', lx: 470, ly: 230 },
]

function Box({ x, y, w, h, label, delay = 0 }: { x: number; y: number; w: number; h: number; label: string; delay?: number }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08, delay }}>
      <rect x={x} y={y} width={w} height={h} className="mo__box" />
      <path d={`M${x} ${y + 10}V${y}h10M${x + w - 10} ${y}h10v10M${x + w} ${y + h - 10}v10h-10M${x + 10} ${y + h}H${x}v-10`} className="mo__corner" />
      <rect x={x} y={y - 18} width={label.length * 7 + 12} height={16} className="mo__tagbg" />
      <text x={x + 6} y={y - 6} className="mo__tag">
        {label}
      </text>
    </motion.g>
  )
}

function SiPanel({ step }: { step: number }) {
  return (
    <div className={`mo__panel mo__panel--si ${step >= 1 ? 'is-on' : ''}`}>
      <div className="mo__plate">
        <Street seed={1} className="mo__base" />
        <AnimatePresence>
          {step >= 1 &&
            MEMORIES.map((m, i) => (
              <motion.div
                key={m.seed}
                className="mo__memory"
                initial={{ opacity: 0, x: m.dx * 3, y: m.dy * 3 }}
                animate={{ opacity: 0.3, x: m.dx, y: m.dy }}
                exit={{ opacity: 0 }}
                transition={{ ...SI_SPRING, delay: i * 0.25 }}
              >
                <Street seed={m.seed} awning rain={i === 0} cyclist={false} litShift={m.lit} />
              </motion.div>
            ))}
        </AnimatePresence>
        <div className="mo__tint mo__tint--si" />
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="mo__overlay" aria-hidden="true">
          <AnimatePresence>
            {step >= 1 &&
              MEMORIES.map((m, i) => (
                <motion.g key={m.seed} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, delay: 0.6 + i * 0.3 }}>
                  <line x1={m.lx} y1={m.ly + 6} x2={m.lx} y2={m.ly + 40} className="mo__si-line" />
                  <text x={m.lx + 6} y={m.ly} className="mo__si-note">
                    {m.label}
                  </text>
                </motion.g>
              ))}
            {step >= 2 && (
              <motion.g key="diff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: EASE }}>
                {/* where the awning used to be: outlined from memory */}
                <path d="M512 262h176l-14 30H526Z" className="mo__si-ghost" />
                <line x1="600" y1="262" x2="600" y2="170" className="mo__si-line" />
                <rect x="486" y="126" width="230" height="44" className="mo__si-card" />
                <text x="496" y="144" className="mo__si-note mo__si-note--strong">
                  △ Awning — missing
                </text>
                <text x="496" y="160" className="mo__si-note">
                  differs from 214 previous evenings
                </text>
                <circle cx="438" cy="156" r="20" className="mo__si-match" />
                <text x="380" y="118" className="mo__si-note">
                  ✓ lamp, as always
                </text>
                <path d="M300 400 Q 360 440 420 400" className="mo__si-match" />
                <text x="290" y="470" className="mo__si-note">
                  ✓ puddle forms here, as it did
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>
      <div className="mo__readout">
        <Tag f="si" />
        <span className="label">{step >= 2 ? 'Familiarity 91% · 1 deviation' : step >= 1 ? 'Comparing with 214 evenings…' : '—'}</span>
      </div>
    </div>
  )
}

const READINGS = [
  { t: '11.4 °C', x: 40, y: 60 },
  { t: 'Rain 4 mm/h', x: 40, y: 80 },
  { t: 'Horn — 62 dB, 2 o’clock', x: 520, y: 40 },
  { t: 'Tyre hiss — approaching', x: 40, y: 540 },
]

function SePanel({ step }: { step: number }) {
  return (
    <div className={`mo__panel mo__panel--se ${step >= 1 ? 'is-on' : ''}`}>
      <div className="mo__plate">
        <Street seed={1} cyclist={false} className="mo__base" />
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="mo__overlay" aria-hidden="true">
          {/* the cyclist is in motion; Se is the only system that keeps pace with it */}
          <motion.g
            animate={step >= 1 ? { x: [-360, 520] } : { x: 0 }}
            transition={step >= 1 ? { duration: 5.5, repeat: Infinity, ease: 'linear' } : { duration: 0.6 }}
          >
            <Cyclist transform="translate(300 330)" />
            <AnimatePresence>{step >= 1 && <Box x={284} y={278} w={92} h={112} label="CYCLIST · 18 km/h" />}</AnimatePresence>
          </motion.g>
          <AnimatePresence>
            {step >= 1 && <Box key="ped" x={108} y={244} w={84} h={116} label="PERSON · STILL" delay={0.1} />}
            {step >= 2 && (
              <motion.g key="se2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.05 }}>
                {[0, 1, 2].map((i) => (
                  <motion.ellipse
                    key={i}
                    cx="360"
                    cy="470"
                    rx="40"
                    ry="10"
                    className="mo__ripple"
                    initial={{ scale: 0.1, opacity: 1 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 1.1, delay: i * 0.37, repeat: Infinity, ease: 'easeOut' }}
                  />
                ))}
                <circle cx="438" cy="156" r="10" className="mo__cross" />
                <path d="M438 126v18M438 168v18M408 156h18M450 156h18" className="mo__cross" />
                {/* a sound, sensed as direction */}
                {[0, 1, 2].map((i) => (
                  <motion.path
                    key={i}
                    d="M760 100 a 40 40 0 0 0 -40 40"
                    className="mo__sound"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0], scale: 1.4 }}
                    style={{ transformOrigin: '760px 140px' }}
                    transition={{ duration: 0.9, delay: i * 0.2, repeat: Infinity, repeatDelay: 0.6 }}
                  />
                ))}
                {READINGS.map((r) => (
                  <g key={r.t}>
                    <rect x={r.x - 4} y={r.y - 12} width={r.t.length * 7.2 + 8} height={17} className="mo__tagbg" />
                    <text x={r.x} y={r.y} className="mo__tag">
                      {r.t}
                    </text>
                  </g>
                ))}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
        <div className="mo__tint mo__tint--se" />
      </div>
      <div className="mo__readout">
        <Tag f="se" />
        <span className="label">
          {step >= 1 ? (
            <>
              Live <Clock />
            </>
          ) : (
            '—'
          )}
        </span>
      </div>
    </div>
  )
}

export function Moment() {
  const ref = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(3, Math.max(0, Math.floor(v * 4.2)))))

  return (
    <section className="room mo" id="moment" aria-labelledby="moment-title">
      <div className="wrap">
        <RoomHead
          n="02"
          name="One moment, two perceptions"
          title={
            <span id="moment-title">
              The same corner. <em>Two</em> photographs.
            </span>
          }
          lede="Scroll slowly. The scene never changes — only what each system does with it."
        />
      </div>
      <div className="mo__track" ref={ref}>
        <div className="mo__sticky">
          <div className="wrap mo__inner">
            <div className="mo__caption">
              <span className="label mo__step">
                {String(step + 1).padStart(2, '0')} / 04
              </span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={step}
                  className="mo__text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {STEPS[step]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mo__panels">
              <SiPanel step={step} />
              <SePanel step={step} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
