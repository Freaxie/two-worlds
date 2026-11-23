import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { EASE } from './common'
import './Nav.css'

export const ROOMS = [
  { id: 'difference', n: '01', name: 'The core difference' },
  { id: 'situation', n: '02', name: 'One situation' },
  { id: 'questions', n: '03', name: 'Two questions' },
  { id: 'individual', n: '04', name: 'Individual / Collective' },
  { id: 'experiment', n: '05', name: 'Experiment' },
  { id: 'failure', n: '06', name: 'Failure modes' },
  { id: 'not-opposites', n: '07', name: 'Not opposites' },
  { id: 'coda', n: '08', name: 'Coda' },
]

export function Nav() {
  const [current, setCurrent] = useState<number>(-1)
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useEffect(() => {
    const els = ROOMS.map((r) => document.getElementById(r.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent(ROOMS.findIndex((r) => r.id === e.target.id))
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    const top = () => window.scrollY < window.innerHeight * 0.6 && setCurrent(-1)
    window.addEventListener('scroll', top, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', top)
    }
  }, [])

  const room = ROOMS[current]

  return (
    <>
      <header className="nav">
        <a className="nav__mark" href="#top" aria-label="Fi vs Fe — back to top">
          <span className="nav__fi">Fi</span>
          <span className="nav__vs serif">vs</span>
          <span className="nav__fe">Fe</span>
        </a>
        <button className="nav__room" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="nav-index">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={room?.id ?? 'top'}
              className="label"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {room ? `${room.n} — ${room.name}` : 'Index'}
            </motion.span>
          </AnimatePresence>
          <span className="nav__burger" aria-hidden="true" data-open={open} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="nav-index"
            className="nav-index"
            aria-label="Rooms"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ol>
              {ROOMS.map((r, i) => (
                <li key={r.id} data-current={i === current}>
                  <a href={`#${r.id}`} onClick={() => setOpen(false)}>
                    <span className="label">{r.n}</span>
                    <span className="nav-index__name">{r.name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Reading progress: the line itself travels from crimson to amber */}
      <motion.div className="progress" style={{ scaleX: progress }} aria-hidden="true" />
    </>
  )
}
