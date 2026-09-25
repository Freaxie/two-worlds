import { useMemo, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { EASE, RoomHeader } from '../components/common'
import './FormMatter.css'

type View = 0 | 1 | 2

const TEXTS: Record<View, { who: string; title: string; body: string[]; refs: string; quote?: { q: string; src: string } }> = {
  0: {
    who: 'Plato',
    title: 'The particular sphere participates in an intelligible Form.',
    body: [
      'This bronze sphere is round because it participates in the Circle itself: what circularity perfectly is, grasped by thought rather than sight. The Circle would be what it is if no bronze sphere had ever been cast.',
      'The bronze object is a likeness. It is round and, in some respect, also not round. Geometers reason about the square itself and the diagonal itself, using drawn figures only as images.',
    ],
    refs: 'Phaedo 74a–75b · Republic VI 510d–e · Seventh Letter 342a–343b (authenticity disputed)',
  },
  1: {
    who: 'Common ground',
    title: 'Both agree the form is what is knowable in a thing.',
    body: [
      'Neither philosopher thinks the sphere is just its bronze. Both hold that knowledge is of the universal, and that a thing’s form is what makes it the kind of thing it is.',
      'The dispute is about separation (χωρισμός): can the form exist apart from anything that has it? Plato himself set out powerful objections to separate Forms in the Parmenides. Aristotle pressed them harder.',
    ],
    refs: 'Parmenides 130e–135c · Aristotle, Metaphysics A.9, M.4–5, M.9 1086b2–7',
    quote: {
      q: 'To say that they are patterns and the other things share in them is to use empty words and poetical metaphors.',
      src: 'Aristotle, Metaphysics A.9, 991a20–22 (tr. W. D. Ross)',
    },
  },
  2: {
    who: 'Aristotle',
    title: 'The sphere is a composite of matter and form.',
    body: [
      'The craftsman makes neither the bronze nor the sphere-shape. He brings this form into this matter, and what results is a bronze sphere: a σύνολον, a composite whole.',
      'Form is what makes this bronze a sphere. Matter is what is able to become one. Neither exists as a thing on its own. The form of a sphere is always the form of some sphere.',
    ],
    refs: 'Metaphysics Z.8 1033a24–b19 · Physics II.1–2 · Metaphysics H.6',
  },
}

/* an imperfect circle: the cast is never exactly the figure */
function wobble(r: number, n = 90) {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 + 0.013 * Math.sin(3 * a + 0.4) + 0.008 * Math.sin(7 * a + 1.3) + 0.004 * Math.sin(13 * a))
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)} `
  }
  return d + 'Z'
}

export function FormMatter() {
  const t = useMotionValue(0)
  const [val, setVal] = useState(0)
  const view: View = val < 34 ? 0 : val < 67 ? 1 : 2
  useMotionValueEvent(t, 'change', (v) => setVal(Math.round(v * 100)))

  const sphereR = 138
  const SY = 440
  const outline = useMemo(() => wobble(sphereR), [])

  /* the Form descends from the intelligible into the thing */
  const formCy = useTransform(t, [0, 1], [158, SY])
  const formR = useTransform(t, [0, 1], [96, sphereR])
  const formScale = useTransform(formR, (r) => r / 100)
  const formStroke = useTransform(t, [0, 0.6, 1], ['#4c6780', '#8f8a74', '#f4e3bf'])
  const formGlow = useTransform(t, [0, 1], [1, 0.25])
  const sepOpacity = useTransform(t, [0, 0.55], [1, 0])
  const raysOpacity = useTransform(t, [0, 0.5], [0.9, 0])
  const rayY1 = useTransform(t, [0, 1], [258, SY])
  const fade = useTransform(t, [0, 1], [0.45, 0])
  const aristOpacity = useTransform(t, [0.45, 1], [0, 1])
  const matterX = useTransform(t, [0, 1], [-40, 0])
  const arrowLen = useTransform(t, [0.5, 1], [0, 1])
  const skyOpacity = useTransform(t, [0, 1], [1, 0.1])
  const groundOpacity = useTransform(t, [0.3, 1], [0.2, 1])
  const formLabelOpacity = useTransform(t, [0, 0.4], [1, 0])
  const formSubOpacity = useTransform(t, [0.7, 1], [0, 1])

  const to = (target: number) => animate(t, target, { duration: 1.6, ease: EASE })

  const txt = TEXTS[view]

  return (
    <section id="form" className="room room--rule fm" aria-labelledby="form-title">
      <div className="wrap">
        <RoomHeader
          numeral="IV"
          name="Form & Matter"
          greek="εἶδος καὶ ὕλη"
          greekGloss="eidos kai hylē: form and matter"
          title={
            <span id="form-title">
              Form: <em>above</em> the world, or <em>inside</em> it?
            </span>
          }
          lede={
            <p>
              Aristotle's own example is a bronze sphere. Drag the slider to move the form of the sphere from a separate
              intelligible Circle, where Plato places it, into the bronze itself, where Aristotle places it.
            </p>
          }
        />

        <div className="fm__stage grid">
          <figure className="fm__figure">
            <svg viewBox="0 0 900 640" className="fm__svg" role="img" aria-label={`Diagram: ${txt.title}`}>
              <defs>
                <radialGradient id="bronze" cx="0.36" cy="0.3" r="0.8">
                  <stop offset="0" stopColor="#f0d49c" />
                  <stop offset="0.25" stopColor="#c19556" />
                  <stop offset="0.62" stopColor="#7c5427" />
                  <stop offset="1" stopColor="#2e1f10" />
                </radialGradient>
                <radialGradient id="bronze-rim" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0.85" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity="0.35" />
                </radialGradient>
                <filter id="patina" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="4" result="n" />
                  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.52  0 0 0 0 0.45  0 0 0 -3 1.45" result="p" />
                  <feComposite in="p" in2="SourceGraphic" operator="in" />
                </filter>
                <radialGradient id="ideal-glow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#7d93a8" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#7d93a8" stopOpacity="0" />
                </radialGradient>
                <marker id="fm-ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M2 1 L8 5 L2 9" fill="none" stroke="var(--aris)" strokeWidth="1.2" />
                </marker>
              </defs>

              {/* Plato's two-level world */}
              <motion.g style={{ opacity: skyOpacity }}>
                <rect x="0" y="0" width="900" height="290" fill="var(--plato-mist)" opacity="0.55" />
                <line x1="0" x2="900" y1="290" y2="290" stroke="var(--plato)" strokeDasharray="4 6" />
                <text x="24" y="34" className="dg-mono" fill="var(--plato)">THE INTELLIGIBLE · <tspan className="dg-greek" fontSize="13">τὸ νοητόν</tspan></text>
                <text x="24" y="318" className="dg-mono" fill="var(--plato)">THE VISIBLE · <tspan className="dg-greek" fontSize="13">τὸ ὁρατόν</tspan></text>
              </motion.g>

              {/* Aristotle's one world */}
              <motion.g style={{ opacity: groundOpacity }}>
                <line x1="40" x2="860" y1={SY + sphereR + 12} y2={SY + sphereR + 12} stroke="var(--ink)" strokeWidth="1" />
                {Array.from({ length: 42 }).map((_, i) => (
                  <line key={i} x1={40 + i * 20} x2={40 + i * 20} y1={SY + sphereR + 12} y2={SY + sphereR + (i % 5 ? 17 : 22)} stroke="var(--ink)" strokeWidth="0.7" />
                ))}
                <text x="860" y={SY + sphereR + 40} textAnchor="end" className="dg-mono" fill="var(--muted)">ONE WORLD · NATURE AND ART</text>
              </motion.g>

              {/* separation bracket */}
              <motion.g style={{ opacity: sepOpacity }}>
                <path d={`M700 158 L716 158 L716 ${SY} L700 ${SY}`} fill="none" stroke="var(--plato)" />
                <text x="730" y="290" className="dg-greek" fill="var(--plato-deep)">χωρισμός</text>
                <text x="730" y="308" className="dg-mono" fill="var(--plato)">SEPARATION</text>
              </motion.g>

              {/* participation: the likeness looks up to its original */}
              <motion.g style={{ opacity: raysOpacity }} stroke="var(--plato)" strokeDasharray="2 5" strokeWidth="1">
                {[-80, -40, 0, 40, 80].map((dx) => (
                  <motion.line key={dx} x1={450 + dx * 0.8} x2={450 + dx * 1.2} y1={rayY1} y2={SY - sphereR + 14} />
                ))}
              </motion.g>
              <motion.text x="470" y="334" className="dg-mono" fill="var(--plato)" style={{ opacity: raysOpacity }}>
                METHEXIS · PARTICIPATION
              </motion.text>

              {/* matter: a lump of bronze, before it is anything in particular */}
              <motion.g style={{ opacity: aristOpacity, x: matterX }}>
                <path
                  d="M96 528 C88 506 108 488 136 490 C160 478 196 484 206 502 C222 512 218 538 196 546 C170 558 118 556 96 528 Z"
                  fill="url(#bronze)"
                />
                <text x="152" y="452" textAnchor="middle" className="dg-greek" fill="var(--aris-deep)">ὕλη</text>
                <text x="152" y="468" textAnchor="middle" className="dg-mono" fill="var(--aris)">MATTER: BRONZE</text>
                <motion.path d="M222 516 C250 500 280 490 300 486" fill="none" stroke="var(--aris)" strokeWidth="1.2" markerEnd="url(#fm-ar)" style={{ pathLength: arrowLen }} />
              </motion.g>

              {/* the bronze sphere */}
              <g transform={`translate(450 ${SY})`}>
                <path d={outline} fill="url(#bronze)" />
                <path d={outline} fill="#000" filter="url(#patina)" opacity="0.22" />
                <path d={outline} fill="url(#bronze-rim)" />
                <ellipse cx="-44" cy="-58" rx="34" ry="20" fill="#fff6e0" opacity="0.28" transform="rotate(-30 -44 -58)" />
                {/* as a mere likeness, the particular is faded */}
                <motion.path d={outline} fill="var(--paper)" style={{ opacity: fade }} />
              </g>

              {/* the Form of the Circle */}
              <motion.circle cx="450" r="150" fill="url(#ideal-glow)" cy={formCy} style={{ opacity: formGlow }} />
              <motion.g style={{ x: 450, y: formCy, scale: formScale, stroke: formStroke }} fill="none">
                <circle r="100" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                <line x1="-100" x2="100" y1="0" y2="0" strokeWidth="0.9" vectorEffect="non-scaling-stroke" strokeDasharray="3 4" />
                <line x1="0" x2="70.7" y1="0" y2="-70.7" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
                <polygon
                  points={Array.from({ length: 6 }, (_, i) => `${Math.cos((i * Math.PI) / 3) * 100},${Math.sin((i * Math.PI) / 3) * 100}`).join(' ')}
                  strokeWidth="0.7"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.55"
                />
                <motion.circle r="2.6" style={{ fill: formStroke }} />
              </motion.g>
              <motion.g style={{ opacity: formLabelOpacity }}>
                <text x="450" y="44" textAnchor="middle" className="dg-name" fill="var(--plato-deep)">THE CIRCLE ITSELF</text>
                <text x="450" y="62" textAnchor="middle" className="dg-greek" fill="var(--plato)">αὐτὸ ὁ κύκλος</text>
              </motion.g>

              {/* composite labels */}
              <motion.g style={{ opacity: formSubOpacity }}>
                <line x1="560" y1="398" x2="640" y2="360" stroke="var(--aris)" />
                <text x="648" y="356" className="dg-name" fill="var(--ink)">FORM IN THE BRONZE</text>
                <text x="648" y="374" className="dg-greek" fill="var(--aris-deep)">εἶδος</text>
                <line x1="580" y1="512" x2="648" y2="540" stroke="var(--aris)" />
                <text x="656" y="546" className="dg-name" fill="var(--ink)">THE COMPOSITE</text>
                <text x="656" y="564" className="dg-greek" fill="var(--aris-deep)">σύνολον</text>
              </motion.g>
            </svg>
          </figure>

          <div className="fm__control">
            <div className="fm__ends">
              <button className="textbtn fm__end fm__end--plato" onClick={() => to(0)}>
                <span aria-hidden="true">←</span> Transcendence
              </button>
              <button className="textbtn fm__end fm__end--mid" onClick={() => to(0.5)}>
                Common ground
              </button>
              <button className="textbtn fm__end fm__end--aris" onClick={() => to(1)}>
                Immanence <span aria-hidden="true">→</span>
              </button>
            </div>
            <label htmlFor="fm-range" className="sr-only">
              Where is form? From transcendence (Plato) to immanence (Aristotle)
            </label>
            <input
              id="fm-range"
              className="fm__range"
              type="range"
              min={0}
              max={100}
              step={1}
              value={val}
              style={{ ['--v' as string]: `${val}%` }}
              aria-valuetext={['Transcendence: Plato', 'Common ground', 'Immanence: Aristotle'][view]}
              onChange={(e) => t.set(Number(e.target.value) / 100)}
            />
            <div className="fm__ticks" aria-hidden="true">
              {Array.from({ length: 21 }).map((_, i) => (
                <span key={i} className={i % 10 === 0 ? 'is-major' : ''} />
              ))}
            </div>
          </div>

          <div className="fm__text" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <p className={`label fm__who fm__who--${view}`}>{txt.who}</p>
                <h3 className="fm__title display">{txt.title}</h3>
                {txt.body.map((b) => (
                  <p key={b} className="fm__body">
                    {b}
                  </p>
                ))}
                {txt.quote && (
                  <blockquote className="quote fm__quote">
                    “{txt.quote.q}”<footer>{txt.quote.src}</footer>
                  </blockquote>
                )}
                <p className="cite">{txt.refs}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>


      </div>
    </section>
  )
}
