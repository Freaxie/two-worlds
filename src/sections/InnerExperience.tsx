import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { Cite } from '../components/ui/Cite'
import { EvidenceRow } from '../components/ui/Evidence'
import { EASE, Reveal } from '../components/ui/Reveal'
import { SysTag } from '../components/ui/SysMark'
import { FRAGMENTS, type Fragment } from '../data/fragments'
import { openToolkit } from '../lib/bus'
import { useSettings } from '../lib/settings'

const QUOTE = 'font-display text-[clamp(1.85rem,1.2rem+2.6vw,3.6rem)] leading-[1.12] tracking-[-0.015em]'

/* ---------- typographic effects (visual only; text is always available) ---------- */

function useSeen() {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.6 })
  return [ref, seen] as const
}

function Lines({ f, dim = [] as number[], italicLast = false }: { f: Fragment; dim?: number[]; italicLast?: boolean }) {
  const [ref, seen] = useSeen()
  return (
    <div ref={ref}>
      {f.lines.map((l, i) => (
        <motion.span
          key={i}
          className={`block ${italicLast && i === f.lines.length - 1 ? 'italic' : ''}`}
          initial={{ opacity: 0, y: 14 }}
          animate={seen ? { opacity: dim[i] ?? 1, y: 0 } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: 0.35 * i }}
        >
          {l}
        </motion.span>
      ))}
    </div>
  )
}

function Battery({ f }: { f: Fragment }) {
  const [ref, seen] = useSeen()
  return (
    <div ref={ref}>
      {f.lines.map((l, i) => (
        <motion.span
          key={i}
          className={`block ${i === 2 ? 'italic' : ''}`}
          initial={{ opacity: 0, y: 14 }}
          animate={seen ? { opacity: [1, 0.78, 0.6][i], y: 0 } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: 0.45 * i }}
        >
          {l}
        </motion.span>
      ))}
      <span aria-hidden="true" className="mt-7 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((s) => (
          <motion.span
            key={s}
            className="h-2 w-7 rounded-sm bg-amber"
            initial={{ opacity: 0.9 }}
            animate={seen ? { opacity: s === 0 ? 0.9 : 0.12 } : {}}
            transition={{ duration: 0.6, delay: 1.6 + (4 - s) * 0.35 }}
          />
        ))}
        <span className="ml-3 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-ink-3">social battery</span>
      </span>
    </div>
  )
}

function Caret({ f }: { f: Fragment }) {
  const [ref, seen] = useSeen()
  const last = f.lines.length - 1
  return (
    <div ref={ref}>
      {f.lines.map((l, i) => (
        <motion.span
          key={i}
          className="block"
          initial={{ opacity: 0, y: 14 }}
          animate={seen ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: 0.35 * i }}
        >
          {l}
          {i === last && (
            <span
              aria-hidden="true"
              className="anim-caret ml-[0.12em] inline-block h-[0.85em] w-[0.07em] translate-y-[0.1em] bg-amber"
            />
          )}
        </motion.span>
      ))}
    </div>
  )
}

function Vanish({ f }: { f: Fragment }) {
  const [ref, seen] = useSeen()
  return (
    <div ref={ref}>
      {f.lines.map((l, i) => (
        <motion.span
          key={i}
          className={`block ${i > 0 ? 'italic' : ''}`}
          initial={{ opacity: 0 }}
          animate={seen ? { opacity: i === 0 ? [0, 1, 1, 0.5] : 1 } : {}}
          transition={
            i === 0
              ? { duration: 4.2, times: [0, 0.2, 0.65, 1], ease: 'easeInOut' }
              : { duration: 1.2, ease: EASE, delay: 1.9 + 0.4 * i }
          }
        >
          {l}
        </motion.span>
      ))}
    </div>
  )
}

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz'
function Scramble({ f }: { f: Fragment }) {
  const [ref, seen] = useSeen()
  const { calm } = useSettings()
  const target = f.lines[1]
  const [text, setText] = useState(target)
  useEffect(() => {
    if (!seen || calm) return
    let frame = 0
    let raf = 0
    const total = 70
    const tick = () => {
      frame++
      const p = frame / total
      setText(
        target
          .split('')
          .map((ch, i) => {
            if (ch === ' ' || i / target.length < p * 1.15 - 0.15) return ch
            return GLYPHS[(i * 7 + frame * 3) % GLYPHS.length]
          })
          .join('')
      )
      if (frame < total) raf = requestAnimationFrame(tick)
      else setText(target)
    }
    const start = setTimeout(() => (raf = requestAnimationFrame(tick)), 900)
    return () => {
      clearTimeout(start)
      cancelAnimationFrame(raf)
    }
  }, [seen, calm, target])
  return (
    <div ref={ref}>
      <span className="block">{f.lines[0]}</span>
      <span className="block italic text-ink-2" aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{target}</span>
    </div>
  )
}

function Split({ f }: { f: Fragment }) {
  const [ref, seen] = useSeen()
  return (
    <div ref={ref}>
      <div className="grid grid-cols-[auto_1px_auto] items-center justify-start gap-x-5 sm:gap-x-8">
        <motion.span
          className="text-violet"
          initial={{ opacity: 0, x: -16 }}
          animate={seen ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: EASE }}
        >
          {f.lines[0]}
        </motion.span>
        <span aria-hidden="true" className="h-[1.1em] bg-line-2" />
        <motion.span
          className="text-cyan"
          initial={{ opacity: 0, x: 16 }}
          animate={seen ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}
        >
          {f.lines[1]}
        </motion.span>
      </div>
      <motion.span
        className="mt-2 block italic"
        initial={{ opacity: 0, y: 12 }}
        animate={seen ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.1, ease: EASE, delay: 0.9 }}
      >
        {f.lines[2]}
      </motion.span>
    </div>
  )
}

function Quote({ f }: { f: Fragment }) {
  switch (f.effect) {
    case 'battery':
      return <Battery f={f} />
    case 'caret':
      return <Caret f={f} />
    case 'vanish':
      return <Vanish f={f} />
    case 'scramble':
      return <Scramble f={f} />
    case 'split':
      return <Split f={f} />
    case 'crosscurrent':
      return <Lines f={f} dim={[1, 0.85, 1]} italicLast />
    default:
      return <Lines f={f} italicLast />
  }
}

/* ---------- one fragment ---------- */

function FragmentBlock({ f, i }: { f: Fragment; i: number }) {
  const [open, setOpen] = useState(false)
  const right = i % 2 === 1
  const panelId = `readings-${f.id}`
  return (
    <article
      aria-labelledby={`frag-${f.id}`}
      className={`relative grid grid-cols-12 gap-x-6 py-[clamp(3.5rem,7vw,6.5rem)] ${i > 0 ? 'border-t border-line' : ''}`}
    >
      <div className={`col-span-12 ${right ? 'lg:col-span-9 lg:col-start-4' : 'lg:col-span-9'}`}>
        <Reveal className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="font-mono text-[0.8125rem] text-amber">{f.num}</span>
          <h3 id={`frag-${f.id}`} className="eyebrow text-ink-2">
            {f.title}
          </h3>
          <span className="text-[0.9375rem] text-ink-3">{f.tension}</span>
        </Reveal>

        <blockquote className={`${QUOTE} mt-8 text-ink`}>
          <Quote f={f} />
        </blockquote>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="btn btn-ghost"
          >
            {open ? 'Hide' : 'Read'} the two readings
            <ChevronDown className={`size-4 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <EvidenceRow kinds={f.evidence} />
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="grid gap-x-8 gap-y-6 pt-8 md:grid-cols-3">
                {(
                  [
                    ['a', 'An autism-associated reading', f.aReading],
                    ['b', 'An ADHD-associated reading', f.bReading],
                    ['both', 'Where they meet', f.meet],
                  ] as const
                ).map(([sys, label, text]) => (
                  <div key={sys} className="border-t border-line pt-4">
                    <SysTag sys={sys}>{label}</SysTag>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-night-3/70 p-5 text-[0.875rem] leading-relaxed text-ink-3 md:flex-row md:items-center md:justify-between">
                <p>
                  Commonly described — not universal. The same person may experience this differently from week to week.
                  {f.note && <> {f.note}</>}
                  {f.cite && (
                    <>
                      {' '}
                      <Cite ids={f.cite} />
                    </>
                  )}
                </p>
                {f.toolkit && (
                  <button
                    type="button"
                    onClick={() => openToolkit(f.toolkit!.category)}
                    className="link inline-flex shrink-0 items-center gap-1.5 text-ink"
                  >
                    {f.toolkit.label} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}

/* ---------- the chapter ---------- */

export function InnerExperience() {
  const ref = useRef<HTMLElement>(null)
  const { ambientOn } = useSettings()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x1 = useTransform(scrollYProgress, [0, 1], ['10%', '70%'])
  const x2 = useTransform(scrollYProgress, [0, 1], ['85%', '25%'])
  const hue = useTransform(scrollYProgress, [0, 0.5, 1], [0.22, 0.12, 0.22])

  return (
    <section id="inner" ref={ref} aria-labelledby="inner-title" className="relative isolate py-[clamp(6rem,12vw,11rem)]">
      {/* drifting atmosphere: violet and cyan light trade places as you read */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
        <div className="sticky top-0 h-[100svh] w-full">
          {ambientOn ? (
            <>
              <motion.div
                className="absolute top-[18%] size-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(169_156_245/0.09),transparent)]"
                style={{ left: x1, opacity: hue }}
              />
              <motion.div
                className="absolute top-[52%] size-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(98_227_238/0.07),transparent)]"
                style={{ left: x2 }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_20%_30%,rgb(169_156_245/0.06),transparent),radial-gradient(40%_40%_at_80%_70%,rgb(98_227_238/0.05),transparent)]" />
          )}
        </div>
      </div>

      <div className="wrap">
        <ChapterHeader
          id="inner"
          num="03"
          kicker="The inner experience"
          title={
            <>
              It makes sense
              <br />
              <em>from in here.</em>
            </>
          }
          dek={
            <p>
              Seven fragments of commonly described experience — written as composites, not quotations, and not a checklist.
              Each one has two readings underneath: one through an autism-associated lens, one through an ADHD-associated lens,
              and what happens where they meet.
            </p>
          }
        />
        <div className="mt-[clamp(3rem,6vw,5rem)]">
          {FRAGMENTS.map((f, i) => (
            <FragmentBlock key={f.id} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
