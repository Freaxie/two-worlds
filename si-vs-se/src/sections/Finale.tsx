import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '../components/common'
import './Finale.css'

const KEEP = 7000 // ms a trace is remembered

/* The last diagram is drawn by the visitor: the red point is where you touch the page now;
   the green line is everything you have touched, fading slowly rather than at once. */
function Touch() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const styles = getComputedStyle(document.documentElement)
    const SI = styles.getPropertyValue('--si').trim() || '#1d4a33'
    const SE = styles.getPropertyValue('--se').trim() || '#f2301b'
    const pts: { x: number; y: number; t: number }[] = []
    let last = 0
    let raf = 0
    let visible = false

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = c.clientWidth * dpr
      c.height = c.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const onMove = (e: PointerEvent) => {
      const b = c.getBoundingClientRect()
      if (e.clientY < b.top || e.clientY > b.bottom) return
      pts.push({ x: e.clientX - b.left, y: e.clientY - b.top, t: performance.now() })
      last = performance.now()
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible) return
      const w = c.clientWidth
      const h = c.clientHeight
      // when nobody is touching, the page traces a slow figure of its own
      if (now - last > 2500 && !reduce) {
        const s = now / 1000
        pts.push({ x: w * (0.5 + 0.36 * Math.sin(s * 0.7)), y: h * (0.5 + 0.3 * Math.sin(s * 1.1 + 1)), t: now })
      }
      while (pts.length && now - pts[0].t > KEEP) pts.shift()
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < pts.length; i++) {
        const a = 1 - (now - pts[i].t) / KEEP
        ctx.strokeStyle = SI
        ctx.globalAlpha = a * a * 0.9
        ctx.lineWidth = 1 + a * 3
        ctx.beginPath()
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
        ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke()
        // echoes: the path is remembered slightly displaced, as memory is
        if (i % 3 === 0) {
          ctx.globalAlpha = a * 0.25
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pts[i - 1].x - 10 * (1 - a) * 3, pts[i - 1].y + 8 * (1 - a) * 3)
          ctx.lineTo(pts[i].x - 10 * (1 - a) * 3, pts[i].y + 8 * (1 - a) * 3)
          ctx.stroke()
        }
      }
      const p = pts[pts.length - 1]
      if (p) {
        ctx.globalAlpha = 1
        ctx.fillStyle = SE
        ctx.beginPath()
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = SE
        ctx.lineWidth = 1
        const pulse = (now % 900) / 900
        ctx.globalAlpha = 1 - pulse
        ctx.beginPath()
        ctx.arc(p.x, p.y, 7 + pulse * 26, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(draw)

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(c)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [reduce])

  return <canvas ref={canvas} className="fin__canvas" aria-hidden="true" />
}

export function Finale() {
  return (
    <section className="fin" id="finale" aria-label="Coda">
      <Touch />
      <div className="wrap fin__inner">
        <p className="label fin__eyebrow">Room 08 — Coda · move across the page</p>
        <blockquote className="fin__quote">
          <motion.p
            className="fin__line fin__line--si"
            initial={{ opacity: 0, filter: 'blur(12px)', x: -30 }}
            whileInView={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 2.4, ease: EASE }}
          >
            One remembers the <em>texture</em> of reality.
          </motion.p>
          <motion.p
            className="fin__line fin__line--se"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0, delay: 1.6 }}
          >
            The other touches it <em>directly.</em>
          </motion.p>
        </blockquote>
      </div>
      <footer className="wrap fin__foot">
        <p className="label">
          <span className="si">Si</span> vs <span className="se">Se</span> — an exhibition in eight rooms on two ways of experiencing reality.
        </p>
        <p className="label muted">Set in Inter Tight, Instrument Serif &amp; JetBrains Mono</p>
        <a className="label fin__top" href="#top">
          Return to the beginning ↑
        </a>
      </footer>
    </section>
  )
}
