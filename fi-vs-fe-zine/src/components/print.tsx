import { useEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, type MotionValue } from 'framer-motion'
import { C } from '../lib/organic'

export const EASE = [0.2, 0.7, 0.1, 1] as const

/* ------------------------------------------------------------------
   Print filters, defined once for the whole zine.

   Halftone: a shape is drawn as soft grey alpha, then screened through
   a field of soft dots and thresholded, so dense areas print as fat
   dots and faint areas as fine ones. Blue runs on a square screen,
   pink on a 45° screen (dots at centre and corners of each cell),
   so the two never form a moiré when they overprint.
------------------------------------------------------------------- */

const cell = (body: string, size: number) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><radialGradient id="d"><stop offset="0" stop-opacity="1"/><stop offset="1" stop-opacity="0"/></radialGradient></defs>${body}</svg>`
  )

/* Dots for one screen cell, with copies wrapped from the neighbouring cells so the tile has no seams */
function lattice(size: number, centres: [number, number][], r: number) {
  let body = ''
  for (const [cx, cy] of centres)
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) body += `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="url(#d)"/>`
  return cell(body, size)
}

const SQUARE = lattice(12, [[6, 6]], 8.1)
const DIAG = lattice(14, [[3.5, 3.5], [10.5, 10.5]], 6.6)

function Halftone({ id, color, tile, size }: { id: string; color: string; tile: string; size: number }) {
  return (
    // The region is fixed in user space so it always contains the screen's origin (0, 0);
    // a region sized to the shape would clip the dot tile away whenever the shape sits far from it.
    <filter id={id} filterUnits="userSpaceOnUse" x="-100" y="-100" width="1100" height="1000" colorInterpolationFilters="sRGB">
      <feImage href={tile} x="0" y="0" width={size} height={size} preserveAspectRatio="none" result="cell" />
      <feTile in="cell" result="screen" />
      <feComposite in="SourceAlpha" in2="screen" operator="arithmetic" k2="1" k3="1" k4="-0.5" result="sum" />
      <feComponentTransfer in="sum" result="dots">
        <feFuncA type="discrete" tableValues="0 1" />
      </feComponentTransfer>
      <feFlood floodColor={color} result="ink" />
      <feComposite in="ink" in2="dots" operator="in" />
    </filter>
  )
}

export function PrintDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <Halftone id="ht-blue" color={C.blue} tile={SQUARE} size={12} />
        <Halftone id="ht-pink" color={C.pink} tile={DIAG} size={14} />
        <Halftone id="ht-ink" color={C.ink} tile={SQUARE} size={12} />

        {/* Rough stencil edges and a little speckle where the ink skipped */}
        <filter id="ink-rough" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="11" result="s" />
          <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.25" result="holes" />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>

        {/* Soft blob used as source material for halftones */}
        <radialGradient id="soft">
          <stop offset="0" stopColor="#000" stopOpacity="1" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="soft-flat">
          <stop offset="0" stopColor="#000" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0.5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/* ---------- Sheet furniture ---------- */

export function Crops() {
  const L = 16
  const G = 10
  // [x, y, horizontal direction, vertical direction] for each corner
  const corners: [string, string, number, number][] = [
    ['0', '0', -1, -1],
    ['100%', '0', 1, -1],
    ['0', '100%', -1, 1],
    ['100%', '100%', 1, 1],
  ]
  return (
    <svg className="crops" aria-hidden="true">
      {corners.map(([x, y, h, v]) => (
        <svg key={x + y} x={x} y={y} overflow="visible">
          <g stroke={C.ink} strokeWidth="1">
            <line x1={h * G} x2={h * (G + L)} y1="0" y2="0" />
            <line y1={v * G} y2={v * (G + L)} x1="0" x2="0" />
          </g>
        </svg>
      ))}
    </svg>
  )
}

/* Registration mark: where the drums are lined up */
export function RegMark({ size = 22, color = C.ink, style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" style={style} aria-hidden="true">
      <circle r="6.5" fill="none" stroke={color} strokeWidth="1.2" />
      <line x1="-11" x2="11" y1="0" y2="0" stroke={color} strokeWidth="1.2" />
      <line y1="-11" y2="11" x1="0" x2="0" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}

/* Colour bars: the test strip a printer checks each drum against */
export function ColorBars({ className }: { className?: string }) {
  const sw = [
    { c: C.ink, n: 'K' },
    { c: C.blue, n: 'Fi' },
    { c: C.pink, n: 'Fe' },
    { c: 'over', n: 'Fi+Fe' },
  ]
  return (
    <div className={`bars ${className ?? ''}`} aria-hidden="true">
      {sw.map((s) => (
        <span key={s.n} className="bars__sw">
          {s.c === 'over' ? (
            <span className="bars__chip bars__chip--over">
              <i style={{ background: C.blue }} />
              <i style={{ background: C.pink }} />
            </span>
          ) : (
            <span className="bars__chip" style={{ background: s.c }} />
          )}
          <span className="bars__n">{s.n}</span>
        </span>
      ))}
    </div>
  )
}

/* A strip of masking tape */
export function Tape({ style, className = '' }: { style?: CSSProperties; className?: string }) {
  return <span className={`tape ${className}`} style={style} aria-hidden="true" />
}

/* ---------- A two-page spread ---------- */

type SpreadProps = {
  id: string
  folios: [number, number]
  left: ReactNode
  right: ReactNode
  className?: string
  label: string
}

export function Spread({ id, folios, left, right, className = '', label }: SpreadProps) {
  return (
    <section id={id} className={`spread ${className}`} aria-label={label}>
      <div className="sheet sheet--spread">
        <Crops />
        <div className="pages">
          <div className="page page--left">
            {left}
            <span className="folio">{folios[0]}</span>
          </div>
          <div className="page page--right">
            {right}
            <span className="folio">{folios[1]}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* A spread whose content runs across the fold as one picture */
export function WideSpread({ id, folios, children, className = '', label }: { id: string; folios: [number, number]; children: ReactNode; className?: string; label: string }) {
  return (
    <section id={id} className={`spread ${className}`} aria-label={label}>
      <div className="sheet sheet--spread">
        <Crops />
        <div className="page page--wide">
          {children}
          <span className="folio folio--l">{folios[0]}</span>
          <span className="folio folio--r">{folios[1]}</span>
        </div>
      </div>
    </section>
  )
}

/* Running head at the top of a spread */
export function Head({ pp, title, ink }: { pp: string; title: string; ink?: 'blue' | 'pink' }) {
  return (
    <div className="runhead">
      <span className="caps">pp. {pp}</span>
      <span className="runhead__rule" aria-hidden="true" />
      <span className={`caps ${ink ? `mark mark--${ink}` : ''}`}>{title}</span>
    </div>
  )
}

/* ---------- Motion helpers ---------- */

type RevealProps = { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'p' | 'li' | 'span' | 'figure' }

export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </Comp>
  )
}

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>['offset']

/* Scroll progress of any element (SVG included), smoothed like ink spreading */
export function useScrollIn(ref: RefObject<Element | null>, offset: ScrollOffset = ['start 0.95', 'center 0.5'], smooth = true) {
  const { scrollYProgress } = useScroll({ target: ref as RefObject<HTMLElement | null>, offset })
  const spring = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  return smooth ? spring : scrollYProgress
}

/* A clock that only runs while its figure is on screen */
export function useLiveTime(ref: RefObject<Element | null>, speed = 1): MotionValue<number> {
  const t = useMotionValue(0)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { margin: '15% 0px 15% 0px' })
  useAnimationFrame((_, delta) => {
    if (!inView || reduce) return
    t.set(t.get() + (Math.min(delta, 64) / 1000) * speed)
  })
  return t
}

/* Head and shoulders, cut from paper */
export function figurePath(x: number, y: number, s = 1) {
  const w = 30 * s
  const top = y + 20 * s
  const base = y + 58 * s
  return `M${x - w},${base} C${x - w},${top + 8 * s} ${x - w * 0.55},${top} ${x},${top} C${x + w * 0.55},${top} ${x + w},${top + 8 * s} ${x + w},${base} Z`
}

type FigureProps = { x: number; y: number; s?: number; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number | MotionValue<number> }

export function Figure({ x, y, s = 1, fill = C.ink, stroke = 'none', strokeWidth = 2, opacity }: FigureProps) {
  return (
    <motion.g style={{ opacity }} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
      <circle cx={x} cy={y} r={13 * s} />
      <path d={figurePath(x, y, s)} />
    </motion.g>
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
