/* ------------------------------------------------------------------
   BLUE HOUR — the kit every shot is assembled from
   Photographic clouds, instanced glTF flowers, a glass fish, glass
   towers, wind-driven grass, textured ground and a few lights.
------------------------------------------------------------------- */

import * as THREE from 'three'
import { facade, glowTexture, rng } from './textures'

/** Uniforms shared by every animated material */
export const clock = { uTime: { value: 0 } }

let glowTex: THREE.Texture
export function glow() {
  return (glowTex ??= glowTexture())
}

/* ---------------- wind ---------------- */

/** Bend geometry in world space; `weight` is a GLSL expression in local `position` */
export function windify(mat: THREE.Material, weight: string, strength: number) {
  const prev = mat.onBeforeCompile
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r)
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
        float gust = 0.55 + 0.45 * sin(uTime * 0.6 + wIp.x * 0.04 + wIp.z * 0.03);
        float sx = sin(uTime * 1.7 + wIp.x * 0.6 + wIp.z * 0.35) * gust;
        float sz = cos(uTime * 1.2 + wIp.x * 0.25 + wIp.z * 0.8) * 0.45;
        transformed += inverse(wIm) * (vec3(sx, 0.0, sz) * uWind * (${weight}));`
      )
  }
  mat.customProgramCacheKey = () => `wind-${weight}`
}

/* ---------------- scattering ---------------- */

export type Height = (x: number, z: number) => number

export interface Scatter {
  n: number
  x: [number, number]
  z: [number, number]
  /** 0..1 chance of keeping a spot */
  keep?: (x: number, z: number) => number
}

export function scatter(seed: number, s: Scatter) {
  const r = rng(seed)
  const out: [number, number][] = []
  let guard = 0
  while (out.length < s.n && guard++ < s.n * 10) {
    const x = s.x[0] + (s.x[1] - s.x[0]) * r()
    const z = s.z[0] + (s.z[1] - s.z[0]) * r()
    if (s.keep && r() > s.keep(x, z)) continue
    out.push([x, z])
  }
  return out
}

/* ---------------- ground ---------------- */

/** Heightfield ground with the photographic grass texture, tinted */
export function terrain(height: Height, size: number, seg: number, tex: THREE.Texture, tint: string, repeat: number, centre = new THREE.Vector2(), rock?: { color: string; below: number }) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg)
  g.rotateX(-Math.PI / 2)
  g.translate(centre.x, 0, centre.y)
  const p = g.getAttribute('position') as THREE.BufferAttribute
  const col = new Float32Array(p.count * 3)
  const top = new THREE.Color('#ffffff')
  const low = new THREE.Color(rock?.color ?? '#ffffff')
  for (let i = 0; i < p.count; i++) {
    const y = height(p.getX(i), p.getZ(i))
    p.setY(i, y)
    const c = rock ? top.clone().lerp(low, THREE.MathUtils.clamp((rock.below - y) / 3, 0, 1)) : top
    col.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.computeVertexNormals()
  const map = tex.clone()
  map.repeat.set(repeat, repeat)
  map.needsUpdate = true
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map, color: tint, vertexColors: true, roughness: 0.95, metalness: 0 }))
  mesh.receiveShadow = true
  return mesh
}

export function grass(seed: number, s: Scatter, height: Height, h: [number, number], colors: [string, string], wind = 0.1, width = 0.03) {
  const blade = new THREE.PlaneGeometry(width, 1, 1, 4)
  blade.translate(0, 0.5, 0)
  const p = blade.getAttribute('position') as THREE.BufferAttribute
  const col = new Float32Array(p.count * 3)
  const lo = new THREE.Color(colors[0])
  const hi = new THREE.Color(colors[1])
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i)
    p.setX(i, p.getX(i) * (1 - y * 0.92))
    p.setZ(i, y * y * 0.2)
    const c = lo.clone().lerp(hi, Math.pow(y, 0.8))
    col.set([c.r, c.g, c.b], i * 3)
  }
  blade.setAttribute('color', new THREE.BufferAttribute(col, 3))
  blade.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 })
  windify(mat, 'position.y * position.y', wind)
  const spots = scatter(seed, s)
  const mesh = new THREE.InstancedMesh(blade, mat, spots.length)
  const r = rng(seed + 1)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const tint = new THREE.Color()
  spots.forEach(([x, z], i) => {
    e.set((r() - 0.5) * 0.35, r() * Math.PI * 2, (r() - 0.5) * 0.35)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(x, height(x, z) - 0.02, z), q, new THREE.Vector3(1 + r(), h[0] + (h[1] - h[0]) * r(), 1))
    mesh.setMatrixAt(i, m)
    tint.setHSL(0.02 * (r() - 0.5), 0, 0.7 + r() * 0.55)
    mesh.setColorAt(i, tint)
  })
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

/* ---------------- flowers (glTF) ---------------- */

export interface Bloom {
  /** multiplies the scanned petal colour */
  tint?: THREE.ColorRepresentation
  /** self-light, for flowers that glow at blue hour */
  glow?: THREE.ColorRepresentation
  glowStrength?: number
}

/** Clumps of the scanned oxalis bouquet, instanced across the ground, leaning toward the viewer */
export function oxalis(source: THREE.Mesh, seed: number, s: Scatter, height: Height, scale: [number, number], face: THREE.Vector3, look: Bloom = {}, wind = 0.05) {
  const src = source.material as THREE.MeshStandardMaterial
  const mat = src.clone()
  if (look.tint) mat.color.set(look.tint)
  if (look.glow) {
    mat.emissive.set(look.glow)
    mat.emissiveMap = src.map
    mat.emissiveIntensity = look.glowStrength ?? 1
  }
  mat.side = THREE.DoubleSide
  windify(mat, 'clamp(position.y * 6.0, 0.0, 1.0)', wind)
  const spots = scatter(seed, s)
  const mesh = new THREE.InstancedMesh(source.geometry, mat, spots.length)
  const r = rng(seed + 3)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const tint = new THREE.Color()
  spots.forEach(([x, z], i) => {
    const pos = new THREE.Vector3(x, height(x, z) - 0.01, z)
    const toward = face.clone().sub(pos).setY(0).normalize()
    const lean = up.clone().lerp(toward, 0.15 + r() * 0.2).normalize()
    q.setFromUnitVectors(up, lean).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * Math.PI * 2))
    const k = scale[0] + (scale[1] - scale[0]) * r()
    m.compose(pos, q, new THREE.Vector3(k, k * (0.85 + r() * 0.4), k))
    mesh.setMatrixAt(i, m)
    tint.setHSL(0, 0, 0.8 + r() * 0.35)
    mesh.setColorAt(i, tint)
  })
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

/* ---------------- the glass fish ---------------- */

/** The scanned barramundi, re-dressed as swimming blue glass */
export function glassFish(source: THREE.Mesh) {
  const src = source.material as THREE.MeshStandardMaterial
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#6f8dff',
    metalness: 0,
    roughness: 0.08,
    transmission: 0.92,
    thickness: 0.18,
    ior: 1.45,
    attenuationColor: new THREE.Color('#1d38ff'),
    attenuationDistance: 0.12,
    normalMap: src.normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    iridescence: 0.5,
    iridescenceIOR: 1.3,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new THREE.Color('#4a6cff'),
    emissiveMap: src.map,
    emissiveIntensity: 3.2,
    envMapIntensity: 1.6,
  })
  // swim: a travelling S-bend along the body, strongest at the tail
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = clock.uTime
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float along = clamp((0.3 - position.z) / 0.62, 0.0, 1.0);
        transformed.x += sin(uTime * 6.0 - along * 5.0) * 0.045 * along * along;`
      )
  }
  const fish = new THREE.Mesh(source.geometry, mat)
  fish.castShadow = true
  const g = new THREE.Group()
  g.add(fish)
  return g
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

/**
 * Camera-facing sprites of the photographic cloud texture, each
 * turned at random, lit from above and faded into the haze. Sorted
 * far-to-near from `eye` so they layer correctly.
 */
export function cloudField(tex: THREE.Texture, puffs: Puff[], look: CloudLook, eye: THREE.Vector3, seed = 1) {
  const r = rng(seed)
  const list = [...puffs].sort((a, b) => b.p.distanceToSquared(eye) - a.p.distanceToSquared(eye))
  const base = new THREE.PlaneGeometry(1, 1)
  const g = new THREE.InstancedBufferGeometry()
  g.index = base.index
  g.setAttribute('position', base.getAttribute('position'))
  g.setAttribute('uv', base.getAttribute('uv'))
  const pos = new Float32Array(list.length * 3)
  const size = new Float32Array(list.length)
  const rot = new Float32Array(list.length)
  const seedA = new Float32Array(list.length)
  list.forEach((q, i) => {
    pos.set([q.p.x, q.p.y, q.p.z], i * 3)
    size[i] = q.s
    rot[i] = r() * Math.PI * 2
    seedA[i] = r()
  })
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3))
  g.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1))
  g.setAttribute('aRot', new THREE.InstancedBufferAttribute(rot, 1))
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedA, 1))
  g.instanceCount = list.length

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTex: { value: tex },
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
      attribute float aSize, aRot, aSeed;
      uniform float uTime, uNear, uFar;
      uniform vec3 uDrift;
      varying vec2 vUv;
      varying float vFog, vLit, vSeed, vNear;
      void main() {
        vec3 wp = aPos + uDrift * uTime;
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        float a = aRot + uTime * 0.02 * (aSeed - 0.5);
        vec2 q = position.xy;
        vec2 rq = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
        mv.xy += rq * aSize * vec2(1.35, 1.0);
        vUv = uv;
        vLit = q.y + 0.5;
        vSeed = aSeed;
        float dist = -mv.z;
        vFog = smoothstep(uNear, uFar, dist);
        // fade puffs that crowd the lens
        vNear = smoothstep(aSize * 0.3, aSize * 1.2, dist);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform vec3 uLight, uShade, uFog;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vFog, vLit, vSeed, vNear;
      void main() {
        vec4 t = texture2D(uTex, vUv);
        float lit = smoothstep(0.05, 0.95, vLit) * 0.75 + t.r * 0.35;
        vec3 col = mix(uShade, uLight, clamp(lit + (vSeed - 0.5) * 0.15, 0.0, 1.0));
        col = mix(col, uFog, vFog);
        gl_FragColor = vec4(col, t.a * uOpacity * vNear);
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
  const mat = new THREE.MeshPhysicalMaterial({
    color: s.tint ?? '#a9bdf5',
    metalness: 0.85,
    roughness: 0.05,
    map: f.map,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: f.emissive,
    emissiveIntensity: s.lit ? glowStrength : 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.1,
  })
  const geo = s.round ? new THREE.CylinderGeometry(s.w / 2, s.w / 2, s.h, 64, 1, false) : new THREE.BoxGeometry(s.w, s.h, s.d)
  const group = new THREE.Group()
  const body = new THREE.Mesh(geo, mat)
  body.position.y = s.h / 2
  body.castShadow = body.receiveShadow = true
  group.add(body)
  if (s.frame && !s.round) {
    const fm = new THREE.MeshStandardMaterial({ color: s.frame, roughness: 0.35, metalness: 0.1 })
    const t = Math.max(0.6, s.w * 0.05)
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(t, s.h + t, t), fm)
      p.position.set((sx * s.w) / 2, s.h / 2, (sz * s.d) / 2)
      p.castShadow = true
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

/* ---------------- atmosphere ---------------- */

/**
 * Horizon haze: a sky-space veil that thickens toward the horizon,
 * blending distant land into air and hiding the photographed ground
 * at the edge of each sky.
 */
export function haze(color: THREE.ColorRepresentation, clear: number, thick = -0.04, strength = 1) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uClear: { value: clear }, uThick: { value: thick }, uStrength: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vDir = wp.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uClear, uThick, uStrength;
      varying vec3 vDir;
      void main() {
        float e = normalize(vDir).y;
        gl_FragColor = vec4(uColor, (1.0 - smoothstep(uThick, uClear, e)) * uStrength);
      }`,
  })
  const m = new THREE.Mesh(new THREE.SphereGeometry(2800, 48, 24), mat)
  m.renderOrder = -1
  m.frustumCulled = false
  m.onBeforeRender = (_r, _s, cam) => m.position.copy(cam.position)
  return m
}

/** A night sky with stars, for sets whose photographed horizon would show */
export function nightSky(zenith: string, horizon: string, stars = 1) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uZenith: { value: new THREE.Color(zenith) }, uHorizon: { value: new THREE.Color(horizon) }, uStars: { value: stars } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith, uHorizon;
      uniform float uStars;
      varying vec3 vDir;
      float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = mix(uHorizon, uZenith, pow(smoothstep(-0.05, 0.9, d.y), 0.6));
        // stars: three sizes, the faint ones thickest along a tilted band
        float band = exp(-pow(dot(d, normalize(vec3(0.3, 0.5, -0.8))) * 3.0, 2.0));
        for (int i = 0; i < 3; i++) {
          float scale = 300.0 + float(i) * 260.0;
          vec3 g = floor(d * scale);
          float r = hash(g);
          float thresh = 0.9985 - band * 0.002 * float(i);
          float s = smoothstep(thresh, 1.0, r) * smoothstep(0.0, 0.25, d.y);
          col += vec3(0.85, 0.9, 1.0) * s * uStars * (1.6 - float(i) * 0.4);
        }
        col += vec3(0.25, 0.3, 0.6) * band * 0.08 * smoothstep(0.0, 0.3, d.y);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  const m = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), mat)
  m.renderOrder = -2
  m.frustumCulled = false
  m.onBeforeRender = (_r, _s, cam) => m.position.copy(cam.position)
  return m
}

/* ---------------- light in the air ---------------- */

export function glowSprite(color: THREE.ColorRepresentation, size: number, pos: THREE.Vector3, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
  s.scale.setScalar(size)
  s.position.copy(pos)
  return s
}

/** City lights as glowing points on a street grid */
export function cityLights(seed: number, n: number, min: THREE.Vector3, max: THREE.Vector3, size: number) {
  const r = rng(seed)
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const palette = [new THREE.Color('#ffc978'), new THREE.Color('#e8f0ff'), new THREE.Color('#ff6a78'), new THREE.Color('#9fd0ff')]
  for (let i = 0; i < n; i++) {
    let x = min.x + (max.x - min.x) * r()
    let z = min.z + (max.z - min.z) * r()
    if (r() < 0.65) {
      if (r() < 0.5) x = Math.round(x / 18) * 18 + (r() - 0.5) * 1.5
      else z = Math.round(z / 14) * 14 + (r() - 0.5) * 1.5
    }
    const y = min.y + (max.y - min.y) * Math.pow(r(), 6)
    pos.set([x, y, z], i * 3)
    const c = palette[r() < 0.55 ? 0 : r() < 0.85 ? 1 : r() < 0.5 ? 2 : 3]
    col.set([c.r * 3, c.g * 3, c.b * 3], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return new THREE.Points(g, new THREE.PointsMaterial({ size, map: glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }))
}

/** Sunlit pollen drifting through the meadow; the lens turns it into soft bokeh */
export function pollen(seed: number, n: number, min: THREE.Vector3, max: THREE.Vector3, color: THREE.ColorRepresentation) {
  const r = rng(seed)
  const pos = new Float32Array(n * 3)
  const ph = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    pos.set([min.x + (max.x - min.x) * r(), min.y + (max.y - min.y) * r(), min.z + (max.z - min.z) * r()], i * 3)
    ph[i] = r() * 100
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: clock.uTime, uTex: { value: glow() }, uColor: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      uniform float uTime;
      varying float vA;
      void main() {
        vec3 p = position + vec3(sin(uTime * 0.3 + aPhase) * 0.4, sin(uTime * 0.5 + aPhase * 1.7) * 0.25 + uTime * 0.05, cos(uTime * 0.25 + aPhase) * 0.4);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(60.0 / -mv.z, 1.0, 40.0);
        vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.0 + aPhase * 3.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform vec3 uColor;
      varying float vA;
      void main() { gl_FragColor = vec4(uColor * texture2D(uTex, gl_PointCoord).a * vA, 1.0); }`,
  })
  const pts = new THREE.Points(g, mat)
  pts.frustumCulled = false
  return pts
}
