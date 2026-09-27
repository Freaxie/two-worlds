/* ------------------------------------------------------------------
   BLUE HOUR — textures drawn at start-up
   The soft glow sprite and the curtain-wall facades of the towers.
   Photographic textures are loaded in assets.ts.
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

function tex(canvas: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(canvas)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
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
