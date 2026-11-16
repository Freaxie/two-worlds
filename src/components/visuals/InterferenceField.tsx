import { useEffect, useRef, type RefObject } from 'react'
import { useSettings } from '../../lib/settings'

/* ------------------------------------------------------------------
   INTERFERENCE FIELD
   Two wave sources share one field. Where their peaks meet they
   amplify; where a peak meets a trough they cancel. The combined
   field is drawn as iso-lines — a topographic reading of interference.
   Violet = autism-associated source, cyan = ADHD-associated source,
   amber = where both are equally strong.
------------------------------------------------------------------- */

export type FieldParams = {
  /** normalised source positions, origin top-left */
  a: [number, number]
  b: [number, number]
  ampA: number
  ampB: number
  freqA?: number
  freqB?: number
  /** iso-line density */
  lines?: number
  glow?: number
  vignette?: number
  /** pattern scale as a fraction of the canvas' shorter side */
  scale?: number
  /** which source drifts toward the pointer (hero only) */
  follow?: 'a' | 'b' | null
  /** let source A wander slowly on its own */
  wander?: boolean
  bg?: [number, number, number]
  /** frozen time used when motion is off */
  stillTime?: number
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uA;
uniform vec2 uB;
uniform vec2 uAmp;
uniform vec2 uFreq;
uniform float uScale;
uniform float uLines;
uniform float uGlow;
uniform float uVignette;
uniform float uLineW;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform vec3 uBg;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 p = gl_FragCoord.xy;
  float da = length(p - uA) / uScale;
  float db = length(p - uB) / uScale;

  // each source is strong nearby and fades into the dark
  float ea = uAmp.x / (1.0 + da * da * 3.4);
  float eb = uAmp.y / (1.0 + db * db * 3.4);

  float wa = sin(da * uFreq.x - uTime * 0.8) * ea;
  float wb = sin(db * uFreq.y - uTime * 1.05 + 1.7) * eb;
  float h = wa + wb;

  // iso-lines of the summed field
  float v = h * uLines;
#ifdef GL_OES_standard_derivatives
  float fw = max(fwidth(v), 1e-4);
#else
  float fw = 0.035;
#endif
  float dist = abs(fract(v + 0.5) - 0.5) / fw;
  float line = 1.0 - smoothstep(uLineW * 0.5, uLineW * 0.5 + 0.9, dist);
  // where levels crowd closer than ~2px, fade lines out (prevents moire)
  line *= 1.0 - smoothstep(0.24, 0.6, fw);

  float strength = ea + eb;
  float vis = smoothstep(0.03, 0.42, strength);
  float bright = 0.16 + 0.6 * clamp(strength, 0.0, 1.25);

  // colour by each source's smooth reach, not by the oscillating wave
  float t = eb / (ea + eb + 1e-4);
  vec3 col = mix(uColA, uColB, smoothstep(0.28, 0.72, t));
  // where both reach equally and strongly: amber, the overlap
  float balance = 1.0 - abs(2.0 * t - 1.0);
  float overlap = balance * balance * smoothstep(0.08, 0.42, min(ea, eb));
  col = mix(col, uColC, overlap * 0.9);

  vec3 c = uBg;
  c += uColA * 0.11 * ea * ea + uColB * 0.095 * eb * eb;
  c += col * uGlow * pow(abs(h), 1.8) * 0.11;
  c += col * line * vis * bright;

  vec2 uv = gl_FragCoord.xy / uRes;
  float vg = smoothstep(1.3, 0.2, length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0)));
  c = mix(uBg, c, mix(1.0, vg, uVignette));

  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}
`

const VIOLET: [number, number, number] = [0.663, 0.612, 0.961]
const CYAN: [number, number, number] = [0.384, 0.89, 0.933]
const AMBER: [number, number, number] = [0.957, 0.702, 0.388]
const NIGHT: [number, number, number] = [0.027, 0.035, 0.078]

type Props = {
  params: FieldParams
  className?: string
  /** element whose bounds count as "inside" for pointer following (defaults to canvas) */
  pointerArea?: RefObject<HTMLElement | null>
}

export function InterferenceField({ params, className = '', pointerArea }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef(params)
  paramsRef.current = params
  const { calm, ambientOn, lite } = useSettings()
  const modeRef = useRef({ animate: ambientOn, calm, lite })
  modeRef.current = { animate: ambientOn, calm, lite }
  const kickRef = useRef<() => void>(() => {})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' })
    if (!gl) return
    gl.getExtension('OES_standard_derivatives')

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Interference shader failed:', gl.getShaderInfoLog(s))
        return null
      }
      return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const U = (n: string) => gl.getUniformLocation(prog, n)
    const u = {
      res: U('uRes'), time: U('uTime'), a: U('uA'), b: U('uB'), amp: U('uAmp'), freq: U('uFreq'),
      scale: U('uScale'), lines: U('uLines'), glow: U('uGlow'), vignette: U('uVignette'), lineW: U('uLineW'),
      colA: U('uColA'), colB: U('uColB'), colC: U('uColC'), bg: U('uBg'),
    }
    gl.uniform3fv(u.colA, VIOLET)
    gl.uniform3fv(u.colB, CYAN)
    gl.uniform3fv(u.colC, AMBER)

    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, modeRef.current.lite ? 1.25 : 2)
      // keep very large screens within a sane pixel budget
      const budget = 3.2e6
      if (r.width * r.height * dpr * dpr > budget) dpr = Math.sqrt(budget / Math.max(1, r.width * r.height))
      w = Math.max(1, Math.round(r.width * dpr))
      h = Math.max(1, Math.round(r.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
    }

    // smoothed state
    const p0 = paramsRef.current
    const s = {
      ax: p0.a[0], ay: p0.a[1], bx: p0.b[0], by: p0.b[1], ampA: p0.ampA, ampB: p0.ampB,
      time: p0.stillTime ?? 6.2,
    }
    let pointer: [number, number] | null = null
    let inView = true
    let raf = 0
    let last = 0
    let frame = 0

    const draw = () => {
      const p = paramsRef.current
      gl.uniform2f(u.res, w, h)
      gl.uniform1f(u.time, s.time)
      gl.uniform2f(u.a, s.ax * w, (1 - s.ay) * h)
      gl.uniform2f(u.b, s.bx * w, (1 - s.by) * h)
      gl.uniform2f(u.amp, s.ampA, s.ampB)
      gl.uniform2f(u.freq, p.freqA ?? 15, p.freqB ?? 18)
      gl.uniform1f(u.scale, Math.min(w, h) * (p.scale ?? 0.5))
      gl.uniform1f(u.lines, p.lines ?? 3.2)
      gl.uniform1f(u.glow, p.glow ?? 1)
      gl.uniform1f(u.vignette, p.vignette ?? 0.6)
      gl.uniform1f(u.lineW, 0.85 * dpr)
      gl.uniform3fv(u.bg, p.bg ?? NIGHT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const step = (dt: number) => {
      const p = paramsRef.current
      const { animate } = modeRef.current
      let tax = p.a[0]
      let tay = p.a[1]
      let tbx = p.b[0]
      let tby = p.b[1]
      if (animate) {
        s.time += dt
        if (p.wander) {
          tax += Math.sin(s.time * 0.11) * 0.025
          tay += Math.cos(s.time * 0.083) * 0.03
        }
        if (p.follow && pointer) {
          const k = 0.72
          if (p.follow === 'b') {
            tbx += (pointer[0] - tbx) * k
            tby += (pointer[1] - tby) * k
          } else {
            tax += (pointer[0] - tax) * k
            tay += (pointer[1] - tay) * k
          }
        }
      } else {
        s.time = p.stillTime ?? 6.2
      }
      // novelty chases quickly; structure moves slowly
      const ka = animate ? 1 - Math.pow(0.985, dt * 60) : 1
      const kb = animate ? 1 - Math.pow(0.955, dt * 60) : 1
      const kamp = animate ? 1 - Math.pow(0.9, dt * 60) : 1
      s.ax += (tax - s.ax) * ka
      s.ay += (tay - s.ay) * ka
      s.bx += (tbx - s.bx) * kb
      s.by += (tby - s.by) * kb
      s.ampA += (p.ampA - s.ampA) * kamp
      s.ampB += (p.ampB - s.ampB) * kamp
      return Math.abs(p.ampA - s.ampA) + Math.abs(p.ampB - s.ampB) + Math.abs(tbx - s.bx) + Math.abs(tby - s.by) + Math.abs(tax - s.ax) < 0.002
    }

    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      frame++
      const settled = step(dt)
      // phones: render at ~30fps to save battery
      if (!(modeRef.current.lite && frame % 2)) draw()
      const keepGoing = inView && (modeRef.current.animate || !settled)
      if (keepGoing) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const kick = () => {
      if (!raf && inView) raf = requestAnimationFrame(tick)
    }
    kickRef.current = kick

    resize()
    draw()
    kick()

    const ro = new ResizeObserver(() => {
      resize()
      draw()
      kick()
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      if (inView) kick()
    })
    io.observe(canvas)

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !paramsRef.current.follow) return
      const area = pointerArea?.current ?? canvas
      const r = area.getBoundingClientRect()
      const cr = canvas.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        pointer = null
      } else {
        pointer = [(e.clientX - cr.left) / cr.width, (e.clientY - cr.top) / cr.height]
      }
      kick()
    }
    const onLeave = () => {
      pointer = null
      kick()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
      inView = false
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onLost)
      // free GPU objects but keep the context: StrictMode re-mounts on the same canvas
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [pointerArea])

  // any prop or mode change: wake the loop so the field eases to its new state
  useEffect(() => {
    kickRef.current()
  })

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}
