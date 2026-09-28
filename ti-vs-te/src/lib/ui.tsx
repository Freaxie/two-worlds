import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import './ui.css'

export const EASE = [0.2, 0.7, 0.1, 1] as const

/* ---------- Reveal: restrained scroll-triggered entrance ---------- */

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'span' | 'figure' | 'header'
}

export function Reveal({ children, delay = 0, y = 20, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: reduce ? 0.2 : 0.9, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </Comp>
  )
}

/* ---------- Masked line-by-line reveal for display type ---------- */

export function Lines({ lines, stagger = 0.1 }: { lines: ReactNode[]; stagger?: number }) {
  return (
    <>
      {lines.map((l, i) => (
        <span className="line-mask" key={i}>
          <motion.span
            className="line-inner"
            initial={{ y: '105%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 1, ease: EASE, delay: i * stagger }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </>
  )
}

/* ---------- Part header: numeral, running label, title ---------- */

type PartHeadProps = {
  id: string
  n: string
  name: string
  title: ReactNode
  lede?: ReactNode
  tone?: 'paper' | 'ink'
}

export function PartHead({ id, n, name, title, lede, tone = 'paper' }: PartHeadProps) {
  return (
    <header className={`part-head part-head--${tone} grid`}>
      <Reveal className="part-head__meta" y={0}>
        <span className="label">Part {n}</span>
        <motion.span
          className="part-head__rule"
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <span className="label">{name}</span>
      </Reveal>
      <h2 id={`${id}-title`} className="part-head__title display">
        <Lines lines={Array.isArray(title) ? title : [title]} />
      </h2>
      {lede && (
        <Reveal className="part-head__lede" delay={0.2}>
          <p className="lede">{lede}</p>
        </Reveal>
      )}
    </header>
  )
}

/* ---------- The two marks used everywhere ----------
   Ti is a closed loop (the idea must close on itself);
   Te is a vector (the idea must leave and land somewhere). */

export function Mark({ who, size = 14 }: { who: 'ti' | 'te'; size?: number }) {
  return who === 'ti' ? (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="mark mark--ti">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="mark mark--te">
      <path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function Tag({ who, children }: { who: 'ti' | 'te'; children?: ReactNode }) {
  return (
    <span className={`tag tag--${who}`}>
      <Mark who={who} size={12} />
      <span className="label">{who === 'ti' ? 'Ti' : 'Te'}</span>
      {children && <span className="label tag__extra">{children}</span>}
    </span>
  )
}

export function Guides() {
  return (
    <div className="guides" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  )
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
