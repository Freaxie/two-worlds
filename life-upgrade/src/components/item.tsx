import { useState, useSyncExternalStore } from 'react'
import { Bookmark, BookmarkCheck, Check, MoreHorizontal, ShoppingBag } from 'lucide-react'
import type { TierId } from '../domain/types'
import { CATEGORY_BY_ID, FREQUENCY_META, GOAL_BY_ID, PRIORITY_META, TIER_META, TIERS } from '../domain/taxonomy'
import type { ItemEval } from '../engine/scoring'
import { cx, date, inr, months } from '../lib/format'
import { openItem } from '../lib/router'
import { setStatus } from '../state/actions'
import { todayISO } from '../state/defaults'
import { useModel } from '../state/store'
import { CategoryGlyph, ClassMark, PriceTag, ScoreRing, StatusBadge, VerdictPill } from './marks'
import { Dialog } from './overlay'
import { Button, Field, IconButton, Input, Select } from './ui'

/* ---------- Catalogue card ---------- */

export function ItemCard({ e, rank }: { e: ItemEval; rank?: number }) {
  const cat = CATEGORY_BY_ID[e.item.category]
  return (
    <article className="card group relative flex h-full flex-col p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-line-strong hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow truncate pt-0.5 text-muted">
          {rank !== undefined ? `No. ${rank} · ` : `${cat.index} · `}
          {cat.name}
        </p>
        <ScoreRing score={e.score} size={40} />
      </div>
      <div className="mt-1 flex items-start gap-3">
        <CategoryGlyph id={e.item.category} size="sm" />
        <h3 className="display min-w-0 pt-0.5 text-[1.1875rem] leading-tight text-ink">
          <button type="button" onClick={() => openItem(e.item.id)} className="text-left after:absolute after:inset-0 after:rounded-[14px] focus-visible:outline-none">
            {e.item.name}
          </button>
        </h3>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <ClassMark value={e.item.class} />
        <span className="text-xs text-muted">{FREQUENCY_META[e.item.frequency].short}</span>
        {e.item.situational && <span className="text-xs text-muted">· Situational</span>}
        <StatusBadge status={e.state.status} />
      </div>
      <p className="pretty mt-2.5 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-2">{e.item.problem}</p>
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <PriceTag tier={e.current} />
          <VerdictPill verdict={e.verdict} />
        </div>
        <QuickActions e={e} className="relative z-[1] mt-3 border-t border-line pt-3" />
      </div>
    </article>
  )
}

/* ---------- Quick actions used on cards and lists ---------- */

export function QuickActions({ e, className, compact = false }: { e: ItemEval; className?: string; compact?: boolean }) {
  const s = e.state.status
  const name = e.item.name
  return (
    <div className={cx('flex items-center gap-1.5', className)}>
      <Button
        size="sm"
        variant={s === 'wishlist' ? 'primary' : 'secondary'}
        icon={s === 'wishlist' ? BookmarkCheck : Bookmark}
        aria-pressed={s === 'wishlist'}
        onClick={() => setStatus(e.item.id, 'wishlist', name)}
      >
        {compact ? <span className="sr-only">Wishlist</span> : 'Wishlist'}
      </Button>
      <Button size="sm" variant={s === 'owned' ? 'primary' : 'secondary'} icon={Check} aria-pressed={s === 'owned'} onClick={() => setStatus(e.item.id, 'owned', name)}>
        {compact ? <span className="sr-only">Own it</span> : 'Own it'}
      </Button>
      {!compact && s !== 'purchased' && (
        <Button size="sm" variant="ghost" icon={ShoppingBag} onClick={() => requestPurchase(e.item.id)} className="hidden xs:inline-flex">
          Bought
        </Button>
      )}
      <IconButton icon={MoreHorizontal} label={`More options for ${name}`} size="sm" className="ml-auto" onClick={() => openItem(e.item.id)} />
    </div>
  )
}

/* ---------- The reasoning card: why, in the order a person would ask ---------- */

export function Reasoning({ e, dense = false }: { e: ItemEval; dense?: boolean }) {
  const top = e.goal.parts[0]
  const priority = PRIORITY_META[e.priority].label
  const priorityWhy = e.manual
    ? `You set this manually${e.engineScore !== e.score ? ` (the engine said ${e.engineScore})` : ''}.`
    : top
      ? `${GOAL_BY_ID[top.goal].short} is weighted ${top.weight}/5 and this helps it ${['', 'a little', 'clearly', 'a lot'][top.impact]}.${
          e.coveredBy.length || e.state.hasAlternative ? ' Discounted because something you own already covers it.' : ''
        }`
      : 'It doesn’t serve any goal you’ve weighted.'
  const rows: [string, React.ReactNode][] = [
    ['Problem', e.item.problem],
    ['Frequency', FREQUENCY_META[e.item.frequency].label],
    [
      'Cost',
      <>
        <PriceTag tier={e.current} /> <span className="text-muted">· {TIER_META[e.tier].label.toLowerCase()} tier</span>
        {e.current.annualCost > 0 && (
          <span className="block text-[0.8125rem] text-muted">
            About {inr(e.current.annualCost)} a year to own{e.item.runningCost ? `, including ${inr(e.item.runningCost)} of refills and parts` : ''}.
            {e.paybackMonths && e.paybackMonths < 36 ? ` Estimated to pay for itself in ${months(e.paybackMonths)}.` : ''}
          </span>
        )}
      </>,
    ],
    ['Value', e.item.value],
    ['Priority', `${priority}: ${priorityWhy}`],
    ['Alternative', e.item.alternative],
  ]
  if (e.item.situational) rows.splice(4, 0, ['Applies if', e.item.situational])
  return (
    <dl className={cx('grid gap-x-5', dense ? 'gap-y-2' : 'gap-y-3', 'grid-cols-[5.75rem_minmax(0,1fr)]')}>
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="eyebrow pt-[0.2rem] text-muted">{k}</dt>
          <dd className="pretty m-0 text-sm leading-relaxed text-ink">{v}</dd>
        </div>
      ))}
      <div className="contents">
        <dt className="eyebrow pt-[0.35rem] text-muted">Verdict</dt>
        <dd className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-ink">
          <VerdictPill verdict={e.verdict} />
          <span className="pretty">{e.verdict.reason}</span>
        </dd>
      </div>
    </dl>
  )
}

/* ---------- Purchase dialog, opened from anywhere ---------- */

let purchaseTarget: string | null = null
const purchaseListeners = new Set<() => void>()
export function requestPurchase(id: string) {
  purchaseTarget = id
  purchaseListeners.forEach((l) => l())
}
function closePurchase() {
  purchaseTarget = null
  purchaseListeners.forEach((l) => l())
}

export function PurchaseDialog() {
  const id = useSyncExternalStore(
    (l) => (purchaseListeners.add(l), () => purchaseListeners.delete(l)),
    () => purchaseTarget,
  )
  const model = useModel()
  const e = id ? model.evalById.get(id) : undefined
  return (
    <Dialog open={!!e} onClose={closePurchase} variant="modal" title="Record a purchase">
      {e && <PurchaseForm key={e.item.id} e={e} />}
    </Dialog>
  )
}

function PurchaseForm({ e }: { e: ItemEval }) {
  const [tier, setTier] = useState<TierId>(e.tier)
  const t = e.tiers[tier]!
  const [price, setPrice] = useState(String(t.verified?.price ?? t.price))
  const [when, setWhen] = useState(todayISO())
  const [touched, setTouched] = useState(false)
  const amount = Number(price)
  const priceError = !price.trim() || !Number.isFinite(amount) || amount <= 0 ? 'Enter what you paid, in rupees.' : amount > 10_000_000 ? 'That looks too large.' : undefined
  const dateError = !/^\d{4}-\d{2}-\d{2}$/.test(when) ? 'Pick a date.' : when > todayISO() ? 'The purchase date can’t be in the future.' : undefined
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    setTouched(true)
    if (priceError || dateError) return
    setStatus(e.item.id, 'purchased', e.item.name, { price: Math.round(amount), date: when, tier })
    closePurchase()
  }
  const tiers = TIERS.filter((x) => e.tiers[x])
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5">
      <div>
        <p className="display text-xl text-ink">{e.item.name}</p>
        <p className="mt-1 text-[0.8125rem] text-muted">
          Counts against your budget from {date(when)}. You can rate how it turned out on the Impact page.
        </p>
      </div>
      {tiers.length > 1 && (
        <Field label="Which tier did you buy?">
          {(fid) => (
            <Select id={fid} value={tier} onChange={(ev) => setTier(ev.target.value as TierId)}>
              {tiers.map((x) => (
                <option key={x} value={x}>
                  {TIER_META[x].label}: {e.item.tiers[x]!.note}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price paid (₹)" error={touched ? priceError : undefined}>
          {(fid, d) => <Input id={fid} data-autofocus inputMode="numeric" value={price} onChange={(ev) => setPrice(ev.target.value.replace(/[^\d.]/g, ''))} aria-invalid={touched && !!priceError} aria-describedby={d} />}
        </Field>
        <Field label="Date" error={touched ? dateError : undefined}>
          {(fid, d) => <Input id={fid} type="date" max={todayISO()} value={when} onChange={(ev) => setWhen(ev.target.value)} aria-invalid={touched && !!dateError} aria-describedby={d} />}
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={closePurchase}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" icon={ShoppingBag}>
          Mark as purchased
        </Button>
      </div>
    </form>
  )
}
