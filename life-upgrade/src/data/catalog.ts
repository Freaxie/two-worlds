import type { AppState, CatalogItem } from '../domain/types'
import { DAILY_FITNESS_GROOMING } from './catalog-a'
import { SLEEP_FOCUS_ROOM_TECH } from './catalog-b'
import { KITCHEN_MAKING_SAFETY_MORE } from './catalog-c'

/** The curated catalog that ships with the app. Users edit it through overrides, never in place. */
export const SEED_CATALOG: CatalogItem[] = [...DAILY_FITNESS_GROOMING, ...SLEEP_FOCUS_ROOM_TECH, ...KITCHEN_MAKING_SAFETY_MORE]

export const SEED_IDS = new Set(SEED_CATALOG.map((i) => i.id))

/**
 * The catalog the user actually sees: shipped items with their edits applied, hidden items
 * removed, custom items appended. Alternatives are made symmetric and relationships that point
 * at missing items are dropped, so the engine never has to second-guess the data.
 */
export function resolveCatalog(catalog: AppState['catalog']): CatalogItem[] {
  const hidden = new Set(catalog.hidden)
  const items: CatalogItem[] = SEED_CATALOG.filter((s) => !hidden.has(s.id)).map((s) => {
    const o = catalog.overrides[s.id]
    return o ? { ...s, ...o, id: s.id, tiers: { ...s.tiers, ...o.tiers } } : s
  })
  for (const c of catalog.custom) if (!hidden.has(c.id)) items.push({ ...c, custom: true })

  const ids = new Set(items.map((i) => i.id))
  const alt = new Map<string, Set<string>>()
  for (const i of items) {
    for (const a of i.alternatives ?? []) {
      if (!ids.has(a) || a === i.id) continue
      if (!alt.has(i.id)) alt.set(i.id, new Set())
      if (!alt.has(a)) alt.set(a, new Set())
      alt.get(i.id)!.add(a)
      alt.get(a)!.add(i.id)
    }
  }
  const keep = (list: string[] | undefined, self: string) => (list ?? []).filter((x) => ids.has(x) && x !== self)

  return items.map((i) => ({
    ...i,
    requires: keep(i.requires, i.id),
    buildsOn: keep(i.buildsOn, i.id),
    alternatives: [...(alt.get(i.id) ?? [])],
  }))
}
