/* ------------------------------------------------------------------
   BLUE HOUR — the shot list
   Five 3D sets where the built world and the grown world trade
   places. Each builds its own scene, lighting and camera move.
------------------------------------------------------------------- */

import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import {
  FLOWERS,
  clock,
  cloudField,
  cumulus,
  flowers,
  glowSprite,
  grass,
  puffBox,
  skyDome,
  terrain,
  tower,
  type CloudLook,
  type Height,
  type Puff,
  type SkySpec,
  type TowerSpec,
} from './kit'
import { rng, waterNormals } from './textures'

export interface Shot {
  title: string
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  exposure: number
  lens: number
  update(t: number, p: number): void
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)))

function stage(renderer: THREE.WebGLRenderer, sky: SkySpec, fog: [string, number, number], env: (s: THREE.Scene) => void = () => {}) {
  const scene = new THREE.Scene()
  scene.add(skyDome(sky))
  scene.fog = new THREE.Fog(fog[0], fog[1], fog[2])
  // reflections: the glass towers mirror this sky and its clouds
  const envScene = new THREE.Scene()
  envScene.add(skyDome(sky))
  env(envScene)
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(envScene, 0.015, 0.1, 5000).texture
  pm.dispose()
  return scene
}

function lights(scene: THREE.Scene, sky: string, ground: string, hemi: number, sun: string, sunI: number, dir: THREE.Vector3) {
  scene.add(new THREE.HemisphereLight(sky, ground, hemi))
  const d = new THREE.DirectionalLight(sun, sunI)
  d.position.copy(dir).normalize().multiplyScalar(100)
  scene.add(d)
}

function camera(fov: number) {
  return new THREE.PerspectiveCamera(fov, 1, 0.05, 6000)
}

function aim(cam: THREE.PerspectiveCamera, pos: THREE.Vector3, look: THREE.Vector3, roll = 0) {
  cam.position.copy(pos)
  cam.up.set(0, 1, 0)
  cam.lookAt(look)
  cam.rotateZ(roll)
}

function towers(scene: THREE.Scene, specs: TowerSpec[], glowStrength = 1.4) {
  for (const s of specs) scene.add(tower(s, glowStrength))
}

/* ------------------------------------------------------------------ */

function tidalMeadow(renderer: THREE.WebGLRenderer): Shot {
  const sun = V(0.35, 0.16, -1)
  const sky: SkySpec = { zenith: '#0a1a9e', mid: '#2449ee', horizon: '#a7b8ff', below: '#20306a', sun, sunColor: '#fff1e0', haze: 0.8 }
  const look: CloudLook = { light: '#ffffff', shade: '#8494da', fog: '#a7b8ff', fogNear: 250, fogFar: 1100, drift: V(2.5, 0, 0) }
  const eye = V(0, 0.5, 4)
  const wave = cumulus(12, V(-120, -4, -190), 190, 95, 260, 18, 46)
  const surf = puffBox(13, 140, V(-90, -2, -140), V(-15, 10, -70), 7, 18)
  const high = puffBox(14, 110, V(-600, 110, -900), V(600, 190, -450), 40, 90)
  const scene = stage(renderer, sky, ['#9aaeff', 80, 900], (env) => {
    env.add(cloudField([...wave], look, V(0, 30, -150), 2), cloudField([...high], look, V(0, 30, -150), 3))
  })
  lights(scene, '#c2ceff', '#1d3a14', 1.5, '#fff2e0', 2.4, sun)

  const H: Height = (x, z) => 0.22 * Math.sin(x * 0.08) * Math.cos(z * 0.06) + 0.12 * Math.sin(x * 0.21 + z * 0.13)
  scene.add(terrain(H, 700, 220, '#2b5a20', new THREE.Vector2(0, -200)))
  scene.add(grass(15, { n: 70000, x: [-20, 20], z: [-48, 3.6] }, H, [0.12, 0.36], ['#16340f', '#86c653'], 0.1))
  scene.add(
    flowers(16, FLOWERS.cosmos, { n: 7000, x: [-12, 12], z: [-26, 2.6], keep: (x, z) => Math.min(1, 0.25 + (z + 26) / 22) * (Math.abs(x) < 9 ? 1 : 0.5) }, H, [0.065, 0.11], [0.2, 0.42], ['#ff6fae', '#ff9cc7', '#ffffff', '#ffd6e8', '#e0529a', '#ffffff'], eye, 0.06)
  )
  towers(scene, [
    { x: -34, z: -170, w: 24, d: 24, h: 125, rot: 0.3 },
    { x: 8, z: -200, w: 30, d: 26, h: 175, rot: -0.2 },
    { x: 46, z: -160, w: 20, d: 22, h: 95, rot: 0.6 },
    { x: 82, z: -240, w: 28, d: 28, h: 150, round: true },
    { x: -80, z: -250, w: 22, d: 20, h: 85, rot: 0.1 },
  ])
  scene.add(cloudField(wave, look, eye, 4), cloudField(surf, { ...look, drift: V(4, 0, 0) }, eye, 5), cloudField(high, look, eye, 6))

  const cam = camera(76)
  return {
    title: 'Tidal meadow',
    scene,
    camera: cam,
    exposure: 1,
    lens: 0.45,
    update(_t, p) {
      const e = ease(p)
      aim(cam, V(-0.7, 0.4, 5).lerp(V(0.4, 0.55, 2.4), e), V(4, 12, -100).lerp(V(0, 24, -100), e), THREE.MathUtils.lerp(-0.08, 0.03, e))
    },
  }
}

/* ------------------------------------------------------------------ */

function cloudSea(renderer: THREE.WebGLRenderer): Shot {
  const sun = V(-0.6, 0.07, -1)
  const sky: SkySpec = { zenith: '#020619', mid: '#0d1f86', horizon: '#9a86e6', below: '#3a2f7a', sun, sunColor: '#ffd0e8', haze: 1, stars: 0.6 }
  const look: CloudLook = { light: '#ffe2f2', shade: '#4a3d98', fog: '#7c6ed4', fogNear: 200, fogFar: 1300, drift: V(3, 0, 0) }
  const eye = V(0, 30, 0)
  const sea = puffBox(21, 1500, V(-800, -14, -1000), V(800, 10, 250), 26, 62)
  const scene = stage(renderer, sky, ['#6d62c0', 200, 1400], (env) => env.add(cloudField([...sea], look, eye, 1)))
  lights(scene, '#8a8cff', '#2a1f5a', 1.1, '#ffc6e0', 1.8, sun)

  const main = tower({ x: 0, z: -150, w: 24, d: 24, h: 250, y: -40, round: true, lit: 0.12, warm: true }, 1.5)
  main.rotation.z = 0.14
  scene.add(main)
  towers(scene, [
    { x: -100, z: -280, w: 28, d: 28, h: 220, y: -40, lit: 0.2, rot: 0.4 },
    { x: 90, z: -340, w: 30, d: 24, h: 180, y: -40, lit: 0.25, rot: -0.3 },
    { x: -30, z: -470, w: 24, d: 24, h: 150, y: -40, lit: 0.3 },
    { x: 180, z: -520, w: 26, d: 26, h: 210, y: -40, lit: 0.2 },
  ])
  scene.add(cloudField(sea, look, eye, 2))

  // the vortex overhead: a spiral arm of cloud that slowly turns
  const vortex = new THREE.Group()
  vortex.position.set(-20, 200, -260)
  const r = rng(22)
  const arm: Puff[] = []
  for (let i = 0; i < 380; i++) {
    const a = i * 0.075
    const rad = 6 + i * 0.5
    arm.push({ p: V(Math.cos(a) * rad + (r() - 0.5) * 10, (r() - 0.5) * 6 - i * 0.03, Math.sin(a) * rad + (r() - 0.5) * 10), s: 10 + r() * 16 })
  }
  vortex.add(cloudField(arm, { light: '#f0eeff', shade: '#3d4596', fog: '#6d62c0', fogNear: 300, fogFar: 1500, opacity: 0.85 }, V(0, -190, 260), 3))
  scene.add(vortex)
  scene.add(glowSprite('#ffd6ec', 160, sun.clone().normalize().multiplyScalar(1200), 0.6))

  const cam = camera(72)
  return {
    title: 'Tower in the cloud sea',
    scene,
    camera: cam,
    exposure: 1.05,
    lens: 0.55,
    update(t, p) {
      const e = ease(p)
      vortex.rotation.y = t * 0.12
      const a = THREE.MathUtils.lerp(-0.35, 0.12, e)
      const pos = V(Math.sin(a) * 160, THREE.MathUtils.lerp(26, 40, e), -150 + Math.cos(a) * 160)
      aim(cam, pos, V(0, THREE.MathUtils.lerp(95, 120, e), -170), THREE.MathUtils.lerp(0.12, -0.08, e))
    },
  }
}

/* ------------------------------------------------------------------ */

function mirrorLake(renderer: THREE.WebGLRenderer): Shot {
  const moon = V(-0.22, 0.14, -1)
  const sky: SkySpec = { zenith: '#01020c', mid: '#08145a', horizon: '#2b46cc', below: '#050a2a', sun: moon, sunColor: '#dfe6ff', sunSize: 0.9993, haze: 0.9, stars: 1 }
  const scene = stage(renderer, sky, ['#1a2a8a', 150, 1100])
  lights(scene, '#4a62ff', '#0a1a10', 0.8, '#cfd8ff', 1.2, moon)
  // a flash from beside the camera lights the moss, like the reference footage
  const flash = new THREE.PointLight('#c8ffd0', 60, 40, 1.6)
  flash.position.set(-3, 4, 9)
  scene.add(flash)

  const water = new Water(new THREE.PlaneGeometry(4000, 4000), {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals(),
    sunDirection: moon.clone().normalize(),
    sunColor: '#e6ecff',
    waterColor: '#04103a',
    distortionScale: 1.6,
    fog: true,
  })
  water.rotation.x = -Math.PI / 2
  water.material.uniforms.size.value = 3
  scene.add(water)

  const shore = new THREE.Mesh(new THREE.BoxGeometry(2400, 3, 260), new THREE.MeshLambertMaterial({ color: '#05081a' }))
  shore.position.set(0, -0.6, -330)
  scene.add(shore)
  towers(scene, [
    { x: -70, z: -215, w: 28, d: 28, h: 150, lit: 0.4, warm: true, rot: 0.2 },
    { x: -14, z: -250, w: 24, d: 30, h: 215, lit: 0.35 },
    { x: 38, z: -220, w: 30, d: 30, h: 125, lit: 0.45, round: true },
    { x: 96, z: -270, w: 26, d: 26, h: 185, lit: 0.3, warm: true, rot: -0.3 },
    { x: -130, z: -290, w: 22, d: 22, h: 110, lit: 0.4 },
    { x: 160, z: -320, w: 30, d: 26, h: 140, lit: 0.35 },
  ], 1.5)
  scene.add(glowSprite('#dfe6ff', 45, moon.clone().normalize().multiplyScalar(1200), 0.5))

  const H: Height = (x, z) => 3.6 * Math.exp(-((x + 13) ** 2 / 95 + (z - 2) ** 2 / 210)) - 0.7
  scene.add(terrain(H, 70, 140, '#175a17', new THREE.Vector2(-12, 0)))
  scene.add(grass(31, { n: 34000, x: [-40, 2], z: [-28, 26], keep: (x, z) => (H(x, z) > 0.02 ? 1 : 0) }, H, [0.07, 0.22], ['#0d3a0e', '#9cf06a'], 0.04))

  const cam = camera(74)
  return {
    title: 'Mirror lake',
    scene,
    camera: cam,
    exposure: 1.1,
    lens: 0.5,
    update(t, p) {
      const e = ease(p)
      water.material.uniforms.time.value = t * 0.5
      aim(cam, V(4, 1.5, 13).lerp(V(1, 1.0, 7.5), e), V(-10, 30, -220).lerp(V(8, 36, -220), e), THREE.MathUtils.lerp(-0.14, -0.06, e))
    },
  }
}

/* ------------------------------------------------------------------ */

function nemophilaHill(renderer: THREE.WebGLRenderer): Shot {
  const sun = V(0.3, 0.05, -1)
  const sky: SkySpec = { zenith: '#030a3a', mid: '#1636d8', horizon: '#9aa8ff', below: '#303f9a', sun, sunColor: '#ffe6f2', haze: 0.45, stars: 0.3 }
  const look: CloudLook = { light: '#f6ecff', shade: '#5656b4', fog: '#8c9cff', fogNear: 120, fogFar: 1200, drift: V(2, 0, 0) }
  const eye = V(0, 3, 5)
  const sea = puffBox(41, 1500, V(-900, -70, -1100), V(900, -40, 120), 26, 58)
  const scene = stage(renderer, sky, ['#8594f2', 150, 1200], (env) => env.add(cloudField([...sea], look, V(0, 0, -200), 1)))
  lights(scene, '#a2b2ff', '#101a40', 1.1, '#ffe6f2', 1.3, sun)

  const H: Height = (x, z) => 3 - (x * x + (z - 2) * (z - 2)) / 90
  scene.add(terrain(H, 90, 160, '#0a1812'))
  scene.add(grass(42, { n: 16000, x: [-15, 15], z: [-20, 9] }, H, [0.06, 0.2], ['#07130b', '#2d5c2a'], 0.05))
  scene.add(flowers(43, FLOWERS.nemophila, { n: 5200, x: [-15, 15], z: [-20, 8.5] }, H, [0.055, 0.09], [0.06, 0.2], ['#ffffff', '#e2e9ff', '#c7d4ff'], eye, 0.03))

  towers(scene, [
    { x: -55, z: -230, w: 24, d: 24, h: 200, y: -70, frame: '#eef2ff', tint: '#7b90dc' },
    { x: 18, z: -270, w: 28, d: 24, h: 240, y: -70, frame: '#eef2ff', tint: '#7b90dc', rot: 0.25 },
  ])
  const r = rng(44)
  const far: TowerSpec[] = []
  for (let i = 0; i < 16; i++) far.push({ x: -300 + r() * 600, z: -480 - r() * 260, w: 10 + r() * 8, d: 10 + r() * 8, h: 40 + r() * 70, y: -60, lit: 0.5, warm: true })
  towers(scene, far, 1.8)
  scene.add(cloudField(sea, look, eye, 2))

  const cam = camera(74)
  return {
    title: 'Nemophila hill',
    scene,
    camera: cam,
    exposure: 1,
    lens: 0.6,
    update(_t, p) {
      const e = ease(p)
      const y = H(0, 5.5) + THREE.MathUtils.lerp(0.28, 1.5, e)
      aim(cam, V(0, y, THREE.MathUtils.lerp(6, 5, e)), V(-8, THREE.MathUtils.lerp(4, 26, e), -230))
    },
  }
}

/* ------------------------------------------------------------------ */

function island(renderer: THREE.WebGLRenderer): Shot {
  const moon = V(0.45, 0.28, -1)
  const sky: SkySpec = { zenith: '#01020b', mid: '#0a1a70', horizon: '#4b5fe0', below: '#0a1030', sun: moon, sunColor: '#eef2ff', sunSize: 0.9994, haze: 0.7, stars: 1 }
  const look: CloudLook = { light: '#dfe4ff', shade: '#27307c', fog: '#3a4ab8', fogNear: 200, fogFar: 1400, drift: V(2, 0, 1) }
  const sea = puffBox(51, 1700, V(-1000, -34, -1000), V(1000, -6, 1000), 30, 72)
  const scene = stage(renderer, sky, ['#3a4ab8', 220, 1500], (env) => env.add(cloudField([...sea], look, V(0, 40, 0), 1)))
  lights(scene, '#5870ff', '#0b1a12', 1, '#dfe6ff', 1.6, moon)

  const H: Height = (x, z) => {
    const r = Math.hypot(x, z)
    return r < 36 ? 24 - (r * r) / 220 + 0.4 * Math.sin(x * 0.3) * Math.cos(z * 0.25) : Math.max(8, 24 - (36 * 36) / 220 - (r - 36) * 3)
  }
  scene.add(terrain(H, 80, 180, '#1d5a1c', new THREE.Vector2(), { color: '#1a1a26', below: 17.5 }))
  const rockGeo = new THREE.ConeGeometry(41, 60, 48, 8)
  const rp = rockGeo.getAttribute('position') as THREE.BufferAttribute
  const rr = rng(53)
  for (let i = 0; i < rp.count; i++) {
    const k = 1 + (rr() - 0.5) * 0.18
    rp.setXYZ(i, rp.getX(i) * k, rp.getY(i), rp.getZ(i) * k)
  }
  rockGeo.computeVertexNormals()
  const rock = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({ color: '#1a1a26' }))
  rock.rotation.x = Math.PI
  rock.position.y = 9 - 30
  scene.add(rock)
  scene.add(grass(52, { n: 36000, x: [-36, 36], z: [-36, 36], keep: (x, z) => (Math.hypot(x, z) < 35 ? 1 : 0) }, H, [0.4, 1.1], ['#0f3a10', '#7ad34a'], 0.2))
  towers(scene, [
    { x: -6, z: -4, w: 10, d: 10, h: 72, y: H(-6, -4) - 1, lit: 0.4 },
    { x: 11, z: 7, w: 12, d: 12, h: 96, y: H(11, 7) - 1, lit: 0.35, rot: 0.4 },
    { x: 19, z: -13, w: 8, d: 8, h: 50, y: H(19, -13) - 1, lit: 0.5, warm: true },
    { x: -19, z: 12, w: 9, d: 9, h: 42, y: H(-19, 12) - 1, lit: 0.4, round: true },
  ], 1.5)
  scene.add(cloudField(sea, look, V(90, 45, 60), 2))
  scene.add(glowSprite('#eef2ff', 90, moon.clone().normalize().multiplyScalar(1200), 0.8))

  const cam = camera(66)
  return {
    title: 'The island',
    scene,
    camera: cam,
    exposure: 1.1,
    lens: 0.5,
    update(_t, p) {
      const e = ease(p)
      const a = THREE.MathUtils.lerp(0.55, 1.05, e)
      aim(cam, V(Math.sin(a) * 170, THREE.MathUtils.lerp(58, 44, e), Math.cos(a) * 170), V(0, 40, 0), THREE.MathUtils.lerp(0.06, -0.04, e))
    },
  }
}

export function buildShots(renderer: THREE.WebGLRenderer): Shot[] {
  return [tidalMeadow, cloudSea, mirrorLake, nemophilaHill, island].map((f) => f(renderer))
}

export { clock }
