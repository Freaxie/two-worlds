import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import './Nav.css'

export const ROOMS = [
  { id: 'difference', n: '01', name: 'Core difference' },
  { id: 'moment', n: '02', name: 'One moment' },
  { id: 'questions', n: '03', name: 'Two questions' },
  { id: 'memory', n: '04', name: 'Memory / presence' },
  { id: 'experiment', n: '05', name: 'Experiment' },
  { id: 'modes', n: '06', name: 'Strengths & failure' },
  { id: 'together', n: '07', name: 'Not opposites' },
  { id: 'finale', n: '08', name: 'Coda' },
]

/* The progress rule is itself a small Si/Se diagram:
   what you have already read is stored (green), where you are is the present (red). */
export function Nav() {
  const { scrollYProgress } = useScroll()
  const past = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  const nowX = useTransform(scrollYProgress, (v) => `${v * 100}%`)
  const [active, setActive] = useState<string | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const els = ROOMS.map((r) => document.getElementById(r.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const current = ROOMS.find((r) => r.id === active)

  return (
    <motion.nav
      className="nav"
      aria-label="Rooms"
      initial={false}
      animate={{ y: shown ? 0 : -80, opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.1, 1] }}
    >
      <div className="nav__bar">
        <a className="nav__mark" href="#top">
          <span className="si">Si</span>
          <span className="nav__vs serif">vs</span>
          <span className="se">Se</span>
        </a>
        <span className="nav__current label" aria-live="polite">
          {current ? (
            <>
              <span className="nav__n">{current.n}</span> {current.name}
            </>
          ) : (
            'Two ways of experiencing reality'
          )}
        </span>
        <ol className="nav__index">
          {ROOMS.map((r) => (
            <li key={r.id}>
              <a href={`#${r.id}`} aria-current={active === r.id ? 'true' : undefined} title={r.name}>
                <span className="label">{r.n}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="nav__track" aria-hidden="true">
        <motion.span className="nav__past" style={{ scaleX: past }} />
        <motion.span className="nav__now" style={{ left: nowX }} />
      </div>
    </motion.nav>
  )
}
