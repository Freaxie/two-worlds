/* ------------------------------------------------------------------
   NEON RAIN — the street kit
   Neon signs, rain, splashes, lamp light in wet air, buildings with
   lit windows, car light trails and a rain-rippled street that
   mirrors everything above it.
------------------------------------------------------------------- */

import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { clock, glow } from '../dream/world/kit'
import { facade, rng } from '../dream/world/textures'

/* ---------------- neon ---------------- */

export interface SignSpec {
  text: string
  color: string
  /** world height of the sign; width follows the text */
  height: number
  vertical?: boolean
  /** cast the sign's colour onto its surroundings with a real light (costly: use on a few per set) */
  light?: boolean
  /** chance per second of a stutter */
  flicker?: number
  brightness?: number
}

/**
 * A neon sign: glowing tube lettering on a dark backing board, drawn
 * to a canvas in Monoton and lit hot enough to bloom.
 */
export function neonSign(s: SignSpec) {
  const font = "400 120px 'Monoton', 'IBM Plex Mono', monospace"
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = font
  const chars = s.vertical ? [...s.text] : [s.text]
  const lineW = Math.max(...chars.map((c) => probe.measureText(c).width))
  const pad = 70
  const W = Math.ceil(lineW + pad * 2)
  const H = Math.ceil(chars.length * 140 + pad * 2 - 20)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  // the board: near-black with a faint tube outline
  g.fillStyle = 'rgba(6,6,12,0.88)'
  g.beginPath()
  g.roundRect(8, 8, W - 16, H - 16, 26)
  g.fill()
  g.strokeStyle = s.color
  g.globalAlpha = 0.55
  g.lineWidth = 5
  g.beginPath()
  g.roundRect(22, 22, W - 44, H - 44, 18)
  g.stroke()
  g.globalAlpha = 1
  g.font = font
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  // tube: a coloured halo, then a near-white core
  chars.forEach((ch, i) => {
    const y = pad + 60 + i * 140
    g.shadowColor = s.color
    g.shadowBlur = 28
    g.fillStyle = s.color
    g.fillText(ch, W / 2, y)
    g.shadowBlur = 8
    g.fillStyle = '#ffffff'
    g.globalAlpha = 0.75
    g.fillText(ch, W / 2, y)
    g.globalAlpha = 1
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: true })
  const base = new THREE.Color(1, 1, 1).multiplyScalar(s.brightness ?? 3.2)
  mat.color.copy(base)
  const h = s.height
  const w = (h * W) / H
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  // the sign throws its colour onto wet walls and the street
  const light = s.light ? new THREE.PointLight(s.color, 6 * h, 14 + h * 3, 1.6) : null
  if (light) {
    light.position.set(0, 0, 0.8)
    mesh.add(light)
  }
  const seed = rng(s.text.length * 17 + s.height * 31)()
  const flicker = s.flicker ?? 0
  mesh.onBeforeRender = () => {
    const t = clock.uTime.value
    // a broken tube stutters for a few frames now and then
    const k = flicker > 0 && Math.sin(t * 13.7 + seed * 50) > 1 - flicker * 0.08 && Math.sin(t * 61 + seed * 9) > 0 ? 0.25 : 1
    mat.color.copy(base).multiplyScalar(k)
    if (light) light.intensity = 6 * h * k
  }
  return mesh
}

/* ---------------- rain ---------------- */

/**
 * Rain streaks in a box that travels with the camera, so it is always
 * raining around the lens. Each drop is a thin quad stretched along its
 * fall, the length a camera at 1/48 s would smear it to.
 */
export function rain(n: number, half: THREE.Vector3, speed: number, wind: THREE.Vector2, color: string, opacity = 0.35) {
  const r = rng(n)
  const g = new THREE.InstancedBufferGeometry()
  const quad = new THREE.PlaneGeometry(1, 1)
  quad.translate(0, -0.5, 0)
  g.index = quad.index
  g.setAttribute('position', quad.getAttribute('position'))
  g.setAttribute('uv', quad.getAttribute('uv'))
  const off = new Float32Array(n * 3)
  const sp = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    off.set([r(), r(), r()], i * 3)
    sp[i] = 0.8 + 0.4 * r()
  }
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3))
  g.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(sp, 1))
  g.instanceCount = n
  // drawn in the post overlay, after depth of field, where there is no scene depth to test against;
  // double-sided because which way a streak's quad winds depends on where the camera is
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: clock.uTime,
      uHalf: { value: half },
      uSpeed: { value: speed },
      uWind: { value: wind },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aOff;
      attribute float aSpeed;
      uniform float uTime, uSpeed;
      uniform vec3 uHalf;
      uniform vec2 uWind;
      varying vec2 vUv;
      varying float vFade;
      varying float vShine;
      void main() {
        vec3 size = uHalf * 2.0;
        // most drops are faint; a few catch a sign or a lamp and flare
        vShine = 0.25 + 0.75 * pow(fract(aOff.x * 91.7 + aOff.z * 37.3), 3.0);
        vec3 vel = vec3(uWind.x, -uSpeed * aSpeed, uWind.y);
        // each drop's place in a box that wraps around the camera
        vec3 p = aOff * size + vel * uTime;
        vec3 origin = cameraPosition - uHalf;
        p = origin + mod(p - origin, size);
        // stretch along the fall, face the camera across it
        vec3 dir = normalize(vel);
        float len = length(vel) / 48.0;
        vec3 toCam = normalize(cameraPosition - p);
        vec3 side = normalize(cross(dir, toCam));
        float dist = length(cameraPosition - p);
        float width = 0.006 + dist * 0.0014;
        vec3 wp = p + side * position.x * width - dir * position.y * len;
        vUv = uv;
        // fade at the edges of the box so the wrap never pops
        vec3 q = abs(p - cameraPosition) / uHalf;
        vFade = (1.0 - smoothstep(0.7, 1.0, max(q.x, max(q.y, q.z)))) * smoothstep(0.3, 1.2, dist);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vFade;
      varying float vShine;
      void main() {
        float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
        float along = sin(vUv.y * 3.14159);
        gl_FragColor = vec4(uColor * across * along * vFade * vShine * uOpacity, 1.0);
      }`,
  })
  const mesh = new THREE.Mesh(g, mat)
  mesh.frustumCulled = false
  mesh.renderOrder = 5
  return mesh
}

/** Rings that bloom and fade where drops land on a flat surface at height y */
export function splashes(n: number, centre: THREE.Vector3, radius: number, y: number, color: string) {
  const r = rng(n + 5)
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g2 = c.getContext('2d')!
  g2.strokeStyle = 'white'
  g2.lineWidth = 3
  g2.beginPath()
  g2.arc(32, 32, 26, 0, Math.PI * 2)
  g2.stroke()
  const ring = new THREE.CanvasTexture(c)
  const g = new THREE.InstancedBufferGeometry()
  const quad = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  g.index = quad.index
  g.setAttribute('position', quad.getAttribute('position'))
  g.setAttribute('uv', quad.getAttribute('uv'))
  const data = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * radius
    data.set([centre.x + Math.cos(a) * d, centre.z + Math.sin(a) * d, r()], i * 3)
  }
  g.setAttribute('aSpot', new THREE.InstancedBufferAttribute(data, 3))
  g.instanceCount = n
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: clock.uTime, uTex: { value: ring }, uY: { value: y }, uColor: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `
      attribute vec3 aSpot;
      uniform float uTime, uY;
      varying vec2 vUv;
      varying float vLife;
      void main() {
        float life = fract(uTime * 1.6 + aSpot.z * 7.0);
        vLife = life;
        vec3 p = vec3(aSpot.x, uY + 0.005, aSpot.y) + position * (0.02 + life * 0.16);
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vLife;
      void main() { gl_FragColor = vec4(uColor * texture2D(uTex, vUv).a * (1.0 - vLife) * 0.6, 1.0); }`,
  })
  const mesh = new THREE.Mesh(g, mat)
  mesh.frustumCulled = false
  return mesh
}

/* ---------------- street furniture ---------------- */

/** A street lamp: pole, hood, a real spot light and a soft cone of lit rain beneath it */
export function lamp(pos: THREE.Vector3, color: string, height = 6, shadow = false) {
  const g = new THREE.Group()
  g.position.copy(pos)
  const metal = new THREE.MeshStandardMaterial({ color: '#15161c', roughness: 0.35, metalness: 0.8 })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, height, 12), metal)
  pole.position.y = height / 2
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), metal)
  arm.position.set(0.55, height, 0)
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.32, 0.18, 16), metal)
  hood.position.set(1.1, height - 0.05, 0)
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(8) }))
  bulb.rotation.x = Math.PI / 2
  bulb.position.set(1.1, height - 0.15, 0)
  pole.castShadow = arm.castShadow = hood.castShadow = true
  g.add(pole, arm, hood, bulb)

  const spot = new THREE.SpotLight(color, 120, height * 3, 0.75, 0.6, 1.6)
  spot.position.set(1.1, height - 0.2, 0)
  spot.target.position.set(1.1, 0, 0)
  spot.castShadow = shadow
  if (shadow) {
    spot.shadow.mapSize.set(1024, 1024)
    spot.shadow.bias = -0.0005
  }
  g.add(spot, spot.target)

  // the cone: brightest near the bulb and down its axis, soft at the rim
  const h = height - 0.2
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, h * 0.62, h, 48, 1, true).translate(0, -h / 2, 0),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(color) }, uTime: clock.uTime, uH: { value: h } },
      vertexShader: /* glsl */ `
        varying float vY;
        varying vec3 vN, vV, vW;
        void main() {
          vY = -position.y;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vW = wp.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uTime, uH;
        varying float vY;
        varying vec3 vN, vV, vW;
        void main() {
          float k = vY / uH;
          float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
          // falling rain catching the light: faint streaks drifting down the cone
          float streak = 0.75 + 0.25 * sin(vW.x * 40.0 + vW.z * 37.0 + (vW.y + uTime * 9.0) * 3.0);
          float a = facing * pow(1.0 - k, 1.4) * 0.22 * streak;
          gl_FragColor = vec4(uColor * a, 1.0);
        }`,
    })
  )
  cone.position.set(1.1, height - 0.15, 0)
  g.add(cone)
  return g
}

/* ---------------- buildings ---------------- */

export interface BlockSpec {
  x: number
  z: number
  w: number
  d: number
  h: number
  rot?: number
  lit?: number
  warm?: boolean
  color?: string
  /** glass curtain wall rather than concrete */
  glass?: boolean
}

/** A city block: a concrete or glass mass with lit windows, ledges every few floors and a rooftop rim */
export function block(s: BlockSpec) {
  const seed = Math.round(s.x * 11 + s.z * 7 + s.h * 3)
  const cols = Math.max(3, Math.round(s.w / 2.6))
  const rows = Math.max(4, Math.round(s.h / 3.4))
  const f = facade(seed, cols, rows, s.lit ?? 0.3, s.warm)
  const mat = s.glass
    ? new THREE.MeshPhysicalMaterial({ color: s.color ?? '#7d8fc0', metalness: 0.85, roughness: 0.06, map: f.map, emissive: '#ffffff', emissiveMap: f.emissive, emissiveIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.03 })
    : new THREE.MeshStandardMaterial({ color: s.color ?? '#3a3d4a', roughness: 0.55, metalness: 0.15, map: f.map, emissive: '#ffffff', emissiveMap: f.emissive, emissiveIntensity: 1.6 })
  const roof = new THREE.MeshStandardMaterial({ color: '#16171d', roughness: 0.35, metalness: 0.2 })
  const g = new THREE.Group()
  // box faces: +x, -x, +y (roof), -y, +z, -z
  const body = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), [mat, mat, roof, roof, mat, mat])
  body.position.y = s.h / 2
  body.castShadow = body.receiveShadow = true
  g.add(body)
  // ledges: thin slabs every few floors catch the neon on their wet tops
  const ledge = new THREE.MeshStandardMaterial({ color: '#22242c', roughness: 0.25, metalness: 0.4 })
  const ledgeEvery = 6.8 + (Math.abs(seed) % 3) * 3.4
  for (let y = 6.8; y < s.h - 2; y += ledgeEvery) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(s.w + 0.4, 0.22, s.d + 0.4), ledge)
    l.position.y = y
    l.receiveShadow = true
    g.add(l)
  }
  const rim = new THREE.Mesh(new THREE.BoxGeometry(s.w + 0.3, 0.6, s.d + 0.3), ledge)
  rim.position.y = s.h + 0.3
  g.add(rim)
  g.position.set(s.x, 0, s.z)
  g.rotation.y = s.rot ?? 0
  return g
}

/* ---------------- traffic ---------------- */

/**
 * Cars reduced to their lights: pairs of headlights and tail lights
 * sliding along lanes. With motion blur and the wet street they read
 * as light trails. Call update(t) each frame.
 */
export function traffic(lanes: { from: THREE.Vector3; to: THREE.Vector3; cars: number; speed: number }[], seed: number) {
  const r = rng(seed)
  const group = new THREE.Group()
  const sprite = (color: string, k: number, size: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: new THREE.Color(color).multiplyScalar(k), blending: THREE.AdditiveBlending, depthWrite: false }))
    sp.scale.setScalar(size)
    return sp
  }
  const cars: { lane: (typeof lanes)[number]; phase: number; g: THREE.Group }[] = []
  for (const lane of lanes) {
    const dir = lane.to.clone().sub(lane.from).normalize()
    const side = new THREE.Vector3(-dir.z, 0, dir.x)
    for (let i = 0; i < lane.cars; i++) {
      const g = new THREE.Group()
      for (const sgn of [-1, 1]) {
        const h = sprite('#fff4e0', 12, 1.3)
        h.position.copy(side).multiplyScalar(sgn * 0.75).addScaledVector(dir, 2.1).setY(0.7)
        const t = sprite('#ff2a3a', 10, 1.1)
        t.position.copy(side).multiplyScalar(sgn * 0.75).addScaledVector(dir, -2.1).setY(0.8)
        g.add(h, t)
      }
      group.add(g)
      cars.push({ lane, phase: r(), g })
    }
  }
  return {
    group,
    update(t: number) {
      for (const c of cars) {
        const len = c.lane.from.distanceTo(c.lane.to)
        c.g.position.lerpVectors(c.lane.from, c.lane.to, (c.phase + (t * c.lane.speed) / len) % 1)
      }
    },
  }
}

/* ---------------- the wet street ---------------- */

/** A flat street of standing water: true reflections, rain-stippled */
export function wetStreet(normals: THREE.Texture, size: number, color: string, y = 0, distortion = 0.6) {
  const water = new Water(new THREE.PlaneGeometry(size, size), {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals: normals,
    sunDirection: new THREE.Vector3(0, 1, 0),
    sunColor: '#000000',
    waterColor: color,
    distortionScale: distortion,
    fog: true,
  })
  water.rotation.x = -Math.PI / 2
  water.position.y = y
  water.material.uniforms.size.value = 6
  // Water renders its mirror in its own onBeforeRender; keep that and advance the ripples first
  const reflect = water.onBeforeRender
  water.onBeforeRender = (...args) => {
    water.material.uniforms.time.value = clock.uTime.value * 0.9
    reflect.apply(water, args)
  }
  return water
}

/** Painted street markings that sit just above the water */
export function markings(stripes: { x: number; z: number; w: number; d: number; rot?: number }[]) {
  const mat = new THREE.MeshStandardMaterial({ color: '#d9dce6', roughness: 0.3, metalness: 0, transparent: true, opacity: 0.75 })
  const g = new THREE.Group()
  for (const s of stripes) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.d).rotateX(-Math.PI / 2), mat)
    m.position.set(s.x, 0.012, s.z)
    m.rotation.y = s.rot ?? 0
    m.receiveShadow = true
    g.add(m)
  }
  return g
}
