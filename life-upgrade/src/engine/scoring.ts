import type { CatalogItem, CategoryId, GoalId, ItemState, Listing, Tier, TierId } from '../domain/types'
import { FREQUENCY_META, GOALS, HAVE_STATUSES, priorityOf, TIERS, type PriorityTier } from '../domain/taxonomy'

/* ------------------------------------------------------------------
   The scoring formula. Everything here is documented on the Method page,
   which reads these constants directly so the docs can't drift.

   base  = severity(25) + frequency(20) + goal fit(25) + time saved(10)   ← "benefit", scaled by tier quality
         + durability(10) + cost of ownership(10)
   score = base × modifiers + learning adjustment, then any manual priority
   Price never raises a score: a pricier tier only gains through quality,
   and loses through the cost-of-ownership term.
------------------------------------------------------------------- */

export const WEIGHTS = { severity: 25, frequency: 20, goals: 25, time: 10, durability: 10, cost: 10 } as const

export const MODIFIERS = {
  /** You already own something that does this job */
  covered: 0.4,
  /** A hard dependency isn't owned yet */
  missingRequirement: 0.85,
  /** A soft prerequisite isn't owned yet */
  missingFoundation: 0.92,
  /** A situational item whose condition you haven't confirmed */
  unconfirmedSituation: 0.8,
} as const

/** An upgrade to the next tier must buy at least this many score points per ₹1,000 of extra yearly cost;
    below it, the upgrade is flagged as diminishing returns */
export const UPGRADE_POINTS_PER_K = 10

/** Manual priority pins the score into its tier's band */
export const MANUAL_BANDS: Record<PriorityTier, { min: number; max: number }> = {
  critical: { min: 85, max: 100 },
  high: { min: 70, max: 79 },
  medium: { min: 55, max: 64 },
  low: { min: 0, max: 40 },
}

export const TIME_FULL_MINUTES = 60
export const DURABILITY_FULL_YEARS = 8

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Midpoint of a price band, rounded to ₹50 */
export const tierPrice = (t: Tier) => Math.round((t.priceMin + t.priceMax) / 2 / 50) * 50

/** Full points at ≤ ₹100 a year, half at ₹1,000, none at ₹10,000 or more (log scale) */
export function costFactor(netAnnualCost: number) {
  return clamp(1 - Math.log10(Math.max(netAnnualCost, 100) / 100) / 2, 0, 1)
}

/** Score points per ₹1,000 of yearly ownership cost, mapped to 0–100 on a log scale (10 → 0, 1,000 → 100) */
export function valueIndexOf(score: number, netAnnualCost: number) {
  if (netAnnualCost <= 0) return 100
  const perK = (score * 1000) / Math.max(netAnnualCost, 50)
  return clamp(Math.round((Math.log10(Math.max(perK, 1)) - 1) * 50), 0, 100)
}

export function valueLabel(index: number, paysForItself = false) {
  if (paysForItself) return 'Pays for itself'
  if (index >= 75) return 'Exceptional value'
  if (index >= 50) return 'Strong value'
  if (index >= 25) return 'Fair value'
  return 'Costly to own'
}

/* ---------- Goal fit ---------- */

export type GoalPart = { goal: GoalId; impact: number; weight: number; contribution: number }

/** Strongest single goal counts in full; every other goal the item helps adds 35% of its contribution */
export function goalFit(impacts: CatalogItem['impacts'], weights: Record<GoalId, number>) {
  const parts: GoalPart[] = GOALS.filter((g) => (impacts[g.id] ?? 0) > 0)
    .map((g) => {
      const impact = impacts[g.id] ?? 0
      const weight = clamp(weights[g.id] ?? 0, 0, 5)
      return { goal: g.id, impact, weight, contribution: (impact / 3) * (weight / 5) }
    })
    .sort((a, b) => b.contribution - a.contribution)
  const top = parts[0]?.contribution ?? 0
  const rest = parts.slice(1).reduce((s, p) => s + p.contribution, 0)
  return { fit: Math.min(1, top + 0.35 * rest), parts }
}

/* ---------- Evaluation ---------- */

export type Line = { key: keyof typeof WEIGHTS; label: string; detail: string; points: number; max: number }

export type Modifier = { key: string; label: string; detail: string; factor?: number; delta?: number }

export type TierEval = {
  tier: TierId
  price: number
  priceMin: number
  priceMax: number
  /** A shortlisted listing with a verified price for this tier, when one exists */
  verified?: { price: number; listing: Listing }
  quality: number
  lifespan: number
  annualCost: number
  netAnnualCost: number
  base: number
  score: number
  lines: Line[]
  valueIndex: number
  paysForItself: boolean
  /** Compared with the tier below it: what the upgrade costs and what it buys */
  upgrade?: { from: TierId; extraPrice: number; extraScore: number; pointsPerK: number }
  /** The upgrade from the tier below buys too little to be worth it */
  diminishing: boolean
}

export type VerdictKind = 'buy-now' | 'buy-if' | 'wait' | 'skip' | 'covered' | 'not-needed'

export type Verdict = { kind: VerdictKind; label: string; reason: string }

export type Blocker = { item: CatalogItem; kind: 'requires' | 'buildsOn'; blocked: boolean }

export type ItemEval = {
  item: CatalogItem
  state: ItemState
  tier: TierId
  recommendedTier: TierId
  tiers: Partial<Record<TierId, TierEval>>
  current: TierEval
  goal: ReturnType<typeof goalFit>
  modifiers: Modifier[]
  /** Product of the multiplicative modifiers */
  factor: number
  learning: number
  engineScore: number
  score: number
  priority: PriorityTier
  manual: boolean
  /** Item(s) the user owns that already do this job */
  coveredBy: CatalogItem[]
  unmet: Blocker[]
  /** The item cannot be planned: a hard dependency was marked unnecessary or deferred */
  blocked: boolean
  open: boolean
  have: boolean
  verdict: Verdict
  paybackMonths?: number
}

export const DEFAULT_ITEM_STATE: ItemState = {
  status: 'candidate',
  hasAlternative: false,
  situationConfirmed: false,
  priority: 'auto',
  notes: '',
  updatedAt: '',
}

export type ScoringContext = {
  goals: Record<GoalId, number>
  states: Record<string, ItemState>
  byId: Map<string, CatalogItem>
  listings: Listing[]
  learning: Partial<Record<CategoryId, { adjustment: number; count: number; average: number }>>
}

const stateOf = (ctx: ScoringContext, id: string) => ctx.states[id] ?? DEFAULT_ITEM_STATE

/** A dependency counts as met when you have it, or told us something else covers it */
export function isMet(ctx: ScoringContext, id: string) {
  const s = stateOf(ctx, id)
  return HAVE_STATUSES.includes(s.status) || s.hasAlternative
}

function verifiedFor(ctx: ScoringContext, itemId: string, tier: TierId, isDefault: boolean) {
  const matches = ctx.listings.filter(
    (l) => l.itemId === itemId && l.shortlisted && l.priceStatus === 'verified' && typeof l.price === 'number' && (l.tier ? l.tier === tier : isDefault),
  )
  if (!matches.length) return undefined
  const best = matches.reduce((a, b) => ((a.price ?? Infinity) <= (b.price ?? Infinity) ? a : b))
  return { price: best.price!, listing: best }
}

function evalTier(item: CatalogItem, tierId: TierId, tier: Tier, goal: { fit: number }, factor: number, learning: number): TierEval {
  const q = tier.quality
  const lifespan = Math.max(0.25, tier.lifespanYears ?? item.lifespanYears)
  const price = tierPrice(tier)
  const annualCost = price / lifespan + item.runningCost
  const netAnnualCost = annualCost - 12 * item.monthlySavings
  const freq = FREQUENCY_META[item.frequency]

  const lines: Line[] = [
    {
      key: 'severity',
      label: 'Problem severity',
      detail: `${item.severity} of 5`,
      points: WEIGHTS.severity * ((item.severity - 1) / 4) * q,
      max: WEIGHTS.severity,
    },
    { key: 'frequency', label: 'Frequency of use', detail: freq.label, points: WEIGHTS.frequency * freq.factor * q, max: WEIGHTS.frequency },
    { key: 'goals', label: 'Fit with your goals', detail: `${Math.round(goal.fit * 100)}% match`, points: WEIGHTS.goals * goal.fit * q, max: WEIGHTS.goals },
    {
      key: 'time',
      label: 'Time saved',
      detail: item.minutesSaved ? `${item.minutesSaved} min a week` : 'None to speak of',
      points: WEIGHTS.time * Math.min(1, item.minutesSaved / TIME_FULL_MINUTES) * q,
      max: WEIGHTS.time,
    },
    {
      key: 'durability',
      label: 'Durability',
      detail: `${lifespan} year${lifespan === 1 ? '' : 's'}`,
      points: WEIGHTS.durability * Math.min(1, lifespan / DURABILITY_FULL_YEARS),
      max: WEIGHTS.durability,
    },
    {
      key: 'cost',
      label: 'Cost of ownership',
      detail: netAnnualCost <= 0 ? 'Saves more than it costs' : `₹${Math.round(netAnnualCost).toLocaleString('en-IN')} a year`,
      points: WEIGHTS.cost * costFactor(netAnnualCost),
      max: WEIGHTS.cost,
    },
  ]
  const base = Math.min(100, lines.reduce((s, l) => s + l.points, 0))
  const score = clamp(Math.round(base * factor + learning), 0, 100)
  return {
    tier: tierId,
    price,
    priceMin: tier.priceMin,
    priceMax: tier.priceMax,
    quality: q,
    lifespan,
    annualCost,
    netAnnualCost,
    base,
    score,
    lines,
    valueIndex: valueIndexOf(score, netAnnualCost),
    paysForItself: netAnnualCost <= 0,
    diminishing: false,
  }
}

function applyManual(score: number, priority: ItemState['priority']) {
  if (priority === 'auto') return score
  const band = MANUAL_BANDS[priority]
  return clamp(score, band.min, band.max)
}

export function evaluateItem(item: CatalogItem, ctx: ScoringContext): ItemEval {
  const state = stateOf(ctx, item.id)
  const goal = goalFit(item.impacts, ctx.goals)
  const modifiers: Modifier[] = []
  let factor = 1

  const coveredBy = (item.alternatives ?? [])
    .filter((a) => HAVE_STATUSES.includes(stateOf(ctx, a).status))
    .map((a) => ctx.byId.get(a))
    .filter((x): x is CatalogItem => !!x)
  if (state.hasAlternative || coveredBy.length) {
    factor *= MODIFIERS.covered
    modifiers.push({
      key: 'covered',
      label: 'Already covered',
      detail: coveredBy.length
        ? `Your ${coveredBy.map((c) => c.name.toLowerCase()).join(' and ')} already does this job.`
        : 'You said you already have something that does this job.',
      factor: MODIFIERS.covered,
    })
  }

  const unmet: Blocker[] = []
  for (const id of item.requires ?? []) {
    const dep = ctx.byId.get(id)
    if (!dep || isMet(ctx, id)) continue
    const s = stateOf(ctx, id).status
    unmet.push({ item: dep, kind: 'requires', blocked: s === 'unnecessary' || s === 'deferred' })
  }
  for (const id of item.buildsOn ?? []) {
    const dep = ctx.byId.get(id)
    if (!dep || isMet(ctx, id)) continue
    unmet.push({ item: dep, kind: 'buildsOn', blocked: false })
  }
  const missingReq = unmet.filter((u) => u.kind === 'requires')
  const missingFound = unmet.filter((u) => u.kind === 'buildsOn')
  if (missingReq.length) {
    factor *= MODIFIERS.missingRequirement
    modifiers.push({
      key: 'requires',
      label: 'Needs another purchase',
      detail: `Little use without ${listNames(missingReq.map((u) => u.item))}. The planner buys them together.`,
      factor: MODIFIERS.missingRequirement,
    })
  }
  if (missingFound.length) {
    factor *= MODIFIERS.missingFoundation
    modifiers.push({
      key: 'buildsOn',
      label: 'Builds on something you lack',
      detail: `Worth more once you have ${listNames(missingFound.map((u) => u.item))}.`,
      factor: MODIFIERS.missingFoundation,
    })
  }
  if (item.situational && !state.situationConfirmed) {
    factor *= MODIFIERS.unconfirmedSituation
    modifiers.push({
      key: 'situational',
      label: 'Situational, not confirmed',
      detail: `Only valuable if: ${lowerFirst(item.situational)} Confirm it applies to you to remove this discount.`,
      factor: MODIFIERS.unconfirmedSituation,
    })
  }

  const learned = ctx.learning[item.category]
  const learning = learned?.adjustment ?? 0
  if (learning) {
    modifiers.push({
      key: 'learning',
      label: 'Learned from your ratings',
      detail: `You rated ${learned!.count} past purchase${learned!.count === 1 ? '' : 's'} in this category ${Math.round(learned!.average * 100)}% satisfying on average.`,
      delta: learning,
    })
  }

  const tiers: Partial<Record<TierId, TierEval>> = {}
  const available = TIERS.filter((t) => item.tiers[t])
  for (const t of available) tiers[t] = evalTier(item, t, item.tiers[t]!, goal, factor, learning)

  // Walk up the tiers while each upgrade still buys enough score for its extra yearly cost.
  // Benefit uses the unmodified base so a discount (say, an unconfirmed situation) never changes the tier advice.
  let recommendedTier = available[0]!
  for (let i = 1; i < available.length; i++) {
    const lo = tiers[available[i - 1]!]!
    const hi = tiers[available[i]!]!
    const extraScore = hi.base - lo.base
    const extraCost = hi.netAnnualCost - lo.netAnnualCost
    const pointsPerK = extraCost <= 0 ? (extraScore > 0 ? Infinity : 0) : (extraScore * 1000) / extraCost
    hi.upgrade = { from: lo.tier, extraPrice: hi.price - lo.price, extraScore: hi.score - lo.score, pointsPerK }
    hi.diminishing = extraScore <= 0 || pointsPerK < UPGRADE_POINTS_PER_K
    if (!hi.diminishing && recommendedTier === lo.tier) recommendedTier = hi.tier
  }

  const tier = state.tier && tiers[state.tier] ? state.tier : recommendedTier
  for (const t of available) {
    const v = verifiedFor(ctx, item.id, t, t === tier)
    if (v) tiers[t]!.verified = v
  }
  const current = tiers[tier]!
  const engineScore = current.score
  const score = applyManual(engineScore, state.priority)
  const have = HAVE_STATUSES.includes(state.status)
  const open = state.status === 'candidate' || state.status === 'wishlist'
  const blocked = missingReq.some((u) => u.blocked)

  const evalPartial = { item, state, score, coveredBy, unmet, blocked, have, current }
  return {
    item,
    state,
    tier,
    recommendedTier,
    tiers,
    current,
    goal,
    modifiers,
    factor,
    learning,
    engineScore,
    score,
    priority: priorityOf(score),
    manual: state.priority !== 'auto',
    coveredBy,
    unmet,
    blocked,
    open,
    have,
    verdict: verdictFor(evalPartial),
    paybackMonths: item.monthlySavings > 0 ? current.price / item.monthlySavings : undefined,
  }
}

function verdictFor(e: {
  item: CatalogItem
  state: ItemState
  score: number
  coveredBy: CatalogItem[]
  unmet: Blocker[]
  blocked: boolean
  have: boolean
  current: TierEval
}): Verdict {
  const { item, state, score } = e
  if (state.status === 'owned') return { kind: 'covered', label: 'You own this', reason: 'Marked as already owned.' }
  if (state.status === 'purchased') return { kind: 'covered', label: 'Purchased', reason: 'Bought and tracked in Impact.' }
  if (state.status === 'unnecessary') return { kind: 'not-needed', label: 'Not needed', reason: 'You marked this as unnecessary.' }
  if (e.coveredBy.length) return { kind: 'skip', label: 'Skip: already covered', reason: `Your ${e.coveredBy[0]!.name.toLowerCase()} already does this job.` }
  if (state.hasAlternative) return { kind: 'skip', label: 'Skip: already covered', reason: 'You have something that already does this job.' }
  if (e.blocked) {
    const dep = e.unmet.find((u) => u.blocked)!.item
    return { kind: 'wait', label: 'Blocked', reason: `Needs ${dep.name.toLowerCase()}, which you marked as not needed or later.` }
  }
  if (state.status === 'deferred') {
    return { kind: 'wait', label: 'Deferred', reason: state.targetDate ? `You plan to revisit this on ${state.targetDate}.` : 'You chose to wait on this one.' }
  }
  const req = e.unmet.filter((u) => u.kind === 'requires').map((u) => u.item)
  const withDeps = req.length ? ` Buy it together with ${listNames(req)}.` : ''
  if (score >= 75) {
    if (item.situational && !state.situationConfirmed) return { kind: 'buy-if', label: 'Buy if it applies', reason: `${item.situational}${withDeps}` }
    return { kind: 'buy-now', label: 'Buy now', reason: `${item.buyIf}${withDeps}` }
  }
  if (score >= 60) return { kind: 'buy-if', label: 'Buy if…', reason: `${item.buyIf}${withDeps}` }
  if (score >= 45) {
    const found = e.unmet.filter((u) => u.kind === 'buildsOn').map((u) => u.item)
    return { kind: 'wait', label: 'Wait', reason: found.length ? `Get ${listNames(found)} first.` : 'Worth it later. Higher-value purchases come first.' }
  }
  return { kind: 'skip', label: 'Skip for now', reason: 'Low value for your current goals. Revisit if your priorities change.' }
}

export function listNames(items: CatalogItem[]) {
  const names = items.map((i) => i.name.toLowerCase())
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
