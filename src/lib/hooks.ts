import { useEffect, useRef, useState, type RefObject } from 'react'

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/** true while the element is within (or near) the viewport */
export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = '120px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}

/** sets --mx / --my on the element for the cursor spotlight effect */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const on = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('pointermove', on)
    return () => el.removeEventListener('pointermove', on)
  }, [])
  return ref
}

/** id of the section currently crossing the middle band of the viewport */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')
  useEffect(() => {
    const els = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting)
        if (vis.length) setActive(vis[0].target.id)
      },
      { rootMargin: '-46% 0px -53% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
  return active
}

/** move focus into a dialog, trap Tab, close on Escape, restore focus on close */
export function useDialogFocus(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(sel) ?? [])
    const raf = requestAnimationFrame(() => (panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) return
        const i = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [open, panel])
}
