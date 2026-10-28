import type {
  AppState,
  CatalogItem,
  CategoryId,
  Frequency,
  GoalId,
  ItemClass,
  ItemState,
  ItemStatus,
  Listing,
  ManualPriority,
  PriceStatus,
  Review,
  Tier,
  TierId,
  UsageFrequency,
} from '../domain/types'
import { CATEGORIES, CLASSES, FREQUENCIES, GOALS, TIERS, USAGES } from '../domain/taxonomy'
import { createDefaultState, MAX_BUDGET } from './defaults'

/* ------------------------------------------------------------------
   Validation for anything that crosses a trust boundary: localStorage,
   imported JSON files, research-integration responses and user forms.
   Imports are repaired where that's safe (unknown keys dropped, missing
   optional fields defaulted) and rejected with a readable reason where not.
------------------------------------------------------------------- */

export class ValidationError extends Error {}

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : undefined)
const num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined)
const oneOf = <T extends string>(v: unknown, list: readonly T[]) => (list.includes(v as T) ? (v as T) : undefined)

const STATUSES: ItemStatus[] = ['candidate', 'wishlist', 'deferred', 'purchased', 'owned', 'unnecessary']
const PRIORITIES: ManualPriority[] = ['auto', 'critical', 'high', 'medium', 'low']
const PRICE_STATUSES: PriceStatus[] = ['verified', 'estimate', 'unverified']
const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
const GOAL_IDS = GOALS.map((g) => g.id)

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/

export function isHttpUrl(v: string) {
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/* ---------- Pieces ---------- */

function review(v: unknown): Review | undefined {
  if (!isObj(v)) return undefined
  const usefulness = num(v.usefulness, 1, 5)
  const usage = oneOf<UsageFrequency>(v.usage, USAGES)
  const solved = oneOf(v.solved, ['yes', 'partly', 'no'] as const)
  if (!usefulness || !usage || !solved || typeof v.buyAgain !== 'boolean') return undefined
  return { usefulness: Math.round(usefulness) as Review['usefulness'], usage, solved, buyAgain: v.buyAgain, ratedAt: str(v.ratedAt, 40) ?? '' }
}

export function itemState(v: unknown): ItemState | undefined {
  if (!isObj(v)) return undefined
  const status = oneOf<ItemStatus>(v.status, STATUSES)
  if (!status) return undefined
  const p = isObj(v.purchase) ? v.purchase : undefined
  const purchase =
    p && num(p.price, 0, MAX_BUDGET) !== undefined && isDate(p.date)
      ? { price: p.price as number, date: p.date as string, tier: oneOf<TierId>(p.tier, TIERS), listingId: str(p.listingId, 80) }
      : undefined
  return {
    status: status === 'purchased' && !purchase ? 'owned' : status,
    hasAlternative: v.hasAlternative === true,
    situationConfirmed: v.situationConfirmed === true,
    priority: oneOf<ManualPriority>(v.priority, PRIORITIES) ?? 'auto',
    tier: oneOf<TierId>(v.tier, TIERS),
    targetDate: isDate(v.targetDate) ? v.targetDate : undefined,
    priceTarget: num(v.priceTarget, 1, MAX_BUDGET),
    notes: str(v.notes, 4000) ?? '',
    purchase,
    review: review(v.review),
    updatedAt: str(v.updatedAt, 40) ?? '',
  }
}

function tier(v: unknown): Tier | undefined {
  if (!isObj(v)) return undefined
  const priceMin = num(v.priceMin, 0, MAX_BUDGET)
  const priceMax = num(v.priceMax, 0, MAX_BUDGET)
  const quality = num(v.quality, 0.3, 1.5)
  if (priceMin === undefined || priceMax === undefined || priceMin > priceMax || quality === undefined) return undefined
  return { priceMin, priceMax, quality, lifespanYears: num(v.lifespanYears, 0.25, 50), note: str(v.note, 300) ?? '' }
}

function strings(v: unknown, max = 20, len = 300) {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.slice(0, len)).slice(0, max) : []
}

/** Validates a full catalog item (custom items, imports). Returns a list of problems instead of throwing. */
export function catalogItemProblems(v: unknown): string[] {
  if (!isObj(v)) return ['Not an object']
  const out: string[] = []
  if (typeof v.id !== 'string' || !ID_PATTERN.test(v.id)) out.push('id must be lowercase letters, numbers and dashes')
  if (typeof v.name !== 'string' || v.name.trim().length < 2) out.push('name is required')
  if (!oneOf<CategoryId>(v.category, CATEGORY_IDS)) out.push('category is not recognised')
  if (!oneOf<ItemClass>(v.class, CLASSES)) out.push('class must be essential, useful, optional or luxury')
  if (typeof v.problem !== 'string' || v.problem.trim().length < 5) out.push('problem statement is required')
  if (!oneOf<Frequency>(v.frequency, FREQUENCIES)) out.push('frequency is not recognised')
  if (num(v.severity, 1, 5) === undefined) out.push('severity must be 1–5')
  if (num(v.lifespanYears, 0.25, 50) === undefined) out.push('lifespan must be between 3 months and 50 years')
  if (!isObj(v.tiers) || !tier(v.tiers.standard)) out.push('a standard price tier (min ≤ max) is required')
  return out
}

export function catalogItem(v: unknown): CatalogItem | undefined {
  if (catalogItemProblems(v).length) return undefined
  const o = v as Obj
  const t = o.tiers as Obj
  const impacts: CatalogItem['impacts'] = {}
  if (isObj(o.impacts)) for (const g of GOAL_IDS) {
    const n = num(o.impacts[g], 1, 3)
    if (n) impacts[g as GoalId] = Math.round(n) as 1 | 2 | 3
  }
  const ids = (x: unknown) => strings(x, 20, 64).filter((s) => ID_PATTERN.test(s))
  return {
    id: o.id as string,
    name: (o.name as string).trim().slice(0, 120),
    category: o.category as CategoryId,
    class: o.class as ItemClass,
    problem: (o.problem as string).trim().slice(0, 600),
    value: str(o.value, 600) ?? '',
    buyIf: str(o.buyIf, 600) ?? '',
    alternative: str(o.alternative, 600) ?? '',
    situational: str(o.situational, 600) || undefined,
    frequency: o.frequency as Frequency,
    severity: Math.round(o.severity as number) as CatalogItem['severity'],
    minutesSaved: num(o.minutesSaved, 0, 10080) ?? 0,
    lifespanYears: o.lifespanYears as number,
    runningCost: num(o.runningCost, 0, MAX_BUDGET) ?? 0,
    monthlySavings: num(o.monthlySavings, 0, MAX_BUDGET) ?? 0,
    impacts,
    tiers: { budget: tier(t.budget), standard: tier(t.standard)!, premium: tier(t.premium) },
    lookFor: strings(o.lookFor),
    requires: ids(o.requires),
    buildsOn: ids(o.buildsOn),
    alternatives: ids(o.alternatives),
    tags: strings(o.tags, 30, 60),
    custom: true,
  }
}

/** Overrides are partial items: keep only fields that validate on their own */
function override(v: unknown): Partial<CatalogItem> | undefined {
  if (!isObj(v)) return undefined
  const o: Partial<CatalogItem> = {}
  if (typeof v.name === 'string' && v.name.trim().length >= 2) o.name = v.name.trim().slice(0, 120)
  if (oneOf<CategoryId>(v.category, CATEGORY_IDS)) o.category = v.category as CategoryId
  if (oneOf<ItemClass>(v.class, CLASSES)) o.class = v.class as ItemClass
  for (const k of ['problem', 'value', 'buyIf', 'alternative', 'situational'] as const) if (typeof v[k] === 'string') o[k] = (v[k] as string).slice(0, 600)
  if (oneOf<Frequency>(v.frequency, FREQUENCIES)) o.frequency = v.frequency as Frequency
  const sev = num(v.severity, 1, 5)
  if (sev) o.severity = Math.round(sev) as CatalogItem['severity']
  const n = (k: 'minutesSaved' | 'lifespanYears' | 'runningCost' | 'monthlySavings', lo: number, hi: number) => {
    const x = num(v[k], lo, hi)
    if (x !== undefined) o[k] = x
  }
  n('minutesSaved', 0, 10080)
  n('lifespanYears', 0.25, 50)
  n('runningCost', 0, MAX_BUDGET)
  n('monthlySavings', 0, MAX_BUDGET)
  if (isObj(v.impacts)) {
    const impacts: CatalogItem['impacts'] = {}
    for (const g of GOAL_IDS) {
      const x = num(v.impacts[g], 1, 3)
      if (x) impacts[g as GoalId] = Math.round(x) as 1 | 2 | 3
    }
    o.impacts = impacts
  }
  if (isObj(v.tiers)) {
    const tiers: Partial<CatalogItem['tiers']> = {}
    for (const t of TIERS) {
      const parsed = tier(v.tiers[t])
      if (parsed) tiers[t] = parsed
    }
    o.tiers = tiers as CatalogItem['tiers']
  }
  if (Array.isArray(v.lookFor)) o.lookFor = strings(v.lookFor)
  return Object.keys(o).length ? o : undefined
}

export function listing(v: unknown, origin?: Listing['origin']): Listing | undefined {
  if (!isObj(v)) return undefined
  const brand = str(v.brand, 80)?.trim()
  const model = str(v.model, 120)?.trim()
  const itemId = str(v.itemId, 64)
  if (!brand || !model || !itemId) return undefined
  const price = num(v.price, 1, MAX_BUDGET)
  const url = str(v.url, 2000)
  const verifiedAt = isDate(v.verifiedAt) ? v.verifiedAt : undefined
  const source = str(v.source, 300)?.trim() || undefined
  let priceStatus = oneOf<PriceStatus>(v.priceStatus, PRICE_STATUSES) ?? 'unverified'
  // A price only counts as verified when we know where it came from and when
  if (priceStatus === 'verified' && (price === undefined || !source || !verifiedAt)) priceStatus = price === undefined ? 'unverified' : 'estimate'
  const specs = Array.isArray(v.specs)
    ? v.specs
        .filter(isObj)
        .map((s) => ({ label: str(s.label, 60)?.trim() ?? '', value: str(s.value, 200)?.trim() ?? '' }))
        .filter((s) => s.label && s.value)
        .slice(0, 30)
    : []
  return {
    id: str(v.id, 80) || crypto.randomUUID(),
    itemId,
    tier: oneOf<TierId>(v.tier, TIERS),
    brand,
    model,
    price,
    priceStatus,
    merchant: str(v.merchant, 80)?.trim() || undefined,
    url: url && isHttpUrl(url) ? url : undefined,
    source,
    verifiedAt,
    warranty: str(v.warranty, 120)?.trim() || undefined,
    specs,
    durability: str(v.durability, 400)?.trim() || undefined,
    pros: strings(v.pros, 12, 200),
    cons: strings(v.cons, 12, 200),
    cheaperAlternative: str(v.cheaperAlternative, 300)?.trim() || undefined,
    premiumVerdict: str(v.premiumVerdict, 300)?.trim() || undefined,
    shortlisted: v.shortlisted === true,
    origin: origin ?? oneOf(v.origin, ['manual', 'import', 'integration'] as const) ?? 'import',
    createdAt: str(v.createdAt, 40) || new Date().toISOString(),
  }
}

/* ---------- Whole state ---------- */

/** Parses persisted or imported state. Throws ValidationError when the file isn't an export of this app. */
export function parseState(raw: unknown): AppState {
  if (!isObj(raw)) throw new ValidationError('The file does not contain an object.')
  const data = isObj(raw.data) && raw.app === 'essential-life-upgrade' ? raw.data : raw
  if (data.version !== 1) throw new ValidationError('This file is not an Essential Life Upgrade export (missing version 1).')
  if (!isObj(data.items) || !isObj(data.goals)) throw new ValidationError('The file is missing item or goal data.')

  const base = createDefaultState()
  const goals = { ...base.goals }
  for (const g of GOAL_IDS) {
    const w = num(data.goals[g], 0, 5)
    if (w !== undefined) goals[g as GoalId] = Math.round(w)
  }
  const items: Record<string, ItemState> = {}
  for (const [id, s] of Object.entries(data.items)) {
    const parsed = ID_PATTERN.test(id) ? itemState(s) : undefined
    if (parsed) items[id] = parsed
  }
  const cat = isObj(data.catalog) ? data.catalog : {}
  const overrides: Record<string, Partial<CatalogItem>> = {}
  if (isObj(cat.overrides)) for (const [id, o] of Object.entries(cat.overrides)) {
    const parsed = ID_PATTERN.test(id) ? override(o) : undefined
    if (parsed) overrides[id] = parsed
  }
  const custom = Array.isArray(cat.custom) ? cat.custom.map(catalogItem).filter((x): x is CatalogItem => !!x) : []
  const hidden = strings(cat.hidden, 500, 64).filter((s) => ID_PATTERN.test(s))
  const listings = Array.isArray(data.listings) ? data.listings.map((l) => listing(l)).filter((x): x is Listing => !!x) : []
  const budget = isObj(data.budget) ? data.budget : {}
  const settings = isObj(data.settings) ? data.settings : {}
  const endpoint = str(settings.researchEndpoint, 2000) ?? ''
  const meta = isObj(data.meta) ? data.meta : {}

  return {
    version: 1,
    budget: {
      amount: num(budget.amount, 0, MAX_BUDGET) ?? base.budget.amount,
      periodStart: isDate(budget.periodStart) ? budget.periodStart : base.budget.periodStart,
    },
    goals,
    items,
    catalog: { overrides, custom, hidden },
    listings,
    settings: {
      theme: oneOf(settings.theme, ['system', 'light', 'dark'] as const) ?? 'system',
      valueFloor: num(settings.valueFloor, 30, 90) ?? base.settings.valueFloor,
      researchEndpoint: endpoint && isHttpUrl(endpoint.replace('{query}', 'q')) ? endpoint : '',
      inventoryDone: settings.inventoryDone === true,
    },
    meta: { createdAt: str(meta.createdAt, 40) || base.meta.createdAt, updatedAt: str(meta.updatedAt, 40) || base.meta.updatedAt },
  }
}

/** Wraps state for export so imports can recognise the file */
export function exportEnvelope(state: AppState) {
  return { app: 'essential-life-upgrade', exportedAt: new Date().toISOString(), data: state }
}
