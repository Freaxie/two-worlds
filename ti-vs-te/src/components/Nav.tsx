import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import './Nav.css'

export const ROOMS = [
  { id: 'difference', n: '01', name: 'Core difference' },
  { id: 'one-problem', n: '02', name: 'One problem, two minds' },
  { id: 'questions', n: '03', name: 'Two questions' },
  { id: 'depth', n: '04', name: 'Depth & reach' },
  { id: 'experiment', n: '05', name: 'Experiment' },
  { id: 'failure', n: '06', name: 'Failure modes' },
  { id: 'together', n: '07', name: 'Not opposites' },
  { id: 'finale', n: '08', name: 'Model & machine' },
] as const

export function Nav() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = ROOMS.map((r) => document.getElementById(r.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    const onTop = () => window.scrollY < window.innerHeight * 0.5 && setActive(null)
    window.addEventListener('scroll', onTop, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onTop)
    }
  }, [])

  const current = ROOMS.find((r) => r.id === active)

  return (
    <header className="nav">
      <motion.div className="nav__progress" style={{ scaleX }} aria-hidden="true" />
      <a className="nav__mark" href="#top" aria-label="Ti vs Te — back to top">
        <span className="nav__ti">Ti</span>
        <span className="nav__vs">/</span>
        <span className="nav__te">Te</span>
      </a>
      <p className="nav__current label" aria-live="polite">
        {current ? (
          <>
            <span className="nav__num">{current.n}</span> {current.name}
          </>
        ) : (
          'Two ways of making things make sense'
        )}
      </p>
      <nav aria-label="Rooms">
        <ol className="nav__list">
          {ROOMS.map((r) => (
            <li key={r.id}>
              <a href={`#${r.id}`} className="nav__link label" aria-current={r.id === active ? 'location' : undefined} title={r.name}>
                {r.n}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}
