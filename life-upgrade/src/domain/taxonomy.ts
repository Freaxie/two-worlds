import type { CategoryId, Frequency, GoalId, ItemClass, ItemStatus, ManualPriority, TierId, UsageFrequency } from './types'

/* ---------- Goals: what the user is trying to improve ---------- */

export type Goal = { id: GoalId; name: string; short: string; blurb: string; defaultWeight: number }

export const GOALS: Goal[] = [
  { id: 'fitness', name: 'Fitness & physique', short: 'Fitness', blurb: 'Build muscle, train consistently, eat to a plan.', defaultWeight: 5 },
  { id: 'focus', name: 'Focus & follow-through', short: 'Focus', blurb: 'Less friction and procrastination, more finished.', defaultWeight: 5 },
  { id: 'grooming', name: 'Grooming & presentation', short: 'Grooming', blurb: 'Skin, teeth, hair, clothes — how you show up.', defaultWeight: 4 },
  { id: 'sleep', name: 'Sleep & recovery', short: 'Sleep', blurb: 'Fall asleep easier, wake up rested.', defaultWeight: 4 },
  { id: 'space', name: 'Room & environment', short: 'Room', blurb: 'A clean, calm, organised place to live and work.', defaultWeight: 3 },
  { id: 'making', name: 'Tech & making', short: 'Making', blurb: 'Electronics, robotics, AI and creative projects.', defaultWeight: 3 },
  { id: 'safety', name: 'Safety & resilience', short: 'Safety', blurb: 'Protect your health, devices and data.', defaultWeight: 3 },
  { id: 'comfort', name: 'Comfort & enjoyment', short: 'Comfort', blurb: 'Audio, entertainment and everyday ease.', defaultWeight: 2 },
]

export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g])) as Record<GoalId, Goal>

export const DEFAULT_GOAL_WEIGHTS = Object.fromEntries(GOALS.map((g) => [g.id, g.defaultWeight])) as Record<GoalId, number>

export const GOAL_WEIGHT_LABELS = ['Not now', 'Minor', 'Some', 'Moderate', 'High', 'Top priority'] as const

/* ---------- Categories ---------- */

export type Category = { id: CategoryId; index: string; name: string; blurb: string }

export const CATEGORIES: Category[] = [
  { id: 'daily', index: '01', name: 'Daily Essentials', blurb: 'The unglamorous basics that keep an ordinary week running.' },
  { id: 'fitness', index: '02', name: 'Health & Fitness', blurb: 'Measure progress, train anywhere, recover properly.' },
  { id: 'grooming', index: '03', name: 'Grooming & Care', blurb: 'Teeth, skin and hair: small daily habits that compound.' },
  { id: 'sleep', index: '04', name: 'Sleep & Recovery', blurb: 'Darker, quieter, more comfortable nights.' },
  { id: 'focus', index: '05', name: 'Focus & Productivity', blurb: 'Tools that make starting easier and distraction harder.' },
  { id: 'room', index: '06', name: 'Room & Environment', blurb: 'Storage, seating, light and air in the room you live in.' },
  { id: 'tech', index: '07', name: 'Technology', blurb: 'Power, storage, audio and screens that just work.' },
  { id: 'kitchen', index: '08', name: 'Kitchen & Nutrition', blurb: 'Cook more, measure what you eat, waste less.' },
  { id: 'making', index: '09', name: 'Learning & Making', blurb: 'Electronics, tools and books for building things.' },
  { id: 'safety', index: '10', name: 'Safety & Preparedness', blurb: 'Cheap insurance against bad days.' },
  { id: 'convenience', index: '11', name: 'Convenience', blurb: 'Remove recurring annoyances and make good habits automatic.' },
  { id: 'luxury', index: '12', name: 'Optional Luxuries', blurb: 'Enjoyment and polish, for after the needs are met.' },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>

/* ---------- Item classes ---------- */

export const CLASS_META: Record<ItemClass, { label: string; blurb: string; discretionary: boolean; rank: number }> = {
  essential: { label: 'Essential', blurb: 'Solves a real, recurring problem. Most people in your position should have one.', discretionary: false, rank: 0 },
  useful: { label: 'Useful', blurb: 'Clearly improves daily life, but you can manage without it.', discretionary: false, rank: 1 },
  optional: { label: 'Optional', blurb: 'Worth it in specific situations, or once the basics are covered.', discretionary: true, rank: 2 },
  luxury: { label: 'Luxury', blurb: 'Enjoyment or polish. Fine to buy, after the needs.', discretionary: true, rank: 3 },
}

export const CLASSES: ItemClass[] = ['essential', 'useful', 'optional', 'luxury']

/* ---------- Frequency ---------- */

export const FREQUENCY_META: Record<Frequency, { label: string; short: string; factor: number }> = {
  daily: { label: 'Daily', short: 'Daily', factor: 1 },
  'several-weekly': { label: 'Several times a week', short: '3–5× a week', factor: 0.8 },
  weekly: { label: 'Weekly', short: 'Weekly', factor: 0.6 },
  monthly: { label: 'Monthly', short: 'Monthly', factor: 0.35 },
  occasional: { label: 'A few times a year', short: 'Occasional', factor: 0.15 },
  standby: { label: 'Standby — rarely used, there when it matters', short: 'Standby', factor: 0.45 },
}

export const FREQUENCIES = Object.keys(FREQUENCY_META) as Frequency[]

/* ---------- Tiers ---------- */

export const TIER_META: Record<TierId, { label: string }> = {
  budget: { label: 'Budget' },
  standard: { label: 'Standard' },
  premium: { label: 'Premium' },
}

export const TIERS: TierId[] = ['budget', 'standard', 'premium']

/* ---------- Status ---------- */

export const STATUS_META: Record<ItemStatus, { label: string; verb: string }> = {
  candidate: { label: 'Undecided', verb: 'Clear status' },
  wishlist: { label: 'Wishlist', verb: 'Add to wishlist' },
  deferred: { label: 'Later', verb: 'Defer until later' },
  purchased: { label: 'Purchased', verb: 'Mark as purchased' },
  owned: { label: 'Already own', verb: 'Mark as owned' },
  unnecessary: { label: "Don't need", verb: 'Mark as unnecessary' },
}

/** Statuses where the user already has the thing */
export const HAVE_STATUSES: ItemStatus[] = ['owned', 'purchased']

/** Statuses the engine can still recommend buying */
export const OPEN_STATUSES: ItemStatus[] = ['candidate', 'wishlist']

/* ---------- Priority ---------- */

export type PriorityTier = Exclude<ManualPriority, 'auto'>

export const PRIORITY_META: Record<PriorityTier, { label: string; min: number }> = {
  critical: { label: 'Critical', min: 80 },
  high: { label: 'High', min: 65 },
  medium: { label: 'Medium', min: 50 },
  low: { label: 'Low', min: 0 },
}

export const PRIORITY_TIERS: PriorityTier[] = ['critical', 'high', 'medium', 'low']

export function priorityOf(score: number): PriorityTier {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

/* ---------- Impact tracker ---------- */

export const USAGE_META: Record<UsageFrequency, { label: string; factor: number; perMonth: number }> = {
  daily: { label: 'Daily', factor: 1, perMonth: 30 },
  weekly: { label: 'Weekly', factor: 0.7, perMonth: 4 },
  monthly: { label: 'Monthly', factor: 0.4, perMonth: 1 },
  rarely: { label: 'Rarely', factor: 0.15, perMonth: 0.25 },
  never: { label: 'Never', factor: 0, perMonth: 0 },
}

export const USAGES = Object.keys(USAGE_META) as UsageFrequency[]
