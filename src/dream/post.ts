/* ------------------------------------------------------------------
   BLUE HOUR — the camera body
   The scene renders to an HDR target with depth, then:
     motion blur (camera, from depth)  →  depth of field (gathered bokeh)
     →  sun shafts  →  subtle bloom  →  ACES tone map
     →  grade, lens, grain, cut ripple
------------------------------------------------------------------- */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const quadVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const depthHelpers = /* glsl */ `
  uniform sampler2D tDepth;
  uniform float cameraNear, cameraFar;
  float linearDepth(vec2 uv) {
    float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
    return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
  }`

const MotionBlur = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1000 },
    uInvProj: { value: new THREE.Matrix4() },
    uCamWorld: { value: new THREE.Matrix4() },
    uPrevViewProj: { value: new THREE.Matrix4() },
    uStrength: { value: 0.5 },
  },
  vertexShader: quadVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse, tDepth;
    uniform mat4 uInvProj, uCamWorld, uPrevViewProj;
    uniform float uStrength;
    varying vec2 vUv;
    void main() {
      float d = texture2D(tDepth, vUv).x;
      vec4 clip = vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
      vec4 view = uInvProj * clip;
      view /= view.w;
      vec4 world = uCamWorld * view;
      vec4 prev = uPrevViewProj * world;
      vec2 prevUv = prev.xy / prev.w * 0.5 + 0.5;
      vec2 vel = (vUv - prevUv) * uStrength;
      float len = length(vel);
      if (len > 0.04) vel *= 0.04 / len;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 9; i++) {
        float k = float(i) / 8.0 - 0.5;
        acc += texture2D(tDiffuse, vUv + vel * k).rgb;
      }
      gl_FragColor = vec4(acc / 9.0, 1.0);
    }`,
}

const DepthOfField = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1000 },
    uFocus: { value: 10 },
    uAperture: { value: 1 },
    uMaxBlur: { value: 14 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: quadVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uFocus, uAperture, uMaxBlur;
    uniform vec2 uRes;
    varying vec2 vUv;
    ${depthHelpers}
    // circle of confusion in pixels for a thin lens focused at uFocus
    float coc(float z) { return clamp(uAperture * abs(1.0 - uFocus / z) * uRes.y / 90.0, 0.0, uMaxBlur); }
    void main() {
      float z0 = linearDepth(vUv);
      float c0 = coc(z0);
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      if (c0 < 0.5 && uMaxBlur < 0.5) { gl_FragColor = vec4(col, 1.0); return; }
      col = min(col, vec3(6.0));
      vec3 acc = col;
      float wsum = 1.0;
      float ga = 2.39996323;
      // golden-angle gather; a tap only contributes if its own blur reaches here,
      // so sharp foreground edges don't smear over the background and vice versa
      for (int i = 1; i < 48; i++) {
        float r = sqrt(float(i) / 48.0) * uMaxBlur;
        vec2 o = vec2(cos(float(i) * ga), sin(float(i) * ga)) * r / uRes;
        vec2 uv = vUv + o;
        float z = linearDepth(uv);
        float c = coc(z);
        float reach = smoothstep(r - 1.5, r + 1.5, (z < z0 ? c : min(c, c0)) );
        vec3 s = min(texture2D(tDiffuse, uv).rgb, vec3(6.0));
        // brighter taps weigh a little more, which rounds highlights into bokeh discs
        float w = reach * (1.0 + min(dot(s, vec3(0.3)), 2.0) * 0.4);
        acc += s * w;
        wsum += w;
      }
      gl_FragColor = vec4(acc / wsum, 1.0);
    }`,
}

const SunShafts = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1000 },
    uSun: { value: new THREE.Vector2(0.5, 0.5) },
    uSunVisible: { value: 0 },
    uStrength: { value: 0.35 },
    uTint: { value: new THREE.Color(1, 0.9, 0.8) },
    uAspect: { value: 1 },
  },
  vertexShader: quadVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uSun;
    uniform float uSunVisible, uStrength, uAspect;
    uniform vec3 uTint;
    varying vec2 vUv;
    ${depthHelpers}
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      if (uSunVisible <= 0.0) { gl_FragColor = vec4(col, 1.0); return; }
      vec2 dir = (uSun - vUv) / 40.0;
      vec2 uv = vUv;
      float illum = 0.0;
      float decay = 1.0;
      for (int i = 0; i < 40; i++) {
        uv += dir;
        // only open sky lets light through; towers, clouds and leaves occlude
        float sky = step(cameraFar * 0.97, linearDepth(clamp(uv, 0.0, 1.0)));
        vec3 s = texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).rgb;
        float b = max(dot(s, vec3(0.33)) - 1.5, 0.0);
        illum += sky * b / (1.0 + b) * decay;
        decay *= 0.965;
      }
      vec2 d = (vUv - uSun) * vec2(uAspect, 1.0);
      float fall = exp(-dot(d, d) * 2.5);
      col += uTint * illum / 40.0 * uStrength * uSunVisible * (0.4 + fall);
      gl_FragColor = vec4(col, 1.0);
    }`,
}

/** Final look: grade, fisheye lens, fringing, vignette, grain and the cut ripple */
const Finish = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uCut: { value: 10 },
    uLens: { value: 0.25 },
    uShadowTint: { value: new THREE.Color('#1a2c8f') },
    uHighlightTint: { value: new THREE.Color('#ffd9e8') },
    uSaturation: { value: 1.08 },
    uGrain: { value: 0.05 },
  },
  vertexShader: quadVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uRes;
    uniform float uTime, uCut, uLens, uSaturation, uGrain;
    uniform vec3 uShadowTint, uHighlightTint;
    varying vec2 vUv;

    float hash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }

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
      float aspect = uRes.x / uRes.y;
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      c.x *= aspect;
      float r = length(c);

      // liquid ripple on the cut
      float amp = 0.022 * exp(-uCut * 5.5);
      vec2 dir = r > 0.0 ? c / r : vec2(0.0);
      uv += vec2(dir.x / aspect, dir.y) * sin(r * 34.0 - uCut * 28.0) * amp * smoothstep(0.0, 0.2, r);

      float ca = 0.012 + amp * 2.0;
      vec3 col = vec3(tap(barrel(uv, uLens * (1.0 + ca))).r, tap(barrel(uv, uLens)).g, tap(barrel(uv, uLens * (1.0 - ca))).b);

      // grade: split-tone cobalt shadows and blush highlights, gentle S-curve
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, col * uShadowTint * 2.2, (1.0 - smoothstep(0.0, 0.45, l)) * 0.38);
      col = mix(col, col * uHighlightTint * 1.1, smoothstep(0.5, 1.0, l) * 0.3);
      col = mix(vec3(l), col, uSaturation);
      col = clamp(col, 0.0, 1.0);
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.35);
      col = mix(vec3(0.012, 0.018, 0.06), vec3(1.0), col);

      // brief bloom of light on the cut
      col += vec3(0.5, 0.6, 1.0) * exp(-uCut * 12.0) * 0.18;

      // vignette
      float hd = 0.5 * length(vec2(aspect, 1.0));
      col *= mix(0.35, 1.0, smoothstep(1.15, 0.45, r / hd));

      // film grain, stronger in the mids like real stock
      float g = hash(vec3(vUv * uRes, floor(uTime * 24.0))) - 0.5;
      col += g * uGrain * (0.4 + 0.6 * (1.0 - abs(l * 2.0 - 1.0)));
      gl_FragColor = vec4(col, 1.0);
    }`,
}

export interface Look {
  focus: number
  aperture: number
  maxBlur: number
  motion: number
  lens: number
  shafts: number
  shaftTint: THREE.ColorRepresentation
  bloom: number
  /** linear scene brightness where bloom begins */
  bloomThreshold: number
  grain: number
  saturation: number
  shadowTint: THREE.ColorRepresentation
  highlightTint: THREE.ColorRepresentation
  /** world position of the sun or moon, for shafts */
  sun?: THREE.Vector3
}

export function createPipeline(renderer: THREE.WebGLRenderer, samples = 4) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples })
  target.depthTexture = new THREE.DepthTexture(1, 1)
  target.depthTexture.type = THREE.FloatType

  const composer = new EffectComposer(renderer)
  const source = new TexturePass(target.texture)
  const motion = new ShaderPass(MotionBlur)
  const dof = new ShaderPass(DepthOfField)
  const shafts = new ShaderPass(SunShafts)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.7, 0.95)
  const finish = new ShaderPass(Finish)
  for (const p of [motion, dof, shafts]) p.uniforms.tDepth.value = target.depthTexture
  composer.addPass(source)
  composer.addPass(motion)
  composer.addPass(dof)
  composer.addPass(shafts)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  composer.addPass(finish)

  const prevViewProj = new THREE.Matrix4()
  const viewProj = new THREE.Matrix4()
  let fresh = true
  const v = new THREE.Vector3()

  return {
    setSize(w: number, h: number, pr: number) {
      const W = Math.round(w * pr)
      const H = Math.round(h * pr)
      target.setSize(W, H)
      composer.setPixelRatio(pr)
      composer.setSize(w, h)
      dof.uniforms.uRes.value.set(W, H)
      finish.uniforms.uRes.value.set(W, H)
      shafts.uniforms.uAspect.value = w / h
    },
    /** call on a cut so motion blur doesn't smear between two shots */
    cut() {
      fresh = true
    },
    render(scene: THREE.Scene, cam: THREE.PerspectiveCamera, look: Look, time: number, cutAge: number) {
      renderer.setRenderTarget(target)
      renderer.render(scene, cam)
      renderer.setRenderTarget(null)

      viewProj.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)
      if (fresh) prevViewProj.copy(viewProj)
      fresh = false
      for (const p of [motion, dof, shafts]) {
        p.uniforms.cameraNear.value = cam.near
        p.uniforms.cameraFar.value = cam.far
      }
      motion.uniforms.uInvProj.value.copy(cam.projectionMatrixInverse)
      motion.uniforms.uCamWorld.value.copy(cam.matrixWorld)
      motion.uniforms.uPrevViewProj.value.copy(prevViewProj)
      motion.uniforms.uStrength.value = look.motion
      motion.enabled = look.motion > 0
      prevViewProj.copy(viewProj)

      dof.uniforms.uFocus.value = look.focus
      dof.uniforms.uAperture.value = look.aperture
      dof.uniforms.uMaxBlur.value = look.maxBlur

      let vis = 0
      if (look.sun && look.shafts > 0) {
        v.copy(look.sun).project(cam)
        const inFront = v.z < 1
        shafts.uniforms.uSun.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5)
        vis = inFront ? Math.max(0, 1 - Math.max(0, Math.hypot(v.x, v.y) - 0.9) * 1.2) : 0
      }
      shafts.uniforms.uSunVisible.value = vis
      shafts.uniforms.uStrength.value = look.shafts
      shafts.uniforms.uTint.value.set(look.shaftTint)

      bloom.strength = look.bloom
      bloom.threshold = look.bloomThreshold
      finish.uniforms.uTime.value = time
      finish.uniforms.uCut.value = cutAge
      finish.uniforms.uLens.value = look.lens
      finish.uniforms.uGrain.value = look.grain
      finish.uniforms.uSaturation.value = look.saturation
      finish.uniforms.uShadowTint.value.set(look.shadowTint)
      finish.uniforms.uHighlightTint.value.set(look.highlightTint)
      composer.render()
    },
  }
}
