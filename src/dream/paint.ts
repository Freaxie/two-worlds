/* ------------------------------------------------------------------
   BLUE HOUR — painting primitives
   Everything on screen is drawn from these: sprites made once at
   start-up, plus live strokes for towers, grass, water and lights.
------------------------------------------------------------------- */

export type Ctx = CanvasRenderingContext2D

/** Scene frame: canvas size, unit (short side) and centre */
export interface Frame {
  W: number
  H: number
  u: number
  cx: number
  cy: number
  /** half-extent that stays covered under any camera rotation */
  ext: number
}

export const TAU = Math.PI * 2
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t))

/** Seeded PRNG (mulberry32) so every shot is composed the same way each loop */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/* ---------------- sprites ---------------- */

export type FlowerKind = 'cosmos' | 'cosmosWhite' | 'nemo' | 'rose' | 'lily' | 'daisy' | 'bud'
export type PuffTint = 'day' | 'dusk' | 'night'

export interface Sprites {
  flower: Record<FlowerKind, HTMLCanvasElement>
  puff: Record<PuffTint, HTMLCanvasElement>
  glow: HTMLCanvasElement
  leaf: HTMLCanvasElement
}

const S = 160

function petalFlower(
  n: number,
  len: number,
  wid: number,
  inner: string,
  outer: string,
  centre: string,
  centreR: number,
  vein?: string
) {
  const c = canvas(S)
  const g = c.getContext('2d')!
  g.translate(S / 2, S / 2)
  for (let i = 0; i < n; i++) {
    g.save()
    g.rotate((i / n) * TAU + 0.2)
    const grad = g.createLinearGradient(0, 0, len, 0)
    grad.addColorStop(0, inner)
    grad.addColorStop(1, outer)
    g.fillStyle = grad
    g.beginPath()
    g.ellipse(len * 0.52, 0, len * 0.5, wid, 0, 0, TAU)
    g.fill()
    if (vein) {
      g.strokeStyle = vein
      g.lineWidth = 1.2
      g.beginPath()
      g.moveTo(centreR, 0)
      g.lineTo(len * 0.9, 0)
      g.moveTo(centreR, 0)
      g.lineTo(len * 0.8, wid * 0.45)
      g.moveTo(centreR, 0)
      g.lineTo(len * 0.8, -wid * 0.45)
      g.stroke()
    }
    g.restore()
  }
  const cg = g.createRadialGradient(-centreR * 0.3, -centreR * 0.3, 1, 0, 0, centreR)
  cg.addColorStop(0, '#fff6c8')
  cg.addColorStop(1, centre)
  g.fillStyle = cg
  g.beginPath()
  g.arc(0, 0, centreR, 0, TAU)
  g.fill()
  return c
}

function rose() {
  const c = canvas(S)
  const g = c.getContext('2d')!
  g.translate(S / 2, S / 2)
  const R = S * 0.44
  // outer cup of petals
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU
    const grad = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R)
    grad.addColorStop(0, '#f6a9c2')
    grad.addColorStop(0.75, '#f7c3d3')
    grad.addColorStop(1, '#d9759a')
    g.fillStyle = grad
    g.beginPath()
    g.ellipse(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, R * 0.58, R * 0.48, a, 0, TAU)
    g.fill()
  }
  // spiral of inner petal edges
  for (let k = 0; k < 5; k++) {
    const r = R * (0.62 - k * 0.11)
    g.strokeStyle = k < 2 ? 'rgba(196,78,122,.55)' : 'rgba(170,52,98,.75)'
    g.lineWidth = 3.4 - k * 0.4
    g.beginPath()
    g.arc(k * 1.5, k * 1.2, r, 0.4 + k * 1.3, 0.4 + k * 1.3 + 4.2)
    g.stroke()
  }
  const hi = g.createRadialGradient(-R * 0.3, -R * 0.4, 1, -R * 0.2, -R * 0.3, R * 0.6)
  hi.addColorStop(0, 'rgba(255,240,246,.7)')
  hi.addColorStop(1, 'rgba(255,240,246,0)')
  g.fillStyle = hi
  g.beginPath()
  g.arc(0, 0, R, 0, TAU)
  g.fill()
  return c
}

function puff(light: string, shade: string, core: string) {
  const c = canvas(S)
  const g = c.getContext('2d')!
  const r = S / 2
  const fade = (col: string, a: number) => col.replace(/[\d.]+\)$/, `${a})`)
  // body: shaded underside with a soft edge
  const base = g.createRadialGradient(r, r * 1.05, 0, r, r, r)
  base.addColorStop(0, fade(core, 1))
  base.addColorStop(0.55, fade(shade, 0.95))
  base.addColorStop(0.8, fade(shade, 0.5))
  base.addColorStop(1, fade(shade, 0))
  g.fillStyle = base
  g.fillRect(0, 0, S, S)
  // sunlit crown
  const top = g.createRadialGradient(r * 0.8, r * 0.55, 0, r * 0.85, r * 0.65, r * 0.75)
  top.addColorStop(0, fade(light, 0.8))
  top.addColorStop(0.5, fade(light, 0.4))
  top.addColorStop(1, fade(light, 0))
  g.fillStyle = top
  g.fillRect(0, 0, S, S)
  return c
}

function glow() {
  const c = canvas(S)
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.12, 'rgba(255,255,255,.85)')
  grad.addColorStop(0.35, 'rgba(200,215,255,.25)')
  grad.addColorStop(1, 'rgba(160,180,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, S, S)
  return c
}

function leaf() {
  const c = canvas(S)
  const g = c.getContext('2d')!
  g.translate(S / 2, S / 2)
  const grad = g.createLinearGradient(-S * 0.4, -S * 0.2, S * 0.4, S * 0.2)
  grad.addColorStop(0, '#2f6b2a')
  grad.addColorStop(1, '#0f2a14')
  g.fillStyle = grad
  g.beginPath()
  g.ellipse(0, 0, S * 0.45, S * 0.22, 0, 0, TAU)
  g.fill()
  g.strokeStyle = 'rgba(160,210,140,.35)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(-S * 0.42, 0)
  g.lineTo(S * 0.42, 0)
  g.stroke()
  return c
}

export function makeSprites(): Sprites {
  return {
    flower: {
      cosmos: petalFlower(8, S * 0.44, S * 0.13, '#c8487e', '#fbd3e2', '#e7b21c', S * 0.08),
      cosmosWhite: petalFlower(8, S * 0.44, S * 0.13, '#f1d3de', '#ffffff', '#e9b81d', S * 0.08),
      nemo: petalFlower(5, S * 0.45, S * 0.2, '#f4f7ff', '#5b7cff', '#e8f0ff', S * 0.07, 'rgba(40,60,190,.5)'),
      daisy: petalFlower(12, S * 0.44, S * 0.07, '#ffffff', '#c5d4ff', '#f2d45c', S * 0.1),
      lily: petalFlower(6, S * 0.46, S * 0.15, '#fbfbe8', '#ffffff', '#c7d67a', S * 0.06, 'rgba(160,170,120,.35)'),
      bud: petalFlower(5, S * 0.3, S * 0.16, '#ffffff', '#f3e9ef', '#f4f0d0', S * 0.06),
      rose: rose(),
    },
    puff: {
      day: puff('rgba(250,252,255,1)', 'rgba(150,170,230,1)', 'rgba(118,138,212,1)'),
      dusk: puff('rgba(255,230,244,1)', 'rgba(150,135,205,1)', 'rgba(96,86,170,1)'),
      night: puff('rgba(200,210,255,1)', 'rgba(70,82,160,1)', 'rgba(38,46,112,1)'),
    },
    glow: glow(),
    leaf: leaf(),
  }
}

/* ---------------- backgrounds ---------------- */

export function sky(ctx: Ctx, F: Frame, stops: [number, string][], top = -1, bottom = 1) {
  const y0 = F.cy + top * F.u
  const y1 = F.cy + bottom * F.u
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  for (const [o, c] of stops) g.addColorStop(o, c)
  ctx.fillStyle = g
  ctx.fillRect(F.cx - F.ext * 2, F.cy - F.ext * 2, F.ext * 4, F.ext * 4)
}

export function stars(ctx: Ctx, F: Frame, seed: number, n: number, yMax: number, t: number) {
  const r = rng(seed)
  ctx.fillStyle = '#fff'
  for (let i = 0; i < n; i++) {
    const x = F.cx + (r() * 2 - 1) * F.ext
    const y = F.cy - F.ext + r() * (yMax - (F.cy - F.ext))
    const tw = 0.5 + 0.5 * Math.sin(t * 3 + i)
    ctx.globalAlpha = 0.3 + 0.6 * tw * r()
    const s = r() < 0.1 ? 2 : 1.2
    ctx.fillRect(x, y, s, s)
  }
  ctx.globalAlpha = 1
}

/** A bright sun or moon with a starburst; bloom in the lens does the rest */
export function orb(ctx: Ctx, sp: Sprites, x: number, y: number, r: number, t: number, rays = true) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(sp.glow, x - r * 6, y - r * 6, r * 12, r * 12)
  ctx.drawImage(sp.glow, x - r * 2, y - r * 2, r * 4, r * 4)
  if (rays) {
    ctx.translate(x, y)
    ctx.rotate(t * 0.05)
    for (let i = 0; i < 6; i++) {
      ctx.rotate(TAU / 12)
      const g = ctx.createLinearGradient(-r * 9, 0, r * 9, 0)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, 'rgba(255,255,255,.45)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(-r * 9, -r * 0.08, r * 18, r * 0.16)
    }
  }
  ctx.restore()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

/* ---------------- clouds ---------------- */

export interface Puff {
  x: number
  y: number
  r: number
}

/** A cumulus: a heap of puffs, flat-ish bottom, towering top */
export function cumulus(seed: number, x: number, y: number, w: number, h: number, n = 26): Puff[] {
  n = Math.round(n * 1.8)
  const r = rng(seed)
  const out: Puff[] = []
  for (let i = 0; i < n; i++) {
    const fx = r() * 2 - 1
    const peak = 1 - fx * fx
    const py = y - r() * h * peak
    out.push({ x: x + fx * w * 0.5, y: py, r: (0.18 + 0.36 * r()) * h * (0.45 + 0.55 * peak) })
  }
  return out.sort((a, b) => b.y - a.y)
}

/** A long low bank or cloud-sea band */
export function bank(seed: number, x0: number, x1: number, y: number, h: number, n: number): Puff[] {
  const r = rng(seed)
  const out: Puff[] = []
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r())
    out.push({ x, y: y + (r() - 0.3) * h * 0.6, r: h * (0.35 + 0.5 * r()) })
  }
  return out.sort((a, b) => a.y - b.y)
}

export function drawPuffs(ctx: Ctx, sp: Sprites, puffs: Puff[], tint: PuffTint, dx = 0, alpha = 1, t = 0) {
  const img = sp.puff[tint]
  ctx.globalAlpha = alpha
  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i]
    const breathe = 1 + 0.03 * Math.sin(t * 1.3 + i)
    const r = p.r * breathe
    ctx.drawImage(img, p.x + dx - r, p.y - r, r * 2, r * 2)
  }
  ctx.globalAlpha = 1
}

/* ---------------- towers ---------------- */

export interface Tower {
  /** base: left, corner, right x at baseY */
  xl: number
  xm: number
  xr: number
  baseY: number
  topY: number
  /** x all verticals converge toward (worm's-eye view) */
  vpx: number
  /** 0 = parallel sides, 1 = meets at vpx at topY */
  taper: number
  cols: number
  rows: number
  /** colour of the sky the glass reflects, lit face / shade face */
  lit: [string, string, string]
  shade: [string, string]
  windows?: { seed: number; density: number; color: string }
  frame?: string
  mullion?: string
  reflect?: Puff[]
  reflectTint?: PuffTint
}

type Pt = [number, number]

function edgeAt(t: Tower, x: number, y: number): number {
  // x of a vertical edge (which starts at x on the base) at height y
  const k = ((t.baseY - y) / (t.baseY - t.topY)) * t.taper
  return lerp(x, t.vpx, k)
}

function face(t: Tower, x0: number, x1: number): Pt[] {
  return [
    [x0, t.baseY],
    [x1, t.baseY],
    [edgeAt(t, x1, t.topY), t.topY],
    [edgeAt(t, x0, t.topY), t.topY],
  ]
}

function path(ctx: Ctx, pts: Pt[]) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
}

function drawFace(ctx: Ctx, sp: Sprites, tw: Tower, x0: number, x1: number, lit: boolean, time: number) {
  const pts = face(tw, x0, x1)
  ctx.save()
  path(ctx, pts)
  ctx.clip()
  const g = ctx.createLinearGradient(0, tw.topY, 0, tw.baseY)
  if (lit) {
    g.addColorStop(0, tw.lit[0])
    g.addColorStop(0.55, tw.lit[1])
    g.addColorStop(1, tw.lit[2])
  } else {
    g.addColorStop(0, tw.shade[0])
    g.addColorStop(1, tw.shade[1])
  }
  ctx.fillStyle = g
  ctx.fillRect(Math.min(x0, pts[3][0]) - 2, tw.topY, Math.abs(x1 - x0) + Math.abs(pts[3][0] - x0) + 40, tw.baseY - tw.topY)

  if (tw.reflect && lit) {
    drawPuffs(ctx, sp, tw.reflect, tw.reflectTint ?? 'day', Math.sin(time * 0.3) * 6, 0.55, time)
  }

  // glass sheen: a soft diagonal band
  const sx = lerp(x0, x1, 0.3 + 0.1 * Math.sin(time * 0.4))
  const sh = ctx.createLinearGradient(sx - (x1 - x0) * 0.3, 0, sx + (x1 - x0) * 0.3, 0)
  sh.addColorStop(0, 'rgba(255,255,255,0)')
  sh.addColorStop(0.5, lit ? 'rgba(255,255,255,.22)' : 'rgba(170,190,255,.08)')
  sh.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sh
  ctx.fillRect(Math.min(x0, pts[3][0]) - 40, tw.topY, Math.abs(x1 - x0) + Math.abs(pts[3][0] - x0) + 80, tw.baseY - tw.topY)

  // lit windows
  if (tw.windows) {
    const r = rng(tw.windows.seed + (lit ? 1 : 7))
    ctx.fillStyle = tw.windows.color
    for (let row = 0; row < tw.rows; row++) {
      const fy0 = Math.pow(row / tw.rows, 1.15)
      const fy1 = Math.pow((row + 0.7) / tw.rows, 1.15)
      const ya = lerp(tw.baseY, tw.topY, fy0)
      const yb = lerp(tw.baseY, tw.topY, fy1)
      for (let col = 0; col < tw.cols; col++) {
        if (r() > tw.windows.density) continue
        const xa = edgeAt(tw, lerp(x0, x1, (col + 0.15) / tw.cols), ya)
        const xb = edgeAt(tw, lerp(x0, x1, (col + 0.85) / tw.cols), ya)
        ctx.globalAlpha = 0.45 + 0.55 * r()
        ctx.fillRect(Math.min(xa, xb), yb, Math.abs(xb - xa), ya - yb)
      }
    }
    ctx.globalAlpha = 1
  }

  // mullions and floor lines
  ctx.strokeStyle = tw.mullion ?? (lit ? 'rgba(20,30,70,.35)' : 'rgba(120,150,255,.12)')
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let col = 1; col < tw.cols; col++) {
    const bx = lerp(x0, x1, col / tw.cols)
    ctx.moveTo(bx, tw.baseY)
    ctx.lineTo(edgeAt(tw, bx, tw.topY), tw.topY)
  }
  for (let row = 1; row < tw.rows; row++) {
    const y = lerp(tw.baseY, tw.topY, Math.pow(row / tw.rows, 1.15))
    ctx.moveTo(edgeAt(tw, x0, y), y)
    ctx.lineTo(edgeAt(tw, x1, y), y)
  }
  ctx.stroke()
  ctx.restore()

  if (tw.frame) {
    ctx.strokeStyle = tw.frame
    ctx.lineWidth = Math.max(3, Math.abs(x1 - x0) * 0.05)
    path(ctx, pts)
    ctx.stroke()
  }
}

export function drawTower(ctx: Ctx, sp: Sprites, tw: Tower, time: number) {
  // the face nearer the vanishing point is in shade
  const leftLit = tw.vpx > tw.xm
  drawFace(ctx, sp, tw, tw.xl, tw.xm, leftLit, time)
  drawFace(ctx, sp, tw, tw.xm, tw.xr, !leftLit, time)
  // bright corner edge
  ctx.strokeStyle = 'rgba(220,235,255,.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(tw.xm, tw.baseY)
  ctx.lineTo(edgeAt(tw, tw.xm, tw.topY), tw.topY)
  ctx.stroke()
}

/** Row of worm's-eye towers along a ground line */
export function towerRow(
  seed: number,
  F: Frame,
  specs: { x: number; w: number; top: number }[],
  baseY: number,
  vpx: number,
  taper: number,
  style: Pick<Tower, 'lit' | 'shade' | 'windows' | 'frame' | 'reflectTint'> & { reflect?: boolean }
): Tower[] {
  const r = rng(seed)
  return specs.map((s, i) => {
    const xl = F.cx + (s.x - s.w / 2) * F.u
    const xr = F.cx + (s.x + s.w / 2) * F.u
    const xm = lerp(xl, xr, 0.35 + 0.3 * r())
    const topY = F.cy + s.top * F.u
    const h = baseY - topY
    return {
      xl,
      xm,
      xr,
      baseY,
      topY,
      vpx,
      taper,
      cols: 6 + Math.floor(r() * 6),
      rows: Math.max(8, Math.floor(h / (F.u * 0.035))),
      ...style,
      windows: style.windows ? { ...style.windows, seed: style.windows.seed + i * 31 } : undefined,
      reflect: style.reflect ? cumulus(seed + i * 5, (xl + xr) / 2, lerp(topY, baseY, 0.6), (xr - xl) * 1.6, h * 0.35, 14) : undefined,
    }
  })
}

/** A glass cylinder, drawn upright at the origin; callers rotate/translate */
export function cylinder(ctx: Ctx, sp: Sprites, w: number, h: number, time: number, lightY: number) {
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0)
  g.addColorStop(0, '#05070f')
  g.addColorStop(0.18, '#1b2340')
  g.addColorStop(0.32, '#9fb4ea')
  g.addColorStop(0.4, '#2a3561')
  g.addColorStop(0.75, '#0b0f20')
  g.addColorStop(0.92, '#4b5a90')
  g.addColorStop(1, '#070a14')
  ctx.fillStyle = g
  ctx.fillRect(-w / 2, -h, w, h)
  ctx.strokeStyle = 'rgba(180,200,255,.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let y = -h; y < 0; y += w * 0.07) {
    ctx.moveTo(-w / 2, y)
    ctx.quadraticCurveTo(0, y + w * 0.04, w / 2, y)
  }
  ctx.stroke()
  // top ellipse
  ctx.fillStyle = '#1a2240'
  ctx.beginPath()
  ctx.ellipse(0, -h, w / 2, w * 0.12, 0, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = 'rgba(210,225,255,.6)'
  ctx.lineWidth = 2
  ctx.stroke()
  orb(ctx, sp, -w * 0.12, lightY, w * 0.05, time, true)
}

/* ---------------- ground cover ---------------- */

export interface Bloom {
  x: number
  y: number
  s: number
  kind: FlowerKind
  lean: number
  stem: number
  ph: number
  tilt: number
}

/** Scatter flowers over a band that recedes from far (y0) to near (y1) */
export function meadow(
  seed: number,
  F: Frame,
  n: number,
  y0: number,
  y1: number,
  sMin: number,
  sMax: number,
  kinds: FlowerKind[],
  xSpread = 1
): Bloom[] {
  const r = rng(seed)
  const out: Bloom[] = []
  for (let i = 0; i < n; i++) {
    const d = Math.pow(r(), 0.7)
    const s = lerp(sMin, sMax, d * d) * F.u * (0.75 + 0.5 * r())
    out.push({
      x: F.cx + (r() * 2 - 1) * F.ext * xSpread,
      y: lerp(y0, y1, d),
      s,
      kind: kinds[Math.floor(r() * kinds.length)],
      lean: (r() - 0.5) * 0.5,
      stem: s * (1.5 + r() * 1.5),
      ph: r() * TAU,
      tilt: 0.55 + 0.45 * r(),
    })
  }
  return out.sort((a, b) => a.y - b.y)
}

export function drawMeadow(ctx: Ctx, sp: Sprites, blooms: Bloom[], t: number, wind = 1, stemColor = '#1f4a22') {
  // stems in one batch
  ctx.strokeStyle = stemColor
  ctx.lineCap = 'round'
  for (const b of blooms) {
    const sway = Math.sin(t * 1.6 + b.ph) * 0.08 * wind
    const tx = b.x + (b.lean + sway) * b.stem
    ctx.lineWidth = Math.max(1, b.s * 0.05)
    ctx.beginPath()
    ctx.moveTo(b.x, b.y + b.stem)
    ctx.quadraticCurveTo(b.x + b.lean * b.stem * 0.3, b.y + b.stem * 0.5, tx, b.y)
    ctx.stroke()
  }
  for (const b of blooms) {
    const sway = Math.sin(t * 1.6 + b.ph) * 0.08 * wind
    const tx = b.x + (b.lean + sway) * b.stem
    const img = sp.flower[b.kind]
    ctx.save()
    ctx.translate(tx, b.y)
    ctx.rotate(b.lean * 0.6 + sway)
    ctx.scale(1, b.tilt)
    ctx.drawImage(img, -b.s, -b.s, b.s * 2, b.s * 2)
    ctx.restore()
  }
}

export interface Blade {
  x: number
  y: number
  h: number
  lean: number
  ph: number
  c: number
}

export function grass(seed: number, F: Frame, n: number, y0: number, y1: number, hMin: number, hMax: number, xSpread = 1): Blade[] {
  const r = rng(seed)
  const out: Blade[] = []
  for (let i = 0; i < n; i++) {
    const d = Math.pow(r(), 0.8)
    out.push({
      x: F.cx + (r() * 2 - 1) * F.ext * xSpread,
      y: lerp(y0, y1, d),
      h: lerp(hMin, hMax, d) * F.u * (0.6 + 0.8 * r()),
      lean: (r() - 0.5) * 0.9,
      ph: r() * TAU,
      c: Math.floor(r() * 3),
    })
  }
  return out.sort((a, b) => a.y - b.y)
}

export function drawGrass(ctx: Ctx, blades: Blade[], t: number, colors: [string, string, string], wind = 1) {
  ctx.lineCap = 'round'
  for (let c = 0; c < 3; c++) {
    ctx.strokeStyle = colors[c]
    ctx.beginPath()
    for (const b of blades) {
      if (b.c !== c) continue
      const sway = Math.sin(t * 1.8 + b.ph + b.x * 0.004) * 0.18 * wind
      const tipx = b.x + (b.lean + sway) * b.h
      ctx.moveTo(b.x, b.y)
      ctx.quadraticCurveTo(b.x + b.lean * b.h * 0.2, b.y - b.h * 0.6, tipx, b.y - b.h)
    }
    ctx.lineWidth = 1.6
    ctx.stroke()
  }
}

/** A soft ground plane from y down, with an optional lit crest */
export function ground(ctx: Ctx, F: Frame, y: number, top: string, bottom: string, curve = 0) {
  const g = ctx.createLinearGradient(0, y, 0, y + F.u)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(F.cx - F.ext * 2, y + curve)
  ctx.quadraticCurveTo(F.cx, y - curve, F.cx + F.ext * 2, y + curve)
  ctx.lineTo(F.cx + F.ext * 2, F.cy + F.ext * 2)
  ctx.lineTo(F.cx - F.ext * 2, F.cy + F.ext * 2)
  ctx.closePath()
  ctx.fill()
}

/** Leafy mound: a heap of leaf sprites, darker toward the bottom */
export function bush(seed: number, cx: number, cy: number, w: number, h: number, n: number, size: number) {
  const r = rng(seed)
  const out: { x: number; y: number; s: number; a: number }[] = []
  for (let i = 0; i < n; i++) {
    const fx = r() * 2 - 1
    const fy = r()
    const top = Math.sqrt(1 - fx * fx)
    out.push({ x: cx + fx * w / 2, y: cy - top * h * fy, s: size * (0.6 + 0.8 * r()) * (0.6 + fy * 0.4 + (1 - top) * 0.3), a: r() * TAU })
  }
  return out.sort((a, b) => a.y - b.y)
}

export function drawBush(ctx: Ctx, sp: Sprites, leaves: ReturnType<typeof bush>, t: number) {
  for (const l of leaves) {
    ctx.save()
    ctx.translate(l.x, l.y)
    ctx.rotate(l.a + Math.sin(t + l.a) * 0.05)
    ctx.drawImage(sp.leaf, -l.s, -l.s, l.s * 2, l.s * 2)
    ctx.restore()
  }
}

/* ---------------- city lights ---------------- */

export interface Light {
  x: number
  z: number
  y: number
  c: number
}

/** A lit city on a ground plane; x across, z into the distance, y up */
export function city(seed: number, n: number, spread: number, towers: number): Light[] {
  const r = rng(seed)
  const out: Light[] = []
  for (let i = 0; i < n; i++) {
    const road = r() < 0.45
    let x = (r() * 2 - 1) * spread
    let z = 1 + r() * 14
    if (road) {
      if (r() < 0.5) x = Math.round(x / 0.8) * 0.8
      else z = Math.round(z / 0.7) * 0.7
    }
    out.push({ x, z, y: 0, c: road ? (r() < 0.6 ? 0 : 2) : r() < 0.7 ? 1 : 0 })
  }
  for (let k = 0; k < towers; k++) {
    const x = (r() * 2 - 1) * spread * 0.6
    const z = 1.5 + r() * 8
    const h = 0.3 + r() * 1.2
    const floors = Math.floor(h * 30)
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < 3; c++) {
        if (r() < 0.5) out.push({ x: x + c * 0.03, z, y: (f / floors) * h, c: 1 })
      }
    }
  }
  return out
}

const LIGHT = ['#ffd08a', '#eaf1ff', '#ff5a6a']

/** Project with the camera `height` above the ground, horizon at `hy` */
export function drawCity(ctx: Ctx, F: Frame, lights: Light[], hy: number, height: number, drift: number, alpha = 1, glow?: HTMLCanvasElement) {
  const f = F.u * 0.9
  const px = F.u / 720
  const proj = (l: Light) => {
    const z = l.z - drift
    if (z < 0.4) return null
    return { z, x: F.cx + (l.x / z) * f, y: hy + ((height - l.y) / z) * f }
  }
  // haze: every few lights bleeds a soft halo, so the grid reads as a glowing city
  if (glow) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < lights.length; i += 5) {
      const q = proj(lights[i])
      if (!q) continue
      const s = (24 / q.z + 6) * px
      ctx.globalAlpha = alpha * 0.16
      ctx.drawImage(glow, q.x - s, q.y - s, s * 2, s * 2)
    }
    ctx.restore()
  }
  for (let c = 0; c < 3; c++) {
    ctx.fillStyle = LIGHT[c]
    for (const l of lights) {
      if (l.c !== c) continue
      const q = proj(l)
      if (!q) continue
      const s = Math.max(1.4, 5 / q.z) * px
      ctx.globalAlpha = alpha * Math.min(1, 2.2 / Math.sqrt(q.z))
      ctx.fillRect(q.x, q.y, s, s)
    }
  }
  ctx.globalAlpha = 1
}

/* ---------------- water ---------------- */

/** Draw `src` back as a rippling reflection in horizontal slices */
export function ripple(ctx: Ctx, src: HTMLCanvasElement, y0: number, y1: number, t: number, amp: number, freq: number) {
  const step = 4
  for (let y = y0; y < y1; y += step) {
    const depth = (y - y0) / Math.max(1, y1 - y0)
    const dx = Math.sin(y * freq + t * 3) * amp * (0.3 + depth) + Math.sin(y * freq * 2.7 - t * 2) * amp * 0.4
    ctx.drawImage(src, 0, y, src.width, step, dx, y, src.width, step)
  }
}

/** Sparkling highlight streaks on a water surface */
export function glints(ctx: Ctx, F: Frame, seed: number, n: number, y0: number, y1: number, t: number, color = 'rgba(255,255,255,.75)') {
  const r = rng(seed)
  ctx.fillStyle = color
  for (let i = 0; i < n; i++) {
    const d = r()
    const y = lerp(y0, y1, d * d)
    const x = F.cx + (r() * 2 - 1) * F.ext + Math.sin(t * 0.8 + i) * 10
    const w = (4 + r() * 22) * (0.3 + d * 1.4)
    const on = Math.sin(t * (2 + r() * 3) + i) * 0.5 + 0.5
    ctx.globalAlpha = on * on
    ctx.fillRect(x, y, w, Math.max(1, d * 2.4))
  }
  ctx.globalAlpha = 1
}
