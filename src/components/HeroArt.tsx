import { useEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/* deterministic scatter so the sky is identical on every visit */
export function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- Dodecahedron: the figure the Timaeus assigns to the whole (55c) ---------- */

const PHI = (1 + Math.sqrt(5)) / 2
const DODECA_V: [number, number, number][] = (() => {
  const v: [number, number, number][] = []
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([x, y, z])
  const a = 1 / PHI
  for (const s1 of [-1, 1])
    for (const s2 of [-1, 1]) {
      v.push([0, s1 * a, s2 * PHI])
      v.push([s1 * a, s2 * PHI, 0])
      v.push([s1 * PHI, 0, s2 * a])
    }
  return v
})()
const DODECA_E: [number, number][] = (() => {
  const e: [number, number][] = []
  const L = 2 / PHI
  for (let i = 0; i < DODECA_V.length; i++)
    for (let j = i + 1; j < DODECA_V.length; j++) {
      const [a, b, c] = DODECA_V[i]
      const [d, f, g] = DODECA_V[j]
      if (Math.abs(Math.hypot(a - d, b - f, c - g) - L) < 1e-6) e.push([i, j])
    }
  return e
})()

function Dodecahedron({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const lines = useRef<(SVGLineElement | null)[]>([])
  const reduce = useReducedMotion()

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      const t = reduce ? 0.6 : (now - t0) / 1000
      const ay = 0.5 + t * 0.07
      const ax = 0.42 + Math.sin(t * 0.05) * 0.2
      const cyA = Math.cos(ay), syA = Math.sin(ay), cxA = Math.cos(ax), sxA = Math.sin(ax)
      const P = DODECA_V.map(([x, y, z]) => {
        const x1 = x * cyA + z * syA
        const z1 = -x * syA + z * cyA
        const y2 = y * cxA - z1 * sxA
        const z2 = y * sxA + z1 * cxA
        return [cx + (x1 * r) / PHI / 1.1, cy + (y2 * r) / PHI / 1.1, z2]
      })
      DODECA_E.forEach(([i, j], k) => {
        const el = lines.current[k]
        if (!el) return
        const [x1, y1, z1] = P[i]
        const [x2, y2, z2] = P[j]
        el.setAttribute('x1', x1.toFixed(1))
        el.setAttribute('y1', y1.toFixed(1))
        el.setAttribute('x2', x2.toFixed(1))
        el.setAttribute('y2', y2.toFixed(1))
        const depth = (z1 + z2) / 2 / PHI // -1..1
        el.setAttribute('opacity', (0.28 + depth * 0.2).toFixed(2))
      })
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [cx, cy, r, reduce])

  return (
    <g stroke="#b9c6d2" strokeWidth="1" fill="none">
      <circle cx={cx} cy={cy} r={r * 1.08} stroke="#b9c6d2" opacity="0.14" strokeDasharray="2 6" />
      {DODECA_E.map((_, k) => (
        <line key={k} ref={(el) => { lines.current[k] = el }} />
      ))}
    </g>
  )
}

/* ---------- Plato's side: the intelligible sky ---------- */

export function PlatoSky() {
  const stars = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: 150 }, () => {
      const y = Math.pow(r(), 1.5) * 1000
      return { x: r() * 720, y, s: r() < 0.08 ? 1.6 : 0.5 + r() * 0.8, o: 0.25 + r() * 0.6 }
    })
  }, [])

  /* Republic VI, 509d: a line cut into two unequal parts, each cut again in the same ratio.
     Lengths here use ratio 1 : 1.6, so the two middle segments come out equal, as they must. */
  const base = 640
  const total = 470
  const k = 1.6
  const vis = total / (1 + k)
  const intl = total - vis
  const seg = [vis / (1 + k), (vis * k) / (1 + k), intl / (1 + k), (intl * k) / (1 + k)]
  const marks = [base]
  seg.forEach((s) => marks.push(marks[marks.length - 1] - s))
  const names = [
    ['εἰκασία', 'images'],
    ['πίστις', 'belief'],
    ['διάνοια', 'thought'],
    ['νόησις', 'understanding'],
  ]

  return (
    <svg className="hero-art" viewBox="0 0 720 1000" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="sky-glow" cx="0.72" cy="0.18" r="0.7">
          <stop offset="0" stopColor="#2a3442" />
          <stop offset="1" stopColor="#16191e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rise" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#b9c6d2" stopOpacity="0" />
          <stop offset="0.6" stopColor="#b9c6d2" stopOpacity="0.35" />
          <stop offset="1" stopColor="#b9c6d2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="720" height="1000" fill="url(#sky-glow)" />

      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#e8ecef" opacity={s.o} />
      ))}

      {/* constellation-like construction: an equilateral triangle, the Timaeus' elementary figure */}
      <g stroke="#b9c6d2" strokeWidth="0.8" fill="none" opacity="0.5">
        <path d="M470 150 L620 410 L320 410 Z" strokeDasharray="1 5" />
        <circle cx="470" cy="323.2" r="173.2" opacity="0.5" />
        <line x1="470" y1="150" x2="470" y2="410" opacity="0.6" />
        {[
          [470, 150],
          [620, 410],
          [320, 410],
          [470, 323.2],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.4" fill="#e8ecef" stroke="none" />
        ))}
      </g>

      <Dodecahedron cx={260} cy={520} r={110} />

      {/* ascending hairlines */}
      <g className="hero-rise">
        {[150, 300, 560, 640].map((x, i) => (
          <line key={x} x1={x} y1={980 - i * 40} x2={x} y2={120 + i * 30} stroke="url(#rise)" strokeWidth="0.8" />
        ))}
      </g>

      {/* the Divided Line */}
      <g className="divided-line" fontFamily="'GFS Didot', serif" fill="#c7d1da">
        <line x1="44" y1={marks[0]} x2="44" y2={marks[4]} stroke="#c7d1da" strokeWidth="1" opacity="0.6" />
        {marks.map((m, i) => (
          <line key={i} x1="38" x2="50" y1={m} y2={m} stroke="#c7d1da" strokeWidth="1" opacity="0.7" />
        ))}
        {names.map(([g, e], i) => {
          const mid = (marks[i] + marks[i + 1]) / 2
          return (
            <g key={g} opacity={0.55 + i * 0.12}>
              <text x="62" y={mid} fontSize="15">
                {g}
              </text>
              <text x="62" y={mid + 15} fontSize="9" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.2" opacity="0.7">
                {e.toUpperCase()}
              </text>
            </g>
          )
        })}
        <text x="40" y={marks[0] + 28} fontSize="10" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.4" opacity="0.6">
          REP. 509D
        </text>
      </g>
    </svg>
  )
}

/* ---------- Aristotle's side: the field notebook ---------- */

export function AristotleField() {
  const ink = '#5b4a36'
  return (
    <svg className="hero-art" viewBox="0 0 720 1000" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {/* ---- botanical plate (Lyceum botany: Theophrastus, Enquiry into Plants) ---- */}
        <g opacity="0.55" transform="translate(500 130) scale(0.74)">
          <rect x="0" y="0" width="210" height="440" strokeWidth="0.6" opacity="0.6" />
          <text x="10" y="18" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="8.5" letterSpacing="1.3">
            TAB. I
          </text>
          {/* stem */}
          <path d="M108 400 C104 330 114 260 106 190 C100 140 108 90 112 56" strokeWidth="1.2" />
          {/* leaves: alternate, lanceolate, with midribs */}
          {[
            [106, 330, -1, 1],
            [109, 280, 1, 0.95],
            [106, 232, -1, 0.85],
            [104, 186, 1, 0.75],
            [106, 140, -1, 0.62],
            [110, 100, 1, 0.5],
          ].map(([x, y, d, s], i) => {
            const L = 78 * s
            const tip = x + d * L
            return (
              <g key={i}>
                <path
                  d={`M${x} ${y} C${x + d * L * 0.3} ${y - 26 * s} ${x + d * L * 0.8} ${y - 30 * s} ${tip} ${y - 36 * s} C${x + d * L * 0.75} ${y - 8 * s} ${x + d * L * 0.3} ${y + 4 * s} ${x} ${y}`}
                  strokeWidth="0.9"
                />
                <path d={`M${x} ${y} Q${x + d * L * 0.55} ${y - 18 * s} ${tip} ${y - 36 * s}`} strokeWidth="0.5" opacity="0.7" />
                {[0.3, 0.5, 0.7].map((f) => (
                  <path
                    key={f}
                    d={`M${x + d * L * f} ${y - 16 * s * f * 1.6} l${d * 8 * s} ${-10 * s}`}
                    strokeWidth="0.4"
                    opacity="0.6"
                  />
                ))}
              </g>
            )
          })}
          {/* terminal umbel */}
          {Array.from({ length: 9 }).map((_, i) => {
            const a = -Math.PI / 2 + (i - 4) * 0.28
            const x2 = 112 + Math.cos(a) * 34
            const y2 = 56 + Math.sin(a) * 30
            return (
              <g key={i}>
                <line x1="112" y1="56" x2={x2} y2={y2} strokeWidth="0.6" />
                <circle cx={x2} cy={y2} r="2.4" strokeWidth="0.6" />
              </g>
            )
          })}
          {/* roots */}
          <path d="M108 400 C100 412 90 420 76 426 M108 400 C114 414 126 420 140 428 M108 400 C108 414 104 426 108 436 M96 414 C90 424 82 428 72 432 M122 414 C130 424 140 426 150 424" strokeWidth="0.6" />
          <line x1="20" y1="400" x2="190" y2="400" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.7" />
        </g>

        {/* ---- a division of animals: blooded / bloodless (History of Animals I–IV) ---- */}
        <g opacity="0.5" transform="translate(440 510)" fontFamily="'GFS Didot', serif">
          <text x="0" y="104" fill={ink} stroke="none" fontSize="15">
            ζῷα
          </text>
          <path d="M32 99 L48 99 M48 40 L48 158 M48 40 L62 40 M48 158 L62 158" strokeWidth="0.7" />
          <text x="68" y="44" fill={ink} stroke="none" fontSize="13">
            ἔναιμα
          </text>
          <text x="68" y="162" fill={ink} stroke="none" fontSize="13">
            ἄναιμα
          </text>
          <path d="M118 40 L128 40 M128 8 L128 72" strokeWidth="0.6" />
          <path d="M118 158 L128 158 M128 126 L128 190" strokeWidth="0.6" />
          {['man', 'viviparous quadrupeds', 'oviparous quadrupeds', 'birds', 'fishes'].map((t, i) => (
            <g key={t}>
              <line x1="128" x2="136" y1={8 + i * 16} y2={8 + i * 16} strokeWidth="0.5" />
              <text x="140" y={11 + i * 16} fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="7.5" letterSpacing="0.6">
                {t.toUpperCase()}
              </text>
            </g>
          ))}
          {['cephalopods', 'crustaceans', 'testaceans', 'insects'].map((t, i) => (
            <g key={t}>
              <line x1="128" x2="136" y1={126 + i * 21} y2={126 + i * 21} strokeWidth="0.5" />
              <text x="140" y={129 + i * 21} fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="7.5" letterSpacing="0.6">
                {t.toUpperCase()}
              </text>
            </g>
          ))}
        </g>

        {/* ---- the ground: a measured horizontal ---- */}
        <g opacity="0.5">
          <line x1="0" y1="780" x2="720" y2="780" strokeWidth="0.7" />
          {Array.from({ length: 37 }).map((_, i) => (
            <line key={i} x1={i * 20} x2={i * 20} y1="780" y2={i % 5 === 0 ? 772 : 776} strokeWidth="0.6" />
          ))}
        </g>
      </g>
    </svg>
  )
}

/* ---------- The cuttlefish, after History of Animals IV.1 (used in Room VI) ---------- */

export function Cuttlefish({ className }: { className?: string }) {
  const ink = 'currentColor'
  return (
    <svg className={className} viewBox="-4 0 310 140" aria-hidden="true">
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {/* ---- anatomical sketch: the cuttlefish (History of Animals IV.1) ---- */}
        <g>
          {/* mantle with lateral fin */}
          <path d="M120 40 C150 14 250 12 290 38 C304 48 304 62 290 72 C250 98 150 96 120 70 Z" strokeWidth="1" />
          <path d="M126 36 C160 6 252 2 296 32 M126 74 C160 104 252 108 296 78" strokeWidth="0.5" opacity="0.7" />
          {/* cuttlebone, drawn as a dashed internal outline */}
          <path d="M140 55 C170 40 250 40 282 55 C250 70 170 70 140 55 Z" strokeWidth="0.5" strokeDasharray="2 3" />
          {/* head and eye */}
          <path d="M120 40 C108 42 98 48 96 55 C98 62 108 68 120 70" strokeWidth="1" />
          <circle cx="110" cy="52" r="5" strokeWidth="0.8" />
          <circle cx="110" cy="52" r="1.5" fill={ink} stroke="none" />
          {/* eight arms and two longer tentacles */}
          {[-18, -12, -6, 0, 6, 12, 18, 24].map((o, i) => (
            <path key={i} d={`M96 ${55 + o * 0.3} C80 ${52 + o * 0.6} 64 ${54 + o} 48 ${56 + o * 1.3}`} strokeWidth="0.7" />
          ))}
          <path d="M96 52 C60 40 30 44 4 30 M96 58 C60 70 30 66 6 80" strokeWidth="0.7" />
          <circle cx="4" cy="30" r="2" strokeWidth="0.6" />
          <circle cx="6" cy="80" r="2" strokeWidth="0.6" />
          <text x="130" y="128" fill={ink} stroke="none" fontFamily="'GFS Didot', serif" fontSize="14">
            σηπία
          </text>
          <text x="176" y="128" fill={ink} stroke="none" fontFamily="'IBM Plex Mono', monospace" fontSize="8" letterSpacing="1.2">
            CUTTLEFISH · HA IV.1
          </text>
        </g>

      </g>
    </svg>
  )
}
