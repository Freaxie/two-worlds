// CRT monitor model + screen shader, and flat "panels" (modern LCD / holographic fragments).
// Screen content is any 2D canvas, re-uploaded when the owning scene redraws it.
import * as THREE from 'three';
import { makeCanvas } from '../core.js';

const SCREEN_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const SCREEN_FRAG = /* glsl */`
uniform sampler2D map; uniform vec2 texSize; uniform float time, power, brightness, curvature, scan, scanRows;
uniform float flicker, noiseAmt, crt, opacity, sheen, rollBar; uniform vec3 glowColor;
varying vec2 vUv; varying vec3 vN; varying vec3 vView;
uint hu(uint x){ x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float h21(vec2 p){ return float(hu(uint(p.x) * 1597334677u ^ hu(uint(p.y) + 374761393u))) / 4294967295.0; }
void main() {
  vec2 uv = vUv;
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + curvature * r2 * crt;
  uv = c * 0.5 + 0.5;
  // power on/off squash inside the tube
  float sy = 1.0, sx = 1.0, boost = 0.0;
  if (power < 1.0) {
    float a = clamp(power * 2.0, 0.0, 1.0), b = clamp(power * 2.0 - 1.0, 0.0, 1.0);
    sx = max(a, 0.002); sy = max(b * b, 0.004); boost = (1.0 - b) * 2.0 * step(0.001, power);
  }
  vec2 puv = (uv - 0.5) / vec2(sx, sy) + 0.5;
  float inside = step(0.0, puv.x) * step(puv.x, 1.0) * step(0.0, puv.y) * step(puv.y, 1.0);
  float edge = smoothstep(0.0, 0.012, uv.x) * smoothstep(1.0, 0.988, uv.x) * smoothstep(0.0, 0.012, uv.y) * smoothstep(1.0, 0.988, uv.y);
  vec2 px = vec2(1.0 / texSize.x, 0.0);
  vec3 col = texture2D(map, puv).rgb * 0.62;
  col += (texture2D(map, puv + px * 1.6).rgb + texture2D(map, puv - px * 1.6).rgb) * 0.19 * crt + texture2D(map, puv).rgb * 0.38 * (1.0 - crt);
  // scanlines
  float sl = 0.5 + 0.5 * cos(puv.y * scanRows * 6.2831853);
  col *= 1.0 - scan * crt * sl;
  // rolling bar + flicker + noise
  col *= 1.0 + rollBar * crt * 0.08 * smoothstep(0.0, 0.15, 0.15 - abs(fract(puv.y * 0.6 - time * 0.13) - 0.5));
  col *= 1.0 - flicker * (0.5 + 0.5 * sin(time * 113.0)) * 0.06;
  float n = h21(floor(puv * texSize * 0.5) + vec2(floor(time * 60.0) * 3.0, 0.0));
  col += (n - 0.5) * noiseAmt;
  // faint phosphor background glow so the tube never reads as pure black
  col += glowColor * 0.012 * crt;
  // tube vignette
  col *= mix(1.0, 1.0 - 0.45 * smoothstep(0.35, 1.25, r2), crt);
  col *= inside * edge * brightness * (1.0 + boost);
  // glass sheen (fake reflection), stronger at grazing angles
  float fres = pow(1.0 - clamp(dot(normalize(vN), normalize(vView)), 0.0, 1.0), 2.0);
  float band = smoothstep(0.55, 0.0, abs(vUv.x * 0.7 + vUv.y - 1.15)) * 0.5 + smoothstep(0.9, 0.0, length(vUv - vec2(0.25, 0.8))) * 0.25;
  col += vec3(0.6, 0.75, 0.8) * (band * 0.035 + fres * 0.08) * sheen;
  gl_FragColor = vec4(col, opacity);
}`;

export function makeScreenMaterial(tex, opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT, fragmentShader: SCREEN_FRAG,
    uniforms: {
      map: { value: tex }, texSize: { value: new THREE.Vector2(tex.image.width, tex.image.height) },
      time: { value: 0 }, power: { value: 1 }, brightness: { value: opts.brightness ?? 1.5 },
      curvature: { value: opts.curvature ?? 0.06 }, scan: { value: opts.scan ?? 0.32 }, scanRows: { value: opts.scanRows ?? 240 },
      flicker: { value: opts.flicker ?? 0.5 }, noiseAmt: { value: opts.noise ?? 0.03 }, crt: { value: opts.crt ?? 1 },
      opacity: { value: opts.opacity ?? 1 }, sheen: { value: opts.sheen ?? 1 }, rollBar: { value: opts.rollBar ?? 1 },
      glowColor: { value: new THREE.Color(opts.glow ?? '#3dff8b') },
    },
    transparent: (opts.opacity ?? 1) < 1 || opts.transparent === true,
    depthWrite: opts.depthWrite ?? true,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
}

export function canvasTexture(w, h) {
  const canvas = makeCanvas(w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4;
  return { canvas, ctx: canvas.getContext('2d'), tex };
}

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

let plasticMat = null, darkMat = null;
function materials() {
  if (!plasticMat) {
    plasticMat = new THREE.MeshStandardMaterial({ color: 0x23272a, roughness: 0.62, metalness: 0.05 });
    darkMat = new THREE.MeshStandardMaterial({ color: 0x0b0d0e, roughness: 0.8, metalness: 0.0 });
  }
  return { plasticMat, darkMat };
}

// A CRT monitor, screen width `sw` world units (4:3 tube). Origin = screen centre.
export class Monitor {
  constructor({ sw = 4, texW = 1280, texH = 960, style = {}, chassis = true, beige = false } = {}) {
    this.group = new THREE.Group();
    const sh = sw * 0.75;
    this.sw = sw; this.sh = sh;
    const { canvas, ctx, tex } = canvasTexture(texW, texH);
    this.canvas = canvas; this.ctx = ctx; this.tex = tex;
    this.mat = makeScreenMaterial(tex, style);
    // gently curved screen
    const geo = new THREE.PlaneGeometry(sw, sh, 24, 18);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / (sw / 2), y = pos.getY(i) / (sh / 2);
      pos.setZ(i, (1 - (x * x + y * y) * 0.5) * sw * 0.025);
    }
    geo.computeVertexNormals();
    this.screen = new THREE.Mesh(geo, this.mat);
    this.group.add(this.screen);
    if (chassis) {
      const { plasticMat, darkMat } = materials();
      const pm = beige ? new THREE.MeshStandardMaterial({ color: 0x8c8470, roughness: 0.7 }) : plasticMat;
      const bw = sw * 1.2, bh = sh * 1.26, r = sw * 0.05;
      const outer = roundedShape(bw, bh, r);
      const hole = roundedShape(sw * 1.015, sh * 1.02, sw * 0.03);
      outer.holes.push(hole);
      const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: sw * 0.07, bevelEnabled: true, bevelThickness: sw * 0.02, bevelSize: sw * 0.015, bevelSegments: 3, curveSegments: 8 }), pm);
      bezel.position.set(0, -sh * 0.03, -sw * 0.045);
      this.group.add(bezel);
      // inner recess (dark)
      const rec = new THREE.Mesh(new THREE.BoxGeometry(sw * 1.03, sh * 1.04, sw * 0.02), darkMat);
      rec.position.z = -sw * 0.03; this.group.add(rec);
      // tube housing (tapered back)
      const back = new THREE.Mesh(new THREE.CylinderGeometry(sw * 0.36, sw * 0.6, sw * 0.85, 4, 1), pm);
      back.rotation.x = Math.PI / 2; back.rotation.y = Math.PI / 4;
      back.scale.set(1.0, 1, 0.82);
      back.position.set(0, -sh * 0.02, -sw * 0.5); this.group.add(back);
      // stand
      const neck = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.3, sh * 0.25, sw * 0.3), pm);
      neck.position.set(0, -sh * 0.72, -sw * 0.35); this.group.add(neck);
      const base = new THREE.Mesh(new THREE.BoxGeometry(sw * 0.75, sw * 0.04, sw * 0.6), pm);
      base.position.set(0, -sh * 0.84, -sw * 0.35); this.group.add(base);
      // power LED
      const led = new THREE.Mesh(new THREE.SphereGeometry(sw * 0.012, 8, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 3.0, 0.8) }));
      led.position.set(bw * 0.42, -bh * 0.43 - sh * 0.03, 0.03 * sw); this.group.add(led);
      this.led = led;
      // screen light spill
      this.light = new THREE.PointLight(new THREE.Color(style.glow ?? '#3dff8b'), 2.0, sw * 2.5, 2);
      this.light.position.set(0, 0, sw * 0.5); this.group.add(this.light);
    }
  }
  update(t, power = 1) {
    this.mat.uniforms.time.value = t;
    this.mat.uniforms.power.value = power;
    this.tex.needsUpdate = true;
    if (this.light) this.light.intensity = 2.0 * power;
  }
}

// Flat panel (modern LCD window or holographic fragment)
export class Panel {
  constructor({ w = 4, h = 3, texW = 1024, texH = 768, style = {} } = {}) {
    const { canvas, ctx, tex } = canvasTexture(texW, texH);
    this.canvas = canvas; this.ctx = ctx; this.tex = tex;
    this.mat = makeScreenMaterial(tex, { crt: 0, curvature: 0, scan: 0, flicker: 0, noise: 0.0, sheen: 0.3, rollBar: 0, ...style });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.w = w; this.h = h;
  }
  update(t, power = 1) {
    this.mat.uniforms.time.value = t; this.mat.uniforms.power.value = power; this.tex.needsUpdate = true;
  }
}
