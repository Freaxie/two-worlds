import { useState } from 'react'
import { Save } from 'lucide-react'
import type { CatalogItem, CategoryId, Frequency, GoalId, ItemClass, TierId } from '../domain/types'
import { CATEGORIES, CLASS_META, CLASSES, FREQUENCIES, FREQUENCY_META, GOALS, TIER_META, TIERS } from '../domain/taxonomy'
import { SEED_IDS } from '../data/catalog'
import { openItem } from '../lib/router'
import { catalogItem, catalogItemProblems } from '../state/validation'
import { dispatch, useModel } from '../state/store'
import { Dialog, toast } from '../components/overlay'
import { Button, Field, Input, Select, Textarea } from '../components/ui'

type TierDraft = { on: boolean; min: string; max: string; quality: string; note: string }

const QUALITY_DEFAULT: Record<TierId, string> = { budget: '0.85', standard: '1', premium: '1.04' }

function draftFrom(item?: CatalogItem) {
  const tiers = Object.fromEntries(
    TIERS.map((t) => {
      const x = item?.tiers[t]
      return [t, { on: !!x || t === 'standard', min: x ? String(x.priceMin) : '', max: x ? String(x.priceMax) : '', quality: x ? String(x.quality) : QUALITY_DEFAULT[t], note: x?.note ?? '' }]
    }),
  ) as Record<TierId, TierDraft>
  return {
    name: item?.name ?? '',
    category: (item?.category ?? 'daily') as CategoryId,
    class: (item?.class ?? 'useful') as ItemClass,
    problem: item?.problem ?? '',
    value: item?.value ?? '',
    buyIf: item?.buyIf ?? '',
    alternative: item?.alternative ?? '',
    situational: item?.situational ?? '',
    frequency: (item?.frequency ?? 'daily') as Frequency,
    severity: String(item?.severity ?? 3),
    minutesSaved: String(item?.minutesSaved ?? 0),
    lifespanYears: String(item?.lifespanYears ?? 3),
    runningCost: String(item?.runningCost ?? 0),
    monthlySavings: String(item?.monthlySavings ?? 0),
    impacts: Object.fromEntries(GOALS.map((g) => [g.id, String(item?.impacts[g.id] ?? 0)])) as Record<GoalId, string>,
    lookFor: (item?.lookFor ?? []).join('\n'),
    tiers,
  }
}

type Draft = ReturnType<typeof draftFrom>

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'item'

export function ItemFormDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item?: CatalogItem }) {
  return (
    <Dialog open={open} onClose={onClose} title={item ? `Edit ${item.name}` : 'Add an item to your catalog'}>
      {open && <ItemForm item={item} onDone={onClose} />}
    </Dialog>
  )
}

function ItemForm({ item, onDone }: { item?: CatalogItem; onDone: () => void }) {
  const model = useModel()
  const [d, setD] = useState<Draft>(() => draftFrom(item))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const setTier = (t: TierId, p: Partial<TierDraft>) => setD((x) => ({ ...x, tiers: { ...x.tiers, [t]: { ...x.tiers[t], ...p } } }))

  const build = () => {
    const errs: Record<string, string> = {}
    const n = (v: string, k: string, lo: number, hi: number, label: string) => {
      const x = Number(v)
      if (v.trim() === '' || !Number.isFinite(x) || x < lo || x > hi) errs[k] = `${label} must be between ${lo} and ${hi.toLocaleString('en-IN')}.`
      return x
    }
    const tiers: Partial<CatalogItem['tiers']> = {}
    for (const t of TIERS) {
      const td = d.tiers[t]
      if (!td.on) continue
      const min = n(td.min, `${t}.min`, 0, 10_000_000, 'Price')
      const max = n(td.max, `${t}.max`, 0, 10_000_000, 'Price')
      const quality = n(td.quality, `${t}.quality`, 0.3, 1.5, 'Quality')
      if (!errs[`${t}.min`] && !errs[`${t}.max`] && min > max) errs[`${t}.max`] = 'The high end must be at least the low end.'
      tiers[t] = { priceMin: min, priceMax: max, quality, note: td.note.trim() }
    }
    const impacts: CatalogItem['impacts'] = {}
    for (const g of GOALS) {
      const v = Number(d.impacts[g.id])
      if (v > 0) impacts[g.id] = v as 1 | 2 | 3
    }
    let id = item?.id ?? slug(d.name)
    if (!item) {
      let i = 2
      const taken = new Set(model.catalog.map((c) => c.id))
      const base = id
      while (taken.has(id) || SEED_IDS.has(id)) id = `${base}-${i++}`
    }
    const candidate = {
      ...(item ?? {}),
      id,
      name: d.name.trim(),
      category: d.category,
      class: d.class,
      problem: d.problem.trim(),
      value: d.value.trim(),
      buyIf: d.buyIf.trim(),
      alternative: d.alternative.trim(),
      situational: d.situational.trim() || undefined,
      frequency: d.frequency,
      severity: n(d.severity, 'severity', 1, 5, 'Severity'),
      minutesSaved: n(d.minutesSaved, 'minutesSaved', 0, 10080, 'Minutes saved'),
      lifespanYears: n(d.lifespanYears, 'lifespanYears', 0.25, 50, 'Lifespan'),
      runningCost: n(d.runningCost, 'runningCost', 0, 10_000_000, 'Running cost'),
      monthlySavings: n(d.monthlySavings, 'monthlySavings', 0, 10_000_000, 'Monthly savings'),
      impacts,
      tiers: tiers as CatalogItem['tiers'],
      lookFor: d.lookFor.split('\n').map((l) => l.trim()).filter(Boolean),
    }
    if (d.name.trim().length < 2) errs.name = 'Give it a name.'
    if (d.problem.trim().length < 5) errs.problem = 'Describe the problem it solves; every recommendation starts there.'
    if (!d.tiers.standard.on) errs['standard.min'] = 'A standard tier is required.'
    if (!Object.keys(errs).length) for (const p of catalogItemProblems(candidate)) errs.form = p
    setErrors(errs)
    return Object.keys(errs).length ? null : candidate
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const c = build()
    if (!c) return
    if (item && SEED_IDS.has(item.id)) {
      const parsed = catalogItem(c)
      if (!parsed) return setErrors({ form: 'Something in the form is invalid.' })
      const { id: _id, custom: _custom, ...patch } = parsed
      dispatch({ type: 'catalog/override', id: item.id, patch })
      toast('Catalog entry updated')
    } else {
      const parsed = catalogItem(c)
      if (!parsed) return setErrors({ form: 'Something in the form is invalid.' })
      dispatch({ type: 'catalog/custom', item: parsed })
      toast(item ? 'Item updated' : `${parsed.name} added to your catalog`)
      if (!item) openItem(parsed.id)
    }
    onDone()
  }

  const err = (k: string) => errors[k]

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6 px-5 py-5 sm:px-7">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-3 text-muted">The item</legend>
        <Field label="Name" error={err('name')} className="sm:col-span-2">
          {(id, db) => <Input id={id} data-autofocus value={d.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!err('name')} aria-describedby={db} maxLength={120} />}
        </Field>
        <Field label="Category">
          {(id) => (
            <Select id={id} value={d.category} onChange={(e) => set('category', e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Class" hint={CLASS_META[d.class].blurb}>
          {(id, db) => (
            <Select id={id} aria-describedby={db} value={d.class} onChange={(e) => set('class', e.target.value as ItemClass)}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {CLASS_META[c].label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="The problem it solves" error={err('problem')} className="sm:col-span-2">
          {(id, db) => <Textarea id={id} value={d.problem} onChange={(e) => set('problem', e.target.value)} aria-invalid={!!err('problem')} aria-describedby={db} maxLength={600} />}
        </Field>
        <Field label="When it’s high value" className="sm:col-span-2">
          {(id) => <Input id={id} value={d.value} onChange={(e) => set('value', e.target.value)} maxLength={600} />}
        </Field>
        <Field label="Buy if…">
          {(id) => <Input id={id} value={d.buyIf} onChange={(e) => set('buyIf', e.target.value)} maxLength={600} />}
        </Field>
        <Field label="Cheaper alternative">
          {(id) => <Input id={id} value={d.alternative} onChange={(e) => set('alternative', e.target.value)} maxLength={600} />}
        </Field>
        <Field label="Only worth it if (optional)" hint="Makes it situational until you confirm it applies" className="sm:col-span-2">
          {(id, db) => <Input id={id} aria-describedby={db} value={d.situational} onChange={(e) => set('situational', e.target.value)} maxLength={600} />}
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <legend className="eyebrow mb-3 text-muted">Scoring inputs</legend>
        <Field label="Used">
          {(id) => (
            <Select id={id} value={d.frequency} onChange={(e) => set('frequency', e.target.value as Frequency)}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_META[f].short}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Severity (1–5)" error={err('severity')}>
          {(id, db) => (
            <Select id={id} aria-describedby={db} value={d.severity} onChange={(e) => set('severity', e.target.value)}>
              {['1', '2', '3', '4', '5'].map((s) => (
                <option key={s} value={s}>
                  {s} {['', '— minor annoyance', '', '— real problem', '', '— serious'][Number(s)]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <NumField label="Minutes saved / week" k="minutesSaved" d={d} set={set} err={err} />
        <NumField label="Lifespan (years)" k="lifespanYears" d={d} set={set} err={err} />
        <NumField label="Running cost ₹ / year" k="runningCost" d={d} set={set} err={err} />
        <NumField label="Saves ₹ / month" k="monthlySavings" d={d} set={set} err={err} />
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3 text-muted">Which goals it serves</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GOALS.map((g) => (
            <Field key={g.id} label={g.short}>
              {(id) => (
                <Select id={id} value={d.impacts[g.id]} onChange={(e) => set('impacts', { ...d.impacts, [g.id]: e.target.value })}>
                  <option value="0">None</option>
                  <option value="1">A little</option>
                  <option value="2">Clearly</option>
                  <option value="3">A lot</option>
                </Select>
              )}
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="eyebrow mb-3 text-muted">Price tiers (₹, estimates)</legend>
        {TIERS.map((t) => {
          const td = d.tiers[t]
          return (
            <div key={t} className="rounded-[12px] border border-line p-3.5">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input type="checkbox" checked={td.on} disabled={t === 'standard'} onChange={(e) => setTier(t, { on: e.target.checked })} className="size-4 accent-[var(--ink)]" />
                {TIER_META[t].label}
                {t === 'standard' && <span className="text-xs font-normal text-muted">(required)</span>}
              </label>
              {td.on && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <Field label="From" error={err(`${t}.min`)}>
                    {(id, db) => <Input id={id} inputMode="numeric" value={td.min} onChange={(e) => setTier(t, { min: e.target.value })} aria-invalid={!!err(`${t}.min`)} aria-describedby={db} />}
                  </Field>
                  <Field label="To" error={err(`${t}.max`)}>
                    {(id, db) => <Input id={id} inputMode="numeric" value={td.max} onChange={(e) => setTier(t, { max: e.target.value })} aria-invalid={!!err(`${t}.max`)} aria-describedby={db} />}
                  </Field>
                  <Field label="Quality" hint="vs standard = 1" error={err(`${t}.quality`)}>
                    {(id, db) => <Input id={id} inputMode="decimal" value={td.quality} onChange={(e) => setTier(t, { quality: e.target.value })} aria-invalid={!!err(`${t}.quality`)} aria-describedby={db} />}
                  </Field>
                  <Field label="What this tier gets you" className="col-span-3">
                    {(id) => <Input id={id} value={td.note} onChange={(e) => setTier(t, { note: e.target.value })} maxLength={300} />}
                  </Field>
                </div>
              )}
            </div>
          )
        })}
      </fieldset>

      <Field label="What to look for (one per line)">
        {(id) => <Textarea id={id} value={d.lookFor} onChange={(e) => set('lookFor', e.target.value)} />}
      </Field>

      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-[10px] bg-bad/8 px-3 py-2 text-sm text-bad">
          {errors.form ?? 'Fix the highlighted fields to save.'}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" icon={Save}>
          {item ? 'Save changes' : 'Add to catalog'}
        </Button>
      </div>
    </form>
  )
}

function NumField({
  label,
  k,
  d,
  set,
  err,
}: {
  label: string
  k: 'minutesSaved' | 'lifespanYears' | 'runningCost' | 'monthlySavings'
  d: Draft
  set: <K extends keyof Draft>(k: K, v: Draft[K]) => void
  err: (k: string) => string | undefined
}) {
  return (
    <Field label={label} error={err(k)}>
      {(id, db) => <Input id={id} inputMode="decimal" value={d[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!err(k)} aria-describedby={db} />}
    </Field>
  )
}
