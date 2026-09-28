import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from 'react'
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import './common.css'

export const EASE = [0.2, 0.7, 0.1, 1] as const

/* ---------- Reveal: restrained scroll-triggered entrance ---------- */

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'span' | 'figure' | 'blockquote'
}

export function Reveal({ children, delay = 0, y = 22, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: reduce ? 0.2 : 1, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </Comp>
  )
}

/* ---------- Line-by-line masked text reveal ---------- */

export function Lines({ lines, className, stagger = 0.1 }: { lines: ReactNode[]; className?: string; stagger?: number }) {
  return (
    <span className={className}>
      {lines.map((l, i) => (
        <span className="line-mask" key={i}>
          <Reveal as="span" className="line-inner" delay={i * stagger} y={60}>
            {l}
          </Reveal>
        </span>
      ))}
    </span>
  )
}

/* ---------- Section header: numeral, name, title ---------- */

type HeadProps = {
  n: string
  name: string
  title: ReactNode
  lede?: ReactNode
  className?: string
}

export function SectionHead({ n, name, title, lede, className = '' }: HeadProps) {
  return (
    <header className={`s-head grid ${className}`}>
      <Reveal className="s-head__num" y={0}>
        <span aria-hidden="true">{n}</span>
      </Reveal>
      <div className="s-head__meta">
        <Reveal className="s-head__eyebrow">
          <span className="label">{n}</span>
          <span className="s-head__dash" aria-hidden="true" />
          <span className="label">{name}</span>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="s-head__title display">{title}</h2>
        </Reveal>
        {lede && (
          <Reveal delay={0.14}>
            <div className="lede s-head__lede">{lede}</div>
          </Reveal>
        )}
      </div>
    </header>
  )
}

/* ---------- Tags ---------- */

export function Tag({ who, children }: { who: 'fi' | 'fe'; children?: ReactNode }) {
  return (
    <span className={`tag tag--${who}`}>
      <span className="tag__mark" aria-hidden="true" />
      <span className="label">{who === 'fi' ? 'Fi' : 'Fe'}</span>
      {children && <span className="label label--muted tag__extra">{children}</span>}
    </span>
  )
}

/* ---------- Living time: a clock that only ticks while its figure is on screen ---------- */

export function useLiveTime(ref: RefObject<Element | null>, speed = 1): MotionValue<number> {
  const t = useMotionValue(0)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { margin: '20% 0px 20% 0px' })
  useAnimationFrame((_, delta) => {
    if (!inView || reduce) return
    t.set(t.get() + (Math.min(delta, 64) / 1000) * speed)
  })
  return t
}

/* A path whose outline is recomputed from a motion value — no React re-renders */
export function LivePath({ source, d, ...rest }: { source: MotionValue<number>; d: (v: number) => string } & Omit<ComponentProps<typeof motion.path>, 'd'>) {
  const path = useTransform(source, d)
  return <motion.path d={path} {...rest} />
}

/* ---------- Abstract human figure: a head and the curve of the shoulders ---------- */

export function figurePath(x: number, y: number, s = 1) {
  // (x, y) is the centre of the head; shoulders sit below as a soft arch
  const w = 30 * s
  const top = y + 20 * s
  const base = y + 58 * s
  return `M${x - w},${base} C${x - w},${top + 8 * s} ${x - w * 0.55},${top} ${x},${top} C${x + w * 0.55},${top} ${x + w},${top + 8 * s} ${x + w},${base} Z`
}

type FigureProps = {
  x: number
  y: number
  s?: number
  fill?: string
  stroke?: string
  className?: string
  opacity?: number | MotionValue<number>
}

export function Figure({ x, y, s = 1, fill = 'currentColor', stroke = 'none', className, opacity = 1 }: FigureProps) {
  return (
    <motion.g className={className} style={{ opacity }}>
      <circle cx={x} cy={y} r={13 * s} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <path d={figurePath(x, y, s)} fill={fill} stroke={stroke} strokeWidth={1.2} />
    </motion.g>
  )
}

/* ---------- Media query hook ---------- */

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

/* ---------- Pointer parallax: a normalised [-1, 1] pointer position ---------- */

export function usePointer() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ref = useRef({ x, y })
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const on = (e: PointerEvent) => {
      x.set((e.clientX / window.innerWidth) * 2 - 1)
      y.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [x, y])
  return ref.current
}
