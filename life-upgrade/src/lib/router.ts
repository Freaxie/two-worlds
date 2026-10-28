import { useSyncExternalStore } from 'react'

/* Hash routing: #/catalog?cat=grooming&item=pillow. Survives refreshes, works from a file:// URL. */

export type View = 'overview' | 'catalog' | 'plan' | 'research' | 'impact' | 'settings' | 'method' | 'triage'

const VIEWS: View[] = ['overview', 'catalog', 'plan', 'research', 'impact', 'settings', 'method', 'triage']

export type Route = { view: View; params: URLSearchParams }

let cached: { hash: string; route: Route } | null = null

function parse(): Route {
  const hash = location.hash
  if (cached && cached.hash === hash) return cached.route
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?')
  const view = (VIEWS.includes(path as View) ? path : 'overview') as View
  const route = { view, params: new URLSearchParams(query) }
  cached = { hash, route }
  return route
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export const useRoute = () => useSyncExternalStore(subscribe, parse)

export function href(view: View, params?: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v) q.set(k, v)
  const s = q.toString()
  return `#/${view}${s ? `?${s}` : ''}`
}

export function navigate(view: View, params?: Record<string, string | undefined>) {
  location.hash = href(view, params)
}

/** Change query params on the current view. `replace` avoids filling history with every keystroke. */
export function setParams(patch: Record<string, string | undefined>, replace = false) {
  const { view, params } = parse()
  const next = new URLSearchParams(params)
  for (const [k, v] of Object.entries(patch)) {
    if (v) next.set(k, v)
    else next.delete(k)
  }
  const s = next.toString()
  const url = `#/${view}${s ? `?${s}` : ''}`
  if (replace) {
    history.replaceState(null, '', url)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else location.hash = url
}

export const openItem = (id: string) => setParams({ item: id })
export const closeItem = () => setParams({ item: undefined })
