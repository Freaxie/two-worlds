import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import { useDialogFocus, useMedia } from '../../lib/hooks'
import { useSettings, type MotionPref, type TextSize } from '../../lib/settings'
import { EASE } from '../ui/Reveal'

type Option<T extends string> = { value: T; label: string }

function Segmented<T extends string>({
  legend,
  hint,
  name,
  value,
  options,
  onChange,
}: {
  legend: string
  hint?: string
  name: string
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="float-left w-full text-[0.9375rem] font-semibold text-ink">{legend}</legend>
      {hint && <p className="clear-both pt-1 text-[0.8125rem] leading-snug text-ink-3">{hint}</p>}
      <div className="clear-both mt-3 grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-line-2 p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={`relative flex min-h-10 cursor-pointer items-center justify-center rounded-full px-2 text-center text-[0.8125rem] leading-tight transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-amber ${
              value === o.value ? 'bg-ink text-night' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function SensoryPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const { settings, set, reset, calm } = useSettings()
  const osReduce = useMedia('(prefers-reduced-motion: reduce)')
  useDialogFocus(open, panel, onClose)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-void/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            id="sensory-panel"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sensory-title"
            aria-describedby="sensory-desc"
            className="fixed inset-x-3 top-[4.5rem] z-[65] max-h-[calc(100svh-5.5rem)] overflow-y-auto rounded-3xl border border-line-2 bg-night-2 p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] sm:left-auto sm:right-4 sm:w-[24rem]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="sensory-title" className="font-display text-2xl leading-tight text-ink">
                  Sensory settings
                </h2>
                <p id="sensory-desc" className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
                  Adjust how much this page moves, glows and contrasts. Saved on this device only.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                data-autofocus
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line-2 text-ink hover:border-ink-3"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close sensory settings</span>
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <Segmented<MotionPref>
                legend="Motion"
                hint={`Animation, parallax and smooth scrolling. Your device currently asks for ${osReduce ? 'reduced' : 'full'} motion.`}
                name="motion"
                value={settings.motion}
                onChange={(motion) => set({ motion })}
                options={[
                  { value: 'system', label: 'Device default' },
                  { value: 'full', label: 'Full' },
                  { value: 'reduced', label: 'Reduced' },
                ]}
              />

              <div className="border-t border-line pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span id="ambient-label" className="text-[0.9375rem] font-semibold text-ink">
                      Ambient effects
                    </span>
                    <p id="ambient-hint" className="pt-1 text-[0.8125rem] leading-snug text-ink-3">
                      Moving wave fields, cursor glow and drifting text.{calm && ' Paused while motion is reduced.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.ambient}
                    aria-labelledby="ambient-label"
                    aria-describedby="ambient-hint"
                    onClick={() => set({ ambient: !settings.ambient })}
                    className={`relative mt-1 h-8 w-14 shrink-0 rounded-full border transition-colors ${
                      settings.ambient ? 'border-amber bg-amber/25' : 'border-line-2 bg-night-4'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-1/2 size-6 -translate-y-1/2 rounded-full transition-[left,background-color] duration-300 ${
                        settings.ambient ? 'left-[1.6rem] bg-amber' : 'left-1 bg-ink-3'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <Segmented<TextSize>
                legend="Text size"
                name="text"
                value={settings.text}
                onChange={(text) => set({ text })}
                options={[
                  { value: 'base', label: 'Default' },
                  { value: 'lg', label: 'Larger' },
                  { value: 'xl', label: 'Largest' },
                ]}
              />

              <Segmented<'standard' | 'high'>
                legend="Contrast"
                hint="Brightens secondary text and dividing lines."
                name="contrast"
                value={settings.contrast}
                onChange={(contrast) => set({ contrast })}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'high', label: 'Higher' },
                ]}
              />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
              <button
                type="button"
                onClick={reset}
                className="flex min-h-11 items-center gap-2 rounded-full px-1 text-[0.875rem] text-ink-2 hover:text-ink"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset to defaults
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
