import type { AppState, CatalogItem } from '../domain/types'
import { resolveCatalog } from '../data/catalog'
import { learnFromReviews } from './learning'
import { evaluateItem, type ItemEval, type ScoringContext } from './scoring'

/** Everything the UI derives from state, computed once per change */
export type Model = {
  catalog: CatalogItem[]
  byId: Map<string, CatalogItem>
  evals: ItemEval[]
  evalById: Map<string, ItemEval>
  learning: ScoringContext['learning']
  budget: BudgetSummary
}

export type BudgetSummary = {
  amount: number
  spent: number
  /** Estimated cost of everything on the wishlist */
  committed: number
  remaining: number
  purchases: number
}

export function buildModel(state: AppState): Model {
  const catalog = resolveCatalog(state.catalog)
  const byId = new Map(catalog.map((i) => [i.id, i]))
  const learning = learnFromReviews(catalog, state.items)
  const ctx: ScoringContext = { goals: state.goals, states: state.items, byId, listings: state.listings, learning }
  const evals = catalog.map((item) => evaluateItem(item, ctx))
  const evalById = new Map(evals.map((e) => [e.item.id, e]))

  let spent = 0
  let purchases = 0
  for (const e of evals) {
    const p = e.state.purchase
    if (e.state.status === 'purchased' && p && p.date >= state.budget.periodStart) {
      spent += p.price
      purchases += 1
    }
  }
  const committed = evals.filter((e) => e.state.status === 'wishlist').reduce((s, e) => s + (e.current.verified?.price ?? e.current.price), 0)

  return {
    catalog,
    byId,
    evals,
    evalById,
    learning,
    budget: { amount: state.budget.amount, spent, committed, remaining: state.budget.amount - spent, purchases },
  }
}
