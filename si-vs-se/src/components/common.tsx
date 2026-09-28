import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import './common.css'

/* Two motion vocabularies. Si settles slowly, as if checking against a reference;
   Se lands at once, with no lag between event and registration. */
export const EASE = [0.2, 0.7, 0.1, 1] as const
export const SI_SPRING = { type: 'spring', stiffness: 38, damping: 16, mass: 1.6 } as const
export const SE_SPRING = { type: 'spring', stiffness: 700, damping: 34, mass: 0.4 } as const

/* ---------- Reveal: scroll-triggered entrance ---------- */

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

/* ---------- Room header ---------- */

type RoomHeadProps = {
  n: string
  name: string
  title: ReactNode
  lede?: ReactNode
  tone?: 'paper' | 'ink'
}

export function RoomHead({ n, name, title, lede, tone = 'paper' }: RoomHeadProps) {
  return (
    <header className={`room-head room-head--${tone} grid`}>
      <Reveal className="room-head__n" y={0}>
        <span aria-hidden="true">{n}</span>
      </Reveal>
      <div className="room-head__body">
        <Reveal className="room-head__eyebrow">
          <span className="label">Room {n}</span>
          <span className="room-head__dash" aria-hidden="true" />
          <span className="label">{name}</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="room-head__title">{title}</h2>
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

/* ---------- Function tag ---------- */

export function Tag({ f, children }: { f: 'si' | 'se'; children?: ReactNode }) {
  return (
    <span className={`tag tag--${f}`}>
      <span className="tag__mark" aria-hidden="true" />
      <span className="label">{f === 'si' ? 'Si — Experienced' : 'Se — Immediate'}</span>
      {children && <span className="label muted tag__extra">{children}</span>}
    </span>
  )
}

/* ---------- Hooks ---------- */

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

/* The present, as a value that keeps changing. */
export function useNow(interval = 1000, active = true) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(new Date()), interval)
    return () => window.clearInterval(id)
  }, [interval, active])
  return now
}

export const pad = (n: number, l = 2) => String(Math.floor(n)).padStart(l, '0')

export function timecode(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds() / 10)}`
}

/* Deterministic pseudo-random, so diagrams look hand-set but render the same every time. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* A running timecode, isolated so only it re-renders. */
export function Clock({ interval = 47 }: { interval?: number }) {
  const reduce = useReducedMotion()
  const now = useNow(reduce ? 1000 : interval)
  return <span aria-hidden="true" className="clock">{timecode(now)}</span>
}
