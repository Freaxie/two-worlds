import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { EASE, useLens } from './common'
import './Nav.css'

export type NavItem = { id: string; label: string; numeral: string }

export const NAV_LEFT: NavItem[] = [
  { id: 'ontology', label: 'Ontology', numeral: 'II' },
  { id: 'knowledge', label: 'Knowledge', numeral: 'III' },
  { id: 'form', label: 'Form & Matter', numeral: 'IV' },
  { id: 'causality', label: 'Causality', numeral: 'V' },
]
export const NAV_RIGHT: NavItem[] = [
  { id: 'soul', label: 'Soul', numeral: 'VI' },
  { id: 'ethics', label: 'Ethics', numeral: 'VII' },
  { id: 'synthesis', label: 'The Synthesis', numeral: 'X' },
]

/* every room, for the active-section tracker and the mobile index */
const ALL_ROOMS: NavItem[] = [
  { id: 'top', label: 'The Two Worlds', numeral: '' },
  { id: 'divide', label: 'The Fundamental Divide', numeral: 'I' },
  ...NAV_LEFT,
  NAV_RIGHT[0],
  NAV_RIGHT[1],
  { id: 'politics', label: 'Politics', numeral: 'VIII' },
  { id: 'questions', label: 'The Big Questions', numeral: 'IX' },
  NAV_RIGHT[2],
  { id: 'finale', label: 'The Argument Continues', numeral: '' },
]

function useActiveRoom() {
  const [active, setActive] = useState('top')
  useEffect(() => {
    const els = ALL_ROOMS.map((r) => document.getElementById(r.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-45% 0px -54% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

export function Nav() {
  const active = useActiveRoom()
  const [open, setOpen] = useState(false)
  const { lens, setLens } = useLens()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  const menuBtn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  const current = ALL_ROOMS.find((r) => r.id === active)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = panel.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab' && panel.current) {
        const f = Array.from(panel.current.querySelectorAll<HTMLElement>('a, button'))
        const i = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      menuBtn.current?.focus()
    }
  }, [open])

  const link = (it: NavItem) => (
    <li key={it.id}>
      <a href={`#${it.id}`} className="nav__link" aria-current={active === it.id ? 'location' : undefined}>
        <span className="nav__num" aria-hidden="true">
          {it.numeral}
        </span>
        {it.label}
      </a>
    </li>
  )

  return (
    <>
      <nav className="nav" aria-label="Exhibition rooms">
        <div className="nav__inner">
          <ul className="nav__group nav__group--left">{NAV_LEFT.map(link)}</ul>

          <a href="#top" className="nav__mark" aria-current={active === 'top' ? 'location' : undefined}>
            <span className="nav__mark-p" aria-hidden="true" />
            <span className="nav__mark-text">The Two Worlds</span>
            <span className="nav__mark-a" aria-hidden="true" />
          </a>

          <ul className="nav__group nav__group--right">{NAV_RIGHT.map(link)}</ul>

          <div className="nav__mobile">
            <span className="nav__current">
              <span className="nav__current-num">{current?.numeral}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={current?.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {current?.id === 'top' ? 'Prologue' : current?.label}
                </motion.span>
              </AnimatePresence>
            </span>
            <button
              ref={menuBtn}
              className="nav__menubtn"
              aria-expanded={open}
              aria-controls="room-index"
              onClick={() => setOpen(true)}
            >
              Index
            </button>
          </div>
        </div>

        {lens !== 'none' && (
          <div className={`nav__lens nav__lens--${lens}`}>
            <span className="label">Reading as {lens === 'plato' ? 'Plato' : 'Aristotle'}</span>
            <button className="textbtn nav__lensclear label" onClick={() => setLens('none')}>
              Show both ×
            </button>
          </div>
        )}

        <motion.div className="nav__progress" style={{ scaleX: progress }} aria-hidden="true" />
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="room-index"
            ref={panel}
            className="index"
            role="dialog"
            aria-modal="true"
            aria-label="Index of rooms"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="index__head">
              <span className="label">Index of rooms</span>
              <button className="index__close" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ol className="index__list">
              {ALL_ROOMS.map((r, i) => (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.04 * i }}
                >
                  <a href={`#${r.id}`} onClick={() => setOpen(false)} aria-current={active === r.id ? 'location' : undefined}>
                    <span className="index__num">{r.numeral || '·'}</span>
                    <span className="index__label">{r.label}</span>
                  </a>
                </motion.li>
              ))}
            </ol>
            <p className="index__foot mono">PLATO · ARISTOTLE — AN EXHIBITION IN TEN ROOMS</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
