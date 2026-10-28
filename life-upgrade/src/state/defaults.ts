import type { AppState, ItemState } from '../domain/types'
import { DEFAULT_GOAL_WEIGHTS } from '../domain/taxonomy'
import { DEFAULT_ITEM_STATE } from '../engine/scoring'

export const STORAGE_KEY = 'essential-life-upgrade/v1'

export const BUDGET_PRESETS = [2000, 5000, 10000, 25000, 50000] as const

export const DEFAULT_VALUE_FLOOR = 60

export const MAX_BUDGET = 10_000_000

export const todayISO = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function createDefaultState(now = new Date()): AppState {
  const iso = now.toISOString()
  return {
    version: 1,
    budget: { amount: 10000, periodStart: todayISO(now) },
    goals: { ...DEFAULT_GOAL_WEIGHTS },
    items: {},
    catalog: { overrides: {}, custom: [], hidden: [] },
    listings: [],
    settings: { theme: 'system', valueFloor: DEFAULT_VALUE_FLOOR, researchEndpoint: '', inventoryDone: false },
    meta: { createdAt: iso, updatedAt: iso },
  }
}

export function itemStateOf(state: AppState, id: string): ItemState {
  return state.items[id] ?? DEFAULT_ITEM_STATE
}
