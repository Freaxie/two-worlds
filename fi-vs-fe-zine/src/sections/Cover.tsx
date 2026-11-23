import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { ColorBars, Crops, EASE, RegMark, Tape } from '../components/print'
import './Cover.css'

/* The cover is printed in two passes. The blue plate lands first; the pink
   plate arrives out of register and settles almost — never perfectly — on top. */
export function Cover() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  // The pink plate drifts with the hand: registration is never fixed
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 60, damping: 16 })
  const sy = useSpring(py, { stiffness: 60, damping: 16 })
  useEffect(() => {
    if (reduce || window.matchMedia('(pointer: coarse)').matches) return
    const on = (e: PointerEvent) => {
      px.set(((e.clientX / window.innerWidth) * 2 - 1) * 9)
      py.set(((e.clientY / window.innerHeight) * 2 - 1) * 6)
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [px, py, reduce])

  // Scrolling away separates the plates onto their own pages
  const fiX = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const feX = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120])
  const feTotalX = useTransform([feX, sx] as MotionValue<number>[], ([a, b]: number[]) => a + b)

  return (
    <header ref={ref} id="cover" className="cover" aria-labelledby="cover-title">
      <div className="cover__sheet sheet">
        <Crops />

        <div className="cover__mast">
          <span className="caps">Issue 01</span>
          <span className="caps cover__mast-mid">A zine in two inks · 16 pp.</span>
          <ColorBars />
        </div>

        <h1 id="cover-title" className="cover__title">
          <span className="sr-only">Fi versus Fe</span>

          {/* Plate A — Fi, Inner Blue */}
          <motion.span className="cover__plate cover__plate--fi" style={{ x: fiX }} aria-hidden="true">
            <svg className="cover__dots cover__dots--fi" viewBox="0 0 600 600">
              <g filter="url(#ht-blue)">
                <circle cx="300" cy="300" r="290" fill="url(#soft)" />
              </g>
            </svg>
            <motion.span
              className="cover__word poster rough"
              initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
            >
              Fi
            </motion.span>
          </motion.span>

          {/* Plate B — Fe, Shared Pink */}
          <motion.span className="cover__plate cover__plate--fe" style={{ x: feTotalX, y: sy }} aria-hidden="true">
            <motion.span
              className="cover__plate-in"
              initial={{ x: reduce ? 0 : 46, y: reduce ? 0 : -22, opacity: 0 }}
              animate={{ x: 4, y: 3, opacity: 1 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.7 }}
            >
              <svg className="cover__dots cover__dots--fe" viewBox="0 0 600 600">
                <g filter="url(#ht-pink)">
                  <circle cx="200" cy="230" r="150" fill="url(#soft-flat)" />
                  <circle cx="390" cy="210" r="120" fill="url(#soft-flat)" />
                  <circle cx="330" cy="400" r="170" fill="url(#soft-flat)" />
                  <circle cx="150" cy="420" r="100" fill="url(#soft-flat)" />
                </g>
              </svg>
              <span className="cover__word poster rough">Fe</span>
            </motion.span>
          </motion.span>

          <motion.span
            className="cover__vs"
            aria-hidden="true"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.8, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -7 }}
            transition={{ duration: 0.28, ease: [0.5, 0, 0.75, 0], delay: 1.5 }}
          >
            vs
          </motion.span>
        </h1>

        <div className="cover__foot">
          <p className="cover__sub">
            Two ways of navigating <em>what matters.</em>
          </p>

          <div className="cover__slips">
            <motion.div
              className="slip cover__slip cover__slip--fi"
              initial={{ opacity: 0, y: reduce ? 0 : 20, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ duration: 0.6, ease: EASE, delay: 1.8 }}
            >
              <Tape style={{ top: -12, left: 24, transform: 'rotate(-4deg)' }} />
              <span className="caps">
                <span className="mark mark--blue">Fi</span> Inner values
              </span>
              <p>“What feels true to me?”</p>
            </motion.div>
            <motion.div
              className="slip cover__slip cover__slip--fe"
              initial={{ opacity: 0, y: reduce ? 0 : 20, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 1.5 }}
              transition={{ duration: 0.6, ease: EASE, delay: 2 }}
            >
              <Tape style={{ top: -12, right: 22, transform: 'rotate(5deg)' }} />
              <span className="caps">
                <span className="mark mark--pink">Fe</span> Shared values
              </span>
              <p>“What matters to us?”</p>
            </motion.div>
          </div>
        </div>

        <div className="cover__reg cover__reg--l">
          <RegMark />
        </div>
        <div className="cover__reg cover__reg--r">
          <RegMark />
        </div>
      </div>
    </header>
  )
}
