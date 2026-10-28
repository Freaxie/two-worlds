import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../lib/format'

/* ---------- Buttons ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink/85 border border-ink',
  secondary: 'bg-surface text-ink border border-line-strong hover:border-ink/40 hover:bg-inset/60',
  ghost: 'text-ink-2 hover:text-ink hover:bg-inset border border-transparent',
  danger: 'bg-surface text-bad border border-bad/40 hover:bg-bad/8 hover:border-bad',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; icon?: LucideIcon; iconRight?: LucideIcon }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-8 px-2.5 text-[0.8125rem]' : 'h-10 px-3.5 text-sm',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon aria-hidden className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={1.75} />}
      {children}
      {IconRight && <IconRight aria-hidden className="size-3.5" strokeWidth={1.75} />}
    </button>
  )
})

export function IconButton({ icon: Icon, label, className, size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-[10px] text-ink-2 transition-colors hover:bg-inset hover:text-ink aria-pressed:bg-ink aria-pressed:text-on-ink disabled:opacity-40',
        size === 'sm' ? 'size-8' : 'size-10',
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden className={size === 'sm' ? 'size-4' : 'size-[18px]'} strokeWidth={1.75} />
    </button>
  )
}

/* ---------- Chips & segmented controls ---------- */

export function Chip({ active, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cx(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] whitespace-nowrap transition-colors',
        active ? 'border-ink bg-ink text-on-ink' : 'border-line-strong bg-surface text-ink-2 hover:border-ink/40 hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
  className,
}: {
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const move = (dir: number) => {
    const i = options.findIndex((o) => o.value === value)
    const next = options[(i + dir + options.length) % options.length]!
    onChange(next.value)
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('inline-flex max-w-full overflow-x-auto rounded-[11px] border border-line bg-inset p-0.5', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), move(1))
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), move(-1))
      }}
    >
      {options.map((o, idx) => {
        const on = o.value === value
        const focusable = on || (idx === 0 && !options.some((x) => x.value === value))
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            tabIndex={focusable ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'shrink-0 rounded-[9px] whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-[0.8125rem]' : 'h-8 px-3 text-sm',
              on ? 'bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]' : 'text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Fields ---------- */

const fieldBase =
  'w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-ink focus:outline-none aria-invalid:border-bad'

export function Field({ label, hint, error, children, className }: { label: string; hint?: ReactNode; error?: string; children: (id: string, describedBy?: string) => ReactNode; className?: string }) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-2">
        {label}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(fieldBase, 'h-10', className)} {...rest} />
})

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'h-10 appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8', className)} style={{ backgroundImage: CHEVRON }} {...rest}>
      {children}
    </select>
  )
}

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5' fill='none' stroke='%238a857b' stroke-width='1.5'/%3E%3C/svg%3E")`

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, 'min-h-20 py-2 leading-relaxed', className)} {...rest} />
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-ink' : 'bg-line-strong')}
      >
        <span className={cx('absolute top-0.5 left-0.5 size-4 rounded-full bg-surface shadow transition-transform duration-200', checked && 'translate-x-4')} />
      </button>
      <label htmlFor={id} className="text-sm leading-snug">
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[0.8125rem] text-muted">{description}</span>}
      </label>
    </div>
  )
}

/* ---------- Layout ---------- */

export function SectionHead({ index, title, lede, action, as: H = 'h2' }: { index?: string; title: ReactNode; lede?: ReactNode; action?: ReactNode; as?: 'h2' | 'h3' }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-2xl">
        {index && <p className="eyebrow mb-2 text-muted">{index}</p>}
        <H className={cx('display text-ink', H === 'h2' ? 'text-[1.75rem] sm:text-[2rem]' : 'text-[1.375rem]')}>{title}</H>
        {lede && <p className="pretty mt-2 text-[0.9375rem] text-ink-2">{lede}</p>}
      </div>
      {action}
    </div>
  )
}

export function Empty({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] border border-dashed border-line-strong px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full border border-line bg-surface text-muted">
        <Icon aria-hidden className="size-5" strokeWidth={1.5} />
      </span>
      <p className="display text-xl text-ink">{title}</p>
      {children && <div className="pretty mt-2 max-w-md text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className="mt-1 text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}
