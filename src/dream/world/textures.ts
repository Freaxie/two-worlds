/* ------------------------------------------------------------------
   BLUE HOUR — textures made at start-up
   Noise-built cloud puffs, glows, water normals and tower facades.
   Nothing is loaded from the network.
------------------------------------------------------------------- */

import * as THREE from 'three'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* tileable value noise + fbm on a grid of `period` cells */
function makeNoise(seed: number, period: number) {
  const r = rng(seed)
  const g = new Float32Array(period * period).map(() => r())
  const at = (x: number, y: number) => g[(((y % period) + period) % period) * period + (((x % period) + period) % period)]
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx
    return a + (b - a) * sy
  }
}

function fbm(noise: (x: number, y: number) => number, x: number, y: number, oct: number) {
  let v = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < oct; i++) {
    v += noise(x * f, y * f) * amp
    f *= 2
    amp *= 0.5
  }
  return v
}

function tex(canvas: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(canvas)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

/**
 * Cloud puff: R = lit amount (1 on the sunny crown, 0 in the shaded belly),
 * A = density. Colour is applied in the cloud shader so one texture serves
 * day, dusk and night.
 */
export function cloudTexture(seed: number, size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const img = g.createImageData(size, size)
  const n = makeNoise(seed, 64)
  const dens = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size - 0.5
      const v = y / size - 0.5
      // soft gaussian body, flatter underneath, broken up by billowing noise
      const r = Math.hypot(u, v * (v > 0 ? 1.5 : 1.05))
      const body = Math.exp(-(r * r) / (2 * 0.16 * 0.16))
      const billow = fbm(n, x / 22, y / 22, 5)
      const wisp = fbm(n, x / 9 + 40, y / 9 + 40, 3)
      dens[y * size + x] = Math.max(0, body * (0.25 + 1.15 * billow) + (wisp - 0.5) * 0.12 * body - 0.12)
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const d = Math.min(1, Math.pow(dens[i] * 1.5, 1.2))
      // light arrives from above: how much cloud sits between here and the top
      let occ = 0
      for (let k = 1; k <= 8; k++) occ += dens[Math.max(0, y - k * 5) * size + x]
      const lit = Math.max(0, Math.min(1, 1.05 - occ * 0.2 + (0.5 - y / size) * 0.35))
      img.data[i * 4] = lit * 255
      img.data[i * 4 + 1] = lit * 255
      img.data[i * 4 + 2] = lit * 255
      img.data[i * 4 + 3] = d * 255
    }
  }
  g.putImageData(img, 0, 0)
  return tex(c, false)
}

export function glowTexture(size = 128) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.15, 'rgba(255,255,255,.7)')
  gr.addColorStop(0.4, 'rgba(255,255,255,.15)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, size, size)
  return tex(c)
}

/** Tileable normal map for Water.js, built from fbm height */
export function waterNormals(size = 256) {
  const n = makeNoise(7, 32)
  const h = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = fbm(n, (x / size) * 32, (y / size) * 32, 4)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const img = g.createImageData(size, size)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 6
      const dy = (at(x, y + 1) - at(x, y - 1)) * 6
      const l = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / l) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255
      img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  const t = tex(c, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/**
 * Curtain-wall facade. `map` darkens mullions and spandrels; `emissive`
 * holds the lit windows. One texture tile = one window bay.
 */
export function facade(seed: number, cols: number, rows: number, lit: number, warm = false) {
  const px = 16
  const w = cols * px
  const h = rows * px
  const base = document.createElement('canvas')
  base.width = w
  base.height = h
  const bg = base.getContext('2d')!
  bg.fillStyle = '#ffffff'
  bg.fillRect(0, 0, w, h)
  bg.fillStyle = '#30384c'
  for (let x = 0; x < cols; x++) bg.fillRect(x * px, 0, 1, h)
  for (let y = 0; y < rows; y++) bg.fillRect(0, y * px, w, 3)

  const em = document.createElement('canvas')
  em.width = w
  em.height = h
  const eg = em.getContext('2d')!
  eg.fillStyle = '#000'
  eg.fillRect(0, 0, w, h)
  const r = rng(seed)
  for (let y = 0; y < rows; y++) {
    // lit windows come in runs, like offices along a floor
    let on = r() < lit
    for (let x = 0; x < cols; x++) {
      if (r() < 0.25) on = r() < lit
      if (!on) continue
      const k = 0.55 + 0.45 * r()
      eg.fillStyle = warm && r() < 0.5 ? `rgba(255,${190 + 40 * k},${120 + 60 * k},${k})` : `rgba(${200 + 40 * k},${235},${255},${k})`
      eg.fillRect(x * px + 2, y * px + 4, px - 3, px - 5)
    }
  }
  return { map: tex(base), emissive: tex(em) }
}
