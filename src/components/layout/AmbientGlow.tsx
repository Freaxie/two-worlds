import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useSettings } from '../../lib/settings'
import { useMedia } from '../../lib/hooks'

/** a soft lantern of light that trails the mouse; never shown for touch, calm mode or ambient-off */
export function AmbientGlow() {
  const { ambientOn } = useSettings()
  const fine = useMedia('(pointer: fine)')
  const x = useMotionValue(-600)
  const y = useMotionValue(-600)
  const sx = useSpring(x, { stiffness: 60, damping: 20, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 60, damping: 20, mass: 0.6 })
  const enabled = ambientOn && fine

  useEffect(() => {
    if (!enabled) return
    const on = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[45] size-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
      style={{
        x: sx,
        y: sy,
        background: 'radial-gradient(closest-side, rgb(244 179 99 / 0.045), rgb(169 156 245 / 0.03) 45%, transparent 100%)',
      }}
    />
  )
}
