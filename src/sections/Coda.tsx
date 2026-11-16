import { useState } from 'react'
import { ArrowUp, SlidersHorizontal } from 'lucide-react'
import { Logo } from '../components/layout/Logo'
import { SensoryPanel } from '../components/layout/SensoryPanel'
import { Reveal } from '../components/ui/Reveal'
import { InterferenceField, type FieldParams } from '../components/visuals/InterferenceField'

/* the two sources again — closer now, nearly in step: not resolved, but legible */
const CALM: FieldParams = {
  a: [0.44, 0.5],
  b: [0.56, 0.5],
  ampA: 0.62,
  ampB: 0.62,
  freqA: 14,
  freqB: 14.6,
  scale: 0.75,
  lines: 2.6,
  glow: 0.7,
  vignette: 0.9,
  stillTime: 3.2,
}

export function Coda() {
  const [settings, setSettings] = useState(false)
  return (
    <>
      <section id="coda" aria-labelledby="coda-title" className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_50%,rgb(244_179_99/0.08),transparent_70%)]">
          <InterferenceField params={CALM} className="opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,rgb(7_9_20/0.5),rgb(7_9_20/0.82)_70%,var(--color-night))]" />
        </div>
        <div className="wrap flex min-h-[92svh] flex-col items-center justify-center py-32 text-center">
          <Reveal className="flex items-center gap-4 text-ink-3" y={0}>
            <span className="eyebrow text-amber">08</span>
            <span aria-hidden="true" className="h-px w-10 bg-line-2" />
            <span className="eyebrow">Coda</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="coda-title" className="display mt-8 text-[clamp(3rem,1.6rem+6vw,7.5rem)] leading-[0.95] text-ink">
              Not simple.
              <br />
              <em>Legible.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16} className="mt-10 max-w-[38rem] space-y-5 text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-relaxed text-ink-2">
            <p>
              Autism and ADHD can bring real difficulty and real distinctiveness — often in the same afternoon. Understanding the
              pattern won’t make it simple. It might make it legible: to the people around you, and to yourself.
            </p>
            <p>
              There is no instruction manual. There is attention, experiment and revision — and the slow work of believing your
              own experience.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-12 flex flex-wrap justify-center gap-3">
            <a href="#top" className="btn btn-ghost">
              <ArrowUp className="size-4" aria-hidden="true" /> Back to the beginning
            </a>
            <a href="#toolkit" className="btn btn-primary">
              Revisit the toolkit
            </a>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line bg-void">
        <div className="wrap grid gap-10 py-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="flex items-center gap-3">
              <Logo />
              <span className="font-display text-lg italic text-ink">No Instruction Manual</span>
            </p>
            <p className="mt-4 max-w-xs text-[0.875rem] leading-relaxed text-ink-3">
              An interactive essay on AuDHD: two operating systems, one brain.
            </p>
          </div>
          <div className="space-y-4 text-[0.875rem] leading-relaxed text-ink-3 md:col-span-5">
            <p>
              <strong className="font-semibold text-ink-2">Not medical advice.</strong> This site is educational. It cannot diagnose
              anything, and its self-reflection is not a screening tool. If you’re struggling, please talk to a qualified
              professional, or use one of the{' '}
              <a href="#support" className="link text-ink-2">
                support lines
              </a>
              .
            </p>
            <p>
              <strong className="font-semibold text-ink-2">Private by design.</strong> No cookies, no analytics, no accounts.
              Reflection answers never leave the page; sensory settings and saved strategies are stored only on this device.
            </p>
            <p>
              <strong className="font-semibold text-ink-2">On sources.</strong> Research summaries reflect published work as of
              November 2026; research moves on. First-person fragments are composites, not quotations. The site has not been
              clinically reviewed — every claim is labelled so you can weigh it yourself.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:col-span-3 md:items-end">
            <button type="button" onClick={() => setSettings(true)} className="btn btn-ghost">
              <SlidersHorizontal className="size-4" aria-hidden="true" /> Sensory settings
            </button>
            <a href="#top" className="btn text-ink-2 hover:text-ink">
              <ArrowUp className="size-4" aria-hidden="true" /> Back to top
            </a>
          </div>
        </div>
      </footer>
      <SensoryPanel open={settings} onClose={() => setSettings(false)} />
    </>
  )
}
