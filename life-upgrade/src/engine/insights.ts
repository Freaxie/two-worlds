import type { CatalogItem, CategoryId } from '../domain/types'
import { CATEGORIES, CLASS_META, FREQUENCY_META } from '../domain/taxonomy'
import type { Model } from './model'
import type { ItemEval } from './scoring'
import { VALUE_BASELINE } from './planner'

/* ------------------------------------------------------------------
   The dashboard's answers. Each function answers one question the user
   should be able to read off the home screen without digging.
------------------------------------------------------------------- */

const isCandidate = (e: ItemEval) => e.open && !e.blocked && !e.coveredBy.length && !e.state.hasAlternative

/** 1. What are my five highest-value potential purchases? */
export function topPurchases(model: Model, n = 5) {
  return model.evals
    .filter(isCandidate)
    .sort((a, b) => b.score - a.score || b.current.valueIndex - a.current.valueIndex)
    .slice(0, n)
}

/** The highest-scoring open item you can afford now, with any hard dependencies priced in */
export function bestNext(model: Model) {
  const remaining = model.budget.remaining
  const ranked = model.evals.filter(isCandidate).sort((a, b) => b.score - a.score || a.current.price - b.current.price)
  const priced = ranked.map((e) => {
    const deps = e.unmet.filter((u) => u.kind === 'requires').map((u) => model.evalById.get(u.item.id)!).filter(Boolean)
    return { eval: e, deps, price: e.current.price + deps.reduce((s, d) => s + d.current.price, 0) }
  })
  const fit = priced.find((p) => p.price <= remaining)
  if (fit) return { ...fit, fits: true }
  return priced[0] ? { ...priced[0], fits: false } : undefined
}

/** 2. Which purchases solve my biggest recurring problems? Severity × how often it bites × how much you care. */
export function recurringProblems(model: Model, n = 4) {
  const friction = (e: ItemEval) => (e.item.severity / 5) * FREQUENCY_META[e.item.frequency].factor * (0.5 + 0.5 * e.goal.fit)
  return model.evals
    .filter((e) => isCandidate(e) && e.item.severity >= 3 && ['daily', 'several-weekly'].includes(e.item.frequency))
    .sort((a, b) => friction(b) - friction(a) || b.score - a.score)
    .slice(0, n)
}

/** 4. What do I already own that makes another purchase redundant? */
export function coverage(model: Model) {
  const redundant: { have: CatalogItem; covers: CatalogItem[] }[] = []
  for (const e of model.evals) {
    if (!e.have) continue
    const covers = (e.item.alternatives ?? []).map((id) => model.evalById.get(id)).filter((x): x is ItemEval => !!x && !x.have && x.state.status !== 'unnecessary')
    if (covers.length) redundant.push({ have: e.item, covers: covers.map((c) => c.item) })
  }
  const declared = model.evals.filter((e) => e.state.hasAlternative && !e.have && e.state.status !== 'unnecessary')
  const owned = model.evals.filter((e) => e.have)
  const notNeeded = model.evals.filter((e) => e.state.status === 'unnecessary')
  return { redundant, declared, owned, notNeeded }
}

export type Postpone = { eval: ItemEval; reason: string; after?: CatalogItem[] }

/** 5. Which purchases should I postpone? The costliest temptations come first. */
export function postpone(model: Model, n = 5): Postpone[] {
  const out: Postpone[] = []
  for (const e of model.evals) {
    if (!e.open && e.state.status !== 'deferred') continue
    if (e.coveredBy.length || e.state.hasAlternative) continue
    const found = e.unmet.filter((u) => u.kind === 'buildsOn').map((u) => u.item)
    const req = e.unmet.filter((u) => u.kind === 'requires')
    if (e.state.status === 'deferred') {
      out.push({ eval: e, reason: e.state.targetDate ? `You deferred this until ${e.state.targetDate}.` : 'You chose to wait on this.' })
    } else if (e.blocked) {
      out.push({ eval: e, reason: `Needs ${req.map((u) => u.item.name.toLowerCase()).join(', ')}, which you set aside.`, after: req.map((u) => u.item) })
    } else if (found.length && e.score < 65) {
      out.push({ eval: e, reason: 'Builds on things you don’t have yet.', after: found })
    } else if (e.item.class === 'luxury' && e.score < 65) {
      out.push({ eval: e, reason: 'A want, not a need. Fine to buy once the essentials are handled.' })
    } else if (e.current.diminishing && e.state.tier === e.current.tier && e.current.upgrade) {
      out.push({ eval: e, reason: `You picked the ${e.current.tier} tier, which costs ₹${e.current.upgrade.extraPrice.toLocaleString('en-IN')} more for little extra.` })
    } else if (e.score < 50 && e.current.price >= 3000) {
      out.push({ eval: e, reason: 'Expensive for what it would do for your current goals.' })
    }
  }
  return out.sort((a, b) => b.eval.current.price - a.eval.current.price).slice(0, n)
}

/** 6. What can I buy once that keeps paying off for years? */
export function buyOnce(model: Model, n = 4) {
  const durable = (e: ItemEval) => e.score * Math.min(e.current.lifespan, 12)
  return model.evals
    .filter((e) => isCandidate(e) && e.current.lifespan >= 5 && ['daily', 'several-weekly', 'weekly'].includes(e.item.frequency) && e.score >= 55)
    .sort((a, b) => durable(b) - durable(a))
    .slice(0, n)
}

export type CategoryOpportunity = {
  id: CategoryId
  name: string
  index: string
  needs: number
  wants: number
  total: number
  open: number
  top?: ItemEval
}

/** Value still on the table per category: the sum of every open item's score above 50 */
export function categoryOpportunities(model: Model): CategoryOpportunity[] {
  return CATEGORIES.map((c) => {
    const items = model.evals.filter((e) => e.item.category === c.id && isCandidate(e))
    let needs = 0
    let wants = 0
    for (const e of items) {
      const v = Math.max(0, e.score - VALUE_BASELINE)
      if (CLASS_META[e.item.class].discretionary) wants += v
      else needs += v
    }
    const top = [...items].sort((a, b) => b.score - a.score)[0]
    return { id: c.id, name: c.name, index: c.index, needs, wants, total: needs + wants, open: items.length, top }
  }).sort((a, b) => b.total - a.total)
}

/** Money and time: what your purchases save now, and what the plan would add */
export function savings(model: Model, planIds: string[]) {
  let realisedMonthly = 0
  let realisedMinutes = 0
  for (const e of model.evals) {
    if (!e.have) continue
    const solved = e.state.review?.solved
    const realisation = solved === 'no' ? 0 : solved === 'partly' ? 0.5 : 1
    realisedMonthly += e.item.monthlySavings * realisation
    realisedMinutes += e.item.minutesSaved * realisation
  }
  const plan = planIds.map((id) => model.evalById.get(id)).filter((x): x is ItemEval => !!x)
  return {
    realisedMonthly,
    realisedHoursPerMonth: (realisedMinutes * 52) / 12 / 60,
    plannedMonthly: plan.reduce((s, e) => s + e.item.monthlySavings, 0),
    plannedHoursPerMonth: (plan.reduce((s, e) => s + e.item.minutesSaved, 0) * 52) / 12 / 60,
  }
}
