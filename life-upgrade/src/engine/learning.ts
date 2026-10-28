import type { CatalogItem, CategoryId, ItemState, Review } from '../domain/types'
import { USAGE_META } from '../domain/taxonomy'
import { clamp } from './scoring'

/* ------------------------------------------------------------------
   Purchase impact. Each rating becomes a 0–1 satisfaction score; a
   category's average nudges future scores in that category. The nudge
   is shrunk toward zero when there are few ratings, so one bad buy
   doesn't condemn a whole category.
------------------------------------------------------------------- */

export const SATISFACTION_WEIGHTS = { usefulness: 0.35, usage: 0.25, solved: 0.25, buyAgain: 0.15 } as const

/** Average satisfaction that counts as "as expected" — no adjustment either way */
export const NEUTRAL_SATISFACTION = 0.6
export const LEARNING_SCALE = 25
export const LEARNING_MIN = -10
export const LEARNING_MAX = 8

export function satisfaction(r: Review) {
  const solved = r.solved === 'yes' ? 1 : r.solved === 'partly' ? 0.5 : 0
  return (
    SATISFACTION_WEIGHTS.usefulness * ((r.usefulness - 1) / 4) +
    SATISFACTION_WEIGHTS.usage * USAGE_META[r.usage].factor +
    SATISFACTION_WEIGHTS.solved * solved +
    SATISFACTION_WEIGHTS.buyAgain * (r.buyAgain ? 1 : 0)
  )
}

export type CategoryLearning = { adjustment: number; count: number; average: number }

export function learnFromReviews(items: CatalogItem[], states: Record<string, ItemState>) {
  const acc = new Map<CategoryId, { sum: number; n: number }>()
  for (const item of items) {
    const s = states[item.id]
    if (!s?.review || s.status !== 'purchased') continue
    const a = acc.get(item.category) ?? { sum: 0, n: 0 }
    a.sum += satisfaction(s.review)
    a.n += 1
    acc.set(item.category, a)
  }
  const out: Partial<Record<CategoryId, CategoryLearning>> = {}
  for (const [cat, { sum, n }] of acc) {
    const average = sum / n
    const shrink = n / (n + 2)
    const adjustment = clamp(Math.round((average - NEUTRAL_SATISFACTION) * LEARNING_SCALE * shrink), LEARNING_MIN, LEARNING_MAX)
    out[cat] = { adjustment, count: n, average }
  }
  return out
}

export type PurchaseOutcome = {
  item: CatalogItem
  state: ItemState
  price: number
  satisfaction: number
  months: number
  /** Rupees per use so far, from the reported usage frequency */
  costPerUse?: number
  /** Money that bought disappointment: price × (1 − satisfaction) */
  regret: number
}

export function monthsSince(date: string, today = new Date()) {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 1
  const months = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  return Math.max(1, months)
}

export function purchaseOutcomes(items: CatalogItem[], states: Record<string, ItemState>, today = new Date()) {
  const out: PurchaseOutcome[] = []
  for (const item of items) {
    const s = states[item.id]
    if (s?.status !== 'purchased' || !s.review || !s.purchase) continue
    const sat = satisfaction(s.review)
    const months = monthsSince(s.purchase.date, today)
    const uses = USAGE_META[s.review.usage].perMonth * months
    out.push({
      item,
      state: s,
      price: s.purchase.price,
      satisfaction: sat,
      months,
      costPerUse: uses > 0 ? s.purchase.price / uses : undefined,
      regret: s.purchase.price * (1 - sat),
    })
  }
  const best = out
    .filter((o) => o.satisfaction >= 0.6)
    .sort((a, b) => b.satisfaction - a.satisfaction || (a.costPerUse ?? Infinity) - (b.costPerUse ?? Infinity))
  const mistakes = out.filter((o) => o.satisfaction < 0.5).sort((a, b) => b.regret - a.regret)
  return { all: out, best, mistakes }
}
