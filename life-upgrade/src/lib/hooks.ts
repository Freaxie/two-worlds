import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ThemePref } from '../domain/types'

/** Applies the theme preference to <html data-theme> and follows the OS when set to system */
export function useTheme(pref: ThemePref) {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches)
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])
}

/**
 * FLIP re-ordering: children with data-flip="<key>" glide from their old position
 * to the new one when the list re-sorts (goal weights changing, for instance).
 */
export function useFlip<T extends HTMLElement>(deps: unknown) {
  const ref = useRef<T>(null)
  const last = useRef(new Map<string, DOMRect>())
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, DOMRect>()
    root.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const key = el.dataset.flip!
      const rect = el.getBoundingClientRect()
      next.set(key, rect)
      const prev = last.current.get(key)
      if (!prev || reduce) return
      const dy = prev.top - rect.top
      if (Math.abs(dy) < 1) return
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.2, 0.7, 0.1, 1)' })
    })
    last.current = next
  }, [deps])
  return ref
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/** Global keyboard shortcut, ignored while typing in a field */
export function useKey(key: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  const saved = useRef(handler)
  saved.current = handler
  useEffect(() => {
    if (!enabled) return
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === key) saved.current(e)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [key, enabled])
}

export function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
