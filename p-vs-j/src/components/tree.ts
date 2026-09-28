import { rng, seg } from './common'

/* A small shared model for branching diagrams: nodes grow out of their parent over time. */

export type TNode = { x: number; y: number; parent: number; depth: number }

export function makeTree(opts: {
  seed: number
  x: number
  y: number
  angle: number
  len: number
  depth: number
  spread: number
  kids?: (depth: number, r: () => number) => number
  shrink?: number
}): TNode[] {
  const r = rng(opts.seed)
  const nodes: TNode[] = [{ x: opts.x, y: opts.y, parent: -1, depth: 0 }]
  const shrink = opts.shrink ?? 0.7
  const kids = opts.kids ?? ((d, rr) => (d === 0 ? 3 : 2 + (rr() < 0.3 ? 1 : 0)))
  const grow = (i: number, ang: number, len: number, d: number) => {
    if (d >= opts.depth) return
    const n = kids(d, r)
    const spread = opts.spread * Math.pow(0.82, d)
    for (let k = 0; k < n; k++) {
      const t = n === 1 ? 0 : k / (n - 1) - 0.5
      const a = ang + t * spread + (r() - 0.5) * 0.3
      const l = len * (0.8 + r() * 0.4)
      const p = nodes[i]
      nodes.push({ x: p.x + Math.cos(a) * l, y: p.y + Math.sin(a) * l, parent: i, depth: d + 1 })
      grow(nodes.length - 1, a, len * shrink, d + 1)
    }
  }
  grow(0, opts.angle, opts.len, 0)
  return nodes
}

/**
 * Position of node i at time t (0–1): each generation leaves its parent during its own
 * window, so the tree visibly opens generation by generation.
 */
export function treePos(nodes: TNode[], i: number, t: number, maxDepth: number): [number, number] {
  const n = nodes[i]
  if (n.parent < 0) return [n.x, n.y]
  const [px, py] = treePos(nodes, n.parent, t, maxDepth)
  const span = 1 / maxDepth
  const a = (n.depth - 1) * span * 0.85
  const k = ease(seg(t, a, a + span * 1.15))
  return [px + (n.x - px) * k, py + (n.y - py) * k]
}

export function treeVisible(n: TNode, t: number, maxDepth: number) {
  if (n.parent < 0) return 1
  const span = 1 / maxDepth
  const a = (n.depth - 1) * span * 0.85
  return seg(t, a, a + span * 0.4)
}

export const ease = (x: number) => 1 - Math.pow(1 - x, 3)
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Scales a tree uniformly so it fits inside a box, keeping its root where it is. */
export function fitTree(nodes: TNode[], box: { x0: number; y0: number; x1: number; y1: number }): TNode[] {
  const root = nodes[0]
  let k = 1
  for (const n of nodes) {
    const dx = n.x - root.x
    const dy = n.y - root.y
    if (dx > 0) k = Math.min(k, (box.x1 - root.x) / dx)
    if (dx < 0) k = Math.min(k, (box.x0 - root.x) / dx)
    if (dy > 0) k = Math.min(k, (box.y1 - root.y) / dy)
    if (dy < 0) k = Math.min(k, (box.y0 - root.y) / dy)
  }
  return nodes.map((n) => ({ ...n, x: root.x + (n.x - root.x) * k, y: root.y + (n.y - root.y) * k }))
}

/** Smooth path through points (Catmull-Rom converted to cubic Béziers) */
export function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}
