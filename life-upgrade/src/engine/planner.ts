import type { TierId } from '../domain/types'
import { TIERS } from '../domain/taxonomy'
import { MANUAL_BANDS, clamp, type ItemEval, type TierEval } from './scoring'

/* ------------------------------------------------------------------
   Budget planner.

   Value captured by a purchase = (score − 50)^1.5. Fifty is the point where
   a purchase stops being clearly worth it; the exponent makes one big fix
   count for more than several small wins of the same total score.

   Only items that clear the value bar are eligible, so money left over is a
   legitimate outcome, never a failure. Hard dependencies are honoured: an
   item is only ever bought together with what it needs.

   Balanced  — exact search (group knapsack) over dependency-closed bundles,
               choosing each item's tier from budget up to its best-value tier.
   Minimum   — the essentials that matter most, cheapest tier, in priority order.
   Premium   — top tier of everything worth having, in priority order, so the
               cost of chasing the best version of each thing is plain to see.
------------------------------------------------------------------- */

export type PlanMode = 'minimum' | 'balanced' | 'premium'

export const PLAN_MODES: Record<PlanMode, { label: string; blurb: string }> = {
  minimum: { label: 'Minimum viable', blurb: 'Only the essentials that matter most, at the cheapest tier that does the job.' },
  balanced: { label: 'Balanced', blurb: 'The highest-value combination within your budget. Each item at its best-value tier, or cheaper when money is tight.' },
  premium: { label: 'Premium', blurb: 'The top tier of everything worth having, in priority order. Shows exactly where extra money stops buying much.' },
}

/** Minimum-viable setups only include essentials at or above this score */
export const MINIMUM_SCORE = 62
/** Premium setups let in wants this far below the value bar */
export const PREMIUM_SLACK = 10
export const VALUE_BASELINE = 50
export const VALUE_EXPONENT = 1.5

export const valueOf = (score: number) => Math.pow(Math.max(0, score - VALUE_BASELINE), VALUE_EXPONENT)

export type PlanOptions = { budget: number; floor: number; includeLuxury: boolean }

export type PlanLine = {
  id: string
  eval: ItemEval
  tier: TierId
  tierEval: TierEval
  price: number
  verified: boolean
  score: number
  value: number
  /** Only in the plan because these chosen items need it */
  dependencyOf: string[]
  belowFloor: boolean
  /** Bought below the item's best-value tier to stretch the budget */
  downgraded: boolean
  diminishing: boolean
  cumulative: number
  cumulativeShare: number
}

export type FrontierPoint = { id: string; name: string; spend: number; value: number; inPlan: boolean }

export type Plan = {
  mode: PlanMode
  budget: number
  floor: number
  lines: PlanLine[]
  total: number
  leftover: number
  value: number
  potential: number
  share: number
  runningCost: number
  monthlySavings: number
  minutesSaved: number
  /** Spend at which 80% of this plan's value has been captured */
  eightyAt?: number
  closeCalls: { eval: ItemEval; price: number; short: number }[]
  frontier: FrontierPoint[]
}

type Variant = { tier: TierId; tierEval: TierEval; price: number; verified: boolean; score: number; value: number }

type Cand = { e: ItemEval; eligible: boolean; requires: string[]; variants: Variant[] }

type Pick = { c: Cand; v: Variant }

export function scoreAtTier(e: ItemEval, t: TierId) {
  const s = e.tiers[t]!.score
  if (e.state.priority === 'auto') return s
  const band = MANUAL_BANDS[e.state.priority]
  return clamp(s, band.min, band.max)
}

function tierChoices(e: ItemEval, mode: PlanMode): TierId[] {
  const avail = TIERS.filter((t) => e.tiers[t])
  if (mode === 'minimum') return [avail[0]!]
  if (mode === 'premium') return [avail[avail.length - 1]!]
  if (e.state.tier && e.tiers[e.state.tier]) return [e.state.tier]
  return avail.slice(0, avail.indexOf(e.recommendedTier) + 1)
}

function eligible(e: ItemEval, mode: PlanMode, opts: PlanOptions) {
  if (!e.open || e.blocked || e.coveredBy.length || e.state.hasAlternative) return false
  if (mode === 'minimum') return e.item.class === 'essential' && e.score >= Math.max(opts.floor, MINIMUM_SCORE)
  if (mode === 'premium') return e.score >= opts.floor - PREMIUM_SLACK
  const luxuryOk = e.item.class !== 'luxury' || opts.includeLuxury || e.manual
  return luxuryOk && e.score >= opts.floor
}

function candidate(e: ItemEval, mode: PlanMode, isEligible: boolean, floor: number): Cand {
  const all = tierChoices(e, mode).map((tier) => {
    const tierEval = e.tiers[tier]!
    const score = scoreAtTier(e, tier)
    return { tier, tierEval, price: tierEval.verified?.price ?? tierEval.price, verified: !!tierEval.verified, score, value: valueOf(score) }
  })
  // A cheaper tier is only an option while it still clears the value bar
  const clearing = mode === 'balanced' && isEligible ? all.filter((v) => v.score >= floor) : all
  const variants = clearing.length ? clearing : all
  return { e, eligible: isEligible, requires: e.unmet.filter((u) => u.kind === 'requires').map((u) => u.item.id), variants }
}

const best = (c: Cand) => c.variants.reduce((a, b) => (b.value > a.value ? b : a))
const cheapest = (c: Cand) => c.variants.reduce((a, b) => (b.price < a.price ? b : a))

/** Eligible items plus any unmet hard dependencies they pull in */
function buildPool(evals: ItemEval[], mode: PlanMode, opts: PlanOptions) {
  const byId = new Map(evals.map((e) => [e.item.id, e]))
  const pool = new Map<string, Cand>()
  for (const e of evals) if (eligible(e, mode, opts)) pool.set(e.item.id, candidate(e, mode, true, opts.floor))
  const queue = [...pool.values()]
  while (queue.length) {
    const c = queue.pop()!
    for (const id of c.requires) {
      if (pool.has(id)) continue
      const dep = byId.get(id)
      if (!dep?.open) continue
      const d = candidate(dep, mode, false, opts.floor)
      pool.set(id, d)
      queue.push(d)
    }
  }
  // Anything whose dependency can't be bought (owned elsewhere, set aside) leaves the pool
  let changed = true
  while (changed) {
    changed = false
    for (const [id, c] of pool) {
      if (c.requires.some((r) => !pool.has(r))) {
        pool.delete(id)
        changed = true
      }
    }
  }
  return pool
}

/* ---------- Exact search for the balanced plan ---------- */

const EPS_PER_RUPEE = 1e-7
const MAX_OPTIONS_PER_GROUP = 4096

type Option = { picks: Pick[]; price: number; value: number }

function clusters(pool: Map<string, Cand>) {
  const parent = new Map<string, string>()
  const find = (x: string): string => {
    while (parent.get(x) !== x) x = parent.get(x)!
    return x
  }
  for (const id of pool.keys()) parent.set(id, id)
  for (const c of pool.values()) for (const r of c.requires) parent.set(find(c.e.item.id), find(r))
  const groups = new Map<string, Cand[]>()
  for (const c of pool.values()) {
    const root = find(c.e.item.id)
    groups.set(root, [...(groups.get(root) ?? []), c])
  }
  return [...groups.values()]
}

function optionsFor(group: Cand[]): Option[] {
  const ids = group.map((c) => c.e.item.id)
  const out: Option[] = []
  const subsets = 1 << Math.min(group.length, 12)
  for (let mask = 1; mask < subsets; mask++) {
    const members = group.filter((_, i) => mask & (1 << i))
    const inSet = new Set(members.map((m) => m.e.item.id))
    const closed = members.every((m) => m.requires.every((r) => !ids.includes(r) || inSet.has(r)))
    // A dependency-only member is bought only when something in the bundle needs it
    const justified = members.every((m) => m.eligible || members.some((o) => o.requires.includes(m.e.item.id)))
    if (!closed || !justified) continue
    // Every combination of tiers across the bundle's members
    let combos: Pick[][] = [[]]
    for (const m of members) combos = combos.flatMap((picks) => m.variants.map((v) => [...picks, { c: m, v }]))
    for (const picks of combos) {
      const price = picks.reduce((s, p) => s + p.v.price, 0)
      const value = picks.reduce((s, p) => s + p.v.value, 0)
      if (value > 0) out.push({ picks, price, value: value - EPS_PER_RUPEE * price })
      if (out.length >= MAX_OPTIONS_PER_GROUP) return out
    }
  }
  return out
}

function knapsack(groups: Option[][], budget: number): Pick[] {
  if (budget <= 0) return []
  const unit = Math.max(10, Math.ceil(budget / 4000))
  const cap = Math.floor(budget / unit)
  let dp = new Float64Array(cap + 1)
  const choices: Int16Array[] = []
  for (const opts of groups) {
    const next = dp.slice()
    const choice = new Int16Array(cap + 1).fill(-1)
    opts.forEach((o, oi) => {
      const w = Math.ceil(o.price / unit)
      for (let c = cap; c >= w; c--) {
        const v = dp[c - w]! + o.value
        if (v > next[c]! + 1e-9) {
          next[c] = v
          choice[c] = oi
        }
      }
    })
    dp = next
    choices.push(choice)
  }
  const picks: Pick[] = []
  let c = cap
  for (let g = groups.length - 1; g >= 0; g--) {
    const oi = choices[g]![c]!
    if (oi < 0) continue
    const o = groups[g]![oi]!
    picks.push(...o.picks)
    c -= Math.ceil(o.price / unit)
  }
  return picks
}

/* ---------- Priority-order fill for minimum and premium ---------- */

function priorityFill(pool: Map<string, Cand>, budget: number): Pick[] {
  const order = [...pool.values()].filter((c) => c.eligible).sort((a, b) => best(b).score - best(a).score || cheapest(a).price - cheapest(b).price)
  const chosen = new Map<string, Pick>()
  let spent = 0
  const bundle = (c: Cand, acc: Cand[]) => {
    if (chosen.has(c.e.item.id) || acc.includes(c)) return acc
    for (const r of c.requires) bundle(pool.get(r)!, acc)
    acc.push(c)
    return acc
  }
  for (const c of order) {
    const items = bundle(c, [])
    const cost = items.reduce((s, m) => s + best(m).price, 0)
    if (!items.length || spent + cost > budget) continue
    for (const m of items) chosen.set(m.e.item.id, { c: m, v: best(m) })
    spent += cost
  }
  return [...chosen.values()]
}

/** Highest score first (cheaper first on ties); dependencies always come before what needs them */
function sequence(picks: Pick[]) {
  const sorted = [...picks].sort((a, b) => b.v.score - a.v.score || a.v.price - b.v.price)
  const byId = new Map(picks.map((p) => [p.c.e.item.id, p]))
  const out: Pick[] = []
  const seen = new Set<string>()
  const visit = (p: Pick) => {
    if (seen.has(p.c.e.item.id)) return
    seen.add(p.c.e.item.id)
    for (const r of p.c.requires) {
      const d = byId.get(r)
      if (d) visit(d)
    }
    out.push(p)
  }
  sorted.forEach(visit)
  return out
}

export function planPurchases(evals: ItemEval[], mode: PlanMode, opts: PlanOptions): Plan {
  const pool = buildPool(evals, mode, opts)
  const picks = mode === 'balanced' ? knapsack(clusters(pool).map(optionsFor).filter((g) => g.length), opts.budget) : priorityFill(pool, opts.budget)
  const chosen = sequence(picks)
  const chosenIds = new Set(chosen.map((p) => p.c.e.item.id))

  const value = chosen.reduce((s, p) => s + p.v.value, 0)
  let spend = 0
  let gained = 0
  const lines: PlanLine[] = chosen.map(({ c, v }) => {
    spend += v.price
    gained += v.value
    return {
      id: c.e.item.id,
      eval: c.e,
      tier: v.tier,
      tierEval: v.tierEval,
      price: v.price,
      verified: v.verified,
      score: v.score,
      value: v.value,
      dependencyOf: c.eligible ? [] : chosen.filter((o) => o.c.requires.includes(c.e.item.id)).map((o) => o.c.e.item.id),
      belowFloor: v.score < opts.floor,
      downgraded: mode === 'balanced' && TIERS.indexOf(v.tier) < TIERS.indexOf(c.e.recommendedTier) && !c.e.state.tier,
      diminishing: mode === 'premium' && v.tierEval.diminishing,
      cumulative: spend,
      cumulativeShare: value ? gained / value : 0,
    }
  })

  const potential = [...pool.values()].reduce((s, c) => s + best(c).value, 0)
  const total = spend
  const leftover = Math.max(0, opts.budget - total)
  const eighty = lines.find((l) => l.cumulativeShare >= 0.8 - 1e-9)

  const closeCalls = [...pool.values()]
    .filter((c) => c.eligible && !chosenIds.has(c.e.item.id))
    .sort((a, b) => best(b).score - best(a).score)
    .slice(0, 3)
    .map((c) => {
      const deps = c.requires.filter((r) => !chosenIds.has(r)).map((r) => cheapest(pool.get(r)!).price)
      const price = cheapest(c).price + deps.reduce((s, p) => s + p, 0)
      return { eval: c.e, price, short: Math.max(0, price - leftover) }
    })

  // The frontier continues past the budget so the chart can show what more money would buy
  const rest = sequence([...pool.values()].filter((c) => !chosenIds.has(c.e.item.id)).map((c) => ({ c, v: best(c) })))
  let fSpend = 0
  let fValue = 0
  const frontier: FrontierPoint[] = [...chosen, ...rest].map(({ c, v }) => {
    fSpend += v.price
    fValue += v.value
    return { id: c.e.item.id, name: c.e.item.name, spend: fSpend, value: potential ? fValue / potential : 0, inPlan: chosenIds.has(c.e.item.id) }
  })

  return {
    mode,
    budget: opts.budget,
    floor: opts.floor,
    lines,
    total,
    leftover,
    value,
    potential,
    share: potential ? value / potential : 0,
    runningCost: chosen.reduce((s, p) => s + p.c.e.item.runningCost, 0),
    monthlySavings: chosen.reduce((s, p) => s + p.c.e.item.monthlySavings, 0),
    minutesSaved: chosen.reduce((s, p) => s + p.c.e.item.minutesSaved, 0),
    eightyAt: eighty?.cumulative,
    closeCalls,
    frontier,
  }
}
