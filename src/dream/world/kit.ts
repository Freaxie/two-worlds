/* ------------------------------------------------------------------
   BLUE HOUR — the kit every shot is assembled from
   Sky dome, cloud billboards, glass towers, wind-driven grass and
   flowers, stars and city lights.
------------------------------------------------------------------- */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { cloudTexture, facade, glowTexture, rng } from './textures'

/** Uniforms shared by every animated material */
export const clock = { uTime: { value: 0 } }

let cloudTex: THREE.Texture
let glowTex: THREE.Texture
export function glow() {
  return (glowTex ??= glowTexture())
}
function clouds() {
  return (cloudTex ??= cloudTexture(3))
}

/* ---------------- sky ---------------- */

export interface SkySpec {
  zenith: string
  mid: string
  horizon: string
  below: string
  sun: THREE.Vector3
  sunColor: string
  sunSize?: number
  haze?: number
  stars?: number
}

export function skyDome(s: SkySpec) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: new THREE.Color(s.zenith) },
      mid: { value: new THREE.Color(s.mid) },
      horizon: { value: new THREE.Color(s.horizon) },
      below: { value: new THREE.Color(s.below) },
      sunDir: { value: s.sun.clone().normalize() },
      sunColor: { value: new THREE.Color(s.sunColor) },
      sunSize: { value: s.sunSize ?? 0.9995 },
      haze: { value: s.haze ?? 0.6 },
      stars: { value: s.stars ?? 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith, mid, horizon, below, sunColor, sunDir;
      uniform float sunSize, haze, stars;
      varying vec3 vDir;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
        col = mix(col, zenith, smoothstep(0.22, 0.85, h));
        col = mix(col, below, smoothstep(0.0, -0.12, h));
        float s = max(dot(d, sunDir), 0.0);
        col += sunColor * (pow(s, 6.0) * 0.25 * haze + pow(s, 60.0) * 0.6 * haze);
        col += sunColor * smoothstep(sunSize, sunSize + 0.0003, s) * 6.0;
        if (stars > 0.0 && h > 0.02) {
          vec3 g = floor(d * 420.0);
          float r = hash(g);
          float tw = smoothstep(0.9975, 1.0, r) * stars * smoothstep(0.02, 0.3, h);
          col += vec3(0.9, 0.95, 1.0) * tw * 2.5;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat)
  mesh.renderOrder = -10
  mesh.frustumCulled = false
  return mesh
}

/* ---------------- clouds ---------------- */

export interface Puff {
  p: THREE.Vector3
  s: number
}

export interface CloudLook {
  light: string
  shade: string
  fog: string
  fogNear: number
  fogFar: number
  opacity?: number
  drift?: THREE.Vector3
}

/** Camera-facing puffs, sorted far-to-near from `eye` so they layer correctly */
export function cloudField(puffs: Puff[], look: CloudLook, eye: THREE.Vector3, seed = 1) {
  const r = rng(seed)
  puffs.sort((a, b) => b.p.distanceToSquared(eye) - a.p.distanceToSquared(eye))
  const base = new THREE.PlaneGeometry(1, 1)
  const g = new THREE.InstancedBufferGeometry()
  g.index = base.index
  g.setAttribute('position', base.getAttribute('position'))
  g.setAttribute('uv', base.getAttribute('uv'))
  const pos = new Float32Array(puffs.length * 3)
  const size = new Float32Array(puffs.length)
  const seedA = new Float32Array(puffs.length)
  puffs.forEach((q, i) => {
    pos.set([q.p.x, q.p.y, q.p.z], i * 3)
    size[i] = q.s
    seedA[i] = r()
  })
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3))
  g.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1))
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedA, 1))
  g.instanceCount = puffs.length

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTex: { value: clouds() },
      uLight: { value: new THREE.Color(look.light) },
      uShade: { value: new THREE.Color(look.shade) },
      uFog: { value: new THREE.Color(look.fog) },
      uNear: { value: look.fogNear },
      uFar: { value: look.fogFar },
      uOpacity: { value: look.opacity ?? 1 },
      uDrift: { value: look.drift ?? new THREE.Vector3() },
      uTime: clock.uTime,
    },
    vertexShader: /* glsl */ `
      attribute vec3 aPos;
      attribute float aSize;
      attribute float aSeed;
      uniform float uTime, uNear, uFar;
      uniform vec3 uDrift;
      varying vec2 vUv;
      varying float vFog;
      varying float vSeed;
      void main() {
        vec3 wp = aPos + uDrift * uTime;
        wp.x += sin(uTime * 0.25 + aSeed * 40.0) * aSize * 0.03;
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        float br = 1.0 + 0.04 * sin(uTime * 0.6 + aSeed * 20.0);
        mv.xy += position.xy * vec2(1.55, 1.0) * aSize * br;
        vUv = uv;
        if (aSeed > 0.5) vUv.x = 1.0 - vUv.x;
        vSeed = aSeed;
        vFog = smoothstep(uNear, uFar, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform vec3 uLight, uShade, uFog;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vFog;
      varying float vSeed;
      void main() {
        vec4 t = texture2D(uTex, vUv);
        vec3 col = mix(uShade, uLight, pow(t.r, 0.8) * (0.9 + 0.2 * vSeed));
        col = mix(col, uFog, vFog);
        gl_FragColor = vec4(col, t.a * 0.85 * uOpacity);
      }`,
  })
  const mesh = new THREE.Mesh(g, mat)
  mesh.frustumCulled = false
  return mesh
}

/** Scatter puffs through a box, heaped toward its floor */
export function puffBox(seed: number, n: number, min: THREE.Vector3, max: THREE.Vector3, sMin: number, sMax: number): Puff[] {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const y = min.y + (max.y - min.y) * Math.pow(r(), 1.8)
    return { p: new THREE.Vector3(min.x + (max.x - min.x) * r(), y, min.z + (max.z - min.z) * r()), s: sMin + (sMax - sMin) * r() }
  })
}

/** A towering cumulus: a heap of puffs */
export function cumulus(seed: number, c: THREE.Vector3, w: number, h: number, n: number, sMin: number, sMax: number): Puff[] {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2
    const rad = Math.sqrt(r())
    const lift = r()
    const shrink = 1 - lift * 0.7
    return {
      p: new THREE.Vector3(c.x + Math.cos(a) * rad * w * 0.5 * shrink, c.y + lift * h, c.z + Math.sin(a) * rad * w * 0.3 * shrink),
      s: (sMin + (sMax - sMin) * r()) * (1 - lift * 0.4),
    }
  })
}

/* ---------------- towers ---------------- */

export interface TowerSpec {
  x: number
  z: number
  w: number
  d: number
  h: number
  y?: number
  rot?: number
  round?: boolean
  lit?: number
  warm?: boolean
  frame?: string
  tint?: string
  seed?: number
}

export function tower(s: TowerSpec, glowStrength: number) {
  const seed = s.seed ?? Math.round(s.x * 13 + s.z * 7 + s.h)
  const circumference = s.round ? Math.PI * s.w : s.w
  const cols = Math.max(4, Math.round(circumference / 2.2))
  const rows = Math.max(6, Math.round(s.h / 3.6))
  const f = facade(seed, cols, rows, s.lit ?? 0, s.warm)
  const mat = new THREE.MeshStandardMaterial({
    color: s.tint ?? '#9fb6ff',
    metalness: 0.92,
    roughness: 0.06,
    map: f.map,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: f.emissive,
    emissiveIntensity: s.lit ? glowStrength : 0,
    envMapIntensity: 1.25,
  })
  const geo = s.round ? new THREE.CylinderGeometry(s.w / 2, s.w / 2, s.h, 48, 1, false) : new THREE.BoxGeometry(s.w, s.h, s.d)
  const group = new THREE.Group()
  const body = new THREE.Mesh(geo, mat)
  body.position.y = s.h / 2
  group.add(body)
  if (s.frame && !s.round) {
    // white structural frame at the corners and crown
    const fm = new THREE.MeshStandardMaterial({ color: s.frame, roughness: 0.4, metalness: 0.1, emissive: s.frame, emissiveIntensity: 0.15 })
    const t = Math.max(0.6, s.w * 0.05)
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(t, s.h + t, t), fm)
      p.position.set((sx * s.w) / 2, s.h / 2, (sz * s.d) / 2)
      group.add(p)
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(s.w + t, t, s.d + t), fm)
    cap.position.y = s.h
    group.add(cap)
  }
  group.position.set(s.x, s.y ?? 0, s.z)
  group.rotation.y = s.rot ?? 0
  return group
}

/* ---------------- wind ---------------- */

/** Bend geometry in world space; `weight` is a GLSL expression in local `position` */
function windify(mat: THREE.Material, weight: string, strength: number) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = clock.uTime
    sh.uniforms.uWind = { value: strength }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 wIp = vec3(instanceMatrix[3]);
          mat3 wIm = mat3(instanceMatrix);
        #else
          vec3 wIp = vec3(0.0);
          mat3 wIm = mat3(1.0);
        #endif
        float gust = 0.6 + 0.4 * sin(uTime * 0.7 + wIp.x * 0.05);
        float sx = sin(uTime * 1.9 + wIp.x * 0.7 + wIp.z * 0.4) * gust;
        float sz = cos(uTime * 1.3 + wIp.x * 0.3 + wIp.z * 0.9) * 0.5;
        transformed += inverse(wIm) * (vec3(sx, 0.0, sz) * uWind * (${weight}));`
      )
  }
  mat.customProgramCacheKey = () => `wind-${weight}`
}

/* ---------------- ground cover ---------------- */

export type Height = (x: number, z: number) => number

export interface Scatter {
  n: number
  x: [number, number]
  z: [number, number]
  /** return 0..1 keep-probability for a spot */
  keep?: (x: number, z: number) => number
}

function scatter(seed: number, s: Scatter) {
  const r = rng(seed)
  const out: [number, number][] = []
  let guard = 0
  while (out.length < s.n && guard++ < s.n * 8) {
    const x = s.x[0] + (s.x[1] - s.x[0]) * r()
    const z = s.z[0] + (s.z[1] - s.z[0]) * r()
    if (s.keep && r() > s.keep(x, z)) continue
    out.push([x, z])
  }
  return out
}

export function grass(seed: number, s: Scatter, height: Height, h: [number, number], colors: [string, string], wind = 0.12) {
  const blade = new THREE.PlaneGeometry(0.03, 1, 1, 4)
  blade.translate(0, 0.5, 0)
  const p = blade.getAttribute('position') as THREE.BufferAttribute
  const col = new Float32Array(p.count * 3)
  const lo = new THREE.Color(colors[0])
  const hi = new THREE.Color(colors[1])
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    p.setX(i, p.getX(i) * (1 - y * 0.9))
    p.setZ(i, y * y * 0.18)
    const c = lo.clone().lerp(hi, y)
    col.set([c.r, c.g, c.b], i * 3)
  }
  blade.setAttribute('color', new THREE.BufferAttribute(col, 3))
  blade.computeVertexNormals()
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
  windify(mat, 'position.y * position.y', wind)
  const spots = scatter(seed, s)
  const mesh = new THREE.InstancedMesh(blade, mat, spots.length)
  const r = rng(seed + 1)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const tint = new THREE.Color()
  spots.forEach(([x, z], i) => {
    const hh = h[0] + (h[1] - h[0]) * r()
    e.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(x, height(x, z) - 0.02, z), q, new THREE.Vector3(1 + r(), hh, 1))
    mesh.setMatrixAt(i, m)
    tint.setHSL(0, 0, 0.75 + r() * 0.5)
    mesh.setColorAt(i, tint)
  })
  mesh.frustumCulled = false
  return mesh
}

export interface FlowerSpec {
  petals: number
  len: number
  width: number
  cup: number
  inner: string
  outer: string
  centre: string
  centreSize: number
  glow?: string
  glowStrength?: number
}

export const FLOWERS = {
  cosmos: { petals: 8, len: 1, width: 0.4, cup: 0.25, inner: '#ffe4f0', outer: '#ffffff', centre: '#f2b705', centreSize: 0.2 },
  nemophila: { petals: 5, len: 1, width: 0.62, cup: 0.35, inner: '#ffffff', outer: '#6f93ff', centre: '#f4f8ff', centreSize: 0.12, glow: '#3f63ff', glowStrength: 0.9 },
  lily: { petals: 6, len: 1, width: 0.4, cup: 0.5, inner: '#fbffe8', outer: '#ffffff', centre: '#cbd77a', centreSize: 0.1, glow: '#e9f2ff', glowStrength: 0.25 },
} satisfies Record<string, FlowerSpec>

function flowerHead(f: FlowerSpec) {
  const parts: THREE.BufferGeometry[] = []
  const inner = new THREE.Color(f.inner)
  const outer = new THREE.Color(f.outer)
  for (let i = 0; i < f.petals; i++) {
    const g = new THREE.PlaneGeometry(f.len, f.width, 6, 2)
    const p = g.getAttribute('position') as THREE.BufferAttribute
    const col = new Float32Array(p.count * 3)
    for (let k = 0; k < p.count; k++) {
      const u = p.getX(k) / f.len + 0.5
      const prof = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.02)), 0.55) * (0.5 + 0.5 * u)
      p.setXYZ(k, u * f.len, p.getY(k) * prof, f.cup * u * u)
      const c = inner.clone().lerp(outer, Math.pow(u, 0.7))
      col.set([c.r, c.g, c.b], k * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.rotateX(-Math.PI / 2)
    // petals lie in XZ, cupping upward, fanned around Y
    g.applyMatrix4(new THREE.Matrix4().makeRotationY((i / f.petals) * Math.PI * 2))
    parts.push(g)
  }
  const c = new THREE.SphereGeometry(f.centreSize, 10, 6)
  c.scale(1, 0.5, 1)
  c.translate(0, 0.02, 0)
  const cc = new THREE.Color(f.centre)
  c.setAttribute('color', new THREE.BufferAttribute(new Float32Array(c.getAttribute('position').count * 3).map((_, i) => [cc.r, cc.g, cc.b][i % 3]), 3))
  parts.push(c.toNonIndexed())
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))
  merged.computeVertexNormals()
  return merged
}

/** Stems and heads; heads tilt toward `face` (usually the camera) */
export function flowers(seed: number, kind: FlowerSpec, s: Scatter, height: Height, size: [number, number], stem: [number, number], tints: string[], face: THREE.Vector3, wind = 0.05) {
  const spots = scatter(seed, s)
  const r = rng(seed + 9)
  const headMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.55,
    emissive: new THREE.Color(kind.glow ?? '#000000'),
    emissiveIntensity: kind.glowStrength ?? 0,
  })
  windify(headMat, '1.0', wind)
  const stemMat = new THREE.MeshLambertMaterial({ color: '#2d5a26' })
  windify(stemMat, 'position.y * position.y', wind)
  const heads = new THREE.InstancedMesh(flowerHead(kind), headMat, spots.length)
  const stemGeo = new THREE.CylinderGeometry(0.006, 0.01, 1, 4, 3)
  stemGeo.translate(0, 0.5, 0)
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, spots.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const tint = new THREE.Color()
  const up = new THREE.Vector3(0, 1, 0)
  spots.forEach(([x, z], i) => {
    const y0 = height(x, z)
    const sh = stem[0] + (stem[1] - stem[0]) * r()
    const hs = size[0] + (size[1] - size[0]) * r()
    const top = new THREE.Vector3(x, y0 + sh, z)
    m.compose(new THREE.Vector3(x, y0, z), q.identity(), new THREE.Vector3(1, sh, 1))
    stems.setMatrixAt(i, m)
    // head normal leans toward the viewer, with some scatter
    const toward = face.clone().sub(top).normalize()
    const n = up.clone().lerp(toward, 0.35 + r() * 0.45).add(new THREE.Vector3(r() - 0.5, 0, r() - 0.5).multiplyScalar(0.5)).normalize()
    q.setFromUnitVectors(up, n)
    q.multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * Math.PI * 2))
    m.compose(top, q, new THREE.Vector3(hs, hs, hs))
    heads.setMatrixAt(i, m)
    tint.set(tints[Math.floor(r() * tints.length)])
    heads.setColorAt(i, tint)
  })
  heads.frustumCulled = stems.frustumCulled = false
  const g = new THREE.Group()
  g.add(stems, heads)
  return g
}

/* ---------------- terrain ---------------- */

export function terrain(height: Height, size: number, seg: number, color: string, centre = new THREE.Vector2(), rock?: { color: string; below: number }) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg)
  g.rotateX(-Math.PI / 2)
  g.translate(centre.x, 0, centre.y)
  const p = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)))
  g.computeVertexNormals()
  if (!rock) return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }))
  const top = new THREE.Color(color)
  const low = new THREE.Color(rock.color)
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const c = top.clone().lerp(low, Math.min(1, Math.max(0, (rock.below - p.getY(i)) / 3)))
    col.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }))
}

/* ---------------- lights in the dark ---------------- */

export function glowSprite(color: string, size: number, pos: THREE.Vector3, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
  s.scale.setScalar(size)
  s.position.copy(pos)
  return s
}

/** City lights as glowing points spread over a ground plane */
export function cityLights(seed: number, n: number, min: THREE.Vector3, max: THREE.Vector3, size: number) {
  const r = rng(seed)
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const palette = [new THREE.Color('#ffc978'), new THREE.Color('#e8f0ff'), new THREE.Color('#ff5a6a'), new THREE.Color('#9fd0ff')]
  for (let i = 0; i < n; i++) {
    let x = min.x + (max.x - min.x) * r()
    let z = min.z + (max.z - min.z) * r()
    // most lights line up along a street grid
    if (r() < 0.6) {
      if (r() < 0.5) x = Math.round(x / 18) * 18 + (r() - 0.5) * 1.5
      else z = Math.round(z / 14) * 14 + (r() - 0.5) * 1.5
    }
    const y = min.y + (max.y - min.y) * Math.pow(r(), 6)
    pos.set([x, y, z], i * 3)
    const c = palette[r() < 0.55 ? 0 : r() < 0.85 ? 1 : r() < 0.5 ? 2 : 3]
    col.set([c.r * 2, c.g * 2, c.b * 2], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({ size, map: glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })
  )
}
