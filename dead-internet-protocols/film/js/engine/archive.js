// Virtual FTP archive: a long corridor of directory "cards" (instanced quads textured from a
// label atlas), used for Archie. One card can be highlighted as the found file.
import * as THREE from 'three';
import { mulberry32 } from '../core.js';

const DIRS = ['/pub/gnu', '/pub/X11', '/pub/linux', '/pub/msdos', '/pub/mac', '/pub/tex', '/pub/rfc', '/pub/doc',
  '/pub/sound', '/pub/images', '/pub/unix', '/pub/net', '/pub/games', '/pub/src', '/pub/misc', 'README'];

function atlas() {
  const cw = 320, ch = 120, c = document.createElement('canvas');
  c.width = cw * 4; c.height = ch * 4;
  const g = c.getContext('2d');
  DIRS.forEach((d, i) => {
    const x = (i % 4) * cw, y = Math.floor(i / 4) * ch;
    g.strokeStyle = 'rgba(120,255,170,0.9)'; g.lineWidth = 4;
    g.strokeRect(x + 8, y + 18, cw - 16, ch - 26);
    g.fillStyle = 'rgba(120,255,170,0.9)'; g.fillRect(x + 8, y + 6, 90, 14); // folder tab
    g.fillStyle = 'rgba(40,120,70,0.35)'; g.fillRect(x + 10, y + 20, cw - 20, ch - 30);
    g.font = `500 44px 'Plex Mono'`; g.fillStyle = '#d9ffe8'; g.textBaseline = 'middle';
    g.fillText(d, x + 24, y + 70);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

const VERT = /* glsl */`
attribute vec3 offset; attribute float variant; attribute float bright; attribute float side;
uniform float fogDensity; varying vec2 vUv; varying float vB; varying float vFog;
void main() {
  vec3 p = position;
  // cards on the left wall face +x, on the right wall face -x
  vec3 world = offset + vec3(0.0, p.y, 0.0) + vec3(0.0, 0.0, p.x * side);
  float cx = mod(variant, 4.0), cy = floor(variant / 4.0);
  vUv = vec2((cx + uv.x) / 4.0, 1.0 - (cy + 1.0 - uv.y) / 4.0);
  vB = bright;
  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  float d = -mv.z; vFog = exp(-fogDensity * fogDensity * d * d);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */`
uniform sampler2D atlas; uniform vec3 tint; uniform vec3 hiTint; uniform float hiId; varying vec2 vUv; varying float vB; varying float vFog;
void main() {
  vec4 c = texture2D(atlas, vUv);
  vec3 col = c.rgb * (vB > 5.0 ? hiTint : tint) * min(vB, 5.0);
  gl_FragColor = vec4(col * c.a * vFog, 1.0);
}`;

export class Archive {
  constructor({ z0 = -8, z1 = -125, seed = 3 } = {}) {
    const rnd = mulberry32(seed);
    const offs = [], vars = [], brs = [], sides = [];
    for (const side of [-1, 1]) {
      for (let layer = 0; layer < 3; layer++) {
        const x = side * (3.4 + layer * 2.2);
        for (let y = -1.6; y < 9.5; y += 0.95) {
          for (let z = z0; z > z1; z -= 1.45) {
            if (rnd() < 0.12) continue;
            offs.push(x, y + (rnd() - 0.5) * 0.1, z + (rnd() - 0.5) * 0.25);
            vars.push(Math.floor(rnd() * DIRS.length));
            brs.push(0.25 + rnd() * 0.5 * (layer === 0 ? 1 : 0.6));
            sides.push(side);
          }
        }
      }
    }
    this.count = offs.length / 3;
    const base = new THREE.PlaneGeometry(1.3, 0.5);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
    geo.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offs), 3));
    geo.setAttribute('variant', new THREE.InstancedBufferAttribute(new Float32Array(vars), 1));
    this.bright = new THREE.InstancedBufferAttribute(new Float32Array(brs), 1);
    geo.setAttribute('bright', this.bright);
    geo.setAttribute('side', new THREE.InstancedBufferAttribute(new Float32Array(sides), 1));
    geo.instanceCount = this.count;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { atlas: { value: atlas() }, tint: { value: new THREE.Color(0.35, 1.0, 0.55) }, hiTint: { value: new THREE.Color(0.4, 0.95, 1.2) }, hiId: { value: -1 }, fogDensity: { value: 0.02 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.offsets = offs; this.baseBright = brs.slice(); this.vars = vars;
    // the found file: pick a near-wall card well down the corridor
    let best = 0, bd = 1e9;
    for (let i = 0; i < this.count; i++) {
      const d = Math.abs(offs[i * 3] - 3.4) + Math.abs(offs[i * 3 + 1] - 3.3) + Math.abs(offs[i * 3 + 2] + 86) * 0.5;
      if (d < bd) { bd = d; best = i; }
    }
    this.hi = best;
    this.vars[best] = 2; geo.attributes.variant.array[best] = 2; // '/pub/linux'
    this.hiPos = new THREE.Vector3(offs[best * 3], offs[best * 3 + 1], offs[best * 3 + 2]);
    // light beam on the found card
    this.beam = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.4, 1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    this.beam.position.copy(this.hiPos).add(new THREE.Vector3(-0.2, 15, 0)); this.beam.rotation.y = Math.PI / 2;
    this.group = new THREE.Group(); this.group.add(this.mesh); this.group.add(this.beam);
  }

  // scan: a sweep (0..1 along the corridor) that briefly lights cards like an index lookup
  update(t, { scan = -1, found = 0, fog = 0.02 } = {}) {
    const b = this.bright.array;
    for (let i = 0; i < this.count; i++) {
      let v = this.baseBright[i];
      if (scan >= 0) {
        const z = -this.offsets[i * 3 + 2];
        const sweepZ = 8 + scan * 120;
        const d = Math.abs(z - sweepZ);
        if (d < 6) v += (1 - d / 6) * 1.2 * ((i * 7919) % 5 === 0 ? 1.6 : 0.6);
      }
      b[i] = v;
    }
    b[this.hi] = found > 0 ? 5.5 + found * 1.5 : b[this.hi];
    this.bright.needsUpdate = true;
    this.beam.material.opacity = found * 0.55;
    this.mat.uniforms.fogDensity.value = fog;
  }
}
