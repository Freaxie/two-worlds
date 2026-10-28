import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cx } from '../lib/format'
import { IconButton } from './ui'

/* ---------- Dialog: side sheet on desktop, bottom sheet on phones ---------- */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialog({
  open,
  onClose,
  title,
  children,
  variant = 'sheet',
  footer,
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  variant?: 'sheet' | 'modal'
  footer?: ReactNode
  labelledBy?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const body = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key !== 'Tab' || !panel.current) return
      const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!els.length) return
      const firstEl = els[0]!
      const lastEl = els[els.length - 1]!
      if (e.shiftKey && document.activeElement === firstEl) (e.preventDefault(), lastEl.focus())
      else if (!e.shiftKey && document.activeElement === lastEl) (e.preventDefault(), firstEl.focus())
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = body
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null
  const sheet = variant === 'sheet'
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="animate-fade absolute inset-0 bg-[rgb(10_10_9/0.42)] backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cx(
          'absolute flex flex-col bg-bg shadow-[var(--shadow-lift)] focus:outline-none',
          sheet
            ? 'inset-x-0 bottom-0 max-h-[94dvh] rounded-t-[20px] [animation:sheet-up_0.35s_var(--ease-soft)_both] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[min(640px,100vw)] md:rounded-none md:rounded-l-[20px] md:[animation:sheet-in_0.35s_var(--ease-soft)_both]'
            : 'inset-x-3 top-1/2 mx-auto max-h-[90dvh] max-w-lg -translate-y-1/2 rounded-[18px] [animation:fade-in_0.2s_ease-out_both]',
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <div className="min-w-0 text-sm font-medium text-ink">{title}</div>
            <IconButton icon={X} label="Close" onClick={onClose} size="sm" />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Toasts, with an optional undo ---------- */

type Toast = { id: number; message: string; action?: { label: string; run: () => void } }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(message: string, action?: Toast['action']) {
  const t = { id: nextId++, message, action }
  toasts = [...toasts.slice(-2), t]
  emit()
  setTimeout(() => dismiss(t.id), action ? 6500 : 3500)
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => toasts,
  )
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {list.map((t) => (
        <div key={t.id} className="animate-rise pointer-events-auto flex max-w-md items-center gap-3 rounded-[12px] bg-ink py-2.5 pr-2 pl-4 text-sm text-on-ink shadow-[var(--shadow-lift)]">
          <span className="min-w-0">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="shrink-0 rounded-[8px] px-2.5 py-1 font-medium text-on-ink underline-offset-2 hover:underline"
              onClick={() => {
                t.action!.run()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" className="shrink-0 rounded-[8px] p-1 opacity-70 hover:opacity-100" onClick={() => dismiss(t.id)}>
            <X aria-hidden className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
