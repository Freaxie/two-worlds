import { useId, useMemo } from 'react'
import { rng } from './common'

/* A street corner at dusk, in the rain — drawn as a grainy, photographic plate.
   Rendered in greys only; each perceiving system tints and annotates it its own way. */

type StreetProps = {
  seed?: number
  awning?: boolean
  rain?: boolean
  cyclist?: boolean
  /* windows lit in this version of the evening */
  litShift?: number
  className?: string
}

export const W = 800
export const H = 600

export function Street({ seed = 1, awning = false, rain = true, cyclist = true, litShift = 0, className }: StreetProps) {
  const uid = useId().replace(/:/g, '')
  const r = useMemo(() => rng(seed), [seed])

  const windows = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; lit: boolean }[] = []
    const blocks = [
      { x: 0, w: 210, top: 90 },
      { x: 520, w: 160, top: 60 },
      { x: 680, w: 120, top: 140 },
    ]
    const rr = rng(11)
    for (const b of blocks)
      for (let y = b.top + 24; y < 330; y += 44)
        for (let x = b.x + 18; x < b.x + b.w - 20; x += 36) out.push({ x, y, w: 18, h: 26, lit: (rr() + litShift) % 1 > 0.62 })
    return out
  }, [litShift])

  const drops = useMemo(
    () => Array.from({ length: 140 }, () => ({ x: r() * (W + 120) - 60, y: r() * H, l: 10 + r() * 22, o: 0.25 + r() * 0.5 })),
    [r]
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f6f6a" />
          <stop offset="0.55" stopColor="#a9a8a1" />
          <stop offset="1" stopColor="#c9c7bf" />
        </linearGradient>
        <linearGradient id={`road${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b4a46" />
          <stop offset="1" stopColor="#1c1c1a" />
        </linearGradient>
        <radialGradient id={`halo${uid}`}>
          <stop offset="0" stopColor="#fbfaf4" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#e9e7de" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e9e7de" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`refl${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f1ea" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f3f1ea" stopOpacity="0" />
        </linearGradient>
        <filter id={`soft${uid}`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={`grain${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed={seed} />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.55 0" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={`url(#sky${uid})`} />

      {/* far skyline */}
      <path d="M210 330V170h60v-30h70v50h50v-70h60v40h70v170Z" fill="#8c8b85" />

      {/* buildings */}
      <rect x="0" y="90" width="210" height="260" fill="#3d3c38" />
      <rect x="520" y="60" width="160" height="290" fill="#46453f" />
      <rect x="680" y="140" width="120" height="210" fill="#34332f" />
      {windows.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill={w.lit ? '#e8e5d9' : '#2a2926'} opacity={w.lit ? 0.92 : 1} />
      ))}

      {/* ground-floor shop */}
      <rect x="520" y="270" width="160" height="80" fill="#23221f" />
      <rect x="534" y="284" width="92" height="56" fill="#cfccc0" opacity="0.85" />
      {awning && (
        <g>
          <path d="M512 262h176l-14 30H526Z" fill="#6c6a63" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${526 + i * 19} 292h10l-2 8h-6Z`} fill="#6c6a63" />
          ))}
        </g>
      )}

      {/* pavement and road */}
      <rect y="350" width={W} height="20" fill="#7d7b74" />
      <rect y="370" width={W} height="230" fill={`url(#road${uid})`} />
      {/* crossing stripes */}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${300 + i * 34} 380l-${14 + i * 3} 220h22l${10 + i * 2}-220Z`} fill="#8f8d86" opacity="0.5" />
      ))}

      {/* lamp and its reflection on the wet road */}
      <rect x="436" y="140" width="5" height="212" fill="#1e1d1b" />
      <path d="M424 140h29l-5 12h-19Z" fill="#1e1d1b" />
      <circle cx="438" cy="156" r="70" fill={`url(#halo${uid})`} />
      <rect x="418" y="372" width="40" height="190" fill={`url(#refl${uid})`} filter={`url(#soft${uid})`} />
      {/* shop window reflection */}
      <rect x="540" y="372" width="80" height="120" fill={`url(#refl${uid})`} opacity="0.5" filter={`url(#soft${uid})`} />

      {/* pedestrian under an umbrella */}
      <g transform="translate(150 262)">
        <path d="M-34 22 Q0 -14 34 22Z" fill="#171614" />
        <line x1="0" y1="10" x2="0" y2="40" stroke="#171614" strokeWidth="2" />
        <rect x="-9" y="26" width="18" height="46" rx="5" fill="#252421" />
        <rect x="-8" y="70" width="6" height="22" fill="#1a1917" />
        <rect x="2" y="70" width="6" height="22" fill="#1a1917" />
      </g>

      {/* cyclist crossing */}
      {cyclist && <Cyclist transform="translate(300 330)" />}

      {/* rain */}
      {rain && (
        <g className="street__rain" stroke="#f0eee6" strokeWidth="1">
          {drops.map((d, i) => (
            <line key={i} x1={d.x} y1={d.y} x2={d.x - d.l * 0.25} y2={d.y + d.l} opacity={d.o} />
          ))}
        </g>
      )}

      <rect width={W} height={H} filter={`url(#grain${uid})`} style={{ mixBlendMode: 'overlay' }} />
    </svg>
  )
}

export function Cyclist({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <circle cx="0" cy="40" r="17" fill="none" stroke="#151412" strokeWidth="3" />
      <circle cx="54" cy="40" r="17" fill="none" stroke="#151412" strokeWidth="3" />
      <path d="M0 40 L22 14 L44 14 L54 40 M22 14 L28 40 L44 14" fill="none" stroke="#151412" strokeWidth="3" />
      <path d="M26 12 L30 -14 L42 -30" stroke="#1d1c1a" strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="44" cy="-40" r="8" fill="#1d1c1a" />
      <circle cx="58" cy="16" r="3" fill="#fbfaf4" />
    </g>
  )
}
