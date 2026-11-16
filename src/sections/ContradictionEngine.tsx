import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { Cite } from '../components/ui/Cite'
import { EvidenceRow } from '../components/ui/Evidence'
import { EASE, Reveal } from '../components/ui/Reveal'
import { SysMark, SysTag } from '../components/ui/SysMark'
import { InterferenceField, type FieldParams } from '../components/visuals/InterferenceField'
import { CONTRADICTIONS, type Contradiction, type Reading } from '../data/contradictions'

const BG: [number, number, number] = [0.043, 0.055, 0.114]

function strengthWord(v: number) {
  if (v < 20) return 'faint'
  if (v < 45) return 'moderate'
  if (v < 75) return 'strong'
  return 'very strong'
}

function readState(c: Contradiction, a: number, b: number) {
  const tension = Math.min(a, b)
  const net = b - a
  if (a < 30 && b < 30) return 'Both quiet. Neither need is pulling hard right now — a calm day, or an environment that fits.'
  if (a >= 30 && b < 30) return `${c.a.name} leads; ${c.b.name.toLowerCase()} is in the background. One system is clearly in charge, and from outside that is easy to read.`
  if (b >= 30 && a < 30) return `${c.b.name} leads; ${c.a.name.toLowerCase()} is in the background. One system is clearly in charge, and from outside that is easy to read.`
  if (tension < 60) return 'Both active. A workable tension, if the environment leaves room for both needs.'
  if (Math.abs(net) < 20)
    return 'From outside this looks balanced — even calm. From inside, two strong forces are cancelling each other out, and holding them still costs energy.'
  return 'Both pulling hard, one slightly harder. Choices can flip back and forth as the balance shifts, which can look like indecision from outside.'
}

function outsideWord(c: Contradiction, net: number) {
  if (Math.abs(net) < 15) return 'Looks balanced'
  return net < 0 ? `Leans toward ${c.a.name.toLowerCase()}` : `Leans toward ${c.b.name.toLowerCase()}`
}

function insideWord(t: number) {
  if (t < 25) return 'Low: one need is quiet'
  if (t < 55) return 'Moderate: both needs are active'
  if (t < 80) return 'High: two strong pulls, held at once'
  return 'Very high: a lot of energy goes into holding still'
}

function ReadingBlock({ label, sys, r }: { label: string; sys: 'a' | 'b' | 'both'; r: Reading }) {
  return (
    <div className="border-t border-line pt-5">
      <SysTag sys={sys}>{label}</SysTag>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
        {r.text} {r.cite && <Cite ids={r.cite} />}
      </p>
      <EvidenceRow kinds={r.evidence} className="mt-4" />
    </div>
  )
}

export function ContradictionEngine() {
  const [idx, setIdx] = useState(0)
  const [values, setValues] = useState<Record<string, [number, number]>>(() =>
    Object.fromEntries(CONTRADICTIONS.map((c) => [c.id, c.start]))
  )
  const [revealed, setRevealed] = useState<string[]>([])
  const tabsRef = useRef<HTMLDivElement>(null)

  const c = CONTRADICTIONS[idx]
  const [a, b] = values[c.id]
  const tension = Math.min(a, b)
  const net = b - a
  const open = revealed.includes(c.id)

  const setVal = (which: 0 | 1, v: number) => {
    setValues((s) => {
      const next: [number, number] = [...s[c.id]]
      next[which] = v
      return { ...s, [c.id]: next }
    })
    if (!open) setRevealed((r) => [...r, c.id])
  }
  const preset = (p: [number, number]) => {
    setValues((s) => ({ ...s, [c.id]: p }))
    if (!open) setRevealed((r) => [...r, c.id])
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = CONTRADICTIONS.length
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % n
    if (e.key === 'ArrowLeft') next = (idx - 1 + n) % n
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = n - 1
    if (next < 0) return
    e.preventDefault()
    setIdx(next)
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus()
  }

  const params: FieldParams = useMemo(
    () => ({
      a: [0.29, 0.5],
      b: [0.71, 0.5],
      ampA: Math.max(0.02, a / 100),
      ampB: Math.max(0.02, b / 100),
      scale: 0.62,
      lines: 3.2,
      freqA: 15,
      freqB: 18,
      vignette: 0.45,
      bg: BG,
      stillTime: 5.1,
    }),
    [a, b]
  )

  return (
    <section
      id="engine"
      aria-labelledby="engine-title"
      className="relative border-t border-line bg-night-2 py-[clamp(6rem,12vw,11rem)]"
    >
      <div className="wrap">
        <ChapterHeader
          id="engine"
          num="02"
          kicker="The Contradiction Engine"
          title={
            <>
              Two dials,
              <br />
              <em>not one spectrum.</em>
            </>
          }
          dek={
            <p>
              Autism-associated and ADHD-associated tendencies are often drawn as opposite ends of one line — as if more of one
              means less of the other. Turn both dials up and watch what happens. From outside, two strong forces can look like
              calm. From inside, they are anything but.
            </p>
          }
        />

        <Reveal className="mt-14 flex items-start gap-3 rounded-2xl border border-line bg-night/50 p-4 text-[0.875rem] leading-relaxed text-ink-2 sm:items-center">
          <Info className="mt-0.5 size-4 shrink-0 text-amber sm:mt-0" aria-hidden="true" />
          <p>
            These pairs are <strong className="font-semibold text-ink">illustrative tendencies</strong>, not universal traits or
            mutually exclusive categories. Plenty of autistic people love novelty; plenty of ADHDers depend on routine.
          </p>
        </Reveal>

        {/* pair selector */}
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Contradictions"
          className="scroll-row -mx-[clamp(1rem,4.2vw,4rem)] mt-10 flex gap-2 px-[clamp(1rem,4.2vw,4rem)] pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
        >
          {CONTRADICTIONS.map((p, i) => (
            <button
              key={p.id}
              id={`tab-${p.id}`}
              role="tab"
              type="button"
              aria-selected={i === idx}
              aria-controls="engine-panel"
              tabIndex={i === idx ? 0 : -1}
              onClick={() => setIdx(i)}
              onKeyDown={onTabKey}
              className="chip shrink-0"
            >
              <span className="font-mono text-[0.6875rem] opacity-70">{p.num}</span>
              {p.a.name} <span aria-hidden="true">/</span>
              <span className="sr-only">versus</span> {p.b.name}
            </button>
          ))}
        </div>

        <div id="engine-panel" role="tabpanel" aria-labelledby={`tab-${c.id}`} className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* the field */}
            <figure className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-night lg:col-span-7">
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/11] lg:aspect-auto lg:min-h-[26rem] lg:flex-1">
                <div className="absolute inset-0">
                  <InterferenceField params={params} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-5 sm:p-6">
                  <span className="flex items-center gap-2 rounded-full bg-night/75 px-3 py-1.5 text-[0.8125rem] text-violet">
                    <SysMark sys="a" size={10} /> {c.a.name}
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-night/75 px-3 py-1.5 text-[0.8125rem] text-cyan">
                    {c.b.name} <SysMark sys="b" size={10} />
                  </span>
                </div>
              </div>
              <figcaption className="border-t border-line px-5 py-4 text-[0.8125rem] leading-relaxed text-ink-3 sm:px-6">
                <span className="eyebrow mr-2 text-ink-2">Fig. 02</span>
                Each dial sets one source’s strength. Where both are strong, the field turns amber and the pattern grows
                intricate — the overlap is where the tension lives.
              </figcaption>
            </figure>

            {/* the controls */}
            <div className="flex flex-col rounded-[1.75rem] border border-line bg-night/60 p-6 sm:p-8 lg:col-span-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h3
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="font-display text-[clamp(1.75rem,1.4rem+1vw,2.25rem)] leading-tight text-ink"
                >
                  {c.a.name} <span className="text-ink-3">/</span> <em className="italic">{c.b.name}</em>
                </motion.h3>
              </AnimatePresence>

              <div className="mt-6 space-y-5">
                {([0, 1] as const).map((w) => {
                  const side = w === 0 ? c.a : c.b
                  const v = w === 0 ? a : b
                  const id = `dial-${w}`
                  return (
                    <div key={w}>
                      <div className="flex items-baseline justify-between gap-3">
                        <label htmlFor={id} className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
                          <SysMark sys={w === 0 ? 'a' : 'b'} size={11} />
                          {side.dial}
                        </label>
                        <span className="font-mono text-[0.8125rem] text-ink-2" aria-hidden="true">
                          {v}
                        </span>
                      </div>
                      <input
                        id={id}
                        type="range"
                        min={0}
                        max={100}
                        value={v}
                        onChange={(e) => setVal(w, Number(e.target.value))}
                        aria-valuetext={`${v} out of 100, ${strengthWord(v)}`}
                        style={{
                          ['--fill' as string]: `${v}%`,
                          ['--track' as string]: w === 0 ? 'var(--color-violet)' : 'var(--color-cyan)',
                        }}
                      />
                      <p className="sr-only">{w === 0 ? 'Autism-associated tendency' : 'ADHD-associated tendency'}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Try a preset">
                {(
                  [
                    ['Both strong', [84, 80]],
                    [`${c.a.name} leads`, [82, 18]],
                    [`${c.b.name} leads`, [16, 82]],
                    ['Both quiet', [14, 18]],
                  ] as [string, [number, number]][]
                ).map(([label, p]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => preset(p)}
                    className="rounded-full border border-line px-3 py-1.5 text-[0.8125rem] text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* outside / inside */}
              <div className="mt-8 grid gap-6 border-t border-line pt-6">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="eyebrow text-ink-3">Outside view</p>
                    <p className="text-[0.875rem] text-ink">{outsideWord(c, net)}</p>
                  </div>
                  <div className="relative mt-4 h-6" aria-hidden="true">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-line-2" />
                    <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-ink-3" />
                    <motion.div
                      className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-night"
                      animate={{ left: `${50 + net / 2}%` }}
                      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[0.75rem] text-ink-3" aria-hidden="true">
                    <span className="flex items-center gap-1.5">
                      <SysMark sys="a" size={8} /> leans {c.a.name.toLowerCase()}
                    </span>
                    <span>balanced</span>
                    <span className="flex items-center gap-1.5">
                      leans {c.b.name.toLowerCase()} <SysMark sys="b" size={8} />
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="eyebrow text-ink-3">Inside view</p>
                    <p className="text-[0.875rem] text-ink">{insideWord(tension)}</p>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-night-4" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-amber-2),var(--color-amber))]"
                      animate={{ width: `${tension}%` }}
                      transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                    />
                  </div>
                  <p className="mt-2 text-[0.75rem] text-ink-3">Tension held between the two pulls</p>
                </div>
              </div>

              <p className="mt-6 rounded-2xl bg-night-3 p-4 text-[0.9375rem] leading-relaxed text-ink-2" aria-live="polite">
                {readState(c, a, b)}
              </p>
            </div>
          </div>

          {/* the explanation */}
          <div className="mt-6 rounded-[1.75rem] border border-line bg-night/40">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="coexist-panel"
              onClick={() => setRevealed((r) => (open ? r.filter((x) => x !== c.id) : [...r, c.id]))}
              className="flex w-full items-center justify-between gap-4 rounded-[1.75rem] p-6 text-left sm:px-8"
            >
              <span className="font-display text-[clamp(1.35rem,1.1rem+0.8vw,1.75rem)] leading-tight text-ink">
                How can both be true?
              </span>
              <span className="flex items-center gap-2 text-[0.875rem] text-ink-3">
                <span className="hidden sm:inline">{open ? 'Hide' : 'Show'} the explanation</span>
                <ChevronDown className={`size-5 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id="coexist-panel"
                  key={c.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-x-10 gap-y-8 px-6 pb-8 sm:px-8 lg:grid-cols-3">
                    <ReadingBlock label={`The ${c.a.name.toLowerCase()} side`} sys="a" r={c.aReading} />
                    <ReadingBlock label={`The ${c.b.name.toLowerCase()} side`} sys="b" r={c.bReading} />
                    <ReadingBlock label="How they coexist" sys="both" r={c.coexist} />
                    <blockquote className="border-l-2 border-amber pl-5 lg:col-span-3">
                      <p className="eyebrow text-ink-3">An everyday example</p>
                      <p className="mt-2 font-display text-[clamp(1.25rem,1.05rem+0.6vw,1.6rem)] italic leading-snug text-ink">
                        {c.example}
                      </p>
                    </blockquote>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Reveal className="mt-16 grid gap-6 lg:grid-cols-12">
          <p className="display text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] leading-[1.15] text-ink lg:col-span-7">
            A single spectrum can only show the outside view. <em>AuDHD often lives in the inside view.</em>
          </p>
          <p className="text-[0.9375rem] leading-relaxed text-ink-2 lg:col-span-4 lg:col-start-9">
            Many AuDHD people describe this as one reason they went unrecognised for so long: opposing pulls can produce
            behaviour that looks unremarkable, while the effort of balancing them stays invisible.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
