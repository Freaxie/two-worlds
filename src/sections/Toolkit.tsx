import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Check, ChevronDown, ClipboardCopy, Search, Trash2, X } from 'lucide-react'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { Cite } from '../components/ui/Cite'
import { EvidenceRow } from '../components/ui/Evidence'
import { EASE } from '../components/ui/Reveal'
import { CATEGORIES, CATEGORY_LABEL, STRATEGIES, type CategoryId, type Strategy } from '../data/toolkit'
import { TOOLKIT_EVENT } from '../lib/bus'
import { useSpotlight } from '../lib/hooks'
import { copyText, readList, writeJSON } from '../lib/storage'

const SAVED_KEY = 'nim:manual:v1'
const num = (s: Strategy) => `6.${String(STRATEGIES.indexOf(s) + 1).padStart(2, '0')}`

function manualText(list: Strategy[]) {
  const out = ['My manual — strategies saved from “No Instruction Manual”, an interactive essay on AuDHD', '']
  list.forEach((s, i) => {
    out.push(`${i + 1}. ${s.title}`)
    out.push(`Problem: ${s.problem}`)
    out.push('Try:')
    s.how.forEach((h) => out.push(`  - ${h}`))
    out.push(`Watch out for: ${s.limits}`)
    if (s.audhd) out.push(`If AuDHD: ${s.audhd}`)
    out.push('')
  })
  out.push('Strategies to try, adapt and discard — not medical advice.')
  return out.join('\n')
}

function StrategyCard({ s, saved, onSave }: { s: Strategy; saved: boolean; onSave: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useSpotlight<HTMLElement>()
  const panel = `strategy-${s.id}`
  return (
    <motion.li layout="position" transition={{ duration: 0.45, ease: EASE }}>
      <article
        ref={ref}
        aria-labelledby={`${panel}-title`}
        className="spotlight rounded-[1.5rem] border border-line bg-charcoal-2/70 transition-colors duration-300 hover:border-line-2"
      >
        <div className="grid gap-4 p-5 sm:grid-cols-[4.5rem_1fr_auto] sm:gap-6 sm:p-7">
          <p className="font-mono text-[0.8125rem] text-amber sm:pt-2">§ {num(s)}</p>
          <div className="min-w-0">
            <h3 id={`${panel}-title`} className="font-display text-[clamp(1.4rem,1.2rem+0.6vw,1.75rem)] leading-tight text-ink">
              {s.title}
            </h3>
            <p className="mt-2 max-w-[44rem] text-[0.9375rem] leading-relaxed text-ink-2">{s.problem}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[0.8125rem] text-ink-3">{s.cats.map((c) => CATEGORY_LABEL[c]).join(' · ')}</span>
              <EvidenceRow kinds={s.evidence} />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onSave}
              aria-pressed={saved}
              className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[0.875rem] transition-colors ${
                saved ? 'border-amber bg-amber/10 text-amber' : 'border-line-2 text-ink-2 hover:border-ink-3 hover:text-ink'
              }`}
            >
              {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
              {saved ? 'Saved' : 'Save'}
              <span className="sr-only"> “{s.title}” to my manual</span>
            </button>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panel}
              onClick={() => setOpen((v) => !v)}
              className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[0.875rem] font-semibold text-night transition-colors hover:bg-amber"
            >
              {open ? 'Close' : 'Open'}
              <span className="sr-only"> “{s.title}”</span>
              <ChevronDown className={`size-4 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panel}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="grid gap-x-10 gap-y-7 border-t border-line p-5 sm:p-7 sm:pl-[calc(4.5rem+3.25rem)] md:grid-cols-2">
                <div>
                  <h4 className="eyebrow text-cyan">Why it might help</h4>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                    {s.why} {s.cite && <Cite ids={s.cite} />}
                  </p>
                </div>
                <div>
                  <h4 className="eyebrow text-violet">How to try it</h4>
                  <ol className="mt-3 space-y-2.5">
                    {s.how.map((h, i) => (
                      <li key={i} className="grid grid-cols-[1.5rem_1fr] text-[0.9375rem] leading-relaxed text-ink-2">
                        <span className="font-mono text-[0.8125rem] leading-[1.75] text-ink-3">{i + 1}.</span>
                        {h}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h4 className="eyebrow text-ink-3">Where it falls short</h4>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{s.limits}</p>
                </div>
                {s.audhd && (
                  <div className="rounded-2xl border border-amber/30 bg-amber-deep/25 p-4">
                    <h4 className="eyebrow text-amber">When both systems are involved</h4>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{s.audhd}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </motion.li>
  )
}

export function Toolkit() {
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [query, setQuery] = useState('')
  const [onlySaved, setOnlySaved] = useState(false)
  const [saved, setSaved] = useState<string[]>(() => readList(SAVED_KEY))
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')

  useEffect(() => writeJSON(SAVED_KEY, saved), [saved])

  // other chapters can open the toolkit on a category
  useEffect(() => {
    const on = (e: Event) => {
      const c = (e as CustomEvent<string>).detail as CategoryId
      if (CATEGORY_LABEL[c]) {
        setCat(c)
        setQuery('')
        setOnlySaved(false)
      }
    }
    window.addEventListener(TOOLKIT_EVENT, on)
    return () => window.removeEventListener(TOOLKIT_EVENT, on)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STRATEGIES.filter((s) => {
      if (onlySaved && !saved.includes(s.id)) return false
      if (cat !== 'all' && !s.cats.includes(cat)) return false
      if (!q) return true
      return [s.title, s.problem, s.why, s.limits, s.audhd ?? '', ...s.how, ...s.cats.map((c) => CATEGORY_LABEL[c])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [cat, query, onlySaved, saved])

  const toggleSave = (id: string) => setSaved((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))
  const savedList = STRATEGIES.filter((s) => saved.includes(s.id))

  return (
    <section id="toolkit" aria-labelledby="toolkit-title" className="relative border-t border-line bg-charcoal py-[clamp(6rem,12vw,11rem)]">
      <div className="wrap">
        <ChapterHeader
          id="toolkit"
          num="06"
          kicker="Practical toolkit"
          title={
            <>
              A partial manual.
              <br />
              <em>Written in pencil.</em>
            </>
          }
          dek={
            <p>
              There is no instruction manual — but clinicians, researchers, and autistic and ADHD people have been writing notes
              in the margins for years. These are strategies to try, adapt and discard. Each one says what it’s for, why it
              might help, how to start, and where it falls short.
            </p>
          }
        />

        {/* toolbar */}
        <div className="mt-[clamp(3rem,6vw,5rem)] rounded-[1.5rem] border border-line bg-charcoal-2/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search strategies</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: timers, noise, starting, sleep…"
                className="h-12 w-full rounded-full border border-line-2 bg-night/60 pl-11 pr-11 text-[0.9375rem] text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:text-ink"
                >
                  <X className="size-4" aria-hidden="true" />
                  <span className="sr-only">Clear search</span>
                </button>
              )}
            </label>
            <button
              type="button"
              aria-pressed={onlySaved}
              onClick={() => setOnlySaved((v) => !v)}
              className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border px-5 text-[0.9375rem] transition-colors ${
                onlySaved ? 'border-amber bg-amber/10 text-amber' : 'border-line-2 text-ink hover:border-ink-3'
              }`}
            >
              <BookmarkCheck className="size-4" aria-hidden="true" />
              My manual <span className="font-mono text-[0.8125rem]">({saved.length})</span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button type="button" className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.875rem] text-ink-3" role="status">
            Showing {visible.length} of {STRATEGIES.length} strategies
            {cat !== 'all' && <> in {CATEGORY_LABEL[cat]}</>}
            {onlySaved && <> from your manual</>}
          </p>
          {onlySaved && savedList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => setCopied((await copyText(manualText(savedList))) ? 'ok' : 'fail')}
                className="flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-[0.875rem] text-ink hover:border-ink-3"
              >
                {copied === 'ok' ? <Check className="size-4" aria-hidden="true" /> : <ClipboardCopy className="size-4" aria-hidden="true" />}
                {copied === 'ok' ? 'Copied' : 'Copy my manual'}
              </button>
              <button
                type="button"
                onClick={() => setSaved([])}
                className="flex h-10 items-center gap-2 rounded-full px-3 text-[0.875rem] text-ink-3 hover:text-ink"
              >
                <Trash2 className="size-4" aria-hidden="true" /> Clear
              </button>
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-line-2 p-10 text-center">
            <p className="font-display text-2xl text-ink">
              {onlySaved && !saved.length ? 'Your manual is empty — for now.' : 'Nothing matches that.'}
            </p>
            <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-3">
              {onlySaved && !saved.length
                ? 'Use “Save” on any strategy to collect your own short manual. It stays on this device, and you can copy it out as plain text.'
                : 'Try a different word, or another category.'}
            </p>
          </div>
        ) : (
          <motion.ul layout className="mt-6 space-y-3">
            <AnimatePresence initial={false}>
              {visible.map((s) => (
                <StrategyCard key={s.id} s={s} saved={saved.includes(s.id)} onSave={() => toggleSave(s.id)} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        <p className="mt-10 max-w-3xl text-[0.875rem] leading-relaxed text-ink-3">
          These strategies are general information, not medical advice. Medication, therapy and workplace or educational
          adjustments are also options worth discussing with a qualified professional. What works changes over time — it’s
          fine to rewrite the manual.
        </p>
      </div>
    </section>
  )
}
