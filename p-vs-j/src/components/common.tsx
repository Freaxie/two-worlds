import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, type MotionValue } from 'framer-motion'
import './common.css'

export const EASE = [0.22, 0.8, 0.1, 1] as const

/* ---------- Deterministic randomness: every diagram draws the same way twice ---------- */

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Maps a global 0–1 progress onto a local 0–1 window [a, b] */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

/* ---------- Reveal: restrained entrance on scroll ---------- */

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'span' | 'figure'
}

export function Reveal({ children, delay = 0, y = 22, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: reduce ? 0.2 : 1, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </Comp>
  )
}

/* ---------- Section head: index, room name, title ---------- */

type HeadProps = {
  index: string
  name: string
  title: ReactNode
  lede?: ReactNode
  tone?: 'paper' | 'dark'
}

export function SectionHead({ index, name, title, lede, tone = 'paper' }: HeadProps) {
  return (
    <header className={`shead shead--${tone} grid`}>
      <Reveal className="shead__meta" y={0}>
        <span className="shead__index display" aria-hidden="true">
          {index}
        </span>
        <span className="label">
          Room {index} <span className="shead__slash">/</span> {name}
        </span>
      </Reveal>
      <div className="shead__main">
        <Reveal delay={0.06}>
          <h2 className="shead__title display">{title}</h2>
        </Reveal>
        {lede && (
          <Reveal delay={0.14}>
            <div className="lede shead__lede">{lede}</div>
          </Reveal>
        )}
      </div>
    </header>
  )
}

export function Chip({ who, children }: { who: 'j' | 'p'; children?: ReactNode }) {
  return (
    <span className="chip label">
      <span className={`chip__mark chip__mark--${who}`} aria-hidden="true" />
      {children ?? (who === 'j' ? 'J — Closure' : 'P — Openness')}
    </span>
  )
}

/* ---------- Hooks ---------- */

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>['offset']>

/**
 * Mirrors a motion value into React state, at most once per frame. Diagrams with many
 * interdependent marks are easier to express as a pure function of one number `t`.
 */
export function useFrameValue(mv: MotionValue<number>) {
  const [v, setV] = useState(mv.get())
  useEffect(() => {
    let raf = 0
    const unsub = mv.on('change', (x) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setV(x))
    })
    setV(mv.get())
    return () => {
      unsub()
      cancelAnimationFrame(raf)
    }
  }, [mv])
  return v
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/**
 * A 0–1 progress value for a diagram. On wide screens it is scrubbed by scroll through
 * `ref`; on narrow screens (or with reduced motion) it plays once when the target enters view.
 */
export function useDiagramProgress(
  ref: RefObject<HTMLElement | null>,
  scrub: boolean,
  offset: ScrollOffset = ['start start', 'end end'],
  duration = 3.6
): MotionValue<number> {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset })
  const timed = useMotionValue(0)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const useScrub = scrub && !reduce

  useEffect(() => {
    if (useScrub || !inView) return
    if (reduce) {
      timed.set(1)
      return
    }
    const c = animate(timed, 1, { duration, ease: [0.4, 0, 0.2, 1] })
    return () => c.stop()
  }, [useScrub, inView, reduce, timed, duration])

  return useScrub ? scrollYProgress : timed
}
