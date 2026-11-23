/* ------------------------------------------------------------------
   Camera helpers shared by the reels: easing, a breathing handheld
   sway, and aiming with roll.
------------------------------------------------------------------- */

import * as THREE from 'three'

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
export const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * THREE.MathUtils.clamp(t, 0, 1))
export const lerp = THREE.MathUtils.lerp

/** a slow, breathing hand on the camera */
export const hand = (t: number, k: number) => V(Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3) * 0.25, Math.sin(t * 1.3 + 1) * 0.5, 0).multiplyScalar(k)

export function camera(fov: number) {
  return new THREE.PerspectiveCamera(fov, 1, 0.05, 6000)
}

/** place the camera, look at a point, then roll about the view axis; `up` overrides the world up (for straight-down shots) */
export function aim(cam: THREE.PerspectiveCamera, pos: THREE.Vector3, look: THREE.Vector3, roll = 0, up = V(0, 1, 0)) {
  cam.position.copy(pos)
  cam.up.copy(up)
  cam.lookAt(look)
  cam.rotateZ(roll)
  cam.updateMatrixWorld()
}
