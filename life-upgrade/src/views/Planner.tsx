import { useMemo, useState } from 'react'
import { BookmarkPlus, Check, Link2, PiggyBank, TrendingDown } from 'lucide-react'
import { TIER_META } from '../domain/taxonomy'
import { PLAN_MODES, planPurchases, type Plan, type PlanMode } from '../engine/planner'
import { cx, inr, inrCompact, num, plural } from '../lib/format'
import { openItem, setParams, useRoute } from '../lib/router'
import { setManyStatus } from '../state/actions'
import { BUDGET_PRESETS, MAX_BUDGET } from '../state/defaults'
import { dispatch, useAppState, useModel } from '../state/store'
import { ValueCurve } from '../components/charts'
import { ClassMark } from '../components/marks'
import { toast } from '../components/overlay'
import { Button, Chip, Empty, Input, Segmented, Switch } from '../components/ui'

const MODES: PlanMode[] = ['balanced', 'minimum', 'premium']

export function Planner() {
  const model = useModel()
  const state = useAppState()
  const { params } = useRoute()
  const remaining = Math.max(0, model.budget.remaining)
  const budgetParam = Number(params.get('b'))
  const budget = Number.isFinite(budgetParam) && budgetParam > 0 ? Math.min(budgetParam, MAX_BUDGET) : remaining
  const mode = (MODES.includes(params.get('mode') as PlanMode) ? params.get('mode') : 'balanced') as PlanMode
  const [includeLuxury, setIncludeLuxury] = useState(false)
  const [custom, setCustom] = useState('')
  const [customErr, setCustomErr] = useState<string>()
  const floor = state.settings.valueFloor

  const plans = useMemo(() => {
    const opts = { budget, floor, includeLuxury }
    return Object.fromEntries(MODES.map((m) => [m, planPurchases(model.evals, m, opts)])) as Record<PlanMode, Plan>
  }, [model, budget, floor, includeLuxury])
  const plan = plans[mode]

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(custom.replace(/[,\s₹]/g, ''))
    if (!custom.trim() || !Number.isFinite(n) || n <= 0) return setCustomErr('Enter an amount in rupees.')
    if (n > MAX_BUDGET) return setCustomErr(`Keep it under ${inr(MAX_BUDGET)}.`)
    setCustomErr(undefined)
    setParams({ b: String(Math.round(n)) }, true)
  }

  const addAll = () => {
    const ids = plan.lines.filter((l) => l.eval.state.status !== 'wishlist').map((l) => l.id)
    if (!ids.length) return toast('Everything in this plan is already on your wishlist')
    setManyStatus(ids, 'wishlist', `${plural(ids.length, 'item')} added to your wishlist`)
  }

  return (
    <div className="animate-rise">
      <div className="max-w-2xl">
        <p className="eyebrow text-muted">Budget planner</p>
        <h1 className="display mt-2 text-[2.25rem] text-ink sm:text-[2.75rem]">What should {inr(budget)} buy?</h1>
        <p className="pretty mt-2 text-ink-2">
          Only purchases that clear your value bar get money. If the best plan leaves cash unspent, that’s the plan working, not failing.
        </p>
      </div>

      {/* Controls: one row above everything they scope */}
      <div className="card mt-8 grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="text-sm font-medium text-ink">Budget</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Budget presets">
            <Chip active={!params.get('b')} onClick={() => setParams({ b: undefined }, true)}>
              Remaining · {inrCompact(remaining)}
            </Chip>
            {BUDGET_PRESETS.map((p) => (
              <Chip key={p} active={budget === p && !!params.get('b')} onClick={() => setParams({ b: String(p) }, true)}>
                {inrCompact(p)}
              </Chip>
            ))}
          </div>
          <form onSubmit={applyCustom} noValidate className="mt-3 flex max-w-sm items-start gap-2">
            <div className="flex-1">
              <label htmlFor="plan-custom" className="sr-only">
                Custom budget
              </label>
              <Input id="plan-custom" inputMode="numeric" placeholder="Custom amount, ₹" value={custom} onChange={(e) => setCustom(e.target.value)} aria-invalid={!!customErr} aria-describedby={customErr ? 'plan-err' : undefined} />
              {customErr && (
                <p id="plan-err" className="mt-1 text-xs text-bad">
                  {customErr}
                </p>
              )}
            </div>
            <Button type="submit">Plan it</Button>
          </form>
          {params.get('b') && budget !== state.budget.amount && (
            <button
              type="button"
              className="mt-3 text-[0.8125rem] font-medium text-ink underline underline-offset-2"
              onClick={() => {
                dispatch({ type: 'budget/set', amount: budget })
                setParams({ b: undefined }, true)
                toast(`Budget set to ${inr(budget)}`)
              }}
            >
              Make {inr(budget)} my total budget
            </button>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="floor" className="text-sm font-medium text-ink">
                Value bar
              </label>
              <span className="num text-sm text-ink">{floor}</span>
            </div>
            <input
              id="floor"
              type="range"
              min={40}
              max={80}
              step={1}
              value={floor}
              onChange={(e) => dispatch({ type: 'settings/patch', patch: { valueFloor: Number(e.target.value) } })}
              className="mt-2 h-5 w-full"
              aria-describedby="floor-hint"
            />
            <p id="floor-hint" className="mt-1 text-xs text-muted">
              Minimum score before the planner will spend on an item. Higher means fewer, surer purchases.
            </p>
          </div>
          <Switch checked={includeLuxury} onChange={setIncludeLuxury} label="Let luxuries compete" description="Off by default: wants wait until needs are met." />
        </div>
      </div>

      {/* Three setups side by side */}
      <section aria-label="Setups compared" className="mt-8">
        <div className="grid gap-3 md:grid-cols-3">
          {MODES.map((m) => {
            const p = plans[m]
            const on = m === mode
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => setParams({ mode: m === 'balanced' ? undefined : m }, true)}
                className={cx('card p-4 text-left transition-colors sm:p-5', on ? 'border-ink ring-1 ring-ink' : 'hover:border-line-strong')}
              >
                <p className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
                  {PLAN_MODES[m].label}
                  {m === 'balanced' && <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-medium text-on-ink">Recommended</span>}
                </p>
                <p className="mt-3 text-[1.75rem] leading-none font-semibold tracking-tight text-ink">{inr(p.total)}</p>
                <p className="mt-1.5 text-[0.8125rem] text-ink-2">
                  {plural(p.lines.length, 'item')} · {Math.round(p.share * 100)}% of available value
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-muted">{p.leftover > 0 ? `Keeps ${inr(p.leftover)}` : 'Uses the whole budget'}</p>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[0.8125rem] text-muted">{PLAN_MODES[mode].blurb}</p>
      </section>

      {plan.lines.length === 0 ? (
        <div className="mt-8">
          <Empty icon={PiggyBank} title={budget <= 0 ? 'No budget left to plan' : 'Keep the money'}>
            {budget <= 0
              ? 'Your remaining budget is zero. Pick a preset above to explore what a budget would buy.'
              : `Nothing ${mode === 'minimum' ? 'essential ' : ''}clears your value bar of ${floor} within ${inr(budget)}. Lower the bar or raise the budget if you disagree; otherwise, not spending is the right call.`}
          </Empty>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section aria-labelledby="seq-h">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="seq-h" className="display text-[1.5rem] text-ink">
                  Buy in this order
                </h2>
                <p className="text-[0.8125rem] text-muted">Highest score first. Anything an item depends on comes right before it.</p>
              </div>
              <Button size="sm" variant="primary" icon={BookmarkPlus} onClick={addAll}>
                Add all to wishlist
              </Button>
            </div>
            <ol className="flex flex-col">
              {plan.lines.map((l, i) => (
                <li key={l.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-3 border-t border-line py-3">
                  <span className="num pt-0.5 font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <button type="button" onClick={() => openItem(l.id)} className="text-left text-sm font-medium text-ink hover:underline">
                      {l.eval.item.name}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <ClassMark value={l.eval.item.class} />
                      <span>
                        {TIER_META[l.tier].label} · score {l.score}
                      </span>
                      {l.eval.state.status === 'wishlist' && <span className="text-ink-2">On wishlist</span>}
                      {l.dependencyOf.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-indigo-text">
                          <Link2 aria-hidden className="size-3" /> Needed for {l.dependencyOf.map((d) => model.byId.get(d)?.name.toLowerCase()).join(', ')}
                        </span>
                      )}
                      {l.downgraded && <span className="text-ink-2">Cheaper tier to stretch the budget</span>}
                      {l.diminishing && (
                        <span className="inline-flex items-center gap-1 text-warn">
                          <TrendingDown aria-hidden className="size-3" />
                          Diminishing returns{l.tierEval.upgrade ? `: ${inr(l.tierEval.upgrade.extraPrice)} for ${l.tierEval.upgrade.extraScore >= 0 ? '+' : ''}${l.tierEval.upgrade.extraScore} pts` : ''}
                        </span>
                      )}
                      {l.belowFloor && !l.dependencyOf.length && <span className="text-warn">Below your value bar</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm text-ink">
                      {inr(l.price)}
                      {l.verified && <Check aria-label="verified price" className="ml-1 inline size-3.5 text-good" strokeWidth={2.5} />}
                    </p>
                    <p className="num text-xs text-muted">{inr(l.cumulative)} total</p>
                  </div>
                </li>
              ))}
            </ol>
            <dl className="mt-2 grid grid-cols-2 gap-4 border-t border-ink pt-4 sm:grid-cols-4">
              <Fact label="Spend" value={inr(plan.total)} />
              <Fact label="Kept" value={inr(plan.leftover)} />
              <Fact label="Running costs" value={`${inr(plan.runningCost)}/yr`} />
              <Fact label="Saves" value={`${inr(plan.monthlySavings)}/mo`} />
            </dl>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="card p-5">
              <ValueCurve points={plan.frontier} budget={budget} eightyAt={plan.eightyAt} />
              {plan.eightyAt !== undefined && plan.total > 0 && (
                <p className="pretty mt-4 text-[0.8125rem] text-ink-2">
                  80% of this plan’s value costs {inr(plan.eightyAt)}. The remaining {inr(plan.total - plan.eightyAt)} buys the last 20%.
                </p>
              )}
            </div>
            {plan.closeCalls.length > 0 && (
              <div className="card p-5">
                <p className="text-[0.9375rem] font-medium text-ink">Just missed</p>
                <p className="mb-3 text-[0.8125rem] text-muted">Clears the bar but didn’t fit. These are next in line if the budget grows.</p>
                <ul className="flex flex-col gap-2">
                  {plan.closeCalls.map((c) => (
                    <li key={c.eval.item.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <button type="button" onClick={() => openItem(c.eval.item.id)} className="min-w-0 truncate text-left text-ink hover:underline">
                        {c.eval.item.name}
                      </button>
                      <span className="num shrink-0 text-xs text-muted">
                        {inr(c.price)}
                        {c.short > 0 ? ` · ${inr(c.short)} short` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ModeCompare plans={plans} />
          </aside>
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num m-0 mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function ModeCompare({ plans }: { plans: Record<PlanMode, Plan> }) {
  const [view, setView] = useState<'value' | 'items'>('value')
  const b = plans.balanced
  const p = plans.premium
  const sameItems = p.lines.filter((l) => b.lines.some((x) => x.id === l.id))
  const premiumTax = sameItems.reduce((s, l) => s + (l.price - (b.lines.find((x) => x.id === l.id)?.price ?? l.price)), 0)
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.9375rem] font-medium text-ink">Premium versus balanced</p>
        <Segmented
          size="sm"
          label="Compare by"
          value={view}
          onChange={setView}
          options={[
            { value: 'value', label: 'Value' },
            { value: 'items', label: 'Items' },
          ]}
        />
      </div>
      <p className="pretty mt-3 text-[0.8125rem] text-ink-2">
        {view === 'value'
          ? `For the same budget, premium captures ${Math.round(p.share * 100)}% of the available value against balanced’s ${Math.round(b.share * 100)}%.`
          : `Premium buys ${plural(p.lines.length, 'item')}; balanced buys ${num(b.lines.length)}.`}{' '}
        {premiumTax > 0 && `On the ${plural(sameItems.length, 'item')} both plans share, premium tiers cost ${inr(premiumTax)} more.`}
      </p>
    </div>
  )
}
