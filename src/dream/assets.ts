/* ------------------------------------------------------------------
   BLUE HOUR — assets
   Photographic skies, scanned-quality models and textures, loaded
   once with progress. Every file lives in public/dream-assets; see
   CREDITS.md there for sources and licences.
------------------------------------------------------------------- */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js'

const BASE = 'dream-assets/'

export interface Assets {
  sky: {
    sunrise: THREE.Texture
    night: THREE.Texture
    dawn: THREE.Texture
    clear: THREE.Texture
  }
  oxalis: THREE.Mesh
  fish: THREE.Mesh
  grass: THREE.Texture
  cloud: THREE.Texture
  waterNormals: THREE.Texture
  score: ArrayBuffer
}

export async function loadAssets(onProgress: (f: number) => void): Promise<Assets> {
  const manager = new THREE.LoadingManager()
  manager.onProgress = (_url, done, total) => onProgress(done / total)
  const gltf = new GLTFLoader()
  const hdr = new HDRLoader().setDataType(THREE.HalfFloatType)
  const uhdr = new UltraHDRLoader(manager).setDataType(THREE.HalfFloatType)
  const tex = new THREE.TextureLoader(manager)
  const file = new THREE.FileLoader(manager).setResponseType('arraybuffer')

  const equirect = <T extends THREE.Texture>(t: T) => {
    t.mapping = THREE.EquirectangularReflectionMapping
    return t
  }
  const firstMesh = (root: THREE.Object3D) => {
    let found: THREE.Mesh | null = null
    root.traverse((o) => {
      if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh
    })
    if (!found) throw new Error('model has no mesh')
    return found as THREE.Mesh
  }

  // .glb and .hdr come in as raw bytes and are parsed here. Hosts that won't
  // serve those types can carry a base64 copy alongside (name + '.b64.txt').
  const bytes = async (name: string): Promise<ArrayBuffer> => {
    manager.itemStart(name)
    try {
      const direct = await fetch(BASE + name)
      if (direct.ok) return await direct.arrayBuffer()
      const b64 = await fetch(BASE + name + '.b64.txt')
      if (!b64.ok) throw new Error(`missing asset ${name}`)
      const bin = atob((await b64.text()).trim())
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out.buffer
    } finally {
      manager.itemEnd(name)
    }
  }
  const model = async (name: string) => firstMesh((await gltf.parseAsync(await bytes(name), '')).scene)
  const radiance = async (name: string) => {
    const t = new THREE.DataTexture()
    // same steps DataTextureLoader.load takes after parsing
    ;(hdr as unknown as { _applyTexData(t: THREE.DataTexture, d: unknown): void })._applyTexData(t, hdr.parse(await bytes(name)))
    return equirect(t)
  }

  const [sunrise, night, dawn, clear, oxalis, fish, grass, cloud, waterNormals, score] = await Promise.all([
    uhdr.loadAsync(BASE + 'spruit_sunrise_2k.hdr.jpg').then(equirect),
    uhdr.loadAsync(BASE + 'moonless_golf_2k.hdr.jpg').then(equirect),
    radiance('blouberg_sunrise_2_1k.hdr'),
    radiance('quarry_01_1k.hdr'),
    model('oxalis.glb'),
    model('barramundi.glb'),
    tex.loadAsync(BASE + 'grass.jpg'),
    tex.loadAsync(BASE + 'cloud.webp'),
    tex.loadAsync(BASE + 'waternormals.jpg'),
    file.loadAsync(BASE + 'score.mp3') as Promise<ArrayBuffer>,
  ])

  grass.colorSpace = THREE.SRGBColorSpace
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping
  grass.anisotropy = 8
  cloud.colorSpace = THREE.SRGBColorSpace
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

  return { sky: { sunrise, night, dawn, clear }, oxalis, fish, grass, cloud, waterNormals, score }
}

/**
 * Direction of a point in an equirectangular sky, given its image
 * coordinates (u across, v down from the top) and the sky's rotation
 * about Y. Used to line the key light up with the sun in the photo.
 */
export function skyDirection(u: number, v: number, rotY = 0) {
  const lon = (u - 0.5) * Math.PI * 2
  const lat = (0.5 - v) * Math.PI
  const d = new THREE.Vector3(Math.cos(lon) * Math.cos(lat), Math.sin(lat), Math.sin(lon) * Math.cos(lat))
  return d.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
}
