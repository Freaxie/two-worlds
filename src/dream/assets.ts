/* ------------------------------------------------------------------
   Asset loading for the reels
   Photographic skies, glTF models, textures and the score, loaded
   once with progress. Each reel names the files it needs; they live
   in public/dream-assets (see CREDITS.md there for sources and licences).
------------------------------------------------------------------- */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { UltraHDRLoader } from 'three/examples/jsm/loaders/UltraHDRLoader.js'

const BASE = 'dream-assets/'

export interface TextureSpec {
  file: string
  /** colour data (sRGB) rather than normals or masks */
  srgb?: boolean
  repeat?: boolean
}

export interface AssetSpec<S extends string, M extends string, T extends string> {
  /** equirectangular skies: .hdr or Ultra HDR .hdr.jpg */
  skies: Record<S, string>
  models: Record<M, string>
  textures: Record<T, TextureSpec>
  score: string
}

export interface Assets<S extends string = string, M extends string = string, T extends string = string> {
  sky: Record<S, THREE.Texture>
  model: Record<M, THREE.Mesh>
  tex: Record<T, THREE.Texture>
  score: ArrayBuffer
}

export async function loadAssets<S extends string, M extends string, T extends string>(spec: AssetSpec<S, M, T>, onProgress: (f: number) => void): Promise<Assets<S, M, T>> {
  const manager = new THREE.LoadingManager()
  manager.onProgress = (_url, done, total) => onProgress(done / total)
  const gltf = new GLTFLoader()
  const hdr = new HDRLoader().setDataType(THREE.HalfFloatType)
  const uhdr = new UltraHDRLoader(manager).setDataType(THREE.HalfFloatType)
  const texLoader = new THREE.TextureLoader(manager)
  const file = new THREE.FileLoader(manager).setResponseType('arraybuffer')

  const equirect = <X extends THREE.Texture>(t: X) => {
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
  const sky = async (name: string) => {
    if (name.endsWith('.hdr.jpg')) return equirect(await uhdr.loadAsync(BASE + name))
    const t = new THREE.DataTexture()
    // same steps DataTextureLoader.load takes after parsing
    ;(hdr as unknown as { _applyTexData(t: THREE.DataTexture, d: unknown): void })._applyTexData(t, hdr.parse(await bytes(name)))
    return equirect(t)
  }
  const texture = async (s: TextureSpec) => {
    const t = await texLoader.loadAsync(BASE + s.file)
    if (s.srgb) t.colorSpace = THREE.SRGBColorSpace
    if (s.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    return t
  }

  const entries = <K extends string, V, R>(rec: Record<K, V>, load: (v: V) => Promise<R>) =>
    Promise.all((Object.entries(rec) as [K, V][]).map(async ([k, v]) => [k, await load(v)] as const)).then((pairs) => Object.fromEntries(pairs) as Record<K, R>)

  const [skies, models, textures, score] = await Promise.all([
    entries(spec.skies, sky),
    entries(spec.models, model),
    entries(spec.textures, texture),
    file.loadAsync(BASE + spec.score) as Promise<ArrayBuffer>,
  ])
  return { sky: skies, model: models, tex: textures, score }
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
