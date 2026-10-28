import { useState } from 'react'
import { Pencil, RotateCcw } from 'lucide-react'
import { GOAL_WEIGHT_LABELS, GOALS } from '../domain/taxonomy'
import { cx, inr, inrCompact } from '../lib/format'
import { BUDGET_PRESETS, MAX_BUDGET } from '../state/defaults'
import { dispatch, useAppState } from '../state/store'
import { Button, Chip, Input } from './ui'

/** Goal weights. Every change re-scores the catalog immediately. */
export function GoalsPanel({ compact = false }: { compact?: boolean }) {
  const { goals } = useAppState()
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.9375rem] font-medium text-ink">Your priorities</p>
          <p className="text-[0.8125rem] text-muted">How much each goal matters right now. Scores update as you drag.</p>
        </div>
        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => dispatch({ type: 'goals/reset' })}>
          Reset
        </Button>
      </div>
      <ul className={cx('grid gap-x-6', compact ? 'gap-y-2.5' : 'gap-y-3.5 sm:grid-cols-2')}>
        {GOALS.map((g) => {
          const w = goals[g.id]
          const id = `goal-${g.id}`
          return (
            <li key={g.id}>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink" title={g.blurb}>
                  {g.name}
                </label>
                <span className="text-xs text-muted">{GOAL_WEIGHT_LABELS[w]}</span>
              </div>
              <input
                id={id}
                type="range"
                min={0}
                max={5}
                step={1}
                value={w}
                aria-valuetext={`${w} of 5, ${GOAL_WEIGHT_LABELS[w]}`}
                onChange={(e) => dispatch({ type: 'goals/set', goal: g.id, weight: Number(e.target.value) })}
                className="mt-1 h-5 w-full cursor-pointer"
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Budget amount with the presets, plus a validated custom value */
export function BudgetEditor({ onDone }: { onDone?: () => void }) {
  const { budget } = useAppState()
  const [custom, setCustom] = useState(String(budget.amount))
  const [error, setError] = useState<string>()
  const apply = (n: number) => {
    dispatch({ type: 'budget/set', amount: n })
    setCustom(String(n))
    setError(undefined)
    onDone?.()
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(custom.replace(/[,\s₹]/g, ''))
    if (!custom.trim() || !Number.isFinite(n) || n < 0) return setError('Enter a whole number of rupees.')
    if (n > MAX_BUDGET) return setError(`Keep it under ${inr(MAX_BUDGET)}.`)
    apply(Math.round(n))
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Budget presets">
        {BUDGET_PRESETS.map((p) => (
          <Chip key={p} active={budget.amount === p} onClick={() => apply(p)}>
            {inrCompact(p)}
          </Chip>
        ))}
      </div>
      <form onSubmit={submit} noValidate className="mt-3 flex items-start gap-2">
        <div className="flex-1">
          <label htmlFor="budget-custom" className="sr-only">
            Custom budget in rupees
          </label>
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">
              ₹
            </span>
            <Input
              id="budget-custom"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'budget-err' : undefined}
              className="pl-7"
            />
          </div>
          {error && (
            <p id="budget-err" className="mt-1 text-xs text-bad">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" icon={Pencil}>
          Set
        </Button>
      </form>
    </div>
  )
}
