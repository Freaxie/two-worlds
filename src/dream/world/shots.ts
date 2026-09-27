/* ------------------------------------------------------------------
   BLUE HOUR — the shot list
   Six sets where the built world and the grown world trade places,
   one per bar of the score. Each is lit by a photographic sky, keyed
   by a shadow-casting sun or moon lined up with that sky, and carries
   its own lens settings: focus pulls, aperture, shafts and grade.
------------------------------------------------------------------- */

import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { skyDirection, type Assets } from '../assets'
import type { Look } from '../post'
import {
  cityLights,
  cloudField,
  cumulus,
  glassFish,
  glowSprite,
  grass,
  haze,
  nightSky,
  oxalis,
  pollen,
  puffBox,
  terrain,
  tower,
  type CloudLook,
  type Height,
  type TowerSpec,
} from './kit'
import { rng } from './textures'

export interface Shot {
  title: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  exposure: number
  look: Look
  update(t: number, p: number): void
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * THREE.MathUtils.clamp(t, 0, 1))
const lerp = THREE.MathUtils.lerp
/** a slow, breathing hand on the camera */
const hand = (t: number, k: number) => V(Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3) * 0.25, Math.sin(t * 1.3 + 1) * 0.5, 0).multiplyScalar(k)

const LOOK: Look = {
  focus: 10,
  aperture: 1,
  maxBlur: 12,
  motion: 0.5,
  lens: 0.26,
  shafts: 0,
  shaftTint: '#ffe0c0',
  bloom: 0.3,
  bloomThreshold: 1.6,
  grain: 0.05,
  saturation: 1.05,
  shadowTint: '#1a2c8f',
  highlightTint: '#ffd9e8',
}

/** Where the sun sits in each photograph (u across, v down) */
const SUN = {
  sunrise: [0.585, 0.43],
  dawn: [0.055, 0.454],
  clear: [0.6, 0.444],
} as const

/** Rotation that swings a sky point at `u` round to the compass angle `want` (radians, 0 = +x, -π/2 = straight ahead) */
function swing(u: number, want: number) {
  return (u - 0.5) * Math.PI * 2 - want
}

function stage(sky: THREE.Texture, rotY: number, bg: number, env: number, fog: THREE.Fog | THREE.FogExp2) {
  const scene = new THREE.Scene()
  scene.background = sky
  scene.environment = sky
  scene.backgroundRotation.set(0, rotY, 0)
  scene.environmentRotation.set(0, rotY, 0)
  scene.backgroundIntensity = bg
  scene.environmentIntensity = env
  scene.fog = fog
  return scene
}

function keyLight(scene: THREE.Scene, dir: THREE.Vector3, color: string, intensity: number, focus: THREE.Vector3, span: number) {
  const l = new THREE.DirectionalLight(color, intensity)
  l.position.copy(focus).addScaledVector(dir.clone().normalize(), 300)
  l.target.position.copy(focus)
  l.castShadow = true
  l.shadow.mapSize.set(2048, 2048)
  const c = l.shadow.camera
  c.left = c.bottom = -span
  c.right = c.top = span
  c.near = 10
  c.far = 700
  l.shadow.bias = -0.0004
  l.shadow.normalBias = 0.03
  scene.add(l, l.target)
  return l
}

/** a flat, fog-coloured floor under a cloud sea, so the photo's ground never shows through */
function underCloud(scene: THREE.Scene, y: number, color: string) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshBasicMaterial({ color, fog: true }))
  m.rotation.x = -Math.PI / 2
  m.position.y = y
  scene.add(m)
}

function camera(fov: number) {
  return new THREE.PerspectiveCamera(fov, 1, 0.05, 6000)
}

function aim(cam: THREE.PerspectiveCamera, pos: THREE.Vector3, look: THREE.Vector3, roll = 0) {
  cam.position.copy(pos)
  cam.up.set(0, 1, 0)
  cam.lookAt(look)
  cam.rotateZ(roll)
  cam.updateMatrixWorld()
}

function towers(scene: THREE.Scene, specs: TowerSpec[], glowStrength = 1.4) {
  for (const s of specs) scene.add(tower(s, glowStrength))
}

/* ------------------------------------------------------------------ */

function firstLight(a: Assets): Shot {
  const rot = swing(SUN.sunrise[0], -1.35)
  const sunDir = skyDirection(SUN.sunrise[0], SUN.sunrise[1], rot)
  const scene = stage(a.sky.sunrise, rot, 0.55, 0.8, new THREE.FogExp2('#c7b3cf', 0.0028))
  scene.add(haze('#d4c0d6', 0.08, -0.03, 0.85))
  keyLight(scene, sunDir, '#ffd3a6', 3.2, V(0, 0, -3), 10)

  const H: Height = (x, z) => 0.2 * Math.sin(x * 0.08) * Math.cos(z * 0.06) + 0.1 * Math.sin(x * 0.21 + z * 0.13)
  scene.add(terrain(H, 900, 220, a.grass, '#b9cf8e', 180, new THREE.Vector2(0, -300)))
  scene.add(grass(11, { n: 60000, x: [-14, 14], z: [-42, 4] }, H, [0.07, 0.2], ['#1c3512', '#c4dc86'], 0.07))
  const eye = V(0, 0.5, 4)
  scene.add(oxalis(a.oxalis, 12, { n: 3600, x: [-8, 8], z: [-24, 3.7], keep: (x, z) => THREE.MathUtils.clamp(0.15 + (z + 24) / 20, 0, 1) * (Math.abs(x) < 5 ? 1 : 0.5) }, H, [2.2, 3.4], eye))
  towers(scene, [
    { x: -36, z: -170, w: 24, d: 24, h: 125, rot: 0.3 },
    { x: 6, z: -205, w: 30, d: 26, h: 180, rot: -0.2 },
    { x: 48, z: -160, w: 20, d: 22, h: 95, rot: 0.6 },
    { x: 86, z: -245, w: 28, d: 28, h: 150, round: true },
  ])
  const bank: CloudLook = { light: '#ffe6dc', shade: '#9b8fc4', fog: '#c7b3cf', fogNear: 250, fogFar: 1200, drift: V(1.5, 0, 0) }
  scene.add(cloudField(a.cloud, cumulus(13, V(-190, -10, -330), 260, 110, 90, 40, 80), bank, eye, 1))
  scene.add(pollen(14, 500, V(-5, 0.15, -7), V(5, 2.2, 4.2), '#ffe2b8'))

  const cam = camera(62)
  const sun = sunDir.clone().multiplyScalar(2000)
  const look: Look = { ...LOOK, aperture: 1.6, maxBlur: 16, shafts: 0.3, shaftTint: '#ffd8b0', bloom: 0.28, bloomThreshold: 3, sun, saturation: 1.08 }
  return {
    title: 'First light',
    scene,
    camera: cam,
    exposure: 0.8,
    look,
    update(t, p) {
      const e = ease(p)
      aim(cam, V(-0.35, 0.3, 4.6).lerp(V(0.25, 0.52, 2.5), e).add(hand(t, 0.012)), V(1, 2.5, -60).lerp(V(0, 12, -100), e), lerp(-0.05, 0.02, e))
      // rack focus from the flowers to the towers
      look.focus = lerp(1.3, 150, ease((p - 0.35) / 0.4))
    },
  }
}

/* ------------------------------------------------------------------ */

function glassKoi(a: Assets): Shot {
  const rot = swing(0.123, -0.4)
  const scene = stage(a.sky.night, rot, 1.1, 0.6, new THREE.FogExp2('#0b1236', 0.0011))
  scene.add(haze('#141c4c', 0.06, -0.06, 0.8))
  const moonDir = V(-0.5, 0.45, -0.6)
  const key = new THREE.DirectionalLight('#9fb4ff', 1.2)
  key.position.copy(moonDir).multiplyScalar(50)
  scene.add(key)
  const rim = new THREE.PointLight('#7fd4ff', 18, 8, 2)
  rim.position.set(1.5, 1.2, -1.5)
  scene.add(rim)
  const warm = new THREE.PointLight('#ffb27a', 8, 8, 2)
  warm.position.set(-2, -1.2, 1)
  scene.add(warm)

  scene.add(cityLights(21, 14000, V(-900, -140, -1200), V(900, -60, -80), 3.2))
  const r = rng(22)
  const specs: TowerSpec[] = []
  for (let i = 0; i < 9; i++) specs.push({ x: -300 + r() * 600, z: -180 - r() * 420, w: 22 + r() * 14, d: 22 + r() * 14, h: 260 + r() * 140, y: -150, lit: 0.35, warm: r() < 0.5 })
  towers(scene, specs, 2)

  const fish = glassFish(a.fish)
  fish.scale.setScalar(2.4)
  scene.add(fish)
  scene.add(glowSprite('#4a6bff', 2.6, V(0, 0, -2.2), 0.25))

  const cam = camera(50)
  const look: Look = { ...LOOK, aperture: 2.2, maxBlur: 20, motion: 0.35, bloom: 0.6, bloomThreshold: 1.2, lens: 0.3, saturation: 1.12, highlightTint: '#dfe6ff' }
  const target = new THREE.Vector3()
  return {
    title: 'Glass koi',
    scene,
    camera: cam,
    exposure: 1.05,
    look,
    update(t, p) {
      const e = ease(p)
      fish.position.set(lerp(-1.4, 1.2, p), 0.05 + Math.sin(t * 1.1) * 0.08, -2.3 + Math.sin(t * 0.7) * 0.15)
      fish.rotation.set(Math.sin(t * 1.1) * 0.06, Math.PI / 2 + Math.sin(t * 0.8) * 0.12, Math.sin(t * 0.9) * 0.05)
      target.copy(fish.position)
      aim(cam, V(lerp(-0.3, 0.3, e), 0.25, 0.9).add(hand(t, 0.01)), target.clone().lerp(V(0, 0, -20), 0.08), lerp(0.04, -0.03, e))
      look.focus = cam.position.distanceTo(fish.position)
    },
  }
}

/* ------------------------------------------------------------------ */

function cloudSea(a: Assets): Shot {
  const rot = swing(SUN.dawn[0], -2.05)
  const sunDir = skyDirection(SUN.dawn[0], SUN.dawn[1], rot)
  const scene = stage(a.sky.dawn, rot, 0.85, 0.9, new THREE.Fog('#cdbfd8', 250, 1500))
  scene.add(haze('#cdbfd8', 0.05, -0.05, 0.9))
  keyLight(scene, sunDir, '#ffd9c2', 2.6, V(0, 60, -170), 140)
  underCloud(scene, -40, '#cdbfd8')

  const eye = V(0, 30, 0)
  const look: CloudLook = { light: '#fff3f2', shade: '#8f86c2', fog: '#cdbfd8', fogNear: 220, fogFar: 1500, drift: V(2.5, 0, 0.5) }
  scene.add(cloudField(a.cloud, puffBox(31, 1400, V(-900, -24, -1200), V(900, 8, 260), 45, 95), look, eye, 2))
  const main = tower({ x: 0, z: -170, w: 26, d: 26, h: 260, y: -40, round: true, lit: 0.08, warm: true }, 1.2)
  main.rotation.z = 0.12
  scene.add(main)
  towers(scene, [
    { x: -110, z: -300, w: 28, d: 28, h: 230, y: -40, rot: 0.4 },
    { x: 95, z: -360, w: 30, d: 24, h: 190, y: -40, rot: -0.3 },
    { x: -40, z: -520, w: 24, d: 24, h: 160, y: -40 },
    { x: 200, z: -560, w: 26, d: 26, h: 220, y: -40 },
  ])
  // a few near puffs that the camera passes through, for depth
  scene.add(cloudField(a.cloud, puffBox(32, 26, V(-160, 10, -110), V(160, 40, 40), 20, 40), { ...look, opacity: 0.8 }, eye, 3))

  const cam = camera(58)
  const sun = sunDir.clone().multiplyScalar(2000)
  const lk: Look = { ...LOOK, aperture: 0.7, maxBlur: 10, shafts: 0.35, shaftTint: '#ffe0d0', bloom: 0.3, bloomThreshold: 2.5, sun, highlightTint: '#ffe2ec' }
  return {
    title: 'Tower in the cloud sea',
    scene,
    camera: cam,
    exposure: 0.85,
    look: lk,
    update(t, p) {
      const e = ease(p)
      const ang = lerp(-0.42, 0.1, e)
      aim(cam, V(Math.sin(ang) * 170, lerp(22, 44, e), -170 + Math.cos(ang) * 170).add(hand(t, 0.6)), V(0, lerp(95, 125, e), -190), lerp(0.1, -0.06, e))
      lk.focus = cam.position.distanceTo(V(0, 100, -170))
    },
  }
}

/* ------------------------------------------------------------------ */

function mirrorLake(a: Assets): Shot {
  const rot = swing(0.123, -1.2)
  const scene = stage(a.sky.night, rot, 0.8, 0.7, new THREE.FogExp2('#101a4a', 0.0019))
  scene.add(haze('#18246a', 0.07, -0.02, 0.85))
  const moonDir = V(-0.35, 0.28, -1).normalize()
  keyLight(scene, moonDir, '#c9d4ff', 1.1, V(-10, 0, 4), 22)
  const flash = new THREE.PointLight('#d8ffd8', 40, 30, 1.7)
  flash.position.set(-2.5, 3.5, 9)
  scene.add(flash)
  scene.add(glowSprite('#e8eeff', 55, moonDir.clone().multiplyScalar(1500), 0.9))

  const water = new Water(new THREE.PlaneGeometry(5000, 5000), {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals: a.waterNormals,
    sunDirection: moonDir.clone(),
    sunColor: '#dfe6ff',
    waterColor: '#040b2c',
    distortionScale: 2.2,
    fog: true,
  })
  water.rotation.x = -Math.PI / 2
  water.material.uniforms.size.value = 2.6
  scene.add(water)
  const shore = new THREE.Mesh(new THREE.BoxGeometry(3000, 3, 300), new THREE.MeshStandardMaterial({ color: '#05081a', roughness: 1 }))
  shore.position.set(0, -0.8, -360)
  scene.add(shore)
  towers(scene, [
    { x: -70, z: -225, w: 28, d: 28, h: 150, lit: 0.4, warm: true, rot: 0.2 },
    { x: -14, z: -260, w: 24, d: 30, h: 215, lit: 0.35 },
    { x: 38, z: -230, w: 30, d: 30, h: 125, lit: 0.45, round: true },
    { x: 96, z: -280, w: 26, d: 26, h: 185, lit: 0.3, warm: true, rot: -0.3 },
    { x: -130, z: -300, w: 22, d: 22, h: 110, lit: 0.4 },
    { x: 160, z: -330, w: 30, d: 26, h: 140, lit: 0.35 },
  ], 1.8)
  const mist: CloudLook = { light: '#9eaee8', shade: '#27336e', fog: '#101a4a', fogNear: 60, fogFar: 600, opacity: 0.16, drift: V(1.2, 0, 0) }
  scene.add(cloudField(a.cloud, puffBox(41, 140, V(-260, -2, -240), V(260, 5, -25), 14, 34), mist, V(0, 1, 8), 4))

  const H: Height = (x, z) => 3.4 * Math.exp(-((x + 13) ** 2 / 95 + (z - 2) ** 2 / 210)) - 0.7
  scene.add(terrain(H, 70, 160, a.grass, '#6fc25a', 14, new THREE.Vector2(-12, 0)))
  scene.add(grass(42, { n: 42000, x: [-40, 2], z: [-28, 26], keep: (x, z) => (H(x, z) > 0.02 ? 1 : 0) }, H, [0.06, 0.2], ['#0e3a10', '#a6f06e'], 0.035))

  const cam = camera(64)
  const lk: Look = { ...LOOK, aperture: 1.1, maxBlur: 12, bloom: 0.5, bloomThreshold: 1.1, lens: 0.3, highlightTint: '#e2e8ff', saturation: 1.1 }
  return {
    title: 'Mirror lake',
    scene,
    camera: cam,
    exposure: 1.15,
    look: lk,
    update(t, p) {
      const e = ease(p)
      water.material.uniforms.time.value = t * 0.45
      aim(cam, V(4, 1.4, 13).lerp(V(1.2, 0.9, 7.2), e).add(hand(t, 0.02)), V(-12, 30, -230).lerp(V(8, 38, -230), e), lerp(-0.12, -0.05, e))
      lk.focus = 240
    },
  }
}

/* ------------------------------------------------------------------ */

function blueBloom(a: Assets): Shot {
  const rot = swing(SUN.clear[0], 0.9)
  const sunDir = skyDirection(SUN.clear[0], SUN.clear[1], rot)
  const scene = stage(a.sky.clear, rot, 0.7, 0.8, new THREE.Fog('#8ea3e8', 180, 1300))
  scene.add(haze('#8ea3e8', 0.06, -0.06, 0.95))
  keyLight(scene, sunDir, '#ffe4ee', 1.6, V(0, 2, 3), 9)
  underCloud(scene, -85, '#8ea3e8')

  const H: Height = (x, z) => 3 - (x * x + (z - 2) * (z - 2)) / 90
  scene.add(terrain(H, 90, 180, a.grass, '#4c6a78', 22))
  scene.add(grass(51, { n: 26000, x: [-15, 15], z: [-20, 9] }, H, [0.06, 0.2], ['#0a1a1c', '#4f7a7a'], 0.05))
  const eye = V(0, 3.5, 6)
  scene.add(oxalis(a.oxalis, 52, { n: 1600, x: [-14, 14], z: [-20, 8.2] }, H, [1.6, 2.6], eye, { tint: '#9db4ff', glow: '#3f63ff', glowStrength: 0.9 }, 0.04))

  const sea: CloudLook = { light: '#f7f2ff', shade: '#7c86cc', fog: '#8ea3e8', fogNear: 150, fogFar: 1300, drift: V(2, 0, 0) }
  scene.add(cloudField(a.cloud, puffBox(53, 1300, V(-1000, -80, -1200), V(1000, -50, 150), 40, 90), sea, V(0, 0, -200), 5))
  towers(scene, [
    { x: -55, z: -240, w: 24, d: 24, h: 210, y: -80, frame: '#eef2ff', tint: '#8aa0e0' },
    { x: 20, z: -280, w: 28, d: 24, h: 250, y: -80, frame: '#eef2ff', tint: '#8aa0e0', rot: 0.25 },
  ])
  const r = rng(54)
  const far: TowerSpec[] = []
  for (let i = 0; i < 16; i++) far.push({ x: -320 + r() * 640, z: -500 - r() * 280, w: 10 + r() * 8, d: 10 + r() * 8, h: 60 + r() * 70, y: -80, lit: 0.5, warm: true })
  towers(scene, far, 2)

  const cam = camera(60)
  const lk: Look = { ...LOOK, aperture: 1.7, maxBlur: 16, bloom: 0.5, bloomThreshold: 1.4, highlightTint: '#e6ecff', shadowTint: '#1a2aa0', saturation: 1.12 }
  return {
    title: 'Blue hour bloom',
    scene,
    camera: cam,
    exposure: 0.95,
    look: lk,
    update(t, p) {
      const e = ease(p)
      const y = H(0, 5.5) + lerp(0.22, 1.7, e)
      aim(cam, V(0.1, y, lerp(6.2, 5, e)).add(hand(t, 0.01)), V(-10, lerp(3, 28, e), -240))
      lk.focus = lerp(1.1, 250, ease((p - 0.3) / 0.45))
    },
  }
}

/* ------------------------------------------------------------------ */

function island(a: Assets): Shot {
  const rot = swing(0.123, 2.3)
  const scene = stage(a.sky.night, rot, 1.2, 0.6, new THREE.Fog('#141c52', 250, 1500))
  // the photographed tree line would show above the clouds here, so paint the sky instead
  scene.background = null
  scene.add(nightSky('#02041a', '#1c2a7a'))
  scene.add(haze('#141c52', 0.08, -0.04, 0.9))
  // moonlight bounced up off the cloud sea onto the underside of the rock
  scene.add(new THREE.HemisphereLight('#6d7fe0', '#aab6ff', 0.9))
  const moonDir = V(0.55, 0.35, -1).normalize()
  keyLight(scene, moonDir, '#d6dfff', 1.4, V(0, 20, 0), 45)
  underCloud(scene, -40, '#141c52')
  scene.add(glowSprite('#eef2ff', 70, moonDir.clone().multiplyScalar(1500), 0.85))

  const sea: CloudLook = { light: '#d9e0ff', shade: '#2a3486', fog: '#141c52', fogNear: 220, fogFar: 1500, drift: V(2, 0, 1) }
  scene.add(cloudField(a.cloud, puffBox(61, 1500, V(-1000, -34, -1000), V(1000, -4, 1000), 45, 100), sea, V(120, 45, 90), 6))

  const H: Height = (x, z) => {
    const r = Math.hypot(x, z)
    return r < 36 ? 24 - (r * r) / 220 + 0.4 * Math.sin(x * 0.3) * Math.cos(z * 0.25) : Math.max(8, 24 - (36 * 36) / 220 - (r - 36) * 3)
  }
  scene.add(terrain(H, 80, 200, a.grass, '#79b35a', 10, new THREE.Vector2(), { color: '#22232e', below: 17.5 }))
  const rockGeo = new THREE.ConeGeometry(41, 60, 64, 10)
  const rp = rockGeo.getAttribute('position') as THREE.BufferAttribute
  const rr = rng(62)
  for (let i = 0; i < rp.count; i++) {
    const k = 1 + (rr() - 0.5) * 0.16
    rp.setXYZ(i, rp.getX(i) * k, rp.getY(i), rp.getZ(i) * k)
  }
  rockGeo.computeVertexNormals()
  const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: '#4d4c5e', roughness: 0.9, flatShading: true }))
  rock.rotation.x = Math.PI
  rock.position.y = 9 - 30
  rock.receiveShadow = true
  scene.add(rock)
  scene.add(grass(63, { n: 50000, x: [-36, 36], z: [-36, 36], keep: (x, z) => (Math.hypot(x, z) < 35 ? 1 : 0) }, H, [0.4, 1.1], ['#0f3a10', '#8ee05a'], 0.2, 0.06))
  scene.add(oxalis(a.oxalis, 64, { n: 500, x: [-30, 30], z: [-30, 30], keep: (x, z) => (Math.hypot(x, z) < 30 ? 1 : 0) }, H, [5, 8], V(120, 40, 90)))
  towers(scene, [
    { x: -6, z: -4, w: 10, d: 10, h: 72, y: H(-6, -4) - 1, lit: 0.4 },
    { x: 11, z: 7, w: 12, d: 12, h: 96, y: H(11, 7) - 1, lit: 0.35, rot: 0.4 },
    { x: 19, z: -13, w: 8, d: 8, h: 50, y: H(19, -13) - 1, lit: 0.5, warm: true },
    { x: -19, z: 12, w: 9, d: 9, h: 42, y: H(-19, 12) - 1, lit: 0.4, round: true },
  ], 1.8)

  const cam = camera(50)
  const lk: Look = { ...LOOK, aperture: 0.6, maxBlur: 10, bloom: 0.5, bloomThreshold: 1.1, highlightTint: '#e6ebff', saturation: 1.08 }
  return {
    title: 'The island',
    scene,
    camera: cam,
    exposure: 1.1,
    look: lk,
    update(t, p) {
      const e = ease(p)
      const ang = lerp(0.55, 1.0, e)
      aim(cam, V(Math.sin(ang) * lerp(190, 165, e), lerp(60, 46, e), Math.cos(ang) * lerp(190, 165, e)).add(hand(t, 0.5)), V(0, 40, 0), lerp(0.05, -0.03, e))
      lk.focus = cam.position.distanceTo(V(0, 40, 0))
    },
  }
}

export function buildShots(a: Assets): Shot[] {
  return [firstLight, glassKoi, cloudSea, mirrorLake, blueBloom, island].map((f) => f(a))
}
