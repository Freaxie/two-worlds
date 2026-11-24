// Keyframed camera moves with per-segment easing and a subtle "handheld" drift.
import * as THREE from 'three';
import { clamp, lerp, easeInOutSine, easeOut, easeIn, fbm1 } from '../core.js';

const EASE = { io: easeInOutSine, o: easeOut, i: easeIn, l: (x) => x };

// keys: [{ t, pos:[x,y,z], look:[x,y,z], fov, roll, ease }]
export function sampleCam(keys, t) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const u = (EASE[b.ease ?? 'io'])(clamp((t - a.t) / (b.t - a.t)));
      const mix = (p, q) => p.map((v, k) => lerp(v, q[k], u));
      return { pos: mix(a.pos, b.pos), look: mix(a.look, b.look), fov: lerp(a.fov ?? 50, b.fov ?? 50, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
    }
  }
  return keys[keys.length - 1];
}

const _v = new THREE.Vector3();
export function applyCam(camera, st, t, shake = 0.0) {
  const sx = fbm1(t * 0.35, 11) * shake, sy = fbm1(t * 0.31, 23) * shake, sr = fbm1(t * 0.27, 37) * shake * 0.01;
  camera.position.set(st.pos[0] + sx, st.pos[1] + sy, st.pos[2]);
  camera.up.set(Math.sin((st.roll ?? 0) + sr), Math.cos((st.roll ?? 0) + sr), 0);
  camera.lookAt(_v.set(st.look[0] + sx * 0.5, st.look[1] + sy * 0.5, st.look[2]));
  if (camera.fov !== (st.fov ?? 50)) { camera.fov = st.fov ?? 50; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
}

// project a world point to frame pixels; returns null if behind the camera
const _p = new THREE.Vector3();
export function toScreen(camera, x, y, z, W, H) {
  _p.set(x, y, z).project(camera);
  if (_p.z > 1 || _p.z < -1) return null;
  return [(_p.x * 0.5 + 0.5) * W, (1 - (_p.y * 0.5 + 0.5)) * H, _p.z];
}
