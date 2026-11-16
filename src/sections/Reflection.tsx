import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ClipboardCopy, Compass, Lock, RotateCcw, ShieldAlert } from 'lucide-react'
import { ChapterHeader } from '../components/ui/ChapterHeader'
import { EASE, Reveal } from '../components/ui/Reveal'
import {
  ANSWER_LABEL,
  ANSWERS,
  STATEMENTS,
  THEME_BY_ID,
  THEMES,
  detectTensions,
  themeResonance,
  type Answer,
} from '../data/reflection'
import { openToolkit } from '../lib/bus'
import { copyText } from '../lib/storage'
import { useSettings } from '../lib/settings'

type Stage = 'intro' | 'questions' | 'summary'

/** focus an element as soon as it mounts (used after each transition so screen readers follow along) */
function useMountFocus<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!enabled) return
    const id = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 30)
    return () => window.clearTimeout(id)
  }, [enabled])
  return ref
}

function StatementText({ text, focus }: { text: string; focus: boolean }) {
  const ref = useMountFocus<HTMLSpanElement>(focus)
  return (
    <span
      ref={ref}
      tabIndex={-1}
      className="block min-h-[2.5em] max-w-[24em] font-display text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-[1.15] text-ink outline-none"
    >
      {text}
    </span>
  )
}

/* colour per theme along violet → amber → cyan — by theme, never by condition */
const STOPS = [
  [169, 156, 245],
  [244, 179, 99],
  [98, 227, 238],
]
function themeColor(i: number, n: number) {
  const t = n <= 1 ? 0 : i / (n - 1)
  const seg = t < 0.5 ? 0 : 1
  const lt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
  const [a, b] = [STOPS[seg], STOPS[seg + 1]]
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * lt))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

function Dots({ a }: { a: Answer }) {
  const n = a === 'often' ? 3 : a === 'sometimes' ? 2 : a === 'rarely' ? 1 : 0
  if (a === 'na')
    return (
      <span aria-hidden="true" className="font-mono text-[0.75rem] leading-none text-ink-3">
        n/a
      </span>
    )
  return (
    <span aria-hidden="true" className="flex gap-1">
      {[0, 1, 2].map((d) => (
        <span key={d} className={`size-1.5 rounded-full ${d < n ? 'bg-current' : 'bg-current opacity-20'}`} />
      ))}
    </span>
  )
}

/* ---------- the generative pattern: a souvenir, not a measurement ---------- */

function Pattern({ answers }: { answers: Record<string, Answer> }) {
  const { calm } = useSettings()
  const rings = useMemo(
    () =>
      STATEMENTS.map((s, i) => {
        const a = answers[s.id]
        const ti = THEMES.findIndex((t) => t.id === s.theme)
        const r = 30 + i * 7.4
        const amp = a === 'often' ? 6.5 : a === 'sometimes' ? 3.4 : a === 'rarely' ? 1.2 : 0
        const k = 3 + ti
        let d = ''
        for (let j = 0; j <= 240; j++) {
          const th = (j / 240) * Math.PI * 2
          const rr = r + amp * Math.sin(k * th + i * 0.7)
          d += `${j ? 'L' : 'M'}${(160 + rr * Math.cos(th)).toFixed(2)},${(160 + rr * Math.sin(th)).toFixed(2)}`
        }
        return {
          id: s.id,
          d: d + 'Z',
          color: themeColor(ti, THEMES.length),
          opacity: a === 'often' ? 0.95 : a === 'sometimes' ? 0.72 : a === 'rarely' ? 0.45 : 0.22,
          dashed: !a || a === 'na',
        }
      }),
    [answers]
  )
  return (
    <svg viewBox="0 0 320 320" className="h-auto w-full" role="img" aria-label="A decorative pattern drawn from your answers. It does not measure anything.">
      <circle cx="160" cy="160" r="3" fill="var(--color-amber)" />
      {rings.map((r, i) => (
        <motion.path
          key={r.id}
          d={r.d}
          fill="none"
          stroke={r.color}
          strokeOpacity={r.opacity}
          strokeWidth={1.1}
          strokeDasharray={r.dashed ? '2 5' : undefined}
          initial={calm ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.08 * i }}
        />
      ))}
    </svg>
  )
}

/* ---------- summary ---------- */

function buildNotes(answers: Record<string, Answer>, date: string) {
  const lines = [
    'Reflection notes — “No Instruction Manual”, an interactive essay on AuDHD',
    `Date: ${date}`,
    'This is a personal reflection, not a diagnostic or screening result.',
    '',
    'Statements and my responses:',
    ...STATEMENTS.map((s) => `- ${s.text} — ${answers[s.id] ? ANSWER_LABEL[answers[s.id]] : 'Skipped'}`),
  ]
  const strong = THEMES.filter((t) => themeResonance(answers, t.id) === 'strong').map((t) => t.label)
  if (strong.length) lines.push('', `Came up most often: ${strong.join('; ')}.`)
  const tensions = detectTensions(answers)
  if (tensions.length) lines.push('', 'Tensions I noticed:', ...tensions.map((t) => `- ${t.text}`))
  lines.push('', 'Things I might want to mention (examples, childhood, what I have tried):', '- ', '- ')
  return lines.join('\n')
}

function Summary({ answers, onRestart, focus }: { answers: Record<string, Answer>; onRestart: () => void; focus: boolean }) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const headingRef = useMountFocus<HTMLHeadingElement>(focus)
  const date = useMemo(() => new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }), [])
  const answered = STATEMENTS.filter((s) => answers[s.id]).length
  const res = THEMES.map((t) => ({ t, r: themeResonance(answers, t.id) }))
  const strong = res.filter((x) => x.r === 'strong')
  const some = res.filter((x) => x.r === 'some')
  const faint = res.filter((x) => x.r === 'faint' || x.r === 'none')
  const tensions = detectTensions(answers)

  const go = (next: { toolkit?: string; anchor?: string }) => {
    if (next.toolkit) openToolkit(next.toolkit)
    else if (next.anchor) document.getElementById(next.anchor)?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="mx-auto max-w-xs lg:sticky lg:top-28">
          <Pattern answers={answers} />
          <p className="mt-4 text-center text-[0.8125rem] leading-relaxed text-ink-3">
            Drawn from your answers: one ring per statement, rippling more the more often you chose it. It measures nothing — it’s
            just yours.
          </p>
        </div>
      </div>

      <div className="lg:col-span-8">
        <p className="eyebrow text-amber">Your reflection · {date}</p>
        <h3 ref={headingRef} tabIndex={-1} className="display mt-4 text-[clamp(2rem,1.5rem+1.8vw,3rem)] leading-[1.06] text-ink outline-none">
          What you described
        </h3>
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-2">
          You responded to {answered} of {STATEMENTS.length} statements.{' '}
          {strong.length || some.length
            ? 'Here is what came up, in your own selections — offered as a mirror, not a verdict.'
            : 'Few of these statements resonated with you, which is useful information too. Experiences vary enormously, between people and over time.'}
        </p>

        {(strong.length > 0 || some.length > 0) && (
          <ul className="mt-8 space-y-4">
            {[...strong, ...some].map(({ t, r }) => (
              <li key={t.id} className="rounded-2xl border border-line bg-night-3/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{t.label}</p>
                  <p className="eyebrow text-ink-3">{r === 'strong' ? 'Came up often' : 'Came up sometimes'}</p>
                </div>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{r === 'strong' ? t.strong : t.some}</p>
                <button type="button" onClick={() => go(t.next)} className="link mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] text-ink">
                  {t.next.label} <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {tensions.length > 0 && (
          <div className="mt-8">
            <p className="eyebrow text-ink-3">Tensions you’re holding</p>
            <ul className="mt-3 space-y-3">
              {tensions.map((t) => (
                <li key={t.pair.join()} className="border-l-2 border-amber pl-4 text-[0.9375rem] leading-relaxed text-ink-2">
                  {t.text}
                </li>
              ))}
            </ul>
            <a href="#engine" className="link mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] text-ink">
              Explore them in the Contradiction Engine <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        )}

        {faint.length > 0 && (strong.length > 0 || some.length > 0) && (
          <p className="mt-8 text-[0.9375rem] leading-relaxed text-ink-3">
            Came up rarely or not at all: {faint.map((x) => x.t.label).join(', ')}. That is useful information too.
          </p>
        )}

        <details className="group mt-8 rounded-2xl border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-[0.9375rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            Your answers, statement by statement
            <span className="font-mono text-[0.75rem] font-normal text-ink-3 group-open:hidden">Show</span>
            <span className="hidden font-mono text-[0.75rem] font-normal text-ink-3 group-open:inline">Hide</span>
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {STATEMENTS.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="text-[0.9375rem] text-ink-2">{s.text}</span>
                <span className="shrink-0 text-[0.875rem] text-ink">{answers[s.id] ? ANSWER_LABEL[answers[s.id]] : 'Skipped'}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => setCopied((await copyText(buildNotes(answers, date))) ? 'ok' : 'fail')}
          >
            {copied === 'ok' ? <Check className="size-4" aria-hidden="true" /> : <ClipboardCopy className="size-4" aria-hidden="true" />}
            {copied === 'ok' ? 'Copied as notes' : 'Copy as notes'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onRestart}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Start again
          </button>
          <span role="status" className="text-[0.875rem] text-ink-3">
            {copied === 'ok' && 'Plain-text notes copied — useful if you decide to talk to a professional.'}
            {copied === 'fail' && 'Copying isn’t available in this browser. Your answers are listed above.'}
          </span>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-amber/40 bg-amber-deep/30 p-5">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <ShieldAlert className="size-4 text-amber" aria-hidden="true" /> What this is — and isn’t
            </p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
              This reflection is not clinically validated and cannot tell you whether you are autistic, ADHD, or both. Many of
              these experiences are common in the general population and can also come from anxiety, depression, trauma, sleep
              problems or physical health conditions.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-night-3/50 p-5">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Compass className="size-4 text-cyan" aria-hidden="true" /> If you’re considering assessment
            </p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
              If these experiences affect your work, relationships, health or sense of self, it can be worth talking to a
              qualified professional. Bringing notes like these — with real examples — can make that conversation easier.
            </p>
            <a href="#assessment" className="link mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] text-ink">
              What an assessment involves <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
        <p className="mt-6 text-[0.875rem] leading-relaxed text-ink-3">
          If you’re in distress right now, please contact local emergency services or a crisis line —{' '}
          <a href="#support" className="link text-ink-2">
            some are listed in the resources
          </a>
          .
        </p>
      </div>
    </div>
  )
}

/* ---------- the chapter ---------- */

export function Reflection() {
  const [stage, setStage] = useState<Stage>('intro')
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const moved = useRef(false)
  const pointerAt = useRef(-Infinity)

  const s = STATEMENTS[i]
  const last = i === STATEMENTS.length - 1

  useEffect(() => () => window.clearTimeout(timer.current), [])


  const goTo = (n: number) => {
    window.clearTimeout(timer.current)
    moved.current = true
    setDir(n > i ? 1 : -1)
    if (n >= STATEMENTS.length) setStage('summary')
    else setI(Math.max(0, n))
  }

  const choose = (a: Answer, viaPointer: boolean) => {
    setAnswers((prev) => ({ ...prev, [s.id]: a }))
    window.clearTimeout(timer.current)
    // pointer users flow forward; keyboard users (arrow keys change radios) stay in control
    if (viaPointer) timer.current = window.setTimeout(() => goTo(i + 1), 450)
  }

  const restart = () => {
    moved.current = true
    setAnswers({})
    setI(0)
    setDir(-1)
    setStage('questions')
  }

  const theme = THEME_BY_ID[s.theme]

  return (
    <section id="reflection" aria-labelledby="reflection-title" className="relative border-t border-line bg-night-2 py-[clamp(6rem,12vw,11rem)]">
      <div className="wrap">
        <ChapterHeader
          id="reflection"
          num="04"
          kicker="Self-reflection"
          title={
            <>
              A mirror,
              <br />
              <em>not a test.</em>
            </>
          }
          dek={
            <p>
              Sixteen statements about everyday experience. Choose how often each one fits — or say it doesn’t. At the end you’ll
              get a written reflection of what you selected. Not a score. Not a diagnosis.
            </p>
          }
        />

        <div ref={rootRef} className="mt-[clamp(3rem,6vw,5rem)]">
          <AnimatePresence mode="wait" initial={false}>
            {stage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="rounded-[1.75rem] border border-line bg-night/60 p-6 sm:p-10"
              >
                <p className="eyebrow text-ink-3">Before you begin</p>
                <ul className="mt-6 grid gap-6 md:grid-cols-3">
                  {[
                    [
                      ShieldAlert,
                      'Not a diagnosis or a screening test',
                      'It can’t tell you whether you are autistic, ADHD, or both. It hasn’t been clinically validated and it never produces a score or a probability.',
                    ],
                    [Lock, 'Completely private', 'Your answers stay in this browser tab. Nothing is stored or sent anywhere, and they vanish when you leave.'],
                    [
                      Compass,
                      'Yours to interpret',
                      'You’ll get a written reflection of what you chose, links to relevant strategies, and optional notes to take to a professional.',
                    ],
                  ].map(([Icon, title, body]) => {
                    const I = Icon as typeof Lock
                    return (
                      <li key={title as string}>
                        <I className="size-5 text-amber" aria-hidden="true" />
                        <p className="mt-3 font-semibold text-ink">{title as string}</p>
                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{body as string}</p>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-8">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      moved.current = true
                      setStage('questions')
                    }}
                  >
                    Begin the reflection <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                  <p className="text-[0.875rem] text-ink-3">16 statements · about 3 minutes · skip anything</p>
                </div>
              </motion.div>
            )}

            {stage === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-[1.75rem] border border-line bg-night/60 p-6 sm:p-10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[0.8125rem] text-ink-2">
                    Statement <span className="text-amber">{String(i + 1).padStart(2, '0')}</span> / {STATEMENTS.length}
                  </p>
                  <p className="eyebrow text-ink-3">{theme.label}</p>
                </div>
                <div className="mt-4 flex gap-1" aria-hidden="true">
                  {STATEMENTS.map((st, k) => (
                    <span
                      key={st.id}
                      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                        k === i ? 'bg-amber' : answers[st.id] ? 'bg-ink-3' : 'bg-night-4'
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  <motion.fieldset
                    key={s.id}
                    custom={dir}
                    initial={{ opacity: 0, x: dir * 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir * -28 }}
                    transition={{ duration: 0.38, ease: EASE }}
                    className="mt-10 min-w-0"
                  >
                    <legend className="block w-full p-0">
                      <StatementText text={s.text} focus={moved.current} />
                    </legend>
                    <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {ANSWERS.map((o) => {
                        const on = answers[s.id] === o.value
                        return (
                          <label
                            key={o.value}
                            onPointerDown={() => (pointerAt.current = performance.now())}
                            className={`group relative flex min-h-[5.5rem] cursor-pointer flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber ${
                              on ? 'border-amber bg-amber/10 text-ink' : 'border-line-2 text-ink-2 hover:border-ink-3 hover:text-ink'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`answer-${s.id}`}
                              value={o.value}
                              checked={on}
                              onChange={() => {}}
                              onClick={() => choose(o.value, performance.now() - pointerAt.current < 900)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  choose(o.value, false)
                                  goTo(i + 1)
                                }
                              }}
                              className="sr-only"
                            />
                            <span className={`flex items-center justify-between ${on ? 'text-amber' : ''}`}>
                              <Dots a={o.value} />
                              {on && <Check className="size-4" aria-hidden="true" />}
                            </span>
                            <span>
                              <span className="block font-semibold leading-tight">{o.label}</span>
                              <span className="mt-1 block text-[0.8125rem] leading-snug text-ink-3">{o.hint}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </motion.fieldset>
                </AnimatePresence>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
                  <button
                    type="button"
                    onClick={() => (i === 0 ? setStage('intro') : goTo(i - 1))}
                    className="btn btn-ghost"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    {!answers[s.id] && (
                      <button type="button" onClick={() => goTo(i + 1)} className="btn text-ink-2 hover:text-ink">
                        Skip
                      </button>
                    )}
                    <button type="button" onClick={() => goTo(i + 1)} className="btn btn-primary">
                      {last ? 'See my reflection' : 'Next'} <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="rounded-[1.75rem] border border-line bg-night/60 p-6 sm:p-10"
              >
                <Summary answers={answers} onRestart={restart} focus={moved.current} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Reveal className="mt-8 text-[0.875rem] leading-relaxed text-ink-3">
          <p>
            The statements were written for this site to prompt reflection. They are not taken from, and cannot substitute for,
            validated clinical instruments.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
