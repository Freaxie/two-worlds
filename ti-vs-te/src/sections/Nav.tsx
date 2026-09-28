import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import './Nav.css'

export const PARTS = [
  { id: 'top', n: '01', name: 'Ti vs Te' },
  { id: 'difference', n: '02', name: 'Core difference' },
  { id: 'problem', n: '03', name: 'One problem' },
  { id: 'questions', n: '04', name: 'Two questions' },
  { id: 'failure', n: '05', name: 'Failure modes' },
  { id: 'experiment', n: '06', name: 'Experiment' },
  { id: 'together', n: '07', name: 'Not opposites' },
  { id: 'final', n: '08', name: 'Coda' },
]

export function Nav() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const els = PARTS.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const current = PARTS.find((p) => p.id === active)

  return (
    <nav className={`nav${active === 'final' ? ' nav--ink' : ''}`} aria-label="Exhibition parts">
      <div className="nav__bar wrap">
        <a href="#top" className="nav__mark">
          <span className="ti">Ti</span>
          <span className="serif">vs</span>
          <span className="te">Te</span>
        </a>
        <ol className="nav__list">
          {PARTS.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className={`nav__link label${p.id === active ? ' is-active' : ''}`} aria-current={p.id === active ? 'true' : undefined}>
                <span className="nav__n">{p.n}</span>
                <span className="nav__name">{p.name}</span>
              </a>
            </li>
          ))}
        </ol>
        <span className="nav__now label label--muted" aria-hidden="true">
          {current ? `${current.n} — ${current.name}` : ''}
        </span>
      </div>
      <motion.div className="nav__progress" style={{ scaleX: progress }} aria-hidden="true" />
    </nav>
  )
}
