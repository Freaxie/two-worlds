/* ------------------------------------------------------------------
   BLUE HOUR — the lens
   Final pass over the tone-mapped frame: fisheye barrel, chromatic
   fringing, a liquid ripple on every cut, grain and a vignette.
   Bloom happens earlier, in UnrealBloomPass.
------------------------------------------------------------------- */

import { Vector2 } from 'three'

export const LensShader = {
  name: 'BlueHourLens',
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
    uCut: { value: 10 },
    uK: { value: 0.35 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uCut;
    uniform float uK;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    vec2 barrel(vec2 uv, float k) {
      float aspect = uRes.x / uRes.y;
      vec2 p = uv - 0.5;
      p.x *= aspect;
      float hd = 0.5 * length(vec2(aspect, 1.0));
      float r = length(p) / hd;
      p *= (1.0 + k * r * r) / (1.0 + k);
      p.x /= aspect;
      return p + 0.5;
    }

    vec3 tap(vec2 uv) { return texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).rgb; }

    void main() {
      vec2 uv = vUv;
      float aspect = uRes.x / uRes.y;
      vec2 c = uv - 0.5;
      c.x *= aspect;
      float r = length(c);

      // liquid ripple spreading from the centre after each cut
      float amp = 0.03 * exp(-uCut * 6.0);
      vec2 dir = r > 0.0 ? c / r : vec2(0.0);
      float wave = sin(r * 36.0 - uCut * 30.0) * amp * smoothstep(0.0, 0.15, r);
      wave += sin(uv.y * 50.0 + uTime * 8.0) * amp * 0.3;
      uv += vec2(dir.x / aspect, dir.y) * wave;

      float ca = 0.02 + amp * 2.5;
      vec3 col;
      col.r = tap(barrel(uv, uK * (1.0 + ca))).r;
      col.g = tap(barrel(uv, uK)).g;
      col.b = tap(barrel(uv, uK * (1.0 - ca))).b;

      // brief exposure bloom on the cut
      col += vec3(0.45, 0.55, 1.0) * exp(-uCut * 14.0) * 0.25;

      float hd = 0.5 * length(vec2(aspect, 1.0));
      float rv = r / hd;
      col *= mix(0.25, 1.0, smoothstep(1.1, 0.5, rv));

      col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.035;
      gl_FragColor = vec4(col, 1.0);
    }`,
}
