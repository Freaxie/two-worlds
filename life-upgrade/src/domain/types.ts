/* ------------------------------------------------------------------
   Domain types. Catalog data (what an item is) is kept apart from the
   user's state (what they think of it, own, or bought) and from product
   research (specific models, prices and merchants they verified).
------------------------------------------------------------------- */

export type GoalId = 'fitness' | 'grooming' | 'focus' | 'sleep' | 'space' | 'making' | 'comfort' | 'safety'

export type CategoryId =
  | 'daily'
  | 'fitness'
  | 'grooming'
  | 'sleep'
  | 'focus'
  | 'room'
  | 'tech'
  | 'kitchen'
  | 'making'
  | 'safety'
  | 'convenience'
  | 'luxury'

/** How necessary an item is. Essential and useful are "needs"; optional and luxury are discretionary. */
export type ItemClass = 'essential' | 'useful' | 'optional' | 'luxury'

export type Frequency = 'daily' | 'several-weekly' | 'weekly' | 'monthly' | 'occasional' | 'standby'

export type TierId = 'budget' | 'standard' | 'premium'

export type Severity = 1 | 2 | 3 | 4 | 5

export type Impact = 1 | 2 | 3

export type Tier = {
  /** Illustrative INR band, not a verified price */
  priceMin: number
  priceMax: number
  /** How well this tier solves the problem relative to standard (1). Applies to benefit, never to cost. */
  quality: number
  /** Overrides the item's lifespan when this tier lasts noticeably longer or shorter */
  lifespanYears?: number
  /** What the money gets you at this tier */
  note: string
}

export type CatalogItem = {
  id: string
  name: string
  category: CategoryId
  class: ItemClass
  /** The concrete problem this solves. Every recommendation leads with it. */
  problem: string
  /** When the value is high */
  value: string
  /** The condition under which buying is the right call */
  buyIf: string
  /** What to do instead for little or no money */
  alternative: string
  /** Only worth it when this is true for you */
  situational?: string
  frequency: Frequency
  severity: Severity
  /** Minutes of recurring friction removed per week */
  minutesSaved: number
  lifespanYears: number
  /** Consumables, refills, filters, subscriptions — INR per year */
  runningCost: number
  /** Money it stops you spending elsewhere — INR per month, estimated */
  monthlySavings: number
  impacts: Partial<Record<GoalId, Impact>>
  tiers: { budget?: Tier; standard: Tier; premium?: Tier }
  /** Buying criteria — what separates a good one from a bad one */
  lookFor: string[]
  /** Hard dependencies: little or no value without these */
  requires?: string[]
  /** Soft prerequisites: get these first, then this one is worth more */
  buildsOn?: string[]
  /** Items that do the same job; owning one makes the others largely redundant */
  alternatives?: string[]
  /** Extra search words */
  tags?: string[]
  /** Created by the user rather than shipped with the app */
  custom?: boolean
}

/* ---------- User state ---------- */

export type ItemStatus = 'candidate' | 'wishlist' | 'deferred' | 'purchased' | 'owned' | 'unnecessary'

export type ManualPriority = 'auto' | 'critical' | 'high' | 'medium' | 'low'

export type UsageFrequency = 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never'

export type Review = {
  usefulness: 1 | 2 | 3 | 4 | 5
  usage: UsageFrequency
  solved: 'yes' | 'partly' | 'no'
  buyAgain: boolean
  ratedAt: string
}

export type Purchase = {
  price: number
  /** YYYY-MM-DD */
  date: string
  tier?: TierId
  listingId?: string
}

export type ItemState = {
  status: ItemStatus
  /** "I already have something that does this job" (not necessarily in the catalog) */
  hasAlternative: boolean
  /** For situational items: has the user confirmed the condition applies to them? */
  situationConfirmed: boolean
  priority: ManualPriority
  /** Preferred tier; falls back to the engine's best-value tier */
  tier?: TierId
  /** YYYY-MM-DD */
  targetDate?: string
  priceTarget?: number
  notes: string
  purchase?: Purchase
  review?: Review
  updatedAt: string
}

/* ---------- Product research ---------- */

export type PriceStatus = 'verified' | 'estimate' | 'unverified'

export type ListingOrigin = 'manual' | 'import' | 'integration'

export type Spec = { label: string; value: string }

export type Listing = {
  id: string
  itemId: string
  /** Which price tier of the item this product represents */
  tier?: TierId
  brand: string
  model: string
  price?: number
  priceStatus: PriceStatus
  merchant?: string
  url?: string
  /** Where the price came from: a page, a receipt, an integration */
  source?: string
  /** YYYY-MM-DD the price was last checked */
  verifiedAt?: string
  warranty?: string
  specs: Spec[]
  durability?: string
  pros: string[]
  cons: string[]
  cheaperAlternative?: string
  premiumVerdict?: string
  shortlisted: boolean
  origin: ListingOrigin
  createdAt: string
}

/* ---------- App state ---------- */

export type ThemePref = 'system' | 'light' | 'dark'

export type Settings = {
  theme: ThemePref
  /** Minimum score an item needs before the planner will spend money on it */
  valueFloor: number
  /** Optional research integration: a URL containing {query}, returning listings as JSON */
  researchEndpoint: string
  /** The quick inventory prompt has been dismissed or completed */
  inventoryDone: boolean
}

export type AppState = {
  version: 1
  budget: {
    amount: number
    /** Purchases on or after this date count against the budget. YYYY-MM-DD */
    periodStart: string
  }
  goals: Record<GoalId, number>
  items: Record<string, ItemState>
  catalog: {
    /** Edits to shipped items, keyed by id */
    overrides: Record<string, Partial<CatalogItem>>
    custom: CatalogItem[]
    hidden: string[]
  }
  listings: Listing[]
  settings: Settings
  meta: { createdAt: string; updatedAt: string }
}
