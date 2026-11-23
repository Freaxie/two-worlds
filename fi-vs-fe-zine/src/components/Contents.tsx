import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE } from './print'
import './Contents.css'

/* The zine's table of contents. Page numbers are real: a 16-page booklet. */
export const PAGES = [
  { id: 'cover', pp: '1', name: 'Cover' },
  { id: 'difference', pp: '2–3', name: 'Same feeling, different compass' },
  { id: 'strip', pp: '4–5', name: 'One dinner, two readings' },
  { id: 'stamps', pp: '6–7', name: 'Two questions' },
  { id: 'plates', pp: '8–9', name: 'Two plates' },
  { id: 'printshop', pp: '10–11', name: 'The print shop' },
  { id: 'errors', pp: '12–13', name: 'Printing errors' },
  { id: 'overprint', pp: '14–15', name: 'Overprint' },
  { id: 'back', pp: '16', name: 'Back cover' },
]

export function Contents() {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(PAGES.findIndex((p) => p.id === e.target.id))
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    PAGES.forEach((p) => {
      const el = document.getElementById(p.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  const page = PAGES[Math.max(0, current)]

  return (
    <nav className="toc" aria-label="Contents">
      <button className="toc__tab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="toc-list">
        <span className="toc__brand">
          <span className="ink-blue">Fi</span> vs <span className="ink-pink">Fe</span>
        </span>
        <span className="toc__pp">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={page.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              p. {page.pp}
            </motion.span>
          </AnimatePresence>
          <span className="toc__of">/ 16</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ol
            id="toc-list"
            className="toc__list slip"
            initial={{ opacity: 0, y: -10, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <li className="caps toc__head">Contents</li>
            {PAGES.map((p, i) => (
              <li key={p.id} data-current={i === current}>
                <a href={`#${p.id}`} onClick={() => setOpen(false)}>
                  <span className="toc__name">{p.name}</span>
                  <span className="toc__dots" aria-hidden="true" />
                  <span className="toc__num">{p.pp}</span>
                </a>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </nav>
  )
}
