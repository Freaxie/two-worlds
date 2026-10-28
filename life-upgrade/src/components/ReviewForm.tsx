import { useState, type ReactNode } from 'react'
import { Gauge, Save } from 'lucide-react'
import type { Review, UsageFrequency } from '../domain/types'
import { USAGE_META, USAGES } from '../domain/taxonomy'
import type { ItemEval } from '../engine/scoring'
import { cx } from '../lib/format'
import { dispatch } from '../state/store'
import { toast } from './overlay'
import { Button, Segmented } from './ui'

/* The purchase rating form, used on the Impact page and in the item drawer */

export function ReviewForm({ e, onSaved }: { e: ItemEval; onSaved?: () => void }) {
  const r = e.state.review
  const [usefulness, setUsefulness] = useState<Review['usefulness'] | null>(r?.usefulness ?? null)
  const [usage, setUsage] = useState<UsageFrequency | null>(r?.usage ?? null)
  const [solved, setSolved] = useState<Review['solved'] | null>(r?.solved ?? null)
  const [buyAgain, setBuyAgain] = useState<'yes' | 'no' | null>(r ? (r.buyAgain ? 'yes' : 'no') : null)
  const [tried, setTried] = useState(false)
  const complete = usefulness && usage && solved && buyAgain

  const save = (ev: React.FormEvent) => {
    ev.preventDefault()
    setTried(true)
    if (!complete) return
    dispatch({ type: 'item/review', id: e.item.id, review: { usefulness, usage, solved, buyAgain: buyAgain === 'yes', ratedAt: new Date().toISOString() } })
    toast(`Rating saved for ${e.item.name}`)
    onSaved?.()
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <Q tried={tried} label="How useful has it been?" missing={!usefulness}>
        <Segmented<string>
          size="sm"
          label="Usefulness from 1 to 5"
          value={usefulness ? String(usefulness) : ''}
          onChange={(v) => setUsefulness(Number(v) as Review['usefulness'])}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n), title: ['', 'Useless', 'Meh', 'Fine', 'Good', 'Excellent'][n] }))}
        />
      </Q>
      <Q tried={tried} label="How often do you use it?" missing={!usage}>
        <Segmented<string> size="sm" label="Usage frequency" value={usage ?? ''} onChange={(v) => setUsage(v as UsageFrequency)} options={USAGES.map((u) => ({ value: u, label: USAGE_META[u].label }))} />
      </Q>
      <div className="grid gap-4 sm:grid-cols-2">
        <Q tried={tried} label="Did it solve the original problem?" missing={!solved}>
          <Segmented<string>
            size="sm"
            label="Solved the problem"
            value={solved ?? ''}
            onChange={(v) => setSolved(v as Review['solved'])}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'partly', label: 'Partly' },
              { value: 'no', label: 'No' },
            ]}
          />
        </Q>
        <Q tried={tried} label="Would you buy it again?" missing={!buyAgain}>
          <Segmented<string>
            size="sm"
            label="Would buy again"
            value={buyAgain ?? ''}
            onChange={(v) => setBuyAgain(v as 'yes' | 'no')}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
        </Q>
      </div>
      <p className="text-xs text-muted">{e.item.problem}</p>
      <div className="flex justify-end">
        <Button size="sm" variant="primary" type="submit" icon={r ? Save : Gauge}>
          {r ? 'Update rating' : 'Save rating'}
        </Button>
      </div>
    </form>
  )
}

function Q({ label, missing, tried, children }: { label: string; missing: boolean; tried: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={cx('text-[0.8125rem] font-medium', tried && missing ? 'text-bad' : 'text-ink-2')}>
        {label}
        {tried && missing && <span className="font-normal"> (required)</span>}
      </p>
      {children}
    </div>
  )
}
