/* ------------------------------------------------------------------
   BLUE HOUR — the lens
   One WebGL pass over the painted frame: fisheye barrel, chromatic
   fringing, bloom, a liquid ripple on every cut, grain and grade.
------------------------------------------------------------------- */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uCut;   // seconds since the last cut
uniform float uK;     // barrel strength
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

vec3 tap(vec2 uv) { return texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb; }

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 c = uv - 0.5;
  c.x *= aspect;
  float r = length(c);

  // liquid ripple that spreads from the centre on each cut
  float age = uCut;
  float amp = 0.035 * exp(-age * 7.0);
  vec2 dir = r > 0.0 ? c / r : vec2(0.0);
  float wave = sin(r * 38.0 - age * 34.0) * amp * smoothstep(0.0, 0.15, r);
  wave += sin(uv.y * 60.0 + uTime * 9.0) * amp * 0.35;
  uv += vec2(dir.x / aspect, dir.y) * wave;

  // fisheye with chromatic fringe growing toward the rim
  float ca = 0.035 + amp * 2.0;
  vec3 col;
  col.r = tap(barrel(uv, uK * (1.0 + ca))).r;
  col.g = tap(barrel(uv, uK)).g;
  col.b = tap(barrel(uv, uK * (1.0 - ca))).b;

  // bloom: gather bright light from two rings
  vec2 buv = barrel(uv, uK);
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    vec2 o = vec2(cos(a), sin(a)) / uRes * 1.0;
    vec3 s1 = tap(buv + o * 9.0);
    vec3 s2 = tap(buv + o * 26.0);
    glow += max(s1 - 0.72, 0.0) * 0.9 + max(s2 - 0.78, 0.0) * 0.7;
  }
  col += glow / 12.0 * 1.1;

  // flash on the cut
  col += vec3(0.55, 0.65, 1.0) * exp(-age * 16.0) * 0.35;

  // blue-hour grade: lifted navy shadows, cool highlights
  col = clamp(col, 0.0, 1.0);
  col = mix(vec3(0.015, 0.025, 0.11), col, 0.94 + 0.06 * col);
  col = pow(col, vec3(0.97, 0.98, 0.93));
  col = col * col * (3.0 - 2.0 * col) * 0.35 + col * 0.65;

  // lens vignette: the rim of a fisheye
  float hd = 0.5 * length(vec2(aspect, 1.0));
  float rv = r / hd;
  col *= smoothstep(1.08, 0.45, rv) * 0.85 + 0.15 * smoothstep(1.2, 0.9, rv);

  // grain
  col += (hash(uv * uRes + fract(uTime) * 91.0) - 0.5) * 0.045;
  gl_FragColor = vec4(col, 1.0);
}`

export interface Lens {
  render(src: HTMLCanvasElement, time: number, cutAge: number, k: number): void
  resize(w: number, h: number): void
}

export function createLens(canvas: HTMLCanvasElement): Lens | null {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true })
  if (!gl) return null

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  const u = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    cut: gl.getUniformLocation(prog, 'uCut'),
    k: gl.getUniformLocation(prog, 'uK'),
  }

  return {
    resize(w, h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    },
    render(src, time, cutAge, k) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.time, time)
      gl.uniform1f(u.cut, cutAge)
      gl.uniform1f(u.k, k)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
  }
}
