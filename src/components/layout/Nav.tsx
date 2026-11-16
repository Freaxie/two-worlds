import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { Menu, SlidersHorizontal, X } from 'lucide-react'
import { CHAPTERS, NAV_CHAPTERS } from '../../data/chapters'
import { useActiveSection, useDialogFocus } from '../../lib/hooks'
import { useSettings } from '../../lib/settings'
import { EASE } from '../ui/Reveal'
import { Logo } from './Logo'
import { SensoryPanel } from './SensoryPanel'

const ALL_IDS = CHAPTERS.map((c) => c.id)

const BLURBS: Record<string, string> = {
  top: 'Two operating systems. One brain.',
  orientation: 'What AuDHD is, what it isn’t, and how to read this site',
  engine: 'Two dials, not one spectrum',
  inner: 'Seven fragments from the inside',
  reflection: 'A private, non-diagnostic self-reflection',
  masking: 'What it costs to look fine',
  toolkit: 'A partial manual: strategies to try',
  resources: 'Further reading, sorted by how sure we are',
  coda: 'Not simple. Legible.',
}

export function Nav() {
  const active = useActiveSection(ALL_IDS)
  const [scrolled, setScrolled] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { calm, settings } = useSettings()
  // inline chapter links need room: with larger text they appear only on wider screens (or not at all)
  const linksAt = settings.text === 'base' ? 'xl:flex' : settings.text === 'lg' ? '2xl:flex' : ''
  const compactUntil = settings.text === 'base' ? 'xl:hidden' : settings.text === 'lg' ? '2xl:hidden' : ''
  // the settings button drops its text label while the inline links need the room
  const settingsLabel =
    settings.text === 'base'
      ? 'hidden sm:inline xl:hidden min-[1700px]:inline'
      : settings.text === 'lg'
        ? 'hidden sm:inline 2xl:hidden min-[1900px]:inline'
        : 'hidden sm:inline'
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })
  const indexPanel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useDialogFocus(indexOpen, indexPanel, () => setIndexOpen(false))
  useEffect(() => {
    if (!indexOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [indexOpen])

  const current = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0]

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled ? 'border-b border-line bg-night/88 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav aria-label="Chapters" className="wrap flex h-16 items-center gap-4">
          <a href="#top" className="group mr-auto flex min-w-0 items-center gap-3 rounded-md py-2 no-underline">
            <Logo />
            <span className="truncate font-display text-[1.0625rem] italic tracking-[-0.01em] text-ink [font-variation-settings:'SOFT'_100,'WONK'_1]">
              No Instruction Manual
            </span>
          </a>

          <ol className={`hidden items-center gap-1 ${linksAt}`}>
            {NAV_CHAPTERS.map((c) => {
              const on = active === c.id
              return (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    aria-current={on ? 'location' : undefined}
                    className={`relative flex items-baseline gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[0.8125rem] no-underline transition-colors duration-300 ${
                      on ? 'text-ink' : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    <span className={`font-mono text-[0.6875rem] ${on ? 'text-amber' : 'text-ink-3'}`} aria-hidden="true">
                      {c.num}
                    </span>
                    {c.label}
                    {on && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-night-4/80"
                        transition={{ duration: 0.5, ease: EASE }}
                      />
                    )}
                  </a>
                </li>
              )
            })}
          </ol>

          <div className="flex items-center gap-2">
            <span className={`hidden max-w-[11rem] truncate text-[0.8125rem] text-ink-3 md:inline ${compactUntil}`} aria-hidden="true">
              <span className="font-mono text-[0.6875rem] text-amber">{current.num}</span> {current.label}
            </span>
            <button
              type="button"
              onClick={() => setIndexOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={indexOpen}
              className={`flex h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-2 px-3.5 text-[0.875rem] text-ink transition-colors hover:border-ink-3 min-[420px]:px-4 ${compactUntil}`}
            >
              <Menu className="size-4" aria-hidden="true" />
              <span className="max-[419px]:sr-only">Contents</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              aria-controls="sensory-panel"
              aria-label="Sensory settings"
              title="Sensory settings"
              className="flex h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-2 px-3.5 text-[0.875rem] text-ink transition-colors hover:border-ink-3"
            >
              <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
              <span className={settingsLabel}>Sensory settings</span>
            </button>
          </div>
        </nav>

        {/* reading progress */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-[2px] overflow-hidden">
          <motion.div
            className="h-full origin-left bg-[linear-gradient(90deg,var(--color-violet),var(--color-amber)_50%,var(--color-cyan))]"
            style={{ scaleX: calm ? scrollYProgress : smooth }}
          />
        </div>
      </header>

      <SensoryPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <AnimatePresence>
        {indexOpen && (
          <motion.div
            ref={indexPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Contents"
            className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-void/97 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="wrap flex h-16 shrink-0 items-center justify-between border-b border-line">
              <span className="eyebrow text-ink-3">Contents</span>
              <button
                type="button"
                onClick={() => setIndexOpen(false)}
                className="flex h-11 items-center gap-2 rounded-full border border-line-2 px-4 text-[0.875rem] text-ink hover:border-ink-3"
              >
                <X className="size-4" aria-hidden="true" />
                Close
              </button>
            </div>
            <ol className="wrap my-6 flex-1">
              {CHAPTERS.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, ease: EASE, delay: 0.03 * i }}
                >
                  <a
                    href={`#${c.id}`}
                    onClick={() => setIndexOpen(false)}
                    aria-current={active === c.id ? 'location' : undefined}
                    className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-2 border-b border-line py-4 no-underline"
                  >
                    <span className="font-mono text-[0.8125rem] text-amber">{c.num}</span>
                    <span>
                      <span className="block font-display text-[clamp(1.5rem,6vw,2.25rem)] leading-tight text-ink group-aria-[current=location]:italic">
                        {c.id === 'top' ? 'Prologue' : c.label}
                      </span>
                      <span className="mt-1 block text-[0.9375rem] text-ink-3">{BLURBS[c.id]}</span>
                    </span>
                  </a>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
