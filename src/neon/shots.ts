/* ------------------------------------------------------------------
   NEON RAIN — the shot list
   A rain-soaked street at night where the built world glows and the
   grown world still finds a way: a glass koi swims through the
   downpour, oxalis flowers drink the rain on a rooftop. Six shots
   composed for a tall 9:16 frame, one per bar of the score.
------------------------------------------------------------------- */

import * as THREE from 'three'
import type { Assets } from '../dream/assets'
import type { Look } from '../dream/post'
import type { Reel, Shot } from '../dream/projector'
import { V, aim, camera, ease, hand, lerp } from '../dream/world/camera'
import { cityLights, cloudField, glassFish, glowSprite, grass, haze, nightSky, oxalis, puffBox, type Height } from '../dream/world/kit'
import { rng } from '../dream/world/textures'
import { block, lamp, markings, neonSign, rain, splashes, traffic, wetStreet, type BlockSpec } from './city'

const SPEC = {
  skies: { night: 'moonless_golf_2k.hdr.jpg' },
  models: { oxalis: 'oxalis.glb', fish: 'barramundi.glb' },
  textures: {
    grass: { file: 'grass.jpg', srgb: true, repeat: true },
    cloud: { file: 'cloud.webp', srgb: true },
    waterNormals: { file: 'waternormals.jpg', repeat: true },
  },
  score: 'neon-score.mp3',
}
type A = Assets<keyof typeof SPEC.skies, keyof typeof SPEC.models, keyof typeof SPEC.textures>

/** Monoton, self-hosted, starts loading with the page so the title card can use it too */
const monoton = new FontFace('Monoton', "url('dream-assets/fonts/Monoton.woff2')").load().then((f) => {
  document.fonts.add(f)
})

const NEON = { magenta: '#ff2bd6', cyan: '#19e6ff', red: '#ff3b4a', amber: '#ffc23b', green: '#6cff8a', violet: '#9d6bff' }

const LOOK: Look = {
  focus: 20,
  aperture: 1.2,
  maxBlur: 16,
  motion: 0.6,
  lens: 0.16,
  shafts: 0,
  shaftTint: '#ffffff',
  bloom: 0.62,
  bloomThreshold: 1.0,
  grain: 0.065,
  saturation: 1.14,
  shadowTint: '#0f3552',
  highlightTint: '#ffa3dc',
}

/** the night: a dim photographic sky for reflections, a painted overcast above, rain-thick air */
function night(a: A, fogDensity: number) {
  const scene = new THREE.Scene()
  scene.environment = a.sky.night
  scene.environmentIntensity = 0.35
  scene.environmentRotation.set(0, 1.2, 0)
  scene.fog = new THREE.FogExp2('#1b1233', fogDensity)
  scene.add(nightSky('#05030f', '#2b1846', 0))
  scene.add(haze('#22163d', 0.12, -0.05, 0.9))
  scene.add(new THREE.HemisphereLight('#5a4a9a', '#100818', 0.5))
  return scene
}

/* ------------------------------------------------------------------
   The street: one set shared by five shots. It runs along -z, with a
   cross street at z = -40, signs on both sides and a banner overhead.
------------------------------------------------------------------- */

function street(a: A) {
  const scene = night(a, 0.016)
  scene.add(wetStreet(a.tex.waterNormals, 700, '#07060d'))

  // overcast lit from below by the city
  const glowCloud = { light: '#ff7ac4', shade: '#140c26', fog: '#1b1233', fogNear: 60, fogFar: 260, opacity: 0.75, drift: V(0.6, 0, -0.3) }
  scene.add(cloudField(a.tex.cloud, puffBox(71, 160, V(-80, 70, -220), V(80, 110, 40), 30, 60), glowCloud, V(0, 2, 0), 7))

  // pavements, kerbs slick with rain
  const kerb = new THREE.MeshStandardMaterial({ color: '#1a1b23', roughness: 0.18, metalness: 0.05 })
  for (const sx of [-1, 1]) {
    for (const [z0, z1] of [[30, -30], [-50, -300]]) {
      const len = z0 - z1
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, len), kerb)
      p.position.set(sx * 7.1, 0.08, (z0 + z1) / 2)
      p.receiveShadow = true
      scene.add(p)
    }
  }

  // buildings down both sides, with a gap for the cross street
  const r = rng(72)
  const blocks: BlockSpec[] = []
  for (const sx of [-1, 1]) {
    let z = 32
    while (z > -300) {
      const w = 9 + r() * 10
      const cz = z - w / 2
      if (cz < -28 && cz > -52) {
        z = -52
        continue
      }
      const d = 12 + r() * 8
      blocks.push({ x: sx * (8.2 + d / 2), z: cz, w: d, d: w - 0.6, h: 14 + r() * 46 + (z < -60 ? r() * 40 : 0), lit: 0.18 + r() * 0.3, warm: r() < 0.6, glass: r() < 0.25 })
      z -= w
    }
  }
  // the cross street's frontages
  for (const sz of [-1, 1]) {
    for (let x = -60; x < 60; x += 14) {
      if (Math.abs(x) < 10) continue
      blocks.push({ x, z: -40 + sz * 18, w: 13, d: 14, h: 18 + r() * 40, lit: 0.25, warm: r() < 0.5 })
    }
  }
  for (const b of blocks) scene.add(block(b))

  // signs: vertical blades hung off the façades, flat signs above the shopfronts
  const signs: [string, string, number, number, number, boolean, boolean?][] = [
    // text, colour, x, y, z, vertical, casts light
    ['HOTEL', NEON.cyan, -7.4, 9, 8, true, true],
    ['RAMEN', NEON.red, 7.4, 5.5, 4, false],
    ['BAR', NEON.magenta, 7.4, 8, -6, true, true],
    ['OPEN', NEON.green, -7.6, 3.2, -4, false],
    ['JAZZ', NEON.violet, -7.4, 12, -16, true],
    ['24H', NEON.amber, 7.6, 3.4, -18, false],
    ['KARAOKE', NEON.magenta, -7.6, 6, -24, false],
    ['RAIN', NEON.cyan, 7.4, 13, -26, true, true],
    ['NOODLE', NEON.amber, -7.6, 4, 16, false],
    ['CAFE', NEON.red, 7.4, 10, 18, true],
    ['LOVE', NEON.magenta, -7.4, 15, -64, true],
    ['DREAM', NEON.cyan, 7.4, 11, -78, true],
    ['TAXI', NEON.amber, -7.6, 4, -70, false],
    ['NIGHT', NEON.violet, 7.6, 6, -96, false],
  ]
  for (const [text, color, x, y, z, vertical, light] of signs) {
    const s = neonSign({ text, color, height: vertical ? 4.2 : 1.4, vertical, light, flicker: text === 'OPEN' || text === 'NIGHT' ? 1 : 0 })
    s.position.set(x, y, z)
    // blades face down the street; flat signs face across it
    s.rotation.y = vertical ? 0 : x < 0 ? Math.PI / 2 : -Math.PI / 2
    if (vertical) s.position.x += x < 0 ? 1.6 : -1.6
    scene.add(s)
  }
  // the banner over the street, the title in the rain
  const banner = neonSign({ text: 'BLUE HOUR', color: NEON.magenta, height: 2.2, light: true, brightness: 3.6 })
  banner.position.set(0, 9.5, -14)
  scene.add(banner)
  const wire = new THREE.Mesh(new THREE.BoxGeometry(16, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.4 }))
  wire.position.set(0, 10.8, -14)
  scene.add(wire)

  for (const [x, z, c, sh] of [[-6.2, 10, '#ffd7a0', true], [6.2, -2, '#ffd7a0', false], [-6.2, -20, '#c8e6ff', false], [6.2, -60, '#ffd7a0', false]] as const) {
    const l = lamp(V(x, 0.16, z), c, 6.2, sh)
    if (x > 0) l.rotation.y = Math.PI
    scene.add(l)
  }

  const cars = traffic(
    [
      { from: V(-3, 0, -260), to: V(-3, 0, 40), cars: 4, speed: 11 },
      { from: V(3, 0, 40), to: V(3, 0, -260), cars: 3, speed: 9 },
      { from: V(-70, 0, -37), to: V(70, 0, -37), cars: 3, speed: 13 },
      { from: V(70, 0, -43), to: V(-70, 0, -43), cars: 3, speed: 12 },
    ],
    73
  )
  scene.add(cars.group)

  // zebra crossings at the junction
  const stripes = []
  for (let i = -5; i <= 5; i++) {
    stripes.push({ x: i * 1.1, z: -27, w: 0.55, d: 3.2 })
    stripes.push({ x: i * 1.1, z: -53, w: 0.55, d: 3.2 })
    stripes.push({ x: -9.5, z: -40 + i * 1.1, w: 3.2, d: 0.55 })
    stripes.push({ x: 9.5, z: -40 + i * 1.1, w: 3.2, d: 0.55 })
  }
  scene.add(markings(stripes))

  scene.add(rain(14000, V(14, 11, 16), 11, new THREE.Vector2(1.4, -0.4), '#d6dcff', 0.45))
  scene.add(splashes(900, V(0, 0, 6), 16, 0.0, '#cfd6ff'))

  // the koi lives here too; shots that don't feature it send it away
  const fish = glassFish(a.model.fish)
  fish.scale.setScalar(1.9)
  const rim = new THREE.PointLight(NEON.magenta, 10, 6, 2)
  fish.add(rim)
  rim.position.set(0.4, 0.3, 0.2)
  scene.add(fish)

  return { scene, fish, cars }
}

/* ------------------------------------------------------------------
   The rooftop garden, above the city in the same rain
------------------------------------------------------------------- */

function rooftop(a: A) {
  const scene = night(a, 0.006)
  // the roof itself is one shallow puddle
  scene.add(wetStreet(a.tex.waterNormals, 60, '#08070f', 0, 0.4))
  const slab = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 60), new THREE.MeshStandardMaterial({ color: '#15151c', roughness: 0.3 }))
  slab.position.set(0, -1.02, 20)
  scene.add(slab)

  // planters of oxalis and grass, wood dark with rain
  const wood = new THREE.MeshStandardMaterial({ color: '#3a2618', roughness: 0.4, metalness: 0 })
  const soil = new THREE.MeshStandardMaterial({ color: '#120d0a', roughness: 0.9 })
  const flat: Height = () => 0.42
  for (const [x, z, w, d] of [[-0.6, 0, 3.4, 1.1], [2.6, -1.6, 2.4, 1.0]] as const) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, d), wood)
    box.position.set(x, 0.225, z)
    box.castShadow = box.receiveShadow = true
    const top = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, d - 0.12).rotateX(-Math.PI / 2), soil)
    top.position.set(x, 0.43, z)
    scene.add(box, top)
    const area = { x: [x - w / 2 + 0.1, x + w / 2 - 0.1] as [number, number], z: [z - d / 2 + 0.1, z + d / 2 - 0.1] as [number, number] }
    scene.add(oxalis(a.model.oxalis, 81 + x * 10, { n: Math.round(w * d * 60), ...area }, flat, [1.3, 2.1], V(0, 0.6, 3)))
    scene.add(grass(82 + x * 10, { n: Math.round(w * d * 900), ...area }, flat, [0.08, 0.22], ['#0f2a12', '#5f9c4a'], 0.03, 0.02))
  }
  // a string of warm bulbs over the garden
  const bulbs = new THREE.Group()
  for (let i = 0; i < 9; i++) {
    const x = -3.5 + i * 1.1
    const y = 2.4 - Math.sin((i / 8) * Math.PI) * 0.45
    bulbs.add(glowSprite('#ffc27a', 0.5, V(x, y, -2.6), 1))
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd39a').multiplyScalar(6) }))
    b.position.set(x, y, -2.6)
    bulbs.add(b)
  }
  scene.add(bulbs)
  const warm = new THREE.PointLight('#ffb36b', 14, 9, 1.8)
  warm.position.set(0.5, 2.2, -1.5)
  warm.castShadow = true
  scene.add(warm)

  // railing at the roof edge
  const steel = new THREE.MeshStandardMaterial({ color: '#2a2c36', roughness: 0.25, metalness: 0.9 })
  const bar = new THREE.Mesh(new THREE.BoxGeometry(30, 0.05, 0.05), steel)
  bar.position.set(0, 1.1, -5)
  scene.add(bar)
  for (let x = -14; x <= 14; x += 1.4) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.04), steel)
    p.position.set(x, 0.55, -5)
    scene.add(p)
  }

  // the city below and beyond: towers, rooftop signs and street light
  const r = rng(83)
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 420
    const z = -40 - r() * 380
    const h = 20 + r() * 90 + (r() < 0.2 ? 60 : 0)
    const g = block({ x, z, w: 14 + r() * 16, d: 14 + r() * 16, h, lit: 0.25 + r() * 0.3, warm: r() < 0.55, glass: r() < 0.3 })
    g.position.y = -60
    scene.add(g)
    if (r() < 0.35) {
      const keys = Object.values(NEON)
      const s = neonSign({ text: ['HOTEL', 'BAR', 'RAIN', 'LOVE', 'CITY', 'NEON', 'SAKE'][i % 7], color: keys[i % keys.length], height: 5 + r() * 4 })
      s.position.set(x, -60 + h + 4, z + 8)
      scene.add(s)
    }
  }
  scene.add(cityLights(84, 9000, V(-500, -60, -500), V(500, -40, -60), 2.4))
  scene.add(rain(9000, V(8, 7, 10), 11, new THREE.Vector2(1.2, -0.3), '#ffd9b8', 0.4))
  scene.add(splashes(500, V(0.5, 0, -0.5), 6, 0.43, '#ffd9b8'))
  return scene
}

/* ------------------------------------------------------------------ */

function shot(title: string, scene: THREE.Scene, look: Partial<Look>, exposure: number, update: (cam: THREE.PerspectiveCamera, lk: Look, t: number, p: number) => void, fov = 62): Shot {
  const cam = camera(fov)
  const lk: Look = { ...LOOK, ...look }
  return { title, scene, camera: cam, exposure, look: lk, update: (t, p) => update(cam, lk, t, p) }
}

export const neonRain: Reel<keyof typeof SPEC.skies, keyof typeof SPEC.models, keyof typeof SPEC.textures> = {
  assets: SPEC,
  beat: 4,
  portrait: true,
  // the signs are drawn in Monoton, so it must be loaded before they are painted
  prepare: () => monoton,
  build(a) {
    const st = street(a)
    const roof = rooftop(a)
    const away = V(0, -50, 0)
    const fishHome = (on: boolean) => {
      if (!on) st.fish.position.copy(away)
    }
    return [
      shot('Downpour', st.scene, { focus: 16, aperture: 1.1 }, 1.25, (cam, lk, t, p) => {
        const e = ease(p)
        fishHome(false)
        st.cars.update(t)
        aim(cam, V(0.8, 1.05, 22).lerp(V(0.3, 1.35, 15), e).add(hand(t, 0.015)), V(0, 7, -60).lerp(V(0, 11, -60), e), lerp(-0.03, 0.02, e))
        lk.focus = lerp(14, 26, e)
      }),
      shot('Koi in the rain', st.scene, { aperture: 2.4, maxBlur: 22, motion: 0.4 }, 1.25, (cam, lk, t, p) => {
        const e = ease(p)
        st.cars.update(t)
        const f = st.fish
        f.position.set(lerp(-1.6, 1.4, p), 2.6 + Math.sin(t * 1.2) * 0.1, 1.6 + Math.sin(t * 0.8) * 0.15)
        f.rotation.set(Math.sin(t * 1.2) * 0.07, Math.PI / 2 + Math.sin(t * 0.9) * 0.15, Math.sin(t) * 0.05)
        aim(cam, V(lerp(-0.4, 0.4, e), 2.4, 4.2).add(hand(t, 0.01)), f.position.clone().lerp(V(0, 6, -40), 0.06), lerp(0.03, -0.02, e))
        lk.focus = cam.position.distanceTo(f.position)
      }, 46),
      shot('Look up', st.scene, { focus: 30, aperture: 0.7, motion: 0.4 }, 1.3, (cam, _lk, t, p) => {
        const e = ease(p)
        fishHome(false)
        st.cars.update(t)
        // straight up between the towers, rain falling into the lens, the frame turning slowly
        aim(cam, V(0.4, 1.7, -18), V(0.4 + Math.sin(t * 0.3) * 2, 80, -26), lerp(-0.25, 0.35, e))
      }, 74),
      shot('Rooftop garden', roof, { aperture: 1.9, maxBlur: 18, highlightTint: '#ffc9a3' }, 1.2, (cam, lk, t, p) => {
        const e = ease(p)
        aim(cam, V(-0.2, 0.62, 2.3).lerp(V(0.25, 0.95, 1.9), e).add(hand(t, 0.01)), V(0.4, 0.3, -1).lerp(V(0, 5, -200), ease((p - 0.15) / 0.7)), 0.02)
        lk.focus = lerp(1.6, 260, ease((p - 0.3) / 0.45))
      }, 56),
      shot('Crossing', st.scene, { focus: 40, aperture: 0.6, motion: 0.9 }, 1.3, (cam, _lk, t, p) => {
        const e = ease(p)
        fishHome(false)
        st.cars.update(t)
        // the junction from straight above, turning as we sink toward it
        const ang = lerp(0.2, -0.25, e)
        aim(cam, V(0, lerp(46, 36, e), -40), V(0, 0, -40.001), 0, V(Math.sin(ang), 0, -Math.cos(ang)))
      }, 58),
      shot('Reflection', st.scene, { aperture: 1.6, maxBlur: 18 }, 1.25, (cam, lk, t, p) => {
        const e = ease(p)
        fishHome(false)
        st.cars.update(t)
        // from the banner's reflection in the street, tilting up to the banner itself
        const look = V(0, 0, -4).lerp(V(0, 9.5, -14), ease((p - 0.2) / 0.7))
        aim(cam, V(0.5, 0.28, 4.5).lerp(V(0.2, 0.5, 3.2), e).add(hand(t, 0.004)), look, lerp(0.02, -0.01, e))
        lk.focus = cam.position.distanceTo(look)
      }, 60),
    ]
  },
}
