import type { CatalogItem, Listing } from '../domain/types'
import { listing } from '../state/validation'

/* ------------------------------------------------------------------
   Product research. The app never invents products, prices or links.
   Three sources, kept apart and labelled:
   - Search links: real merchant search pages for the item's query.
   - Manual entries: what you found, with price provenance you supply.
   - An optional endpoint you configure, returning listings as JSON.
------------------------------------------------------------------- */

export function searchQuery(item: CatalogItem) {
  return item.name.replace(/\(.*?\)/g, '').replace(/[:,].*$/, '').trim()
}

export function searchLinks(item: CatalogItem) {
  const q = encodeURIComponent(searchQuery(item))
  const links = [
    { label: 'Amazon.in', url: `https://www.amazon.in/s?k=${q}` },
    { label: 'Flipkart', url: `https://www.flipkart.com/search?q=${q}` },
    { label: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${q}` },
  ]
  if (item.category === 'making') links.push({ label: 'Robu.in', url: `https://robu.in/?s=${q}&post_type=product` })
  return links
}

/** The JSON shape an integration must return: an array of these (or `{ listings: [...] }`) */
export const INTEGRATION_SCHEMA = `[
  {
    "brand": "string",            // required
    "model": "string",            // required
    "price": 1299,                // INR, optional
    "priceStatus": "verified",    // verified | estimate | unverified
    "merchant": "string",
    "url": "https://…",
    "source": "Where the price was read",   // required for verified
    "verifiedAt": "YYYY-MM-DD",              // required for verified
    "warranty": "1 year",
    "specs": [{ "label": "Capacity", "value": "10 kg" }],
    "pros": ["…"], "cons": ["…"]
  }
]`

export class ResearchError extends Error {}

export async function fetchListings(endpoint: string, item: CatalogItem, signal?: AbortSignal): Promise<Listing[]> {
  if (!endpoint.includes('{query}')) throw new ResearchError('The endpoint must contain {query} where the search term goes.')
  const url = endpoint.replace('{query}', encodeURIComponent(searchQuery(item)))
  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ResearchError('Could not reach the research endpoint. Check the URL and that it allows requests from this page (CORS).')
  }
  if (!res.ok) throw new ResearchError(`The research endpoint answered ${res.status} ${res.statusText}.`)
  let body: unknown
  try {
    body = await res.json()
  } catch {
    throw new ResearchError('The research endpoint did not return JSON.')
  }
  const raw = Array.isArray(body) ? body : Array.isArray((body as { listings?: unknown })?.listings) ? (body as { listings: unknown[] }).listings : null
  if (!raw) throw new ResearchError('Expected a JSON array of listings.')
  const now = new Date().toISOString()
  return raw
    .slice(0, 25)
    .map((r) => listing({ ...(r as object), id: crypto.randomUUID(), itemId: item.id, shortlisted: false, createdAt: now }, 'integration'))
    .filter((l): l is Listing => !!l)
}
