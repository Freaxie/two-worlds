import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { InterferenceField, type FieldParams } from '../components/visuals/InterferenceField'
import { SysMark } from '../components/ui/SysMark'
import { EASE } from '../components/ui/Reveal'
import { useMedia } from '../lib/hooks'
import { useSettings } from '../lib/settings'

const WIDE: FieldParams = {
  a: [0.6, 0.4],
  b: [0.8, 0.6],
  ampA: 1,
  ampB: 1,
  scale: 0.62,
  lines: 3.2,
  follow: 'b',
  wander: true,
  vignette: 0.55,
  stillTime: 6.4,
}
const TALL: FieldParams = {
  a: [0.3, 0.17],
  b: [0.7, 0.27],
  ampA: 1,
  ampB: 1,
  scale: 0.78,
  lines: 2.9,
  follow: null,
  wander: true,
  vignette: 0.3,
  stillTime: 6.4,
}

const LINE_1 = ['Two', 'operating', 'systems.']

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { calm } = useSettings()
  const wide = useMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)')
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fieldOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15])
  const textY = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : -90])

  // staged entrance (about two seconds); calm mode shows everything at once
  const word = (delay: number) =>
    calm
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: '0.35em', filter: 'blur(8px)' },
          animate: { opacity: 1, y: '0em', filter: 'blur(0px)' },
          transition: { duration: 1.05, ease: EASE, delay },
        }

  return (
    <section
      id="top"
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[max(100svh,40rem)] overflow-hidden bg-night"
    >
      {/* field + fallback atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_70%_40%,rgb(169_156_245/0.16),transparent_70%),radial-gradient(50%_50%_at_85%_65%,rgb(98_227_238/0.12),transparent_70%)]"
      >
        <motion.div className="absolute inset-0" style={{ opacity: fieldOpacity }}>
          <InterferenceField params={wide ? WIDE : TALL} pointerArea={ref} />
        </motion.div>
        {/* scrims keep the type legible over the field */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(7_9_20/0.92)_0%,rgb(7_9_20/0.72)_34%,rgb(7_9_20/0.1)_62%,transparent_100%)] max-[899px]:bg-[linear-gradient(180deg,transparent_0%,transparent_12%,rgb(7_9_20/0.82)_28%,rgb(7_9_20/0.97)_37%,rgb(7_9_20/0.98)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(transparent,var(--color-night))]" />
      </div>

      {/* figure legend */}
      <motion.figure
        className="absolute right-[clamp(1rem,4.2vw,4rem)] top-24 hidden w-64 text-right min-[900px]:block before:absolute before:-inset-10 before:-z-10 before:rounded-full before:bg-[radial-gradient(closest-side,rgb(7_9_20/0.82),rgb(7_9_20/0.55)_60%,transparent)]"
        initial={calm ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.1 }}
      >
        <figcaption>
          <p className="eyebrow text-ink-3">Fig. 00 — Interference</p>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-2">
            Two wave sources share one field. Where they meet, they amplify or cancel.
          </p>
          <ul className="mt-4 space-y-1.5 text-[0.8125rem] text-ink-2">
            <li className="flex items-center justify-end gap-2">
              Autism-associated source <SysMark sys="a" size={10} />
            </li>
            <li className="flex items-center justify-end gap-2">
              ADHD-associated source <SysMark sys="b" size={10} />
            </li>
            <li className="flex items-center justify-end gap-2">
              Where both are strong <SysMark sys="both" size={10} />
            </li>
          </ul>
          {!calm && (
            <p className="mt-4 text-[0.8125rem] italic leading-snug text-ink-3">
              Move your pointer: one source chases novelty. The other holds its ground.
            </p>
          )}
        </figcaption>
      </motion.figure>

      <motion.div style={{ y: textY }} className="wrap relative flex min-h-full flex-col justify-end pb-14 pt-[42svh] min-[900px]:justify-center min-[900px]:pb-20 min-[900px]:pt-28">
        <motion.p className="eyebrow mb-7 text-ink-3" {...word(0.05)}>
          AuDHD <span aria-hidden="true">·</span> An interactive essay
        </motion.p>

        <h1 id="hero-title" className="display max-w-[11ch] text-[clamp(3.1rem,1.1rem+7.2vw,8.75rem)] leading-[0.94] text-ink">
          <span className="block">
            {LINE_1.map((w, i) => (
              <motion.span key={w} className="mr-[0.22em] inline-block last:mr-0" {...word(0.15 + i * 0.09)}>
                {w}
              </motion.span>
            ))}
          </span>
          <motion.span className="mt-[0.08em] block italic [font-variation-settings:'SOFT'_100,'WONK'_1]" {...word(0.55)}>
            One brain.
          </motion.span>
        </h1>

        <motion.p className="mt-8 flex items-center gap-3 font-mono text-[0.8125rem] uppercase tracking-[0.16em] text-amber" {...word(0.85)}>
          <span aria-hidden="true" className="h-px w-8 bg-amber/70" />
          No instruction manual.
        </motion.p>

        <div className="mt-10 grid items-end gap-10 min-[900px]:grid-cols-[minmax(0,34rem)_1fr]">
          <motion.div {...word(1.0)}>
            <p className="text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-relaxed text-ink-2">
              Autism and ADHD don’t cancel each other out. Sometimes they collide. Sometimes they compensate. Sometimes
              they create a life that makes perfect sense internally and absolutely none externally.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#orientation" className="btn btn-primary">
                Begin the experience
                <ArrowDown className="size-4 anim-drift" aria-hidden="true" />
              </a>
              <a href="#toolkit" className="btn btn-ghost">
                Go straight to the toolkit
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-7 text-[0.8125rem] leading-relaxed text-ink-3">
              About 20 minutes <span aria-hidden="true">·</span> Explore in any order{' '}
              <span aria-hidden="true">·</span> Nothing you enter leaves your browser
            </p>
          </motion.div>

          <motion.aside
            aria-label="What is AuDHD?"
            className="max-w-sm rounded-2xl border border-line bg-night/70 p-5 backdrop-blur-sm min-[900px]:justify-self-end"
            {...word(1.15)}
          >
            <p className="eyebrow text-amber">What is AuDHD?</p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
              A community term for being <strong className="font-semibold text-ink">both autistic and ADHD</strong>. Not a
              separate diagnosis: two conditions, diagnosed separately, lived together.
            </p>
            <a href="#orientation" className="link mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] text-ink">
              Read the orientation <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          </motion.aside>
        </div>
      </motion.div>
    </section>
  )
}
