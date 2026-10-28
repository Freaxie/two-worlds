import { useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Check, CloudDownload, FlaskConical, Pencil, Plus, Star, Trash2, Upload } from 'lucide-react'
import type { Listing, PriceStatus, TierId } from '../domain/types'
import { CATEGORY_BY_ID, TIER_META, TIERS } from '../domain/taxonomy'
import type { ItemEval } from '../engine/scoring'
import { fetchListings, ResearchError, searchLinks } from '../research/providers'
import { cx, date, inr, inrRange, plural } from '../lib/format'
import { href, setParams, useRoute } from '../lib/router'
import { todayISO } from '../state/defaults'
import { isHttpUrl, listing as parseListing } from '../state/validation'
import { dispatch, useAppState, useModel } from '../state/store'
import { Dialog, toast } from '../components/overlay'
import { Button, Empty, Field, Input, Select, Switch, Textarea } from '../components/ui'

const PRICE_LABEL: Record<PriceStatus, string> = { verified: 'Verified', estimate: 'Estimate', unverified: 'Unverified' }

export function Research() {
  const model = useModel()
  const state = useAppState()
  const { params } = useRoute()
  const forId = params.get('for')
  const e = forId ? model.evalById.get(forId) : undefined
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of state.listings) m.set(l.itemId, (m.get(l.itemId) ?? 0) + 1)
    return m
  }, [state.listings])
  const researched = model.evals.filter((x) => counts.has(x.item.id))
  const suggestions = model.evals.filter((x) => x.open && !counts.has(x.item.id)).sort((a, b) => b.score - a.score).slice(0, 6)

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-muted">Product research</p>
          <h1 className="display mt-2 text-[2.25rem] text-ink sm:text-[2.75rem]">{e ? e.item.name : 'From need to exact model'}</h1>
          <p className="pretty mt-2 text-ink-2">
            Recommendations say what kind of thing to buy. This is where specific models, real prices and merchants go, with where each price came from and when you checked it.
            Nothing here is invented: it’s what you enter, import, or fetch from an integration you configure.
          </p>
        </div>
        <label className="flex min-w-[16rem] flex-col gap-1">
          <span className="text-xs font-medium text-muted">Researching</span>
          <Select value={forId ?? ''} onChange={(ev) => setParams({ for: ev.target.value || undefined })}>
            <option value="">Choose an item…</option>
            {[...model.evals]
              .filter((x) => x.state.status !== 'unnecessary')
              .sort((a, b) => a.item.name.localeCompare(b.item.name))
              .map((x) => (
                <option key={x.item.id} value={x.item.id}>
                  {x.item.name}
                  {counts.get(x.item.id) ? ` (${counts.get(x.item.id)})` : ''}
                </option>
              ))}
          </Select>
        </label>
      </div>

      {e ? (
        <ItemResearch e={e} listings={state.listings.filter((l) => l.itemId === e.item.id)} endpoint={state.settings.researchEndpoint} />
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="r-h">
            <h2 id="r-h" className="display mb-4 text-[1.5rem] text-ink">
              Your research
            </h2>
            {researched.length ? (
              <ul className="flex flex-col gap-2">
                {researched.map((x) => (
                  <li key={x.item.id}>
                    <a href={href('research', { for: x.item.id })} className="card flex items-center justify-between gap-3 p-3.5 hover:border-line-strong">
                      <span className="min-w-0 truncate text-sm font-medium text-ink">{x.item.name}</span>
                      <span className="shrink-0 text-xs text-muted">{plural(counts.get(x.item.id)!, 'product')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon={FlaskConical} title="No products researched yet">
                Start with a need: pick an item, open its merchant searches, then add the two or three models you’re considering and shortlist them to compare.
              </Empty>
            )}
          </section>
          <section aria-labelledby="s-h">
            <h2 id="s-h" className="display mb-1 text-[1.5rem] text-ink">
              Worth researching next
            </h2>
            <p className="mb-4 text-[0.8125rem] text-muted">Your highest-scoring open items with no products picked yet.</p>
            <ul className="flex flex-col gap-2">
              {suggestions.map((x) => (
                <li key={x.item.id}>
                  <a href={href('research', { for: x.item.id })} className="card flex items-center justify-between gap-3 p-3.5 hover:border-line-strong">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{x.item.name}</span>
                      <span className="text-xs text-muted">Estimate {inrRange(x.current.priceMin, x.current.priceMax)}</span>
                    </span>
                    <span className="num shrink-0 text-sm text-ink-2">{x.score}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

function ItemResearch({ e, listings, endpoint }: { e: ItemEval; listings: Listing[]; endpoint: string }) {
  const [editing, setEditing] = useState<Listing | 'new' | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)
  const shortlisted = listings.filter((l) => l.shortlisted)
  const mine = listings.filter((l) => !l.shortlisted && l.origin !== 'integration')
  const live = listings.filter((l) => !l.shortlisted && l.origin === 'integration')

  const runFetch = async () => {
    setFetching(true)
    setFetchError(undefined)
    try {
      const found = await fetchListings(endpoint, e.item)
      dispatch({ type: 'listings/add', listings: found })
      toast(found.length ? `${plural(found.length, 'result')} added for review` : 'The integration returned no results')
    } catch (err) {
      setFetchError(err instanceof ResearchError ? err.message : 'The request failed.')
    } finally {
      setFetching(false)
    }
  }

  const importFile = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text())
      const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray(raw?.listings) ? raw.listings : []
      const parsed = arr.map((r) => parseListing({ ...(r as object), id: crypto.randomUUID(), itemId: e.item.id }, 'import')).filter((x): x is Listing => !!x)
      if (!parsed.length) return toast('No valid listings found in that file (each needs a brand and model)')
      dispatch({ type: 'listings/add', listings: parsed })
      toast(`${plural(parsed.length, 'listing')} imported`)
    } catch {
      toast('That file isn’t valid JSON')
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {CATEGORY_BY_ID[e.item.category].name} · score {e.score}
          </p>
          <p className="mt-1 text-sm text-ink">
            Recommended tier: <span className="font-medium">{TIER_META[e.recommendedTier].label}</span>, estimated {inrRange(e.tiers[e.recommendedTier]!.priceMin, e.tiers[e.recommendedTier]!.priceMax)}{' '}
            <span className="text-muted">(illustrative)</span>
          </p>
          {e.state.priceTarget && <p className="mt-1 text-sm text-ink-2">Your price target: {inr(e.state.priceTarget)}</p>}
          <p className="pretty mt-2 max-w-xl text-[0.8125rem] text-ink-2">Look for: {e.item.lookFor.join('; ')}.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {searchLinks(e.item).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full border border-line-strong bg-surface px-3 text-[0.8125rem] text-ink-2 hover:border-ink/40 hover:text-ink">
                Search {l.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            Add a product
          </Button>
          <Button icon={Upload} onClick={() => fileRef.current?.click()}>
            Import JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(ev) => ev.target.files?.[0] && (importFile(ev.target.files[0]), (ev.target.value = ''))} />
          {endpoint ? (
            <Button icon={CloudDownload} onClick={runFetch} disabled={fetching}>
              {fetching ? 'Fetching…' : 'Fetch live results'}
            </Button>
          ) : (
            <a href={href('settings')} className="text-center text-xs text-muted underline underline-offset-2 hover:text-ink">
              Connect a research integration
            </a>
          )}
        </div>
      </div>
      {fetchError && (
        <p role="alert" className="-mt-6 rounded-[10px] bg-bad/8 px-3 py-2 text-sm text-bad">
          {fetchError}
        </p>
      )}

      <section aria-labelledby="cmp-h">
        <h2 id="cmp-h" className="display text-[1.5rem] text-ink">
          Shortlist comparison
        </h2>
        <p className="mt-1 mb-4 text-[0.8125rem] text-muted">Star products to compare them here, side by side.</p>
        {shortlisted.length ? <Compare items={shortlisted} target={e.state.priceTarget} onEdit={setEditing} /> : <p className="rounded-[12px] border border-dashed border-line-strong px-4 py-5 text-sm text-ink-2">Nothing shortlisted yet.</p>}
      </section>

      <section aria-labelledby="mine-h">
        <h2 id="mine-h" className="display mb-4 text-[1.5rem] text-ink">
          Your entries
        </h2>
        {mine.length ? (
          <ListingGrid items={mine} onEdit={setEditing} />
        ) : (
          <p className="rounded-[12px] border border-dashed border-line-strong px-4 py-5 text-sm text-ink-2">Add the models you’re weighing up, with the price you saw and where.</p>
        )}
      </section>

      {live.length > 0 && (
        <section aria-labelledby="live-h">
          <h2 id="live-h" className="display text-[1.5rem] text-ink">
            Live results to review
          </h2>
          <p className="mt-1 mb-4 text-[0.8125rem] text-muted">
            From your integration ({safeHost(endpoint)}). Kept apart from recommendations until you shortlist them.
          </p>
          <ListingGrid items={live} onEdit={setEditing} />
        </section>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? `Add a product for ${e.item.name}` : 'Edit product'}>
        {editing && <ListingForm e={e} existing={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </div>
  )
}

const safeHost = (u: string) => {
  try {
    return new URL(u.replace('{query}', 'q')).host
  } catch {
    return 'integration'
  }
}

function PriceLine({ l, target }: { l: Listing; target?: number }) {
  if (l.price === undefined) return <span className="text-sm text-muted">No price recorded</span>
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-lg font-semibold text-ink">{inr(l.price)}</span>
      <span className={cx('text-xs font-medium', l.priceStatus === 'verified' ? 'text-good' : 'text-muted')}>{PRICE_LABEL[l.priceStatus]}</span>
      {target !== undefined && l.price <= target && <span className="text-xs font-medium text-good">At or under your target</span>}
    </span>
  )
}

function Provenance({ l }: { l: Listing }) {
  return (
    <p className="text-xs text-muted">
      {l.merchant ?? 'Merchant not recorded'}
      {l.source && ` · source: ${l.source}`}
      {l.verifiedAt ? ` · checked ${date(l.verifiedAt)}` : ' · date not recorded'}
    </p>
  )
}

function ListingActions({ l, onEdit }: { l: Listing; onEdit: (l: Listing) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button size="sm" variant={l.shortlisted ? 'primary' : 'secondary'} icon={Star} aria-pressed={l.shortlisted} onClick={() => dispatch({ type: 'listing/upsert', listing: { ...l, shortlisted: !l.shortlisted } })}>
        {l.shortlisted ? 'Shortlisted' : 'Shortlist'}
      </Button>
      <Button size="sm" variant="ghost" icon={Pencil} onClick={() => onEdit(l)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={Trash2}
        onClick={() => {
          dispatch({ type: 'listing/delete', id: l.id })
          toast(`${l.brand} ${l.model} removed`, { label: 'Undo', run: () => dispatch({ type: 'listing/upsert', listing: l }) })
        }}
      >
        Remove
      </Button>
      {l.url && (
        <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="ml-auto inline-flex items-center gap-1 text-[0.8125rem] text-ink-2 underline-offset-2 hover:text-ink hover:underline">
          Open link <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
      )}
    </div>
  )
}

function ListingGrid({ items, onEdit }: { items: Listing[]; onEdit: (l: Listing) => void }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((l) => (
        <li key={l.id} className="card flex flex-col gap-3 p-4">
          <div>
            <p className="text-xs text-muted">
              {l.brand}
              {l.tier ? ` · ${TIER_META[l.tier].label} tier` : ''}
            </p>
            <p className="font-medium text-ink">{l.model}</p>
          </div>
          <PriceLine l={l} />
          <Provenance l={l} />
          {(l.pros.length > 0 || l.cons.length > 0) && (
            <p className="text-[0.8125rem] text-ink-2">
              {l.pros.slice(0, 2).join(' · ')}
              {l.cons.length > 0 && <span className="text-muted"> — {l.cons.slice(0, 2).join(' · ')}</span>}
            </p>
          )}
          <div className="mt-auto border-t border-line pt-3">
            <ListingActions l={l} onEdit={onEdit} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Side-by-side comparison ---------- */

function Compare({ items, target, onEdit }: { items: Listing[]; target?: number; onEdit: (l: Listing) => void }) {
  const specLabels = [...new Set(items.flatMap((l) => l.specs.map((s) => s.label)))]
  const verified = items.filter((l) => l.priceStatus === 'verified' && l.price !== undefined)
  const cheapest = verified.length ? verified.reduce((a, b) => (a.price! <= b.price! ? a : b)).id : undefined
  const row = (label: string, cell: (l: Listing) => React.ReactNode) => (
    <tr className="border-b border-line align-top">
      <th scope="row" className="sticky left-0 z-[1] w-36 bg-bg py-3 pr-4 text-left text-xs font-medium text-muted">
        {label}
      </th>
      {items.map((l) => (
        <td key={l.id} className="min-w-[13rem] py-3 pr-5 text-[0.8125rem] text-ink">
          {cell(l) ?? <span className="text-muted">—</span>}
        </td>
      ))}
    </tr>
  )
  const list = (xs: string[]) => (xs.length ? <ul className="flex flex-col gap-1">{xs.map((x) => <li key={x}>{x}</li>)}</ul> : null)
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-ink">
            <th scope="col" className="sticky left-0 z-[1] bg-bg" />
            {items.map((l) => (
              <th key={l.id} scope="col" className="py-3 pr-5 text-left align-bottom">
                <p className="text-xs font-normal text-muted">{l.brand}</p>
                <p className="text-sm font-medium text-ink">{l.model}</p>
                {l.id === cheapest && verified.length > 1 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-good">
                    <Check aria-hidden className="size-3" strokeWidth={2.5} /> Lowest verified price
                  </p>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {row('Price', (l) => <PriceLine l={l} target={target} />)}
          {row('Merchant and source', (l) => <Provenance l={l} />)}
          {row('Tier', (l) => (l.tier ? TIER_META[l.tier].label : null))}
          {row('Warranty', (l) => l.warranty)}
          {specLabels.map((label) => row(label, (l) => l.specs.find((s) => s.label === label)?.value))}
          {row('Durability', (l) => l.durability)}
          {row('Advantages', (l) => list(l.pros))}
          {row('Drawbacks', (l) => list(l.cons))}
          {row('Cheaper alternative', (l) => l.cheaperAlternative)}
          {row('Premium worth it?', (l) => l.premiumVerdict)}
          {row('', (l) => <ListingActions l={l} onEdit={onEdit} />)}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Listing form ---------- */

function ListingForm({ e, existing, onDone }: { e: ItemEval; existing?: Listing; onDone: () => void }) {
  const [f, setF] = useState({
    brand: existing?.brand ?? '',
    model: existing?.model ?? '',
    tier: (existing?.tier ?? e.tier) as TierId,
    price: existing?.price !== undefined ? String(existing.price) : '',
    priceStatus: existing?.priceStatus ?? ('verified' as PriceStatus),
    merchant: existing?.merchant ?? '',
    url: existing?.url ?? '',
    source: existing?.source ?? '',
    verifiedAt: existing?.verifiedAt ?? todayISO(),
    warranty: existing?.warranty ?? '',
    specs: (existing?.specs ?? []).map((s) => `${s.label}: ${s.value}`).join('\n'),
    durability: existing?.durability ?? '',
    pros: (existing?.pros ?? []).join('\n'),
    cons: (existing?.cons ?? []).join('\n'),
    cheaperAlternative: existing?.cheaperAlternative ?? '',
    premiumVerdict: existing?.premiumVerdict ?? '',
    shortlisted: existing?.shortlisted ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.brand.trim()) errs.brand = 'Brand is required.'
    if (!f.model.trim()) errs.model = 'Exact model is required.'
    const price = f.price.trim() ? Number(f.price.replace(/[,\s₹]/g, '')) : undefined
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) errs.price = 'Enter a price in rupees.'
    if (f.url.trim() && !isHttpUrl(f.url.trim())) errs.url = 'Links must start with https:// or http://'
    if (f.priceStatus === 'verified') {
      if (price === undefined) errs.price = 'A verified price needs the price.'
      if (!f.source.trim()) errs.source = 'Say where you saw it, e.g. the store page or a receipt.'
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.verifiedAt)) errs.verifiedAt = 'When did you check it?'
      else if (f.verifiedAt > todayISO()) errs.verifiedAt = 'The check date can’t be in the future.'
    }
    const specs = lines(f.specs).map((l) => {
      const i = l.indexOf(':')
      return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : null
    })
    if (specs.some((s) => !s || !s.value)) errs.specs = 'Write each spec as “Label: value”, one per line.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const l = parseListing(
      {
        ...f,
        id: existing?.id ?? crypto.randomUUID(),
        itemId: e.item.id,
        price,
        url: f.url.trim() || undefined,
        verifiedAt: f.priceStatus === 'unverified' ? undefined : f.verifiedAt,
        specs,
        pros: lines(f.pros),
        cons: lines(f.cons),
        createdAt: existing?.createdAt,
      },
      existing?.origin ?? 'manual',
    )
    if (!l) return setErrors({ form: 'Something in the form is invalid.' })
    dispatch({ type: 'listing/upsert', listing: l })
    toast(existing ? 'Product updated' : `${l.brand} ${l.model} added`)
    onDone()
  }

  const tiers = TIERS.filter((t) => e.item.tiers[t])
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 px-5 py-5 sm:px-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand" error={errors.brand}>
          {(id, d) => <Input id={id} data-autofocus value={f.brand} onChange={(x) => set('brand', x.target.value)} aria-invalid={!!errors.brand} aria-describedby={d} maxLength={80} />}
        </Field>
        <Field label="Exact model" error={errors.model}>
          {(id, d) => <Input id={id} value={f.model} onChange={(x) => set('model', x.target.value)} aria-invalid={!!errors.model} aria-describedby={d} maxLength={120} />}
        </Field>
        <Field label="Price (₹)" error={errors.price}>
          {(id, d) => <Input id={id} inputMode="numeric" value={f.price} onChange={(x) => set('price', x.target.value)} aria-invalid={!!errors.price} aria-describedby={d} />}
        </Field>
        <Field label="Price status" hint={f.priceStatus === 'verified' ? 'You saw this price yourself, at a source you can name' : f.priceStatus === 'estimate' ? 'A rough figure, not checked' : 'Price unknown or unchecked'}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={f.priceStatus} onChange={(x) => set('priceStatus', x.target.value as PriceStatus)}>
              <option value="verified">Verified</option>
              <option value="estimate">Estimate</option>
              <option value="unverified">Unverified</option>
            </Select>
          )}
        </Field>
        <Field label="Merchant">
          {(id) => <Input id={id} value={f.merchant} onChange={(x) => set('merchant', x.target.value)} placeholder="Store or seller" maxLength={80} />}
        </Field>
        <Field label="Product link" error={errors.url}>
          {(id, d) => <Input id={id} type="url" value={f.url} onChange={(x) => set('url', x.target.value)} placeholder="https://" aria-invalid={!!errors.url} aria-describedby={d} />}
        </Field>
        {f.priceStatus !== 'unverified' && (
          <>
            <Field label="Price source" error={errors.source}>
              {(id, d) => <Input id={id} value={f.source} onChange={(x) => set('source', x.target.value)} placeholder="Product page, in-store tag, receipt" aria-invalid={!!errors.source} aria-describedby={d} maxLength={300} />}
            </Field>
            <Field label="Price checked on" error={errors.verifiedAt}>
              {(id, d) => <Input id={id} type="date" max={todayISO()} value={f.verifiedAt} onChange={(x) => set('verifiedAt', x.target.value)} aria-invalid={!!errors.verifiedAt} aria-describedby={d} />}
            </Field>
          </>
        )}
        <Field label="Tier it represents">
          {(id) => (
            <Select id={id} value={f.tier} onChange={(x) => set('tier', x.target.value as TierId)}>
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {TIER_META[t].label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Warranty">
          {(id) => <Input id={id} value={f.warranty} onChange={(x) => set('warranty', x.target.value)} placeholder="e.g. 2 years" maxLength={120} />}
        </Field>
      </div>
      <Field label="Key specifications" hint="One per line, as “Label: value”" error={errors.specs}>
        {(id, d) => <Textarea id={id} value={f.specs} onChange={(x) => set('specs', x.target.value)} aria-invalid={!!errors.specs} aria-describedby={d} placeholder={'Capacity: 10 kg\nResolution: 1 g'} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Advantages" hint="One per line">
          {(id, d) => <Textarea id={id} aria-describedby={d} value={f.pros} onChange={(x) => set('pros', x.target.value)} />}
        </Field>
        <Field label="Drawbacks" hint="One per line">
          {(id, d) => <Textarea id={id} aria-describedby={d} value={f.cons} onChange={(x) => set('cons', x.target.value)} />}
        </Field>
        <Field label="Durability notes">
          {(id) => <Input id={id} value={f.durability} onChange={(x) => set('durability', x.target.value)} maxLength={400} />}
        </Field>
        <Field label="Cheaper alternative">
          {(id) => <Input id={id} value={f.cheaperAlternative} onChange={(x) => set('cheaperAlternative', x.target.value)} maxLength={300} />}
        </Field>
        <Field label="Is the premium version worth it?" className="sm:col-span-2">
          {(id) => <Input id={id} value={f.premiumVerdict} onChange={(x) => set('premiumVerdict', x.target.value)} maxLength={300} />}
        </Field>
      </div>
      <Switch checked={f.shortlisted} onChange={(v) => set('shortlisted', v)} label="Shortlist for comparison" description="Shortlisted verified prices replace the estimate in your plans." />
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-[10px] bg-bad/8 px-3 py-2 text-sm text-bad">
          {errors.form ?? 'Fix the highlighted fields to save.'}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {existing ? 'Save product' : 'Add product'}
        </Button>
      </div>
    </form>
  )
}
