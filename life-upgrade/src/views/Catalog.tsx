import { useEffect, useMemo, useRef, useState } from 'react'
import { ListChecks, Plus, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import type { CategoryId, ItemClass } from '../domain/types'
import { CATEGORIES, CATEGORY_BY_ID, CLASS_META, CLASSES, PRIORITY_META, PRIORITY_TIERS, type PriorityTier } from '../domain/taxonomy'
import type { ItemEval } from '../engine/scoring'
import { cx, num } from '../lib/format'
import { navigate, setParams, useRoute } from '../lib/router'
import { todayISO } from '../state/defaults'
import { useModel } from '../state/store'
import { ItemCard } from '../components/item'
import { ClassMark } from '../components/marks'
import { Button, Chip, Empty, Segmented, Select } from '../components/ui'
import { ItemFormDialog } from './ItemForm'

const PRICE_BANDS = [
  { id: 'u500', label: 'Under ₹500', min: 0, max: 499 },
  { id: '500-2k', label: '₹500–2,000', min: 500, max: 2000 },
  { id: '2k-5k', label: '₹2,000–5,000', min: 2001, max: 5000 },
  { id: '5k-15k', label: '₹5,000–15,000', min: 5001, max: 15000 },
  { id: '15k', label: 'Over ₹15,000', min: 15001, max: Infinity },
] as const

const SORTS = {
  score: { label: 'Highest score', fn: (a: ItemEval, b: ItemEval) => b.score - a.score },
  value: { label: 'Best value per rupee', fn: (a: ItemEval, b: ItemEval) => b.current.valueIndex - a.current.valueIndex || b.score - a.score },
  'price-asc': { label: 'Price: low to high', fn: (a: ItemEval, b: ItemEval) => a.current.price - b.current.price },
  'price-desc': { label: 'Price: high to low', fn: (a: ItemEval, b: ItemEval) => b.current.price - a.current.price },
  category: { label: 'By category', fn: (a: ItemEval, b: ItemEval) => CATEGORY_BY_ID[a.item.category].index.localeCompare(CATEGORY_BY_ID[b.item.category].index) || b.score - a.score },
  name: { label: 'Name', fn: (a: ItemEval, b: ItemEval) => a.item.name.localeCompare(b.item.name) },
} as const

type SortId = keyof typeof SORTS
type Own = 'all' | 'open' | 'have'
type Timing = 'all' | 'now' | 'future'

const FUTURE_DAYS = 30

function isFuture(e: ItemEval, today: string) {
  if (e.state.status === 'deferred') return true
  if (!e.state.targetDate) return false
  const horizon = new Date(`${today}T00:00:00`)
  horizon.setDate(horizon.getDate() + FUTURE_DAYS)
  return e.state.targetDate > todayISO(horizon)
}

export function Catalog() {
  const model = useModel()
  const { params } = useRoute()
  const [showFilters, setShowFilters] = useState(false)
  const [adding, setAdding] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const q = params.get('q') ?? ''
  const cat = (params.get('cat') ?? '') as CategoryId | ''
  const classes = (params.get('cls')?.split(',').filter((c) => CLASSES.includes(c as ItemClass)) ?? []) as ItemClass[]
  const price = params.get('price') ?? ''
  const pri = (params.get('pri') ?? '') as PriorityTier | ''
  const own = (params.get('own') ?? 'all') as Own
  const timing = (params.get('time') ?? 'all') as Timing
  const sort = (params.get('sort') && params.get('sort')! in SORTS ? params.get('sort') : 'score') as SortId

  // Arriving via the "/" shortcut from another page focuses search
  useEffect(() => {
    if (params.get('focus')) {
      searchRef.current?.focus()
      setParams({ focus: undefined }, true)
    }
  }, [params])

  const today = todayISO()
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const band = PRICE_BANDS.find((b) => b.id === price)
    return model.evals
      .filter((e) => {
        if (cat && e.item.category !== cat) return false
        if (classes.length && !classes.includes(e.item.class)) return false
        if (band && (e.current.price < band.min || e.current.price > band.max)) return false
        if (pri && e.priority !== pri) return false
        if (own === 'have' && !e.have) return false
        if (own === 'open' && (e.have || e.state.status === 'unnecessary')) return false
        if (timing === 'future' && !isFuture(e, today)) return false
        if (timing === 'now' && (!e.open || isFuture(e, today))) return false
        if (words.length) {
          const hay = [e.item.name, e.item.problem, e.item.value, CATEGORY_BY_ID[e.item.category].name, e.item.class, ...(e.item.tags ?? []), e.state.notes].join(' ').toLowerCase()
          if (!words.every((w) => hay.includes(w))) return false
        }
        return true
      })
      .sort(SORTS[sort].fn)
  }, [model, q, cat, classes, price, pri, own, timing, sort, today])

  const activeCount = [cat, price, pri, classes.length ? 'x' : '', own !== 'all' ? 'x' : '', timing !== 'all' ? 'x' : '', q].filter(Boolean).length
  const clear = () => setParams({ q: undefined, cat: undefined, cls: undefined, price: undefined, pri: undefined, own: undefined, time: undefined })
  const toggleClass = (c: ItemClass) => {
    const next = classes.includes(c) ? classes.filter((x) => x !== c) : [...classes, c]
    setParams({ cls: next.join(',') || undefined }, true)
  }

  const grouped = sort === 'category' && !cat

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-muted">{cat ? `${CATEGORY_BY_ID[cat].index} · Catalog` : 'Catalog'}</p>
          <h1 className="display mt-2 text-[2.25rem] text-ink sm:text-[2.75rem]">{cat ? CATEGORY_BY_ID[cat].name : 'Everything worth considering'}</h1>
          <p className="pretty mt-2 text-ink-2">
            {cat
              ? CATEGORY_BY_ID[cat].blurb
              : 'Every item starts from the problem it solves. Mark what you own, set aside what you don’t need, and the scores re-rank around you.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={ListChecks} onClick={() => navigate('triage')}>
            Quick inventory
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            Add item
          </Button>
        </div>
      </div>

      {/* Toolbar: one row of filters above everything they scope */}
      <div className="sticky top-14 z-30 -mx-4 mt-8 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <label htmlFor="catalog-search" className="sr-only">
              Search the catalog
            </label>
            <input
              id="catalog-search"
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => setParams({ q: e.target.value || undefined }, true)}
              onKeyDown={(e) => e.key === 'Escape' && (e.currentTarget.blur(), setParams({ q: undefined }, true))}
              placeholder="Search problems, items, tags"
              className="h-10 w-full rounded-[10px] border border-line-strong bg-surface pr-9 pl-9 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[0.6875rem] text-muted sm:block">/</kbd>
          </div>
          <Segmented<Own>
            label="Ownership"
            value={own}
            onChange={(v) => setParams({ own: v === 'all' ? undefined : v }, true)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Not owned' },
              { value: 'have', label: 'Owned' },
            ]}
          />
          <label htmlFor="catalog-sort" className="sr-only">
            Sort
          </label>
          <Select id="catalog-sort" value={sort} onChange={(e) => setParams({ sort: e.target.value === 'score' ? undefined : e.target.value }, true)} className="w-auto!">
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button icon={SlidersHorizontal} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} aria-controls="more-filters">
            Filters{activeCount ? ` · ${activeCount}` : ''}
          </Button>
        </div>

        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Item class">
          {CLASSES.map((c) => (
            <Chip key={c} active={classes.includes(c)} onClick={() => toggleClass(c)} title={CLASS_META[c].blurb}>
              <ClassMark value={c} withLabel={false} className={classes.includes(c) ? '[&_span]:!text-on-ink' : ''} />
              {CLASS_META[c].label}
            </Chip>
          ))}
        </div>

        {showFilters && (
          <div id="more-filters" className="animate-rise mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect label="Category" value={cat} onChange={(v) => setParams({ cat: v || undefined }, true)} options={CATEGORIES.map((c) => ({ value: c.id, label: `${c.index} ${c.name}` }))} />
            <FilterSelect label="Price" value={price} onChange={(v) => setParams({ price: v || undefined }, true)} options={PRICE_BANDS.map((b) => ({ value: b.id, label: b.label }))} />
            <FilterSelect label="Priority" value={pri} onChange={(v) => setParams({ pri: v || undefined }, true)} options={PRIORITY_TIERS.map((p) => ({ value: p, label: PRIORITY_META[p].label }))} />
            <FilterSelect
              label="Timing"
              value={timing === 'all' ? '' : timing}
              onChange={(v) => setParams({ time: v || undefined }, true)}
              options={[
                { value: 'now', label: 'Buy now (undecided or wishlist)' },
                { value: 'future', label: `Future (deferred or ${FUTURE_DAYS}+ days out)` },
              ]}
            />
          </div>
        )}
      </div>

      <div className="mt-5 mb-4 flex items-center justify-between gap-3 text-[0.8125rem] text-muted">
        <p aria-live="polite">
          {num(results.length)} of {num(model.evals.length)} items
        </p>
        {activeCount > 0 && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
            <X aria-hidden className="size-3.5" /> Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <Empty
          icon={SearchX}
          title="Nothing matches"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={clear}>Clear filters</Button>
              <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
                Add it yourself
              </Button>
            </div>
          }
        >
          {q ? `No item mentions “${q}” with these filters. ` : ''}Loosen a filter, or add the item to your catalog if it’s missing.
        </Empty>
      ) : grouped ? (
        CATEGORIES.map((c) => {
          const items = results.filter((e) => e.item.category === c.id)
          if (!items.length) return null
          return (
            <section key={c.id} aria-labelledby={`cat-${c.id}`} className="mb-10">
              <div className="mb-4 flex items-baseline gap-3 border-b border-line pb-2">
                <span className="font-mono text-xs text-accent-text">{c.index}</span>
                <h2 id={`cat-${c.id}`} className="display text-[1.5rem] text-ink">
                  {c.name}
                </h2>
                <span className="hidden truncate text-[0.8125rem] text-muted sm:inline">{c.blurb}</span>
              </div>
              <Grid items={items} />
            </section>
          )
        })
      ) : (
        <Grid items={results} />
      )}

      <ItemFormDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

function Grid({ items }: { items: ItemEval[] }) {
  return (
    <ul className={cx('grid gap-3 sm:grid-cols-2 xl:grid-cols-3')}>
      {items.map((e) => (
        <li key={e.item.id}>
          <ItemCard e={e} />
        </li>
      ))}
    </ul>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = `filter-${label.toLowerCase()}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
