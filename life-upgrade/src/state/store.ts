import { createContext, createElement, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { AppState, CatalogItem, GoalId, ItemState, ItemStatus, Listing, Purchase, Review, Settings } from '../domain/types'
import { DEFAULT_GOAL_WEIGHTS } from '../domain/taxonomy'
import { buildModel, type Model } from '../engine/model'
import { DEFAULT_ITEM_STATE } from '../engine/scoring'
import { createDefaultState, MAX_BUDGET, STORAGE_KEY } from './defaults'
import { parseState } from './validation'

/* ------------------------------------------------------------------
   One store, one reducer. State is saved to localStorage on every change
   and re-read when another tab writes, so two open tabs never fight.
------------------------------------------------------------------- */

export type Action =
  | { type: 'item/status'; id: string; status: ItemStatus; purchase?: Purchase }
  | { type: 'item/patch'; id: string; patch: Partial<Omit<ItemState, 'status' | 'updatedAt'>> }
  | { type: 'item/restore'; id: string; state: ItemState | undefined }
  | { type: 'item/review'; id: string; review: Review | undefined }
  | { type: 'items/status'; ids: string[]; status: ItemStatus }
  | { type: 'goals/set'; goal: GoalId; weight: number }
  | { type: 'goals/reset' }
  | { type: 'budget/set'; amount: number }
  | { type: 'budget/period'; date: string }
  | { type: 'catalog/custom'; item: CatalogItem }
  | { type: 'catalog/override'; id: string; patch: Partial<CatalogItem> }
  | { type: 'catalog/reset-item'; id: string }
  | { type: 'catalog/hide'; id: string }
  | { type: 'catalog/unhide-all' }
  | { type: 'catalog/delete-custom'; id: string }
  | { type: 'listing/upsert'; listing: Listing }
  | { type: 'listing/delete'; id: string }
  | { type: 'listings/add'; listings: Listing[] }
  | { type: 'settings/patch'; patch: Partial<Settings> }
  | { type: 'state/replace'; state: AppState }
  | { type: 'state/reset' }

const now = () => new Date().toISOString()

function setItem(s: AppState, id: string, next: ItemState): AppState {
  return { ...s, items: { ...s.items, [id]: { ...next, updatedAt: now() } } }
}

const current = (s: AppState, id: string) => s.items[id] ?? DEFAULT_ITEM_STATE

export function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'item/status': {
      const prev = current(s, a.id)
      const next: ItemState = { ...prev, status: a.status }
      if (a.status === 'purchased') next.purchase = a.purchase ?? prev.purchase
      else if (prev.status === 'purchased') {
        next.purchase = undefined
        next.review = undefined
      }
      if (a.status !== 'deferred' && a.status !== 'wishlist') next.targetDate = prev.targetDate
      return setItem(s, a.id, next)
    }
    case 'item/patch':
      return setItem(s, a.id, { ...current(s, a.id), ...a.patch })
    case 'item/restore': {
      const items = { ...s.items }
      if (a.state) items[a.id] = a.state
      else delete items[a.id]
      return { ...s, items }
    }
    case 'item/review':
      return setItem(s, a.id, { ...current(s, a.id), review: a.review })
    case 'items/status': {
      let out = s
      for (const id of a.ids) out = reducer(out, { type: 'item/status', id, status: a.status })
      return out
    }
    case 'goals/set':
      return { ...s, goals: { ...s.goals, [a.goal]: Math.max(0, Math.min(5, Math.round(a.weight))) } }
    case 'goals/reset':
      return { ...s, goals: { ...DEFAULT_GOAL_WEIGHTS } }
    case 'budget/set':
      return { ...s, budget: { ...s.budget, amount: Math.max(0, Math.min(MAX_BUDGET, Math.round(a.amount))) } }
    case 'budget/period':
      return { ...s, budget: { ...s.budget, periodStart: a.date } }
    case 'catalog/custom': {
      const custom = s.catalog.custom.filter((c) => c.id !== a.item.id)
      return { ...s, catalog: { ...s.catalog, custom: [...custom, { ...a.item, custom: true }] } }
    }
    case 'catalog/override': {
      if (s.catalog.custom.some((c) => c.id === a.id)) {
        const custom = s.catalog.custom.map((c) => (c.id === a.id ? { ...c, ...a.patch, id: c.id, custom: true } : c))
        return { ...s, catalog: { ...s.catalog, custom } }
      }
      const prev = s.catalog.overrides[a.id] ?? {}
      return { ...s, catalog: { ...s.catalog, overrides: { ...s.catalog.overrides, [a.id]: { ...prev, ...a.patch } } } }
    }
    case 'catalog/reset-item': {
      const overrides = { ...s.catalog.overrides }
      delete overrides[a.id]
      return { ...s, catalog: { ...s.catalog, overrides } }
    }
    case 'catalog/hide':
      return { ...s, catalog: { ...s.catalog, hidden: [...new Set([...s.catalog.hidden, a.id])] } }
    case 'catalog/unhide-all':
      return { ...s, catalog: { ...s.catalog, hidden: [] } }
    case 'catalog/delete-custom': {
      const items = { ...s.items }
      delete items[a.id]
      return {
        ...s,
        items,
        catalog: { ...s.catalog, custom: s.catalog.custom.filter((c) => c.id !== a.id) },
        listings: s.listings.filter((l) => l.itemId !== a.id),
      }
    }
    case 'listing/upsert': {
      const exists = s.listings.some((l) => l.id === a.listing.id)
      return { ...s, listings: exists ? s.listings.map((l) => (l.id === a.listing.id ? a.listing : l)) : [...s.listings, a.listing] }
    }
    case 'listing/delete':
      return { ...s, listings: s.listings.filter((l) => l.id !== a.id) }
    case 'listings/add': {
      const ids = new Set(s.listings.map((l) => l.id))
      return { ...s, listings: [...s.listings, ...a.listings.filter((l) => !ids.has(l.id))] }
    }
    case 'settings/patch':
      return { ...s, settings: { ...s.settings, ...a.patch } }
    case 'state/replace':
      return a.state
    case 'state/reset':
      return createDefaultState()
  }
}

/* ---------- Persistence ---------- */

export type StorageIssue = 'unavailable' | 'recovered' | 'write-failed' | null

function load(): { state: AppState; issue: StorageIssue } {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { state: createDefaultState(), issue: 'unavailable' }
  }
  if (!raw) return { state: createDefaultState(), issue: null }
  try {
    return { state: parseState(JSON.parse(raw)), issue: null }
  } catch {
    // Keep the unreadable copy so nothing is silently destroyed
    try {
      localStorage.setItem(`${STORAGE_KEY}/unreadable-${Date.now()}`, raw)
    } catch {
      /* storage full: nothing more we can do */
    }
    return { state: createDefaultState(), issue: 'recovered' }
  }
}

function createStore() {
  const initial = load()
  let state = initial.state
  let issue: StorageIssue = initial.issue
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      if (issue === 'write-failed') issue = null
    } catch {
      issue = 'write-failed'
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        state = parseState(JSON.parse(e.newValue))
        emit()
      } catch {
        /* another tab wrote something we can't read; keep ours */
      }
    })
  }

  return {
    getState: () => state,
    getIssue: () => issue,
    dispatch(action: Action) {
      const next = reducer(state, action)
      if (next === state) return
      state = { ...next, meta: { ...next.meta, updatedAt: now() } }
      save()
      emit()
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    dismissIssue() {
      issue = null
      emit()
    },
  }
}

export const store = createStore()
export const dispatch = store.dispatch

export function useAppState() {
  return useSyncExternalStore(store.subscribe, store.getState)
}

export function useStorageIssue() {
  return useSyncExternalStore(store.subscribe, store.getIssue)
}

/* ---------- Derived model, computed once per change and shared ---------- */

const ModelContext = createContext<Model | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const state = useAppState()
  const model = useMemo(() => buildModel(state), [state])
  return createElement(ModelContext.Provider, { value: model }, children)
}

export function useModel() {
  const m = useContext(ModelContext)
  if (!m) throw new Error('useModel must be used inside ModelProvider')
  return m
}
