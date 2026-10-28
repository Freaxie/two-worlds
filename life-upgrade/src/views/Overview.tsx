import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Bookmark, BookmarkCheck, Check, ListChecks, Pencil, ShoppingBag, X } from 'lucide-react'
import { CATEGORY_BY_ID } from '../domain/taxonomy'
import { bestNext, buyOnce, categoryOpportunities, coverage, postpone, recurringProblems, savings, topPurchases } from '../engine/insights'
import { planPurchases } from '../engine/planner'
import type { ItemEval } from '../engine/scoring'
import { cx, inr, num, plural } from '../lib/format'
import { useFlip } from '../lib/hooks'
import { href, navigate, openItem } from '../lib/router'
import { setStatus } from '../state/actions'
import { dispatch, useAppState, useModel } from '../state/store'
import { BudgetMeter, OpportunityChart } from '../components/charts'
import { requestPurchase, Reasoning } from '../components/item'
import { ClassMark, PriceTag, ScoreRing, VerdictPill } from '../components/marks'
import { BudgetEditor, GoalsPanel } from '../components/panels'
import { Button, Empty, IconButton, Stat } from '../components/ui'

export function Overview() {
  const model = useModel()
  const state = useAppState()
  const next = bestNext(model)
  const plan = useMemo(
    () => planPurchases(model.evals, 'balanced', { budget: Math.max(0, model.budget.remaining), floor: state.settings.valueFloor, includeLuxury: false }),
    [model, state.settings.valueFloor],
  )
  const top = topPurchases(model)
  const touched = Object.keys(state.items).length

  return (
    <div className="animate-rise">
      <Hero next={next} />

      {!state.settings.inventoryDone && touched < 8 && (
        <div className="mt-8 flex flex-col gap-4 rounded-[14px] border border-line-strong bg-surface p-5 sm:flex-row sm:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink">
            <ListChecks aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <p className="font-medium text-ink">Start by telling it what you already own</p>
            <p className="pretty mt-0.5 text-sm text-ink-2">
              Nothing is assumed. A two-minute pass through the catalog (own it, want it, later, don’t need it) makes every recommendation here specific to you.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate('triage')}>
              Quick inventory
            </Button>
            <IconButton icon={X} label="Dismiss" onClick={() => dispatch({ type: 'settings/patch', patch: { inventoryDone: true } })} />
          </div>
        </div>
      )}

      <section aria-labelledby="q-heading" className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
          <h2 id="q-heading" className="display text-[1.75rem] text-ink sm:text-[2rem]">
            Six questions, answered
          </h2>
          <p className="hidden text-[0.8125rem] text-muted sm:block">Everything updates as you mark items and change priorities.</p>
        </div>

        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Question n="01" title="Your five highest-value purchases" more={<a href={href('catalog', { sort: 'score' })}>Full ranking</a>}>
            <TopFive items={top} />
          </Question>
          <div className="card p-5 lg:mt-11">
            <GoalsPanel compact />
          </div>

          <Question n="02" title="The biggest recurring problems">
            {recurringProblems(model).length ? (
              <ul className="flex flex-col divide-y divide-line">
                {recurringProblems(model).map((e) => (
                  <li key={e.item.id} className="py-3 first:pt-0">
                    <p className="pretty text-sm text-ink">{e.item.problem}</p>
                    <button type="button" onClick={() => openItem(e.item.id)} className="mt-1.5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent-text hover:underline">
                      Fix: {e.item.name}
                      <ArrowRight aria-hidden className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Quiet>No frequent, serious problems left unsolved. Nicely done.</Quiet>
            )}
          </Question>

          <Question n="03" title={`What ${inr(Math.max(0, model.budget.remaining))} should buy`} more={<a href={href('plan')}>Open the planner</a>}>
            {plan.lines.length ? (
              <>
                <p className="pretty text-sm text-ink-2">
                  {plural(plan.lines.length, 'purchase')} for {inr(plan.total)}, capturing {Math.round(plan.share * 100)}% of the value available.{' '}
                  {plan.leftover > 0 ? (
                    <span className="text-ink">Keep {inr(plan.leftover)}: nothing else clears your value bar.</span>
                  ) : null}
                </p>
                <ol className="mt-3 flex flex-col gap-1.5">
                  {plan.lines.slice(0, 6).map((l, i) => (
                    <li key={l.id} className="flex items-baseline gap-3 text-sm">
                      <span className="num w-5 shrink-0 text-xs text-muted">{i + 1}.</span>
                      <button type="button" onClick={() => openItem(l.id)} className="min-w-0 flex-1 truncate text-left text-ink hover:underline">
                        {l.eval.item.name}
                      </button>
                      <span className="num shrink-0 text-ink-2">{inr(l.price)}</span>
                    </li>
                  ))}
                  {plan.lines.length > 6 && <li className="pl-8 text-[0.8125rem] text-muted">and {plan.lines.length - 6} more</li>}
                </ol>
              </>
            ) : model.budget.remaining <= 0 ? (
              <Quiet>Your budget is spent. Raise it, or let the next purchase wait. Waiting is a perfectly good outcome.</Quiet>
            ) : (
              <Quiet>Nothing clears your value bar right now, so the best plan is to keep the money.</Quiet>
            )}
          </Question>

          <Question n="04" title="Already covered">
            <Covered />
          </Question>

          <Question n="05" title="Don’t buy these yet">
            <Postpone />
          </Question>

          <Question n="06" title="Buy once, benefit for years">
            <ul className="flex flex-col divide-y divide-line">
              {buyOnce(model).map((e) => (
                <li key={e.item.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <ScoreRing score={e.score} size={36} />
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => openItem(e.item.id)} className="truncate text-left text-sm font-medium text-ink hover:underline">
                      {e.item.name}
                    </button>
                    <p className="text-xs text-muted">
                      Lasts ~{e.current.lifespan} years · about {inr(e.current.annualCost)} a year to own
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Question>
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="card p-5 sm:p-6">
          <OpportunityChart data={categoryOpportunities(model)} onSelect={(id) => navigate('catalog', { cat: id })} />
        </div>
        <Savings planIds={plan.lines.map((l) => l.id)} />
      </section>
    </div>
  )
}

/* ---------- Hero: the answer first ---------- */

function Hero({ next }: { next: ReturnType<typeof bestNext> }) {
  const { budget } = useModel()
  const [editing, setEditing] = useState(false)
  const e = next?.eval
  return (
    <section aria-labelledby="hero-heading" className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
      <div>
        <p className="eyebrow text-muted">Best next purchase</p>
        {e ? (
          <>
            <h1 id="hero-heading" className="display mt-3 text-[2.25rem] text-ink sm:text-[3rem] lg:text-[3.5rem]">
              Your next best purchase is <em className="text-accent-text">{article(e.item.name)}</em>.
            </h1>
            <div className="card mt-6 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <ScoreRing score={e.score} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{e.item.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[0.8125rem] text-muted">
                    <ClassMark value={e.item.class} />
                    {CATEGORY_BY_ID[e.item.category].name}
                    {!next.fits && <span className="text-warn">Over your remaining budget</span>}
                  </p>
                </div>
              </div>
              <Reasoning e={e} />
              {next.deps.length > 0 && (
                <p className="mt-4 text-[0.8125rem] text-ink-2">
                  Includes what it depends on: {next.deps.map((d) => d.item.name).join(', ')} (total about {inr(next.price)}).
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button
                  variant={e.state.status === 'wishlist' ? 'primary' : 'secondary'}
                  icon={e.state.status === 'wishlist' ? BookmarkCheck : Bookmark}
                  aria-pressed={e.state.status === 'wishlist'}
                  onClick={() => setStatus(e.item.id, 'wishlist', e.item.name)}
                >
                  {e.state.status === 'wishlist' ? 'On wishlist' : 'Add to wishlist'}
                </Button>
                <Button icon={ShoppingBag} onClick={() => requestPurchase(e.item.id)}>
                  I bought it
                </Button>
                <Button icon={Check} onClick={() => setStatus(e.item.id, 'owned', e.item.name)}>
                  Already own one
                </Button>
                <Button variant="ghost" iconRight={ArrowRight} onClick={() => openItem(e.item.id)} className="sm:ml-auto">
                  Details
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 id="hero-heading" className="display mt-3 text-[2.25rem] text-ink sm:text-[3rem]">
              Nothing left that’s worth buying.
            </h1>
            <div className="mt-6">
              <Empty icon={Check} title="Every open need is covered">
                Everything in the catalog is owned, set aside, or below your value bar. Keeping the money is the right call.
              </Empty>
            </div>
          </>
        )}
      </div>

      <aside aria-label="Budget" className="lg:pt-8">
        <div className="card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[0.8125rem] text-muted">Remaining budget</p>
            <Button size="sm" variant="ghost" icon={editing ? X : Pencil} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
              {editing ? 'Close' : 'Edit'}
            </Button>
          </div>
          <p className={cx('mt-1 text-[3rem] leading-none font-semibold tracking-[-0.03em]', budget.remaining < 0 ? 'text-bad' : 'text-ink')}>{inr(budget.remaining)}</p>
          <p className="mt-2 text-[0.8125rem] text-ink-2">
            of {inr(budget.amount)}. Unspent money is a fine outcome.
          </p>
          <div className="mt-5">
            <BudgetMeter amount={budget.amount} spent={budget.spent} committed={budget.committed} />
          </div>
          {editing && (
            <div className="animate-rise mt-5 border-t border-line pt-4">
              <BudgetEditor onDone={() => setEditing(false)} />
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
            <Stat label="Spent" value={inr(budget.spent)} sub={plural(budget.purchases, 'purchase')} />
            <Stat label="On wishlist" value={inr(budget.committed)} sub="estimated" />
          </div>
        </div>
      </aside>
    </section>
  )
}

/** "a kitchen scale" — keeps the headline grammatical */
function article(name: string) {
  // Lower-case the first letter unless it starts an acronym ("USB-C hub", "ESP32")
  const text = /^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name
  const head = name.replace(/\(.*?\)/g, '').split(/[:,]/)[0]!.trim()
  const last = head.split(/\s+/).pop() ?? ''
  const plural = /s$/i.test(last) && !/ss$/i.test(last)
  if (plural || /\b(and|or)\b/i.test(name.replace(/\(.*?\)/g, ''))) return text
  const vowelSound = /^[aeiou]/i.test(text) || /^(8|11|18)/.test(text) || /^[AEFHILMNORSX][A-Z0-9-]/.test(text)
  return `${vowelSound ? 'an' : 'a'} ${text}`
}

/* ---------- Question blocks ---------- */

function Question({ n, title, children, more }: { n: string; title: string; children: ReactNode; more?: ReactNode }) {
  return (
    <section aria-labelledby={`q${n}`} className="min-w-0">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 id={`q${n}`} className="flex items-baseline gap-3">
          <span className="num font-mono text-xs text-accent-text">{n}</span>
          <span className="display text-[1.375rem] text-ink">{title}</span>
        </h3>
        {more && <span className="shrink-0 text-[0.8125rem] text-ink-2 underline-offset-2 hover:text-ink hover:underline">{more}</span>}
      </div>
      {children}
    </section>
  )
}

const Quiet = ({ children }: { children: ReactNode }) => <p className="rounded-[12px] border border-dashed border-line-strong px-4 py-5 text-sm text-ink-2">{children}</p>

function TopFive({ items }: { items: ItemEval[] }) {
  const key = items.map((e) => `${e.item.id}:${e.score}`).join('|')
  const ref = useFlip<HTMLOListElement>(key)
  if (!items.length) return <Quiet>No open purchases. Everything is owned, set aside or covered.</Quiet>
  return (
    <ol ref={ref} className="flex flex-col gap-2">
      {items.map((e, i) => (
        <li key={e.item.id} data-flip={e.item.id} className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-3.5">
          <span className="num w-5 shrink-0 text-center font-mono text-xs text-muted">{i + 1}</span>
          <ScoreRing score={e.score} size={40} />
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => openItem(e.item.id)} className="block max-w-full truncate text-left font-medium text-ink hover:underline">
              {e.item.name}
            </button>
            <p className="truncate text-[0.8125rem] text-muted">{e.item.problem}</p>
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1 text-sm sm:flex">
            <PriceTag tier={e.current} compact />
            <VerdictPill verdict={e.verdict} />
          </div>
        </li>
      ))}
    </ol>
  )
}

function Covered() {
  const model = useModel()
  const c = coverage(model)
  if (!c.owned.length && !c.declared.length && !c.notNeeded.length)
    return (
      <Quiet>
        Nothing marked yet. When you mark what you own, this shows which purchases that makes redundant.{' '}
        <a href={href('triage')} className="font-medium text-ink underline underline-offset-2">
          Quick inventory
        </a>
      </Quiet>
    )
  return (
    <div className="flex flex-col gap-3 text-sm">
      {c.redundant.map((r) => (
        <p key={r.have.id} className="pretty text-ink-2">
          Your <span className="font-medium text-ink">{r.have.name.toLowerCase()}</span> makes {r.covers.map((x) => x.name.toLowerCase()).join(' and ')} unnecessary.
        </p>
      ))}
      {c.declared.length > 0 && (
        <p className="pretty text-ink-2">
          You have alternatives for: <span className="text-ink">{c.declared.map((e) => e.item.name).join(', ')}</span>.
        </p>
      )}
      <p className="text-ink-2">
        {plural(c.owned.length, 'item')} owned or bought
        {c.notNeeded.length ? `, ${num(c.notNeeded.length)} marked as not needed` : ''}.{' '}
        <a href={href('catalog', { own: 'have' })} className="font-medium text-ink underline underline-offset-2">
          See them
        </a>
      </p>
    </div>
  )
}

function Postpone() {
  const list = postpone(useModel())
  if (!list.length) return <Quiet>No tempting low-value purchases to warn you about.</Quiet>
  return (
    <ul className="flex flex-col divide-y divide-line">
      {list.map(({ eval: e, reason, after }) => (
        <li key={e.item.id} className="py-2.5 first:pt-0">
          <div className="flex items-baseline justify-between gap-3">
            <button type="button" onClick={() => openItem(e.item.id)} className="min-w-0 truncate text-left text-sm font-medium text-ink hover:underline">
              {e.item.name}
            </button>
            <PriceTag tier={e.current} compact />
          </div>
          <p className="pretty mt-0.5 text-[0.8125rem] text-ink-2">
            {reason}
            {after?.length ? ` Revisit after: ${after.map((a) => a.name.toLowerCase()).join(', ')}.` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}

function Savings({ planIds }: { planIds: string[] }) {
  const s = savings(useModel(), planIds)
  return (
    <div className="card flex flex-col p-5 sm:p-6">
      <p className="text-[0.9375rem] font-medium text-ink">Money and time back</p>
      <p className="mt-0.5 text-[0.8125rem] text-muted">Estimates: less eating out, fewer bottled drinks and barber trips, less friction.</p>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        <Stat label="Saving now" value={`${inr(s.realisedMonthly)}/mo`} sub="from what you own" />
        <Stat label="If you buy the plan" value={`+${inr(s.plannedMonthly)}/mo`} sub="estimated" />
        <Stat label="Hours back now" value={`${s.realisedHoursPerMonth.toFixed(1)}`} sub="per month" />
        <Stat label="With the plan" value={`+${s.plannedHoursPerMonth.toFixed(1)}`} sub="hours per month" />
      </div>
    </div>
  )
}
