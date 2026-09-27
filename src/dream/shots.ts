/* ------------------------------------------------------------------
   BLUE HOUR — the shot list
   Eleven short scenes where the built world and the grown world
   trade places. Each shot composes itself once for a frame size and
   then paints live every frame.
------------------------------------------------------------------- */

import {
  TAU,
  bank,
  bush,
  city,
  clamp,
  cumulus,
  cylinder,
  drawBush,
  drawCity,
  drawGrass,
  drawMeadow,
  drawPuffs,
  drawTower,
  glints,
  grass,
  ground,
  lerp,
  meadow,
  orb,
  ripple,
  rng,
  sky,
  stars,
  towerRow,
  type Ctx,
  type Frame,
  type Sprites,
} from './paint'

export interface Camera {
  zoom: [number, number]
  /** degrees */
  roll: [number, number]
  /** in units of the short side */
  pan: [[number, number], [number, number]]
  shake?: number
  /** lens strength override */
  lens?: number
}

export interface Shot {
  title: string
  cam: Camera
  compose: (F: Frame, sp: Sprites, scratch: HTMLCanvasElement) => (ctx: Ctx, t: number, p: number) => void
}

const BLUE_DAY: [number, string][] = [
  [0, '#0b1aa8'],
  [0.45, '#2346f0'],
  [0.8, '#6c8dff'],
  [1, '#b9c6ff'],
]

const BLUE_HOUR: [number, string][] = [
  [0, '#02051f'],
  [0.4, '#0b1a86'],
  [0.78, '#2a4be6'],
  [1, '#8d8ff0'],
]

const GLASS_DAY = {
  lit: ['#0a1d7a', '#5c86ff', '#c8d6ff'] as [string, string, string],
  shade: ['#030822', '#10205c'] as [string, string],
}

const GLASS_NIGHT = {
  lit: ['#02061c', '#0d1f68', '#1e3aa8'] as [string, string, string],
  shade: ['#010311', '#060d33'] as [string, string],
}

const Y = (F: Frame, k: number) => F.cy + k * F.u
const X = (F: Frame, k: number) => F.cx + k * F.u

/* ---------- a glass koi ---------- */

function koi(ctx: Ctx, sp: Sprites, x: number, y: number, len: number, t: number, heading: number) {
  const w = len * 0.28
  const swish = Math.sin(t * 5) * 0.35
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(heading)
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(sp.glow, -len * 1.1, -len * 1.1, len * 2.2, len * 2.2)
  ctx.globalCompositeOperation = 'source-over'

  const body = ctx.createLinearGradient(0, -w, 0, w)
  body.addColorStop(0, 'rgba(170,190,255,.95)')
  body.addColorStop(0.35, 'rgba(40,70,255,.9)')
  body.addColorStop(1, 'rgba(8,20,150,.95)')

  // tail: two lobes that swish
  ctx.save()
  ctx.translate(-len * 0.45, 0)
  ctx.rotate(swish)
  ctx.fillStyle = 'rgba(60,90,255,.7)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(-len * 0.25, -w * 1.6, -len * 0.5, -w * 1.5)
  ctx.quadraticCurveTo(-len * 0.3, 0, -len * 0.5, w * 1.5)
  ctx.quadraticCurveTo(-len * 0.25, w * 1.6, 0, 0)
  ctx.fill()
  ctx.strokeStyle = 'rgba(200,215,255,.5)'
  ctx.lineWidth = 1
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-len * 0.46, i * w * 0.42)
    ctx.stroke()
  }
  ctx.restore()

  // fins
  ctx.fillStyle = 'rgba(90,120,255,.55)'
  for (const s of [-1, 1]) {
    ctx.save()
    ctx.translate(len * 0.12, s * w * 0.7)
    ctx.rotate(s * (0.6 + Math.sin(t * 6 + s) * 0.25))
    ctx.beginPath()
    ctx.ellipse(-len * 0.1, 0, len * 0.16, w * 0.35, 0, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  // body
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(len * 0.5, 0)
  ctx.bezierCurveTo(len * 0.4, -w * 1.25, -len * 0.25, -w * 1.1, -len * 0.48, -w * 0.12)
  ctx.lineTo(-len * 0.48, w * 0.12)
  ctx.bezierCurveTo(-len * 0.25, w * 1.1, len * 0.4, w * 1.25, len * 0.5, 0)
  ctx.fill()
  // dorsal sheen and glass highlights
  ctx.strokeStyle = 'rgba(235,242,255,.85)'
  ctx.lineWidth = Math.max(1.5, len * 0.012)
  ctx.beginPath()
  ctx.moveTo(len * 0.38, -w * 0.55)
  ctx.quadraticCurveTo(0, -w * 1.02, -len * 0.3, -w * 0.45)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,.9)'
  ctx.beginPath()
  ctx.arc(len * 0.33, -w * 0.18, len * 0.03, 0, TAU)
  ctx.fill()
  // gill line
  ctx.strokeStyle = 'rgba(180,200,255,.5)'
  ctx.beginPath()
  ctx.arc(len * 0.22, 0, w * 0.7, -1, 1)
  ctx.stroke()
  ctx.restore()
}

/* ---------- the shots ---------- */

export const SHOTS: Shot[] = [
  {
    title: 'Tidal meadow',
    cam: { zoom: [1.05, 1.22], roll: [-6, 2], pan: [[0.04, 0.02], [-0.03, -0.02]] },
    compose(F, sp) {
      const horizon = Y(F, 0.08)
      const towers = towerRow(11, F, [
        { x: 0.12, w: 0.2, top: -0.5 },
        { x: 0.42, w: 0.3, top: -0.78 },
        { x: -0.08, w: 0.1, top: -0.2 },
      ], horizon, X(F, 0.2), 0.35, { ...GLASS_DAY, reflect: true })
      const wave = cumulus(12, X(F, -0.5), Y(F, 0.05), F.u * 0.9, F.u * 0.55, 34)
      const spray = bank(13, X(F, -1.1), X(F, 0), Y(F, 0.1), F.u * 0.2, 30)
      const back = meadow(14, F, 220, horizon, Y(F, 0.3), 0.012, 0.04, ['cosmos', 'cosmosWhite', 'cosmos'])
      const front = meadow(15, F, 70, Y(F, 0.3), Y(F, 0.55), 0.04, 0.11, ['cosmos', 'cosmosWhite', 'cosmos', 'cosmos'])
      const blades = grass(16, F, 700, horizon, Y(F, 0.6), 0.02, 0.12)
      const high = cumulus(17, X(F, 0.6), Y(F, -0.25), F.u * 0.5, F.u * 0.12, 12)
      return (ctx, t, p) => {
        sky(ctx, F, BLUE_DAY, -0.6, 0.1)
        drawPuffs(ctx, sp, high, 'day', t * 4, 0.7)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        // the wave of cloud rolls in from the left and curls over
        ctx.save()
        ctx.translate(lerp(-F.u * 0.15, F.u * 0.18, p), 0)
        drawPuffs(ctx, sp, wave, 'day', 0, 0.95, t)
        drawPuffs(ctx, sp, spray, 'day', Math.sin(t * 2) * 8, 0.9, t)
        ctx.restore()
        ground(ctx, F, horizon, '#1d4a1c', '#06140a', F.u * 0.03)
        drawGrass(ctx, blades, t, ['#2f6e2a', '#15401a', '#4c8a38'])
        drawMeadow(ctx, sp, back, t, 1)
        drawMeadow(ctx, sp, front, t, 1.4)
      }
    },
  },
  {
    title: 'Glass koi',
    cam: { zoom: [1.1, 1.2], roll: [4, -3], pan: [[0, 0.02], [0, -0.02]] },
    compose(F, sp) {
      const horizon = Y(F, -0.18)
      const lights = city(21, 5200, 9, 26)
      const r = rng(22)
      const ridge: [number, number][] = []
      for (let i = 0; i <= 40; i++) ridge.push([F.cx - F.ext * 1.5 + (i / 40) * F.ext * 3, horizon - F.u * (0.01 + 0.035 * r())])
      return (ctx, t, p) => {
        sky(ctx, F, [
          [0, '#01041a'],
          [0.55, '#0c1d86'],
          [0.85, '#3b4fd8'],
          [1, '#7b6fcf'],
        ], -0.8, -0.16)
        ctx.fillStyle = '#060a26'
        ctx.beginPath()
        ctx.moveTo(ridge[0][0], ridge[0][1])
        for (const pt of ridge) ctx.lineTo(pt[0], pt[1])
        ctx.lineTo(F.cx + F.ext * 1.5, Y(F, 2))
        ctx.lineTo(F.cx - F.ext * 1.5, Y(F, 2))
        ctx.fill()
        const g = ctx.createLinearGradient(0, horizon, 0, Y(F, 0.6))
        g.addColorStop(0, '#0a0f3a')
        g.addColorStop(1, '#020309')
        ctx.fillStyle = g
        ctx.fillRect(F.cx - F.ext * 2, horizon, F.ext * 4, F.ext * 3)
        drawCity(ctx, F, lights, horizon, 1.4, p * 0.6, 1, sp.glow)
        // glass balustrade catching the city glow
        ctx.strokeStyle = 'rgba(190,210,255,.35)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(F.cx - F.ext * 1.5, Y(F, 0.26))
        ctx.quadraticCurveTo(F.cx, Y(F, 0.2), F.cx + F.ext * 1.5, Y(F, 0.26))
        ctx.stroke()
        ctx.fillStyle = 'rgba(120,150,255,.08)'
        ctx.fillRect(F.cx - F.ext * 2, Y(F, 0.24), F.ext * 4, F.ext * 2)
        const kx = X(F, lerp(-0.35, 0.3, p))
        const ky = Y(F, 0.02 + Math.sin(t * 1.4) * 0.03)
        koi(ctx, sp, kx, ky, F.u * 0.42, t, -0.12 + Math.cos(t * 1.4) * 0.1)
        // drifting bubbles of light
        for (let i = 0; i < 14; i++) {
          const a = (t * 0.3 + i / 14) % 1
          ctx.globalAlpha = (1 - a) * 0.6
          ctx.drawImage(sp.glow, kx - F.u * 0.2 - i * F.u * 0.03, ky - a * F.u * 0.3 + Math.sin(i) * F.u * 0.05, F.u * 0.025, F.u * 0.025)
        }
        ctx.globalAlpha = 1
      }
    },
  },
  {
    title: 'Sea overhead',
    cam: { zoom: [1.12, 1.3], roll: [0, 3], pan: [[0.03, 0], [-0.03, 0.02]] },
    compose(F, sp) {
      const vpx = X(F, 0.12)
      const vpy = Y(F, 0.06)
      const clouds = cumulus(31, X(F, -0.1), Y(F, -0.25), F.u * 1.3, F.u * 0.3, 24)
      return (ctx, t, p) => {
        // above: the underside of the sea, clouds seen through it
        sky(ctx, F, [
          [0, '#1433d6'],
          [0.6, '#0b1b84'],
          [1, '#05092e'],
        ], -0.6, 0.06)
        drawPuffs(ctx, sp, clouds, 'night', Math.sin(t) * 10, 0.9, t)
        ctx.strokeStyle = 'rgba(220,235,255,.55)'
        ctx.lineWidth = 1.5
        for (let i = 1; i < 26; i++) {
          const k = Math.pow(i / 26, 1.8)
          const y = lerp(vpy, F.cy - F.ext * 1.2, k)
          ctx.globalAlpha = 0.2 + k * 0.6
          ctx.beginPath()
          for (let x = F.cx - F.ext * 1.5; x <= F.cx + F.ext * 1.5; x += 12) {
            const yy = y + Math.sin(x * 0.02 * (1.2 - k) + t * 2 + i) * k * F.u * 0.02
            if (x === F.cx - F.ext * 1.5) ctx.moveTo(x, yy)
            else ctx.lineTo(x, yy)
          }
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        // below: a platform lit by a passing train
        const floor = ctx.createLinearGradient(0, vpy, 0, Y(F, 0.6))
        floor.addColorStop(0, '#0b1230')
        floor.addColorStop(1, '#03050c')
        ctx.fillStyle = floor
        ctx.fillRect(F.cx - F.ext * 2, vpy, F.ext * 4, F.ext * 3)
        // platform edge stripe
        ctx.fillStyle = 'rgba(210,225,255,.75)'
        ctx.beginPath()
        ctx.moveTo(vpx, vpy)
        ctx.lineTo(X(F, 0.05), Y(F, 0.8))
        ctx.lineTo(X(F, -0.05), Y(F, 0.8))
        ctx.closePath()
        ctx.fill()
        // train: carriages slide toward the vanishing point
        const run = (t * 1.3) % 1
        for (let c = 0; c < 4; c++) {
          const k0 = clamp(1 - (c * 0.3 + run * 0.3))
          const k1 = clamp(k0 - 0.26)
          const xa = lerp(vpx, X(F, -1.1), k0)
          const xb = lerp(vpx, X(F, -1.1), k1)
          const ya0 = lerp(vpy, Y(F, 0.7), k0)
          const yb0 = lerp(vpy, Y(F, 0.7), k1)
          const ya1 = lerp(vpy, Y(F, -0.2), k0)
          const yb1 = lerp(vpy, Y(F, -0.2), k1)
          ctx.fillStyle = '#2a3350'
          ctx.beginPath()
          ctx.moveTo(xa, ya0)
          ctx.lineTo(xb, yb0)
          ctx.lineTo(xb, yb1)
          ctx.lineTo(xa, ya1)
          ctx.fill()
          // window band
          ctx.fillStyle = 'rgba(214,250,205,.9)'
          ctx.beginPath()
          ctx.moveTo(xa, lerp(ya1, ya0, 0.25))
          ctx.lineTo(xb, lerp(yb1, yb0, 0.25))
          ctx.lineTo(xb, lerp(yb1, yb0, 0.5))
          ctx.lineTo(xa, lerp(ya1, ya0, 0.5))
          ctx.fill()
          ctx.fillStyle = '#2f9a5a'
          ctx.beginPath()
          ctx.moveTo(xa, lerp(ya1, ya0, 0.62))
          ctx.lineTo(xb, lerp(yb1, yb0, 0.62))
          ctx.lineTo(xb, lerp(yb1, yb0, 0.67))
          ctx.lineTo(xa, lerp(ya1, ya0, 0.67))
          ctx.fill()
        }
        // tunnel lamps
        for (let i = 0; i < 8; i++) {
          const k = Math.pow(((i / 8 + t * 0.4) % 1), 2)
          orb(ctx, sp, lerp(vpx, X(F, 0.9), k), lerp(vpy, Y(F, -0.35), k), 1 + k * F.u * 0.01, t, false)
        }
        void p
      }
    },
  },
  {
    title: 'Tower in the cloud sea',
    cam: { zoom: [1.08, 1.25], roll: [-14, 10], pan: [[-0.02, 0.02], [0.02, -0.03]], lens: 1.1 },
    compose(F, sp) {
      const sea = bank(41, F.cx - F.ext * 1.6, F.cx + F.ext * 1.6, Y(F, 0.28), F.u * 0.22, 90)
      const r = rng(42)
      const arms = Array.from({ length: 90 }, () => ({ r: 0.05 + r() * 0.5, a: r() * TAU, len: 0.6 + r() * 1.6, w: 1 + r() * 8, o: 0.05 + r() * 0.25 }))
      return (ctx, t) => {
        sky(ctx, F, [
          [0, '#01020c'],
          [0.5, '#081455'],
          [1, '#2c43c8'],
        ], -0.7, 0.3)
        // the vortex
        const vx = X(F, -0.12)
        const vy = Y(F, -0.3)
        ctx.lineCap = 'round'
        for (const a of arms) {
          ctx.strokeStyle = `rgba(215,222,255,${a.o})`
          ctx.lineWidth = a.w
          ctx.beginPath()
          const a0 = a.a + t * 0.9 / (0.3 + a.r)
          ctx.ellipse(vx, vy, a.r * F.u, a.r * F.u * 0.45, -0.25, a0, a0 + a.len)
          ctx.stroke()
        }
        ctx.drawImage(sp.glow, vx - F.u * 0.12, vy - F.u * 0.06, F.u * 0.24, F.u * 0.12)
        // the tower rises out of the clouds, leaning
        ctx.save()
        ctx.translate(X(F, -0.05), Y(F, 0.35))
        ctx.rotate(-0.22)
        cylinder(ctx, sp, F.u * 0.16, F.u * 0.85, t, -F.u * 0.42)
        ctx.restore()
        drawPuffs(ctx, sp, sea, 'dusk', Math.sin(t * 0.7) * 12, 1, t)
        // a far glass arc sweeping past the right edge
        ctx.strokeStyle = 'rgba(200,215,255,.45)'
        ctx.lineWidth = F.u * 0.025
        ctx.beginPath()
        ctx.arc(X(F, 1.1), Y(F, 0.1), F.u * 0.72, Math.PI * 0.8, Math.PI * 1.3)
        ctx.stroke()
        ctx.strokeStyle = 'rgba(40,60,140,.9)'
        ctx.lineWidth = F.u * 0.012
        ctx.stroke()
      }
    },
  },
  {
    title: 'Night garden',
    cam: { zoom: [1.15, 1.25], roll: [8, 3], pan: [[0.02, 0.03], [0, -0.01]], shake: 0.004 },
    compose(F, sp) {
      const horizon = Y(F, 0.12)
      const towers = towerRow(51, F, [
        { x: -0.05, w: 0.34, top: -1.1 },
        { x: 0.38, w: 0.2, top: -0.55 },
        { x: -0.42, w: 0.16, top: -0.4 },
      ], horizon, X(F, 0.05), 0.55, { ...GLASS_NIGHT, windows: { seed: 5, density: 0.35, color: '#bff5dc' } })
      const blades = grass(52, F, 900, horizon, Y(F, 0.6), 0.02, 0.16)
      const lilies = meadow(53, F, 36, Y(F, 0.15), Y(F, 0.5), 0.03, 0.09, ['lily', 'bud', 'lily'], 0.8)
      return (ctx, t) => {
        sky(ctx, F, [
          [0, '#000106'],
          [0.7, '#050c3a'],
          [1, '#0e1d6c'],
        ], -0.6, 0.12)
        stars(ctx, F, 54, 120, horizon, t)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        ground(ctx, F, horizon, '#0e2a12', '#1d5222', -F.u * 0.02)
        // flash-lit foreground
        const g = ctx.createRadialGradient(X(F, -0.15), Y(F, 0.45), 0, X(F, -0.15), Y(F, 0.45), F.u * 0.6)
        g.addColorStop(0, 'rgba(160,230,150,.35)')
        g.addColorStop(1, 'rgba(160,230,150,0)')
        ctx.fillStyle = g
        ctx.fillRect(F.cx - F.ext * 2, horizon, F.ext * 4, F.ext * 2)
        drawGrass(ctx, blades, t, ['#3f8c3a', '#1c4d20', '#78c060'], 0.6)
        drawMeadow(ctx, sp, lilies, t, 0.7, '#3d7a33')
      }
    },
  },
  {
    title: 'Mirror lake',
    cam: { zoom: [1.1, 1.2], roll: [-18, -12], pan: [[0.02, 0], [-0.03, 0.01]] },
    compose(F, sp, scratch) {
      const waterline = Y(F, -0.02)
      const towers = towerRow(61, F, [
        { x: 0.05, w: 0.22, top: -0.6 },
        { x: 0.32, w: 0.18, top: -0.45 },
        { x: -0.3, w: 0.28, top: -0.75 },
      ], waterline, X(F, 0), 0.1, { ...GLASS_NIGHT, windows: { seed: 6, density: 0.25, color: '#f0f4ff' } })
      const blades = grass(62, F, 1100, Y(F, 0), Y(F, 0.7), 0.01, 0.06, 1)
      const sc = scratch.getContext('2d')!
      const upper = (ctx: Ctx, t: number) => {
        sky(ctx, F, BLUE_HOUR, -0.7, 0)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        orb(ctx, sp, X(F, 0.18), Y(F, -0.12), F.u * 0.02, t)
      }
      return (ctx, t) => {
        upper(ctx, t)
        // reflection: paint the upper world flipped into scratch, then ripple it back
        sc.setTransform(1, 0, 0, 1, 0, 0)
        sc.clearRect(0, 0, scratch.width, scratch.height)
        sc.setTransform(1, 0, 0, -1, 0, waterline * 2)
        upper(sc, t)
        sc.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = '#081660'
        ctx.fillRect(F.cx - F.ext * 2, waterline, F.ext * 4, F.ext * 2)
        ctx.save()
        ctx.globalAlpha = 0.85
        ripple(ctx, scratch, waterline, F.cy + F.ext, t, F.u * 0.012, 0.09)
        ctx.restore()
        ctx.fillStyle = 'rgba(4,10,50,.35)'
        ctx.fillRect(F.cx - F.ext * 2, waterline, F.ext * 4, F.ext * 2)
        glints(ctx, F, 63, 160, waterline, Y(F, 0.5), t)
        // the mossy hill slides in from the left
        const g = ctx.createLinearGradient(X(F, -0.6), Y(F, 0), X(F, 0.2), Y(F, 0.5))
        g.addColorStop(0, '#0d3a12')
        g.addColorStop(0.5, '#2f8a26')
        g.addColorStop(1, '#0a2a0c')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(F.cx - F.ext * 1.6, Y(F, -0.06))
        ctx.bezierCurveTo(X(F, -0.4), Y(F, -0.08), X(F, 0.0), Y(F, 0.2), X(F, 0.35), Y(F, 0.9))
        ctx.lineTo(F.cx - F.ext * 1.6, Y(F, 1.2))
        ctx.closePath()
        ctx.fill()
        ctx.save()
        ctx.clip()
        drawGrass(ctx, blades, t, ['#5fbf3c', '#2a7a24', '#8de05a'], 0.5)
        ctx.restore()
      }
    },
  },
  {
    title: 'Blue field',
    cam: { zoom: [1.05, 1.18], roll: [3, -2], pan: [[-0.03, 0.02], [0.02, -0.01]] },
    compose(F, sp) {
      const horizon = Y(F, -0.05)
      const towers = towerRow(71, F, [
        { x: -0.4, w: 0.24, top: -0.62 },
        { x: -0.08, w: 0.18, top: -0.44 },
        { x: 0.3, w: 0.3, top: -0.85 },
      ], horizon, X(F, 0), 0.2, { ...GLASS_DAY, reflect: true })
      const clouds = [cumulus(72, X(F, -0.2), Y(F, -0.25), F.u * 0.7, F.u * 0.2, 20), cumulus(73, X(F, 0.6), Y(F, -0.4), F.u * 0.5, F.u * 0.14, 14)]
      const blades = grass(74, F, 1000, horizon, Y(F, 0.6), 0.01, 0.1)
      const blooms = meadow(75, F, 40, Y(F, 0.2), Y(F, 0.55), 0.04, 0.12, ['daisy', 'nemo', 'daisy'], 0.9)
      return (ctx, t) => {
        sky(ctx, F, BLUE_DAY, -0.7, -0.05)
        for (const c of clouds) drawPuffs(ctx, sp, c, 'day', t * 5, 0.95, t)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        ground(ctx, F, horizon, '#2b6a24', '#0a2610', F.u * 0.02)
        drawGrass(ctx, blades, t, ['#3d8a30', '#1e5220', '#6ab04a'])
        drawMeadow(ctx, sp, blooms, t, 1, '#2d5f2a')
      }
    },
  },
  {
    title: 'Above the clouds',
    cam: { zoom: [1.2, 1.05], roll: [0, 0], pan: [[0, -0.04], [0, 0.03]], lens: 1.25 },
    compose(F, sp) {
      const seaY = Y(F, -0.02)
      const towers = towerRow(81, F, [
        { x: -0.25, w: 0.14, top: -0.55 },
        { x: -0.02, w: 0.16, top: -0.42 },
      ], Y(F, 0.05), X(F, -0.1), 0.05, { lit: ['#0a0f24', '#1a2550', '#39489a'], shade: ['#04060f', '#10183c'], frame: '#e8ecf6' })
      const far = towerRow(82, F, [
        { x: 0.25, w: 0.04, top: -0.1 },
        { x: 0.35, w: 0.03, top: -0.07 },
        { x: 0.48, w: 0.05, top: -0.12 },
        { x: -0.55, w: 0.04, top: -0.08 },
        { x: 0.6, w: 0.03, top: -0.05 },
      ], seaY, X(F, 0), 0, { ...GLASS_NIGHT, windows: { seed: 8, density: 0.4, color: '#ffe2b0' } })
      const sea = bank(83, F.cx - F.ext * 1.6, F.cx + F.ext * 1.6, seaY + F.u * 0.05, F.u * 0.12, 110)
      const drift = bank(86, F.cx - F.ext, F.cx + F.ext, Y(F, 0.1), F.u * 0.06, 30)
      const mound = meadow(84, F, 120, Y(F, 0.18), Y(F, 0.6), 0.03, 0.1, ['nemo'], 0.7)
      return (ctx, t) => {
        sky(ctx, F, BLUE_HOUR, -0.7, 0)
        stars(ctx, F, 85, 60, Y(F, -0.2), t)
        for (const tw of far) drawTower(ctx, sp, tw, t)
        drawPuffs(ctx, sp, sea, 'dusk', Math.sin(t * 0.5) * 10, 0.95, t)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        drawPuffs(ctx, sp, drift, 'dusk', t * 8, 0.8, t)
        // the dark hill the flowers grow on
        ctx.fillStyle = '#050d12'
        ctx.beginPath()
        ctx.ellipse(F.cx, Y(F, 0.62), F.ext * 1.1, F.u * 0.45, 0, 0, TAU)
        ctx.fill()
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        for (const b of mound) {
          ctx.globalAlpha = 0.18
          ctx.drawImage(sp.glow, b.x - b.s * 1.6, b.y - b.s * 1.6, b.s * 3.2, b.s * 3.2)
        }
        ctx.restore()
        ctx.globalAlpha = 1
        drawMeadow(ctx, sp, mound, t, 0.6, '#12331c')
      }
    },
  },
  {
    title: 'Roses',
    cam: { zoom: [1.08, 1.22], roll: [-3, 4], pan: [[0.03, 0.01], [-0.02, -0.02]] },
    compose(F, sp) {
      const horizon = Y(F, 0.05)
      const towers = towerRow(91, F, [
        { x: -0.18, w: 0.12, top: -0.4 },
        { x: 0.04, w: 0.1, top: -0.52 },
        { x: 0.3, w: 0.13, top: -0.38 },
      ], horizon, X(F, 0), 0.12, { ...GLASS_DAY, reflect: true })
      const clouds = bank(92, F.cx - F.ext * 1.5, X(F, -0.25), Y(F, -0.02), F.u * 0.2, 40)
      const leaves = bush(93, X(F, 0.05), Y(F, 0.75), F.ext * 2.4, F.u * 0.7, 1150, F.u * 0.04)
      const roses = meadow(94, F, 16, Y(F, 0.0), Y(F, 0.4), 0.05, 0.13, ['rose'], 0.8)
      const buds = meadow(95, F, 40, Y(F, 0.05), Y(F, 0.3), 0.008, 0.015, ['cosmos'], 0.8)
      return (ctx, t) => {
        sky(ctx, F, BLUE_DAY, -0.6, 0.05)
        drawPuffs(ctx, sp, clouds, 'dusk', Math.sin(t * 0.5) * 12, 1, t)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        drawBush(ctx, sp, leaves, t)
        drawMeadow(ctx, sp, buds, t, 0.5, '#1c3a1c')
        drawMeadow(ctx, sp, roses, t, 0.5, '#244a24')
      }
    },
  },
  {
    title: 'Ocean over the city',
    cam: { zoom: [1.05, 1.2], roll: [6, -4], pan: [[0, 0.03], [0, -0.02]], lens: 1.2 },
    compose(F, sp) {
      const horizon = Y(F, -0.2)
      const surface = Y(F, 0.08)
      const lights = city(101, 6000, 6, 30)
      const clouds = [cumulus(102, X(F, 0.35), horizon, F.u * 0.4, F.u * 0.18, 16), cumulus(103, X(F, -0.5), horizon, F.u * 0.3, F.u * 0.08, 10)]
      return (ctx, t, p) => {
        sky(ctx, F, [
          [0, '#0a24d8'],
          [0.7, '#3d66ff'],
          [1, '#bcd0ff'],
        ], -0.7, -0.2)
        for (const c of clouds) drawPuffs(ctx, sp, c, 'day', t * 3, 1, t)
        // the sea, seen from the side like a glass tank
        const sea = ctx.createLinearGradient(0, horizon, 0, surface)
        sea.addColorStop(0, '#0c2bd6')
        sea.addColorStop(1, '#1d52ff')
        ctx.fillStyle = sea
        ctx.fillRect(F.cx - F.ext * 2, horizon, F.ext * 4, surface - horizon)
        glints(ctx, F, 104, 220, horizon, surface, t)
        // below the surface, a city seen from above
        const deep = ctx.createLinearGradient(0, surface, 0, Y(F, 0.6))
        deep.addColorStop(0, '#061048')
        deep.addColorStop(1, '#010210')
        ctx.fillStyle = deep
        ctx.fillRect(F.cx - F.ext * 2, surface, F.ext * 4, F.ext * 2)
        ctx.save()
        ctx.beginPath()
        ctx.rect(F.cx - F.ext * 2, surface, F.ext * 4, F.ext * 2)
        ctx.clip()
        drawCity(ctx, F, lights, surface - F.u * 0.04, 0.9, p * 1.2, 1, sp.glow)
        ctx.restore()
        // the bright waterline
        ctx.strokeStyle = 'rgba(210,230,255,.9)'
        ctx.lineWidth = 3
        ctx.beginPath()
        for (let x = F.cx - F.ext * 1.5; x <= F.cx + F.ext * 1.5; x += 10) {
          const y = surface + Math.sin(x * 0.03 + t * 3) * 3 + Math.sin(x * 0.011 - t * 2) * 4
          if (x === F.cx - F.ext * 1.5) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.fillStyle = 'rgba(120,170,255,.18)'
        ctx.fillRect(F.cx - F.ext * 2, surface, F.ext * 4, F.u * 0.05)
      }
    },
  },
  {
    title: 'The island',
    cam: { zoom: [1.25, 1.08], roll: [-4, 5], pan: [[0.02, -0.03], [-0.02, 0.02]], lens: 1.15 },
    compose(F, sp) {
      const crest = Y(F, 0.2)
      const towers = towerRow(111, F, [
        { x: -0.02, w: 0.2, top: -0.5 },
        { x: 0.3, w: 0.22, top: -0.62 },
        { x: -0.3, w: 0.08, top: -0.12 },
        { x: -0.45, w: 0.06, top: -0.05 },
      ], crest, X(F, 0.1), 0.15, { ...GLASS_NIGHT, windows: { seed: 11, density: 0.3, color: '#dfe8ff' } })
      const sea = bank(112, F.cx - F.ext * 1.6, F.cx + F.ext * 1.6, Y(F, 0.12), F.u * 0.14, 100)
      const high = [cumulus(113, X(F, -0.3), Y(F, -0.3), F.u * 0.6, F.u * 0.1, 12), cumulus(114, X(F, 0.5), Y(F, -0.42), F.u * 0.5, F.u * 0.08, 10)]
      const blades = grass(115, F, 700, Y(F, 0.22), Y(F, 0.8), 0.01, 0.05, 0.5)
      return (ctx, t) => {
        sky(ctx, F, BLUE_HOUR, -0.7, 0.1)
        stars(ctx, F, 116, 140, Y(F, 0), t)
        for (const c of high) drawPuffs(ctx, sp, c, 'night', t * 6, 0.9, t)
        drawPuffs(ctx, sp, sea, 'night', Math.sin(t * 0.4) * 10, 1, t)
        for (const tw of towers) drawTower(ctx, sp, tw, t)
        orb(ctx, sp, X(F, 0.26), Y(F, -0.08), F.u * 0.012, t)
        // the grassy island itself
        const g = ctx.createLinearGradient(0, crest, 0, Y(F, 0.8))
        g.addColorStop(0, '#2d7a2a')
        g.addColorStop(1, '#051a08')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(X(F, 0.05), Y(F, 0.72), F.u * 0.75, F.u * 0.52, 0, Math.PI, TAU)
        ctx.fill()
        ctx.save()
        ctx.clip()
        drawGrass(ctx, blades, t, ['#4c9a3a', '#1f5a1f', '#7cc85a'], 0.4)
        ctx.restore()
      }
    },
  },
]
