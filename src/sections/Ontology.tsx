import { useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE, Reveal, RoomHeader, Side } from '../components/common'
import { byId, CONCEPTS, type ConceptId } from '../data/ontology'
import './Ontology.css'

/* anchor points for each concept on the map (viewBox 1200 × 620) */
const POS: Record<ConceptId, [number, number]> = {
  intelligible: [300, 70],
  forms: [300, 190],
  participation: [300, 330],
  particulars: [300, 478],
  hierarchy: [84, 330],
  substance: [900, 310],
  form: [770, 176],
  matter: [770, 450],
  accidents: [900, 406],
  actuality: [1040, 176],
  potentiality: [1040, 450],
}

function bridge(a: ConceptId, b: ConceptId) {
  const [x1, y1] = POS[a]
  const [x2, y2] = POS[b]
  const mx = (x1 + x2) / 2
  const my = Math.min(y1, y2) - 40
  return `M${x1} ${y1} C${mx} ${my} ${mx} ${my} ${x2} ${y2}`
}

export function Ontology() {
  const [sel, setSel] = useState<ConceptId>('forms')
  const [hover, setHover] = useState<ConceptId | null>(null)
  const c = byId[sel]
  const focus = hover ?? sel
  const partner = byId[focus].link

  const nodeProps = (id: ConceptId) => ({
    role: 'button',
    tabIndex: 0,
    'aria-pressed': sel === id,
    'aria-label': byId[id].name,
    className: `onto-node onto-node--${byId[id].who}${sel === id ? ' is-sel' : ''}${partner === id ? ' is-partner' : ''}${
      hover === id ? ' is-hover' : ''
    }`,
    onClick: () => setSel(id),
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(id),
    onBlur: () => setHover(null),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setSel(id)
      }
    },
  })

  return (
    <section id="ontology" className="room room--rule ontology" aria-labelledby="ontology-title">
      <div className="wrap">
        <RoomHeader
          numeral="II"
          name="Ontology"
          greek="οὐσία"
          greekGloss="ousia: being, substance"
          title={<span id="ontology-title">Two architectures of reality.</span>}
          lede={
            <p>
              A map of each system's basic terms. Select a concept to read its definition, why it matters, and how the other
              tradition answers it. The bronze line crosses the divide to its counterpart.
            </p>
          }
        />

        <Reveal className="onto-map">
          <div className="onto-map__heads">
            <Side who="plato">Vertical: degrees of being</Side>
            <Side who="aris">Concentric: the analysis of a thing</Side>
          </div>
          <svg viewBox="0 0 1200 620" className="onto-svg" aria-label="Interactive map of Platonic and Aristotelian concepts">
            <defs>
              <marker id="on-ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M1 2 L5 8 L9 2" fill="none" stroke="var(--aris)" strokeWidth="1.2" />
              </marker>
              <marker id="on-pl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M1 8 L5 2 L9 8" fill="none" stroke="var(--plato)" strokeWidth="1.2" />
              </marker>
            </defs>

            {/* the divide */}
            <line x1="600" y1="20" x2="600" y2="600" stroke="var(--rule-strong)" strokeDasharray="2 5" />

            {/* ---------- PLATO ---------- */}
            <g {...nodeProps('intelligible')}>
              <rect x="130" y="42" width="340" height="56" className="onto-hit" />
              <rect x="130" y="42" width="340" height="56" className="onto-band" />
              <text x="300" y="68" textAnchor="middle" className="dg-name">THE INTELLIGIBLE REALM</text>
              <text x="300" y="86" textAnchor="middle" className="dg-greek onto-gk">τὸ νοητόν</text>
            </g>

            <line x1="300" y1="224" x2="300" y2="444" stroke="var(--plato)" strokeDasharray="3 5" opacity="0.6" />

            <g {...nodeProps('forms')}>
              <rect x="170" y="140" width="260" height="90" className="onto-hit" />
              {[-60, 0, 60].map((dx, i) => (
                <rect
                  key={dx}
                  x={300 + dx - 10}
                  y={172 - 10}
                  width="20"
                  height="20"
                  transform={`rotate(45 ${300 + dx} 172)`}
                  className={i === 1 ? 'onto-mark onto-mark--solid' : 'onto-mark'}
                />
              ))}
              <text x="300" y="214" textAnchor="middle" className="dg-name">FORMS</text>
              <text x="240" y="150" textAnchor="middle" className="dg-mono onto-small">EQUAL</text>
              <text x="300" y="150" textAnchor="middle" className="dg-mono onto-small">BEAUTIFUL</text>
              <text x="360" y="150" textAnchor="middle" className="dg-mono onto-small">JUST</text>
            </g>

            <g {...nodeProps('participation')}>
              <rect x="220" y="300" width="160" height="64" className="onto-hit" />
              <circle cx="300" cy="322" r="11" className="onto-mark" />
              <circle cx="300" cy="322" r="3" className="onto-mark onto-mark--solid" />
              <text x="322" y="326" className="dg-name">PARTICIPATION</text>
              <text x="322" y="344" className="dg-greek onto-gk">μέθεξις</text>
            </g>

            <g {...nodeProps('particulars')}>
              <rect x="170" y="440" width="260" height="90" className="onto-hit" />
              {Array.from({ length: 11 }).map((_, i) => (
                <circle
                  key={i}
                  cx={230 + i * 14}
                  cy={460 + ((i * 7) % 3) * 6}
                  r="4"
                  className="onto-mark onto-mark--faint"
                />
              ))}
              <text x="300" y="506" textAnchor="middle" className="dg-name">SENSIBLE PARTICULARS</text>
              <text x="300" y="524" textAnchor="middle" className="dg-greek onto-gk">τὰ αἰσθητά</text>
            </g>

            <g {...nodeProps('hierarchy')}>
              <rect x="50" y="90" width="70" height="480" className="onto-hit" />
              <line x1="84" y1="560" x2="84" y2="104" stroke="var(--plato)" strokeWidth="1.2" markerEnd="url(#on-pl)" />
              <text x="0" y="0" transform="translate(70 330) rotate(-90)" textAnchor="middle" className="dg-name">
                HIERARCHY OF BEING
              </text>
            </g>

            {/* ---------- ARISTOTLE ---------- */}
            <path d="M784 196 L872 288" stroke="var(--aris)" fill="none" opacity="0.7" />
            <path d="M784 430 L872 332" stroke="var(--aris)" fill="none" opacity="0.7" />
            <path d="M1040 426 C1110 380 1110 250 1046 204" stroke="var(--aris)" fill="none" markerEnd="url(#on-ar)" opacity="0.7" />
            <text x="1112" y="318" className="dg-mono onto-small">CHANGE</text>
            <path d="M1026 196 L928 290" stroke="var(--aris)" fill="none" opacity="0.35" strokeDasharray="2 4" />
            <path d="M1026 430 L928 330" stroke="var(--aris)" fill="none" opacity="0.35" strokeDasharray="2 4" />

            <g {...nodeProps('accidents')}>
              <circle cx="900" cy="310" r="74" className="onto-orbit" />
              <circle cx="900" cy="310" r="74" className="onto-hit onto-hit--ring" />
              {[20, 110, 200, 290].map((a) => {
                const r = (a * Math.PI) / 180
                return <circle key={a} cx={900 + Math.cos(r) * 74} cy={310 + Math.sin(r) * 74} r="4.5" className="onto-mark onto-mark--aris" />
              })}
              <text x="900" y="410" textAnchor="middle" className="dg-name">ACCIDENTS</text>
              <text x="900" y="428" textAnchor="middle" className="dg-greek onto-gk">συμβεβηκότα</text>
            </g>

            <g {...nodeProps('substance')}>
              <circle cx="900" cy="310" r="42" className="onto-hit" />
              <circle cx="900" cy="310" r="30" className="onto-mark onto-mark--aris onto-mark--solid" />
              <text x="900" y="226" textAnchor="middle" className="dg-name">SUBSTANCE</text>
              <text x="900" y="206" textAnchor="middle" className="dg-greek onto-gk">οὐσία</text>
            </g>

            <g {...nodeProps('form')}>
              <rect x="700" y="130" width="140" height="80" className="onto-hit" />
              <circle cx="770" cy="176" r="12" className="onto-mark onto-mark--aris" />
              <circle cx="770" cy="176" r="4.5" className="onto-mark onto-mark--aris onto-mark--solid" />
              <text x="770" y="148" textAnchor="middle" className="dg-name">FORM</text>
            </g>

            <g {...nodeProps('matter')}>
              <rect x="700" y="420" width="140" height="80" className="onto-hit" />
              <circle cx="770" cy="450" r="12" className="onto-mark onto-mark--aris onto-mark--dashed" />
              <text x="770" y="486" textAnchor="middle" className="dg-name">MATTER</text>
            </g>

            <g {...nodeProps('actuality')}>
              <rect x="970" y="130" width="140" height="80" className="onto-hit" />
              <circle cx="1040" cy="176" r="12" className="onto-mark onto-mark--aris onto-mark--solid" />
              <text x="1040" y="148" textAnchor="middle" className="dg-name">ACTUALITY</text>
            </g>

            <g {...nodeProps('potentiality')}>
              <rect x="960" y="420" width="160" height="80" className="onto-hit" />
              <circle cx="1040" cy="450" r="12" className="onto-mark onto-mark--aris onto-mark--dashed" />
              <text x="1040" y="486" textAnchor="middle" className="dg-name">POTENTIALITY</text>
            </g>

            {/* the bridge to the counterpart concept */}
            <AnimatePresence>
              <motion.path
                key={`${focus}-${partner}`}
                d={bridge(focus, partner)}
                className="onto-bridge"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: EASE }}
              />
            </AnimatePresence>
          </svg>

          {/* compact list version for narrow screens */}
          <div className="onto-list">
            {(['plato', 'aris'] as const).map((w) => (
              <div key={w} className="onto-list__col">
                <Side who={w} />
                <ul>
                  {CONCEPTS.filter((k) => k.who === w).map((k) => (
                    <li key={k.id}>
                      <button
                        className={`onto-chip onto-chip--${w}${sel === k.id ? ' is-sel' : ''}`}
                        aria-pressed={sel === k.id}
                        onClick={() => setSel(k.id)}
                      >
                        {k.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="onto-panel grid" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={c.id}
              className="onto-panel__inner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <div className="onto-panel__main">
                <Side who={c.who}>{c.who === 'plato' ? 'Platonic concept' : 'Aristotelian concept'}</Side>
                <h3 className="onto-panel__name display">{c.name}</h3>
                <p className="onto-panel__greek">
                  <span className="greek" lang="grc">
                    {c.greek}
                  </span>
                  <span className="mono">{c.translit}</span>
                </p>
                <dl className="onto-panel__dl">
                  <dt className="label label--muted">Definition</dt>
                  <dd>{c.definition}</dd>
                  <dt className="label label--muted">Significance</dt>
                  <dd>{c.significance}</dd>
                </dl>
              </div>
              <aside className={`onto-panel__across onto-panel__across--${c.who === 'plato' ? 'aris' : 'plato'}`}>
                <p className="label">Across the divide</p>
                <button className="textbtn onto-panel__partner" onClick={() => setSel(c.link)}>
                  <span className="display">{byId[c.link].name}</span>
                  <span aria-hidden="true"> →</span>
                </button>
                <p>{c.relation}</p>
                <p className="cite">{c.sources}</p>
              </aside>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
