import { describe, expect, test } from 'vitest'
import type { AppState, ItemState } from '../domain/types'
import { SEED_CATALOG } from '../data/catalog'
import { createDefaultState } from '../state/defaults'
import { buildModel } from './model'
import { planPurchases } from './planner'
import { costFactor, goalFit, MODIFIERS, valueIndexOf } from './scoring'
import { learnFromReviews, satisfaction } from './learning'
import { categoryOpportunities, coverage, postpone, topPurchases } from './insights'

const withItems = (items: Record<string, Partial<ItemState>>, patch: Partial<AppState> = {}): AppState => {
  const s = createDefaultState(new Date('2026-01-01T00:00:00Z'))
  const full: Record<string, ItemState> = {}
  for (const [id, p] of Object.entries(items)) {
    full[id] = { status: 'candidate', hasAlternative: false, situationConfirmed: false, priority: 'auto', notes: '', updatedAt: '', ...p }
  }
  return { ...s, ...patch, items: full }
}

const evalOf = (state: AppState, id: string) => buildModel(state).evalById.get(id)!

describe('seed catalog', () => {
  test('ids are unique and every relationship points at a real item', () => {
    const ids = new Set(SEED_CATALOG.map((i) => i.id))
    expect(ids.size).toBe(SEED_CATALOG.length)
    for (const i of SEED_CATALOG) {
      for (const r of [...(i.requires ?? []), ...(i.buildsOn ?? []), ...(i.alternatives ?? [])]) expect(ids.has(r), `${i.id} → ${r}`).toBe(true)
      for (const t of Object.values(i.tiers)) if (t) expect(t.priceMin).toBeLessThanOrEqual(t.priceMax)
    }
  })

  test('covers all twelve categories', () => {
    expect(new Set(SEED_CATALOG.map((i) => i.category)).size).toBe(12)
  })
})

describe('scoring', () => {
  test('scores are bounded 0–100 for every item', () => {
    for (const e of buildModel(createDefaultState()).evals) {
      expect(e.score).toBeGreaterThanOrEqual(0)
      expect(e.score).toBeLessThanOrEqual(100)
    }
  })

  test('cost factor halves at ₹1,000 a year and bottoms out at ₹10,000', () => {
    expect(costFactor(50)).toBe(1)
    expect(costFactor(1000)).toBeCloseTo(0.5)
    expect(costFactor(10000)).toBe(0)
    expect(valueIndexOf(80, -100)).toBe(100)
  })

  test('goal fit follows the user’s weights', () => {
    const impacts = { fitness: 3 as const }
    const high = goalFit(impacts, { ...createDefaultState().goals, fitness: 5 })
    const low = goalFit(impacts, { ...createDefaultState().goals, fitness: 1 })
    expect(high.fit).toBeGreaterThan(low.fit)
  })

  test('raising a goal weight raises items that serve it', () => {
    const base = createDefaultState()
    const before = evalOf(base, 'speakers').score
    const after = evalOf({ ...base, goals: { ...base.goals, comfort: 5 } }, 'speakers').score
    expect(after).toBeGreaterThan(before)
  })

  test('premium tiers are never scored higher merely for costing more', () => {
    for (const e of buildModel(createDefaultState()).evals) {
      const std = e.tiers.standard
      const prem = e.tiers.premium
      if (!std || !prem) continue
      // The only way premium gains is quality/lifespan; cost of ownership always counts against it
      const costLine = (t: typeof std) => t.lines.find((l) => l.key === 'cost')!.points
      expect(costLine(prem)).toBeLessThanOrEqual(costLine(std) + 1e-9)
    }
  })

  test('owning an alternative discounts the item and the verdict says why', () => {
    const plain = evalOf(withItems({}), 'water-flosser')
    const covered = evalOf(withItems({ 'floss-kit': { status: 'owned' } }), 'water-flosser')
    expect(covered.coveredBy.map((c) => c.id)).toEqual(['floss-kit'])
    expect(covered.factor).toBeCloseTo(plain.factor * MODIFIERS.covered)
    expect(covered.verdict.kind).toBe('skip')
  })

  test('unmet hard dependency is flagged, and a set-aside dependency blocks the item', () => {
    const needs = evalOf(withItems({}), 'laptop-stand')
    expect(needs.unmet.some((u) => u.kind === 'requires' && u.item.id === 'keyboard-mouse')).toBe(true)
    const blocked = evalOf(withItems({ 'keyboard-mouse': { status: 'unnecessary' } }), 'laptop-stand')
    expect(blocked.blocked).toBe(true)
    const met = evalOf(withItems({ 'keyboard-mouse': { status: 'owned' } }), 'laptop-stand')
    expect(met.unmet.filter((u) => u.kind === 'requires')).toHaveLength(0)
  })

  test('confirming a situational item removes its discount', () => {
    const unconfirmed = evalOf(withItems({}), 'air-purifier')
    const confirmed = evalOf(withItems({ 'air-purifier': { situationConfirmed: true } }), 'air-purifier')
    expect(confirmed.score).toBeGreaterThan(unconfirmed.score)
  })

  test('manual priority pins the score into its band', () => {
    expect(evalOf(withItems({ 'game-controller': { priority: 'critical' } }), 'game-controller').score).toBeGreaterThanOrEqual(85)
    expect(evalOf(withItems({ 'kitchen-scale': { priority: 'low' } }), 'kitchen-scale').score).toBeLessThanOrEqual(40)
  })

  test('luxuries rank below essentials by default', () => {
    const top = topPurchases(buildModel(createDefaultState()), 10)
    expect(top.every((e) => e.item.class !== 'luxury')).toBe(true)
  })
})

describe('planner', () => {
  const evals = buildModel(createDefaultState()).evals

  test.each([2000, 5000, 10000, 25000, 50000])('never exceeds a ₹%i budget, in any mode', (budget) => {
    for (const mode of ['minimum', 'balanced', 'premium'] as const) {
      const plan = planPurchases(evals, mode, { budget, floor: 60, includeLuxury: false })
      expect(plan.total).toBeLessThanOrEqual(budget)
      expect(plan.leftover).toBe(budget - plan.total)
    }
  })

  test('a zero budget buys nothing', () => {
    expect(planPurchases(evals, 'balanced', { budget: 0, floor: 60, includeLuxury: false }).lines).toHaveLength(0)
  })

  test('keeps money when nothing else clears the value bar', () => {
    const plan = planPurchases(evals, 'balanced', { budget: 1_000_000, floor: 60, includeLuxury: false })
    expect(plan.leftover).toBeGreaterThan(900_000)
    expect(plan.lines.every((l) => l.score >= 60 || l.dependencyOf.length)).toBe(true)
  })

  test('bundles hard dependencies and sequences them first', () => {
    const state = withItems({ 'laptop-stand': { priority: 'critical', situationConfirmed: true } })
    const plan = planPurchases(buildModel(state).evals, 'balanced', { budget: 50000, floor: 60, includeLuxury: false })
    const ids = plan.lines.map((l) => l.id)
    expect(ids).toContain('laptop-stand')
    expect(ids).toContain('keyboard-mouse')
    expect(ids.indexOf('keyboard-mouse')).toBeLessThan(ids.indexOf('laptop-stand'))
  })

  test('excludes owned, unnecessary, deferred and covered items', () => {
    const state = withItems({ 'kitchen-scale': { status: 'owned' }, 'alarm-clock': { status: 'unnecessary' }, 'visual-timer': { status: 'deferred' } })
    const ids = planPurchases(buildModel(state).evals, 'balanced', { budget: 50000, floor: 60, includeLuxury: false }).lines.map((l) => l.id)
    expect(ids).not.toContain('kitchen-scale')
    expect(ids).not.toContain('alarm-clock')
    expect(ids).not.toContain('visual-timer')
  })

  test('minimum viable buys only essentials at their cheapest tier', () => {
    const plan = planPurchases(evals, 'minimum', { budget: 50000, floor: 60, includeLuxury: false })
    expect(plan.lines.length).toBeGreaterThan(0)
    for (const l of plan.lines) {
      expect(l.eval.item.class).toBe('essential')
      expect(l.tier).toBe(l.eval.item.tiers.budget ? 'budget' : 'standard')
    }
  })

  test('premium marks diminishing upgrades', () => {
    const plan = planPurchases(evals, 'premium', { budget: 50000, floor: 60, includeLuxury: false })
    expect(plan.lines.some((l) => l.diminishing)).toBe(true)
  })

  test('a bigger budget never captures less value', () => {
    let last = -1
    for (const budget of [2000, 5000, 10000, 25000, 50000]) {
      const v = planPurchases(evals, 'balanced', { budget, floor: 60, includeLuxury: false }).value
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
  })
})

describe('learning', () => {
  test('satisfaction spans 0–1', () => {
    expect(satisfaction({ usefulness: 5, usage: 'daily', solved: 'yes', buyAgain: true, ratedAt: '' })).toBeCloseTo(1)
    expect(satisfaction({ usefulness: 1, usage: 'never', solved: 'no', buyAgain: false, ratedAt: '' })).toBe(0)
  })

  test('bad purchases pull their category down, good ones lift it', () => {
    const purchase = { price: 1000, date: '2026-01-01' }
    const bad = withItems({ 'water-flosser': { status: 'purchased', purchase, review: { usefulness: 1, usage: 'rarely', solved: 'no', buyAgain: false, ratedAt: '' } } })
    const good = withItems({ trimmer: { status: 'purchased', purchase, review: { usefulness: 5, usage: 'weekly', solved: 'yes', buyAgain: true, ratedAt: '' } } })
    expect(learnFromReviews(SEED_CATALOG, bad.items).grooming!.adjustment).toBeLessThan(0)
    expect(learnFromReviews(SEED_CATALOG, good.items).grooming!.adjustment).toBeGreaterThan(0)
    expect(evalOf(bad, 'electric-toothbrush').score).toBeLessThan(evalOf(withItems({}), 'electric-toothbrush').score)
  })
})

describe('insights', () => {
  test('owning an item reports what it makes redundant', () => {
    const m = buildModel(withItems({ 'sleep-mask': { status: 'owned' } }))
    expect(coverage(m).redundant[0]?.covers.map((c) => c.id)).toContain('blackout-curtains')
  })

  test('postpone surfaces luxuries and blocked items with reasons', () => {
    const list = postpone(buildModel(createDefaultState()), 20)
    expect(list.some((p) => p.eval.item.class === 'luxury')).toBe(true)
    expect(list.every((p) => p.reason.length > 0)).toBe(true)
  })

  test('category opportunities cover every category and sort descending', () => {
    const cats = categoryOpportunities(buildModel(createDefaultState()))
    expect(cats).toHaveLength(12)
    for (let i = 1; i < cats.length; i++) expect(cats[i - 1]!.total).toBeGreaterThanOrEqual(cats[i]!.total)
  })
})
