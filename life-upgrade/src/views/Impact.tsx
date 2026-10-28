import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { CATEGORY_BY_ID, USAGE_META } from '../domain/taxonomy'
import { purchaseOutcomes, satisfaction } from '../engine/learning'
import type { ItemEval } from '../engine/scoring'
import { cx, date, inr, plural } from '../lib/format'
import { href, openItem } from '../lib/router'
import { useModel } from '../state/store'
import { ReviewForm } from '../components/ReviewForm'
import { Button, Empty, Stat } from '../components/ui'

export function Impact() {
  const model = useModel()
  const purchased = model.evals.filter((e) => e.state.status === 'purchased')
  const unrated = purchased.filter((e) => !e.state.review)
  const { all, best, mistakes } = purchaseOutcomes(model.catalog, Object.fromEntries(model.evals.map((e) => [e.item.id, e.state])))
  const learned = Object.entries(model.learning).filter(([, l]) => l && l.adjustment !== 0)
  const avg = all.length ? all.reduce((s, o) => s + o.satisfaction, 0) / all.length : 0
  const total = purchased.reduce((s, e) => s + (e.state.purchase?.price ?? 0), 0)

  return (
    <div className="animate-rise">
      <div className="max-w-2xl">
        <p className="eyebrow text-muted">Purchase impact</p>
        <h1 className="display mt-2 text-[2.25rem] text-ink sm:text-[2.75rem]">Did it actually help?</h1>
        <p className="pretty mt-2 text-ink-2">
          Rate what you bought once you’ve lived with it. Ratings adjust future scores in the same category, so the engine learns what works for you.
        </p>
      </div>

      {purchased.length === 0 ? (
        <div className="mt-10">
          <Empty
            icon={ShoppingBag}
            title="Nothing purchased yet"
            action={
              <a href={href('overview')} className="inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-sm font-medium text-on-ink">
                See what to buy first
              </a>
            }
          >
            When you mark something as purchased, it shows up here. Come back after a couple of weeks of use to rate it.
          </Empty>
        </div>
      ) : (
        <>
          <div className="card mt-8 grid grid-cols-2 gap-6 p-5 sm:grid-cols-4 sm:p-6">
            <Stat label="Purchases" value={purchased.length} />
            <Stat label="Spent" value={inr(total)} />
            <Stat label="Rated" value={`${all.length} of ${purchased.length}`} />
            <Stat label="Average satisfaction" value={all.length ? `${Math.round(avg * 100)}%` : '—'} />
          </div>

          {unrated.length > 0 && (
            <section aria-labelledby="unrated-h" className="mt-12">
              <h2 id="unrated-h" className="display text-[1.5rem] text-ink">
                Waiting for your verdict
              </h2>
              <p className="mt-1 mb-5 text-[0.8125rem] text-muted">Four quick questions per purchase.</p>
              <ul className="grid gap-4 lg:grid-cols-2">
                {unrated.map((e) => (
                  <li key={e.item.id} className="card p-5">
                    <PurchaseHead e={e} />
                    <div className="mt-4 border-t border-line pt-4">
                      <ReviewForm e={e} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {all.length > 0 && (
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <section aria-labelledby="best-h">
                <h2 id="best-h" className="display text-[1.5rem] text-ink">
                  Your most valuable purchases
                </h2>
                <p className="mt-1 mb-4 text-[0.8125rem] text-muted">Highest satisfaction, then lowest cost per use.</p>
                {best.length ? (
                  <ul className="flex flex-col gap-2">
                    {best.slice(0, 6).map((o) => (
                      <li key={o.item.id} className="card flex items-center gap-4 p-3.5">
                        <SatBar value={o.satisfaction} />
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => openItem(o.item.id)} className="truncate text-left text-sm font-medium text-ink hover:underline">
                            {o.item.name}
                          </button>
                          <p className="text-xs text-muted">
                            {inr(o.price)}
                            {o.costPerUse !== undefined && ` · about ${o.costPerUse < 10 ? `₹${o.costPerUse.toFixed(1)}` : inr(o.costPerUse)} per use so far`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-[12px] border border-dashed border-line-strong px-4 py-5 text-sm text-ink-2">No purchase has rated well yet.</p>
                )}
              </section>
              <section aria-labelledby="worst-h">
                <h2 id="worst-h" className="display text-[1.5rem] text-ink">
                  Biggest purchasing mistakes
                </h2>
                <p className="mt-1 mb-4 text-[0.8125rem] text-muted">Ranked by money spent on disappointment: price × (1 − satisfaction).</p>
                {mistakes.length ? (
                  <ul className="flex flex-col gap-2">
                    {mistakes.slice(0, 6).map((o) => (
                      <li key={o.item.id} className="card flex items-center gap-4 p-3.5">
                        <SatBar value={o.satisfaction} />
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => openItem(o.item.id)} className="truncate text-left text-sm font-medium text-ink hover:underline">
                            {o.item.name}
                          </button>
                          <p className="text-xs text-muted">
                            {inr(o.regret)} of {inr(o.price)} wasted · {o.state.review!.solved === 'no' ? 'didn’t solve the problem' : `used ${USAGE_META[o.state.review!.usage].label.toLowerCase()}`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-[12px] border border-dashed border-line-strong px-4 py-5 text-sm text-ink-2">No regrets so far. Every rated purchase is pulling its weight.</p>
                )}
              </section>
            </div>
          )}

          <section aria-labelledby="learn-h" className="mt-12">
            <h2 id="learn-h" className="display text-[1.5rem] text-ink">
              What the engine learned
            </h2>
            {learned.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {learned.map(([cat, l]) => (
                  <li key={cat} className="card flex items-center justify-between gap-3 p-3.5 text-sm">
                    <span className="text-ink">{CATEGORY_BY_ID[cat as keyof typeof CATEGORY_BY_ID].name}</span>
                    <span className={cx('num font-medium', l!.adjustment > 0 ? 'text-good' : 'text-bad')}>
                      {l!.adjustment > 0 ? '+' : ''}
                      {l!.adjustment} points
                      <span className="ml-2 font-normal text-muted">from {plural(l!.count, 'rating')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-2">
                Nothing yet. Ratings that are clearly better or worse than expected nudge future scores in that category, by up to +8 or −10 points.
              </p>
            )}
          </section>

          {all.length > 0 && (
            <section aria-labelledby="all-h" className="mt-12">
              <h2 id="all-h" className="display mb-4 text-[1.5rem] text-ink">
                Every rated purchase
              </h2>
              <ul className="flex flex-col gap-2">
                {all.map((o) => {
                  const e = model.evalById.get(o.item.id)!
                  return <RatedRow key={o.item.id} e={e} />
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function PurchaseHead({ e }: { e: ItemEval }) {
  const p = e.state.purchase!
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <button type="button" onClick={() => openItem(e.item.id)} className="text-left font-medium text-ink hover:underline">
          {e.item.name}
        </button>
        <p className="text-xs text-muted">
          {inr(p.price)} · bought {date(p.date)}
        </p>
      </div>
    </div>
  )
}

function RatedRow({ e }: { e: ItemEval }) {
  const [open, setOpen] = useState(false)
  const s = satisfaction(e.state.review!)
  return (
    <li className="card p-3.5">
      <div className="flex items-center gap-4">
        <SatBar value={s} />
        <div className="min-w-0 flex-1">
          <PurchaseHead e={e} />
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Close' : 'Edit rating'}
        </Button>
      </div>
      {open && (
        <div className="mt-4 border-t border-line pt-4">
          <ReviewForm e={e} onSaved={() => setOpen(false)} />
        </div>
      )}
    </li>
  )
}

function SatBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <span className="flex w-14 shrink-0 flex-col items-start gap-1" role="img" aria-label={`${pct}% satisfied`}>
      <span className="text-sm font-semibold text-ink">{pct}%</span>
      <span className="h-1 w-full overflow-hidden rounded-full bg-inset" aria-hidden>
        <span className={cx('block h-full rounded-full', value >= 0.6 ? 'bg-good' : value >= 0.4 ? 'bg-warn' : 'bg-bad')} style={{ width: `${pct}%` }} />
      </span>
    </span>
  )
}
