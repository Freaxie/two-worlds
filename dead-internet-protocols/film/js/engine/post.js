// Post-processing: HDR scene -> bloom chain + cheap depth-of-field -> filmic composite.
// Composite adds chromatic aberration, CRT scanlines, grain, vignette, glitch tearing,
// whole-frame CRT power on/off, then draws the (crisp) subtitle layer on top.
import * as THREE from 'three';

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const DOWN4 = /* glsl */`
uniform sampler2D tSrc; uniform vec2 texel; uniform float threshold; uniform float knee; uniform int useThreshold;
varying vec2 vUv;
vec3 tap(vec2 o) { return texture2D(tSrc, vUv + o * texel).rgb; }
void main() {
  // 4 bilinear taps = 4x4 box (handles thin bright lines without aliasing)
  vec3 c = (tap(vec2(-1.0,-1.0)) + tap(vec2(1.0,-1.0)) + tap(vec2(-1.0,1.0)) + tap(vec2(1.0,1.0))) * 0.25;
  if (useThreshold == 1) {
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - threshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-4);
    float contrib = max(soft, br - threshold) / max(br, 1e-4);
    c *= contrib;
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const BLUR = /* glsl */`
uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
void main() {
  // 9-tap gaussian folded into 5 bilinear taps
  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
  c += texture2D(tSrc, vUv + dir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tSrc, vUv - dir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tSrc, vUv + dir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(tSrc, vUv - dir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;

const UPADD = /* glsl */`
uniform sampler2D tSmall; uniform sampler2D tBig; uniform vec2 texel; uniform float wSmall; varying vec2 vUv;
void main() {
  vec3 s = texture2D(tSmall, vUv + texel * vec2(-0.5,-0.5)).rgb + texture2D(tSmall, vUv + texel * vec2(0.5,-0.5)).rgb
         + texture2D(tSmall, vUv + texel * vec2(-0.5,0.5)).rgb + texture2D(tSmall, vUv + texel * vec2(0.5,0.5)).rgb;
  gl_FragColor = vec4(texture2D(tBig, vUv).rgb + s * 0.25 * wSmall, 1.0);
}`;

const COMPOSITE = /* glsl */`
uniform sampler2D tScene; uniform sampler2D tDepth; uniform sampler2D tBloom; uniform sampler2D tDof; uniform sampler2D tSubs; uniform sampler2D tOverlay; uniform float ovGain;
uniform vec2 res; uniform float time; uniform float frame;
uniform float bloomStrength, exposure, ca, grain, scan, vignette, glitch, glitchSeed, fade, flash;
uniform float dofAmount, focusDist, focusRange, camNear, camFar;
uniform float powerOn, powerOff, subsAlpha, saturation;
uniform vec3 tint; uniform vec4 subsRect; // x,y,w,h in uv (y from bottom)
varying vec2 vUv;

uint hash_u(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float hash21(vec2 p) { return float(hash_u(uint(p.x) * 1597334677u ^ hash_u(uint(p.y) + 0x9e3779b9u))) / 4294967295.0; }

float linDepth(float d) { float z = d * 2.0 - 1.0; return (2.0 * camNear * camFar) / (camFar + camNear - z * (camFar - camNear)); }

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

void main() {
  vec2 uv = vUv;
  // ---- whole-frame CRT power on / off (squash to a line, then to a dot)
  float sx = 1.0, sy = 1.0, boost = 0.0;
  if (powerOff > 0.0) {
    float a = clamp(powerOff * 1.8, 0.0, 1.0), b = clamp(powerOff * 1.8 - 0.8, 0.0, 1.0);
    sy = max(mix(1.0, 0.003, a * a), 0.003); sx = mix(1.0, 0.002, b * b); boost = a * 2.5;
  }
  if (powerOn < 1.0) {
    float a = clamp(powerOn * 2.2, 0.0, 1.0), b = clamp(powerOn * 2.2 - 1.0, 0.0, 1.0);
    sx = mix(0.0, 1.0, sqrt(a)); sy = mix(0.004, 1.0, b * b * (3.0 - 2.0 * b)); boost = (1.0 - b) * 3.0;
  }
  vec2 cuv = (uv - 0.5) / vec2(max(sx, 1e-4), max(sy, 1e-4)) + 0.5;
  float inside = step(0.0, cuv.x) * step(cuv.x, 1.0) * step(0.0, cuv.y) * step(cuv.y, 1.0);
  uv = cuv;

  // ---- glitch tearing: horizontal block displacement
  vec2 guv = uv;
  float rgbSplit = 0.0;
  if (glitch > 0.0) {
    float rows = mix(10.0, 70.0, hash21(vec2(glitchSeed, 3.0)));
    float row = floor(uv.y * rows);
    float h1 = hash21(vec2(row, glitchSeed));
    float h2 = hash21(vec2(row + 17.0, glitchSeed + 5.0));
    if (h1 < glitch * 0.55) guv.x += (h2 - 0.5) * 0.18 * glitch;
    float blockY = floor(uv.y * 8.0), blockX = floor(uv.x * 5.0);
    if (hash21(vec2(blockX + blockY * 9.0, glitchSeed + 11.0)) < glitch * 0.12) guv.y += (hash21(vec2(blockY, glitchSeed)) - 0.5) * 0.04;
    rgbSplit = glitch * 0.012;
  }

  // ---- chromatic aberration (radial) + scene
  vec2 dc = guv - 0.5;
  float r2 = dot(dc, dc);
  vec2 caOff = dc * (ca * (0.6 + r2 * 2.0)) / res * 6.0 + vec2(rgbSplit, 0.0);
  vec3 col;
  col.r = texture2D(tScene, guv + caOff).r;
  col.g = texture2D(tScene, guv).g;
  col.b = texture2D(tScene, guv - caOff).b;

  // ---- depth of field (blend toward a pre-blurred copy by circle of confusion)
  if (dofAmount > 0.0) {
    float d = linDepth(texture2D(tDepth, guv).r);
    float coc = clamp(abs(d - focusDist) / focusRange, 0.0, 1.0) * dofAmount;
    col = mix(col, texture2D(tDof, guv).rgb, smoothstep(0.0, 1.0, coc));
  }

  // ---- bloom
  vec3 bl = texture2D(tBloom, guv).rgb;
  col += bl * bloomStrength;
  col *= tint * exposure;
  // ---- typography overlay: crisp (after DOF), glitch-displaced with a hint of colour fringing
  vec4 ov = texture2D(tOverlay, guv);
  float ovR = texture2D(tOverlay, guv + caOff * 0.6).a;
  col = mix(col, ov.rgb * ovGain, ov.a);
  col.r += ovR * (1.0 - ov.a) * 0.12 * ovGain;
  col *= 1.0 + boost;
  col += flash;

  // ---- tone map + grade
  col = aces(col);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, saturation);
  col += vec3(0.0, 0.010, 0.014) * (1.0 - smoothstep(0.0, 0.35, lum)); // teal shadows
  col = toSRGB(col);

  // ---- vignette
  vec2 vq = (vUv - 0.5) * vec2(1.0, res.y / res.x) * 0.9;
  col *= 1.0 - vignette * smoothstep(0.25, 1.05, length(vq));

  // ---- scanlines (subtle, whole frame) + rolling brightness band
  float sl = 0.5 + 0.5 * cos(gl_FragCoord.y * 3.14159265 / 2.0);
  col *= 1.0 - scan * sl;
  col *= 1.0 + 0.025 * scan * sin(vUv.y * 6.0 - time * 1.7);

  // ---- film grain (luma weighted)
  float n = hash21(gl_FragCoord.xy + vec2(frame * 7.0, frame * 13.0)) - 0.5;
  col += n * grain * (0.35 + 0.65 * (1.0 - abs(lum - 0.45) * 1.6));

  col *= inside;
  col *= 1.0 - fade;

  // ---- subtitles (post-FX, crisp)
  if (subsAlpha > 0.0) {
    vec2 suv = (vUv - subsRect.xy) / subsRect.zw;
    if (suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0) {
      vec4 s = texture2D(tSubs, suv); // straight alpha, sRGB-encoded (NoColorSpace texture)
      col = mix(col, s.rgb, s.a * subsAlpha);
    }
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function rt(w, h, type = THREE.HalfFloatType) {
  return new THREE.WebGLRenderTarget(w, h, { type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
}

export class Post {
  constructor(renderer, w, h) {
    this.r = renderer; this.w = w; this.h = h;
    this.rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.rtScene.depthTexture = new THREE.DepthTexture(w, h, THREE.FloatType);
    // bloom: 1/4, 1/8, 1/16, 1/32
    this.levels = [];
    let bw = w >> 2, bh = h >> 2;
    for (let i = 0; i < 4; i++) { this.levels.push({ w: bw, h: bh, a: rt(bw, bh), b: rt(bw, bh) }); bw >>= 1; bh >>= 1; }
    this.dofA = rt(w >> 2, h >> 2); this.dofB = rt(w >> 2, h >> 2);

    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.qscene = new THREE.Scene(); this.qscene.add(this.quad);

    const mk = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    this.mDown = mk(DOWN4, { tSrc: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 0.8 }, knee: { value: 0.4 }, useThreshold: { value: 1 } });
    this.mBlur = mk(BLUR, { tSrc: { value: null }, dir: { value: new THREE.Vector2() } });
    this.mUp = mk(UPADD, { tSmall: { value: null }, tBig: { value: null }, texel: { value: new THREE.Vector2() }, wSmall: { value: 1 } });
    this.mComp = mk(COMPOSITE, {
      tScene: { value: null }, tDepth: { value: null }, tBloom: { value: null }, tDof: { value: null }, tSubs: { value: null }, tOverlay: { value: null }, ovGain: { value: 0.85 },
      res: { value: new THREE.Vector2(w, h) }, time: { value: 0 }, frame: { value: 0 },
      bloomStrength: { value: 1 }, exposure: { value: 1 }, ca: { value: 1 }, grain: { value: 0.04 }, scan: { value: 0.05 },
      vignette: { value: 0.45 }, glitch: { value: 0 }, glitchSeed: { value: 0 }, fade: { value: 0 }, flash: { value: 0 },
      dofAmount: { value: 0 }, focusDist: { value: 10 }, focusRange: { value: 8 }, camNear: { value: 0.1 }, camFar: { value: 400 },
      powerOn: { value: 1 }, powerOff: { value: 0 }, subsAlpha: { value: 1 }, saturation: { value: 1 },
      tint: { value: new THREE.Vector3(1, 1, 1) }, subsRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    });
  }

  pass(mat, target) {
    this.quad.material = mat;
    this.r.setRenderTarget(target);
    this.r.render(this.qscene, this.cam);
  }

  blur(src, tmp, w, h, scale = 1) {
    this.mBlur.uniforms.tSrc.value = src.texture; this.mBlur.uniforms.dir.value.set(scale / w, 0); this.pass(this.mBlur, tmp);
    this.mBlur.uniforms.tSrc.value = tmp.texture; this.mBlur.uniforms.dir.value.set(0, scale / h); this.pass(this.mBlur, src);
  }

  // p: { bloom, threshold, exposure, ca, grain, scan, vignette, glitch, fade, flash, dof:{amount,focus,range}, powerOn, powerOff, tint, saturation }
  render(scene, camera, overlayTex, subsTex, subsRect, p, t, frame) {
    const r = this.r;
    r.setRenderTarget(this.rtScene);
    r.setClearColor(0x000000, 1);
    r.clear(true, true, true);
    r.render(scene, camera);

    // bloom chain
    const L = this.levels;
    this.mDown.uniforms.useThreshold.value = 1;
    this.mDown.uniforms.threshold.value = p.threshold ?? 0.75;
    this.mDown.uniforms.knee.value = 0.35;
    this.mDown.uniforms.tSrc.value = this.rtScene.texture; this.mDown.uniforms.texel.value.set(1 / this.w, 1 / this.h);
    this.pass(this.mDown, L[0].a);
    this.mDown.uniforms.useThreshold.value = 0;
    for (let i = 1; i < L.length; i++) {
      this.mDown.uniforms.tSrc.value = L[i - 1].a.texture; this.mDown.uniforms.texel.value.set(0.5 / L[i - 1].w, 0.5 / L[i - 1].h);
      this.pass(this.mDown, L[i].a);
    }
    for (let i = 0; i < L.length; i++) this.blur(L[i].a, L[i].b, L[i].w, L[i].h, i === 0 ? 1.0 : 1.4);
    for (let i = L.length - 1; i > 0; i--) {
      this.mUp.uniforms.tSmall.value = L[i].a.texture; this.mUp.uniforms.tBig.value = L[i - 1].a.texture;
      this.mUp.uniforms.texel.value.set(1 / L[i].w, 1 / L[i].h); this.mUp.uniforms.wSmall.value = 1.15;
      this.pass(this.mUp, L[i - 1].b);
      // copy back into a for next iteration
      const tmp = L[i - 1].a; L[i - 1].a = L[i - 1].b; L[i - 1].b = tmp;
    }

    // depth of field source (quarter-res blurred scene)
    const dof = p.dof && p.dof.amount > 0 ? p.dof : null;
    if (dof) {
      this.mDown.uniforms.useThreshold.value = 0;
      this.mDown.uniforms.tSrc.value = this.rtScene.texture; this.mDown.uniforms.texel.value.set(1.5 / this.w, 1.5 / this.h);
      this.pass(this.mDown, this.dofA);
      this.blur(this.dofA, this.dofB, this.w >> 2, this.h >> 2, 1.2);
      this.blur(this.dofA, this.dofB, this.w >> 2, this.h >> 2, 2.2);
    }

    const u = this.mComp.uniforms;
    u.tScene.value = this.rtScene.texture; u.tDepth.value = this.rtScene.depthTexture; u.tBloom.value = L[0].a.texture;
    u.tDof.value = this.dofA.texture; u.tSubs.value = subsTex; u.tOverlay.value = overlayTex; u.ovGain.value = p.ovGain ?? 0.85;
    u.time.value = t; u.frame.value = frame;
    u.bloomStrength.value = p.bloom ?? 1.0; u.exposure.value = p.exposure ?? 1.0; u.ca.value = p.ca ?? 1.0;
    u.grain.value = p.grain ?? 0.045; u.scan.value = p.scan ?? 0.05; u.vignette.value = p.vignette ?? 0.5;
    u.glitch.value = p.glitch ?? 0; u.glitchSeed.value = Math.floor(t * 24) % 997; u.fade.value = p.fade ?? 0; u.flash.value = p.flash ?? 0;
    u.dofAmount.value = dof ? dof.amount : 0; u.focusDist.value = dof ? dof.focus : 10; u.focusRange.value = dof ? dof.range : 10;
    u.camNear.value = camera.near; u.camFar.value = camera.far;
    u.powerOn.value = p.powerOn ?? 1; u.powerOff.value = p.powerOff ?? 0; u.saturation.value = p.saturation ?? 1;
    const tn = p.tint || [1, 1, 1]; u.tint.value.set(tn[0], tn[1], tn[2]);
    u.subsAlpha.value = subsTex ? (p.subsAlpha ?? 1) : 0;
    if (subsRect) u.subsRect.value.set(subsRect[0], subsRect[1], subsRect[2], subsRect[3]);
    this.pass(this.mComp, null);
  }
}
