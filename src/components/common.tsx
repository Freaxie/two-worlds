import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import './common.css'

export const EASE = [0.2, 0.7, 0.1, 1] as const

/* ---------- Reveal: restrained scroll-triggered entrance ---------- */

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'section' | 'figure' | 'blockquote' | 'span'
}

export function Reveal({ children, delay = 0, y = 18, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: reduce ? 0.2 : 0.9, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </Comp>
  )
}

/* ---------- Line-by-line text reveal ---------- */

export function Lines({ lines, className, stagger = 0.12 }: { lines: ReactNode[]; className?: string; stagger?: number }) {
  return (
    <span className={className}>
      {lines.map((l, i) => (
        <span className="line-mask" key={i}>
          <Reveal as="span" className="line-inner" delay={i * stagger} y={28}>
            {l}
          </Reveal>
        </span>
      ))}
    </span>
  )
}

/* ---------- Room header ---------- */

type RoomHeaderProps = {
  numeral: string
  name: string
  greek: string
  greekGloss: string
  title: ReactNode
  lede?: ReactNode
  tone?: 'paper' | 'night'
}

export function RoomHeader({ numeral, name, greek, greekGloss, title, lede, tone = 'paper' }: RoomHeaderProps) {
  return (
    <header className={`room-head room-head--${tone} grid`}>
      <Reveal className="room-head__num" y={0}>
        <span aria-hidden="true">{numeral}</span>
      </Reveal>
      <div className="room-head__meta">
        <Reveal className="room-head__eyebrow">
          <span className="label">Room {numeral}</span>
          <span className="room-head__dash" aria-hidden="true" />
          <span className="label">{name}</span>
          <span className="room-head__greek greek" lang="grc" title={greekGloss}>
            {greek}
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="room-head__title display">{title}</h2>
        </Reveal>
        {lede && (
          <Reveal delay={0.16}>
            <div className="lede room-head__lede">{lede}</div>
          </Reveal>
        )}
      </div>
    </header>
  )
}

/* ---------- Side label (PLATO / ARISTOTLE) ---------- */

export function Side({ who, children }: { who: 'plato' | 'aris'; children?: ReactNode }) {
  return (
    <div className={`side-tag side-tag--${who}`}>
      <span className="side-tag__mark" aria-hidden="true" />
      <span className="label">{who === 'plato' ? 'Plato' : 'Aristotle'}</span>
      {children && <span className="side-tag__extra label label--muted">{children}</span>}
    </div>
  )
}

/* ---------- Lens context: dims one tradition across the whole exhibition ---------- */

export type Lens = 'none' | 'plato' | 'aris'
const LensCtx = createContext<{ lens: Lens; setLens: (l: Lens) => void }>({ lens: 'none', setLens: () => {} })

export function LensProvider({ children }: { children: ReactNode }) {
  const [lens, setLens] = useState<Lens>('none')
  useEffect(() => {
    const root = document.documentElement
    if (lens === 'none') root.removeAttribute('data-lens')
    else root.setAttribute('data-lens', lens)
  }, [lens])
  return <LensCtx.Provider value={{ lens, setLens }}>{children}</LensCtx.Provider>
}

export const useLens = () => useContext(LensCtx)

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
