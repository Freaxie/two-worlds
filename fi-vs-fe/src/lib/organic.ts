/* ------------------------------------------------------------------
   Organic geometry: smooth closed blobs that breathe over time.
   Every living form on the site is a ring of points pushed in and out
   by layered sine waves, then threaded with a Catmull-Rom curve.
------------------------------------------------------------------- */

export type Pt = [number, number]

/* Catmull-Rom → cubic Bézier, closed. Produces a soft continuous outline. */
export function smoothClosed(pts: Pt[], tension = 1): string {
  const n = pts.length
  if (n < 3) return ''
  const f = (v: number) => v.toFixed(2)
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`
  }
  return d + 'Z'
}

export type BlobOpts = {
  cx: number
  cy: number
  r: number
  /* 0..1 — how far the outline strays from a circle */
  wobble?: number
  points?: number
  seed?: number
  /* time in seconds — drives the breathing */
  t?: number
  /* horizontal / vertical stretch */
  sx?: number
  sy?: number
}

export function blobPoints({ cx, cy, r, wobble = 0.12, points = 9, seed = 1, t = 0, sx = 1, sy = 1 }: BlobOpts): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const n =
      Math.sin(a * 2 + seed * 1.7 + t * 0.55) * 0.55 +
      Math.sin(a * 3 - seed * 2.3 + t * 0.37) * 0.3 +
      Math.sin(a * 5 + seed * 0.9 - t * 0.23) * 0.15
    const rr = r * (1 + n * wobble)
    pts.push([cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy])
  }
  return pts
}

export const blob = (o: BlobOpts) => smoothClosed(blobPoints(o))

/* Deterministic pseudo-random for stable layouts */
export function rand(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/* maps v from [a,b] to [0,1], clamped */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a))
export const smooth = (t: number) => t * t * (3 - 2 * t)

/* Mix two hex colours */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (p: number, s: number) => (p >> s) & 255
  const m = (s: number) => Math.round(lerp(ch(pa, s), ch(pb, s), t))
  return `rgb(${m(16)},${m(8)},${m(0)})`
}

export const C = {
  paper: '#f3eee5',
  paper3: '#e0d7c6',
  ink: '#121110',
  muted: '#6d665b',
  faint: '#a59d8f',
  fi: '#7c1631',
  fi2: '#a3263f',
  fiDeep: '#4a0c1c',
  fiMist: '#ead6d3',
  fe: '#e8804f',
  fe2: '#f2a65a',
  feDeep: '#b8532a',
  feMist: '#f6e2cc',
}
