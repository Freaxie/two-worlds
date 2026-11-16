import { useEffect, useMemo, useRef } from 'react'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import { MONOLOGUE } from '../../data/masking'

/* ------------------------------------------------------------------
   THE MASK. A calm porcelain surface split into shards. As `progress`
   runs 0 → 1, cracks spread outward from one point, shards fall away,
   and the inner monologue beneath is revealed — then, finally, a
   quieter question at the centre.
------------------------------------------------------------------- */

const VW = 400
const VH = 520
const FACE = 'M200,14 C318,14 384,112 384,236 C384,382 300,506 200,506 C100,506 16,382 16,236 C16,112 82,14 200,14 Z'
const ORIGIN: [number, number] = [158, 214]

function rng(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

type Shard = { d: string; cx: number; cy: number; t: number; rot: number; dx: number; dy: number }

function makeShards(): Shard[] {
  const r = rng(11)
  const COLS = 7
  const ROWS = 9
  const cw = VW / COLS
  const ch = VH / ROWS
  const P: [number, number][][] = []
  for (let j = 0; j <= ROWS; j++) {
    P[j] = []
    for (let i = 0; i <= COLS; i++) {
      let x = i * cw
      let y = j * ch
      if (i > 0 && i < COLS) x += (r() - 0.5) * 0.62 * cw
      if (j > 0 && j < ROWS) y += (r() - 0.5) * 0.62 * ch
      P[j][i] = [x, y]
    }
  }
  const maxD = Math.hypot(VW, VH) * 0.62
  const shards: Shard[] = []
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const a = P[j][i]
      const b = P[j][i + 1]
      const c = P[j + 1][i + 1]
      const d = P[j + 1][i]
      const tris = r() > 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]
      for (const tri of tris) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3
        const dist = Math.hypot(cx - ORIGIN[0], cy - ORIGIN[1]) / maxD
        const len = Math.hypot(cx - ORIGIN[0], cy - ORIGIN[1]) || 1
        shards.push({
          d: `M${tri.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`,
          cx,
          cy,
          t: 0.17 + 0.5 * Math.min(1, dist) + r() * 0.08,
          rot: (r() - 0.5) * 90,
          dx: (cx - ORIGIN[0]) / len,
          dy: (cy - ORIGIN[1]) / len,
        })
      }
    }
  return shards
}

const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function MaskVisual({ progress, drift }: { progress: MotionValue<number>; drift: boolean }) {
  const shards = useMemo(makeShards, [])
  const shardRefs = useRef<(SVGPathElement | null)[]>([])
  const surfaceTextRef = useRef<SVGGElement>(null)
  const eyesRef = useRef<SVGGElement>(null)
  const innerRef = useRef<SVGGElement>(null)
  const coreRef = useRef<SVGGElement>(null)

  const update = (p: number) => {
    shards.forEach((s, i) => {
      const el = shardRefs.current[i]
      if (!el) return
      const local = clamp((p - s.t) / 0.14)
      const crack = clamp((p - (s.t - 0.1)) / 0.08)
      if (local <= 0) {
        el.style.transform = ''
        el.style.opacity = '1'
      } else {
        const tx = s.dx * local * 70
        const ty = s.dy * local * 70 + local * local * 260
        el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(s.rot * local).toFixed(1)}deg)`
        el.style.opacity = String(1 - Math.pow(local, 1.4))
      }
      el.style.strokeOpacity = String(0.6 * crack)
    })
    if (surfaceTextRef.current) surfaceTextRef.current.style.opacity = String(1 - clamp((p - 0.2) / 0.1))
    if (eyesRef.current) eyesRef.current.style.opacity = String(1 - clamp((p - 0.24) / 0.12))
    if (innerRef.current) innerRef.current.style.opacity = String(p < 0.5 ? 1 : 1 - 0.55 * clamp((p - 0.5) / 0.2) - 0.27 * clamp((p - 0.74) / 0.12))
    if (coreRef.current) coreRef.current.style.opacity = String(clamp((p - 0.74) / 0.12))
  }

  useMotionValueEvent(progress, 'change', update)
  useEffect(() => update(progress.get()))

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <clipPath id="face-clip">
          <path d={FACE} />
        </clipPath>
        <linearGradient id="porcelain" gradientUnits="userSpaceOnUse" x1="60" y1="20" x2="360" y2="500">
          <stop offset="0%" stopColor="#ecebf6" />
          <stop offset="55%" stopColor="#c9c5dc" />
          <stop offset="100%" stopColor="#9d98b8" />
        </linearGradient>
        <radialGradient id="inner-glow" cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor="#171c38" />
          <stop offset="100%" stopColor="#070914" />
        </radialGradient>
        <radialGradient id="core-glow">
          <stop offset="0%" stopColor="var(--color-amber)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-amber)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* beneath: the inner monologue */}
      <g clipPath="url(#face-clip)">
        <path d={FACE} fill="url(#inner-glow)" />
        <g ref={innerRef}>
          {MONOLOGUE.map((m, i) => {
            const y = 58 + i * 23
            const x = 200 + ((i % 3) - 1) * 36
            return (
              <g key={i} className={drift ? (i % 2 ? 'mask-drift-a' : 'mask-drift-b') : ''}>
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={m.sys === 'both' ? 14 : 12.5}
                  fill={m.sys === 'a' ? 'var(--color-violet)' : m.sys === 'b' ? 'var(--color-cyan)' : 'var(--color-amber)'}
                  fillOpacity={m.sys === 'both' ? 0.95 : 0.8}
                >
                  {m.text}
                </text>
              </g>
            )
          })}
        </g>
        <g ref={coreRef} style={{ opacity: 0 }}>
          <circle cx="200" cy="250" r="150" fill="url(#core-glow)" />
          <text x="200" y="244" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="25" fill="var(--color-ink)">
            who would I be
          </text>
          <text x="200" y="274" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="25" fill="var(--color-ink)">
            without it?
          </text>
        </g>
      </g>

      {/* the surface */}
      <g clipPath="url(#face-clip)">
        {shards.map((s, i) => (
          <path
            key={i}
            ref={(el) => {
              shardRefs.current[i] = el
            }}
            d={s.d}
            fill="url(#porcelain)"
            stroke="#070914"
            strokeWidth="1.1"
            strokeOpacity="0"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      </g>
      <g ref={eyesRef}>
        <path d="M110,226 Q146,198 182,226 Q146,244 110,226 Z" fill="#1d2140" />
        <path d="M218,226 Q254,198 290,226 Q254,244 218,226 Z" fill="#1d2140" />
      </g>
      <g ref={surfaceTextRef}>
        <text x="200" y="352" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="19" fontWeight="600" fill="#2a2840">
          I’m good — just a
        </text>
        <text x="200" y="378" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="19" fontWeight="600" fill="#2a2840">
          busy week, that’s all!
        </text>
      </g>
      {/* outline */}
      <path d={FACE} fill="none" stroke="rgb(190 194 255 / 0.25)" strokeWidth="1" />
    </svg>
  )
}
