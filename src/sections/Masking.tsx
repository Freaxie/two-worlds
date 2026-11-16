import { useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { Cite } from '../components/ui/Cite'
import { EvidenceRow } from '../components/ui/Evidence'
import { EASE, Reveal } from '../components/ui/Reveal'
import { MaskVisual } from '../components/visuals/MaskVisual'
import { LAYERS, LEDGER, MASK_NOTES, MONOLOGUE } from '../data/masking'
import { useSettings } from '../lib/settings'

const STAGE_AT = [0, 0.22, 0.48, 0.74]

function LayerCaption({ l, active }: { l: (typeof LAYERS)[number]; active: boolean }) {
  return (
    <motion.div
      className="col-start-1 row-start-1"
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <p className="eyebrow text-amber">{l.n}</p>
      <h3 className="display mt-3 text-[clamp(2rem,1.4rem+2.2vw,3.4rem)] leading-[1.02] text-ink">{l.title}</h3>
      <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-ink-2">
        {l.body} {'cite' in l && l.cite && <Cite ids={[...l.cite]} />}
      </p>
    </motion.div>
  )
}

function ScrollSequence() {
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const { ambientOn } = useSettings()
  const [stage, setStage] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    let s = 0
    STAGE_AT.forEach((at, i) => p >= at && (s = i))
    setStage(s)
  })

  return (
    <div ref={track} className="relative h-[360vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="wrap grid h-full grid-rows-[minmax(0,1fr)_auto] items-center gap-6 pb-8 pt-20 lg:grid-cols-12 lg:grid-rows-1 lg:gap-10 lg:py-16">
          <div className="relative mx-auto h-full max-h-[min(70svh,40rem)] w-full max-w-[30rem] lg:order-2 lg:col-span-6 lg:col-start-7 lg:max-h-[80svh]">
            <MaskVisual progress={scrollYProgress} drift={ambientOn} />
          </div>
          <div className="lg:order-1 lg:col-span-5">
            <div className="grid">
              {LAYERS.map((l, i) => (
                <LayerCaption key={l.n} l={l} active={i === stage} />
              ))}
            </div>
            <div className="mt-8 flex gap-2" aria-hidden="true">
              {LAYERS.map((l, i) => (
                <span key={l.n} className={`h-1 w-10 rounded-full transition-colors duration-500 ${i <= stage ? 'bg-amber' : 'bg-night-4'}`} />
              ))}
            </div>
            <p className="mt-4 text-[0.8125rem] text-ink-3" aria-hidden="true">
              {stage < 3 ? 'Keep scrolling to look underneath.' : 'There is more below.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* calm mode: no scroll-jacked sequence — the same story, laid out still */
function StillSequence() {
  const p = useMotionValue(0.58)
  return (
    <div className="wrap mt-16 grid gap-12 lg:grid-cols-12">
      <div className="mx-auto w-full max-w-[26rem] lg:order-2 lg:col-span-5 lg:col-start-8">
        <MaskVisual progress={p} drift={false} />
      </div>
      <ol className="space-y-10 lg:order-1 lg:col-span-6">
        {LAYERS.map((l) => (
          <li key={l.n}>
            <p className="eyebrow text-amber">{l.n}</p>
            <h3 className="display mt-2 text-[clamp(1.8rem,1.4rem+1.4vw,2.6rem)] text-ink">{l.title}</h3>
            <p className="mt-3 max-w-lg text-[1.0625rem] leading-relaxed text-ink-2">
              {l.body} {'cite' in l && l.cite && <Cite ids={[...l.cite]} />}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Ledger() {
  const [inside, setInside] = useState(false)
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="display text-[clamp(1.9rem,1.4rem+1.6vw,2.8rem)] leading-[1.05] text-ink">Two ledgers</h3>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">
            The same six moments, kept in two different books. Switch between them.
          </p>
        </div>
        <div role="radiogroup" aria-label="Which ledger to show" className="flex rounded-full border border-line-2 p-1">
          {[
            [false, 'What others see'],
            [true, 'What it takes'],
          ].map(([v, label]) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={inside === v}
              tabIndex={inside === v ? 0 : -1}
              onClick={() => setInside(v as boolean)}
              onKeyDown={(e) => {
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault()
                  setInside((x) => !x)
                  const group = e.currentTarget.parentElement
                  requestAnimationFrame(() => group?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus())
                }
              }}
              className={`min-h-11 rounded-full px-5 text-[0.9375rem] transition-colors duration-300 ${
                inside === v ? 'bg-ink text-night' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-10 border-t border-line">
        {LEDGER.map((row, i) => (
          <li key={row.scene} className="grid gap-2 border-b border-line py-6 md:grid-cols-12 md:gap-6">
            <p className="flex items-baseline gap-3 md:col-span-3">
              <span className="font-mono text-[0.75rem] text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-semibold text-ink">{row.scene}</span>
            </p>
            <div className="grid md:col-span-9">
              <motion.p
                className="col-start-1 row-start-1 font-display text-[clamp(1.25rem,1.1rem+0.6vw,1.6rem)] leading-snug text-ink"
                initial={false}
                animate={{ opacity: inside ? 0 : 1, y: inside ? -6 : 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.04 * i }}
              >
                <span className="sr-only">What others see: </span>
                {row.outside}
              </motion.p>
              <motion.p
                className="col-start-1 row-start-1 text-[1.0625rem] leading-relaxed text-ink-2"
                initial={false}
                animate={{ opacity: inside ? 1 : 0, y: inside ? 0 : 6 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.04 * i }}
              >
                <span className="sr-only">What it takes: </span>
                {row.inside}
              </motion.p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Masking() {
  const { calm } = useSettings()
  return (
    <section id="masking" aria-labelledby="masking-title" className="relative py-[clamp(6rem,12vw,11rem)]">
      <div className="wrap">
        <ChapterHeader
          id="masking"
          num="05"
          kicker="Masking & identity"
          title={
            <>
              What it costs
              <br />
              <em>to look fine.</em>
            </>
          }
          dek={
            <p>
              Many autistic and ADHD people learn — often very young — to present a version of themselves that draws less
              attention. That adaptation can protect. It can also be exhausting, and over years it can blur the line between
              the performance and the person.
            </p>
          }
        />
      </div>

      <p className="sr-only">
        A visual sequence follows: a calm mask cracks and falls away to reveal the inner monologue of masking — for example: “
        {MONOLOGUE.slice(0, 6)
          .map((m) => m.text)
          .join('”, “')}
        ” — and finally the question “who would I be without it?”
      </p>

      {calm ? <StillSequence /> : <ScrollSequence />}

      <div className="wrap mt-[clamp(4rem,8vw,7rem)]">
        <Reveal>
          <Ledger />
        </Reveal>

        <div className="mt-[clamp(4rem,8vw,7rem)] grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {MASK_NOTES.map((n, i) => (
            <Reveal key={n.title} delay={0.05 * i} className="border-t border-line pt-5">
              <h3 className="text-[1.1875rem] font-semibold leading-snug text-ink">{n.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
                {n.body} {n.cite && <Cite ids={n.cite} />}
              </p>
              <EvidenceRow kinds={n.evidence} className="mt-4" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
