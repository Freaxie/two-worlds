import { useEffect, useState } from 'react'
import { ArrowUpRight, EyeOff, FlaskConical, Pencil, RotateCcw, Trash2, TrendingDown } from 'lucide-react'
import type { ItemState, ItemStatus, ManualPriority, TierId } from '../domain/types'
import { CATEGORY_BY_ID, PRIORITY_META, priorityOf, STATUS_META, TIER_META, TIERS } from '../domain/taxonomy'
import { SEED_IDS } from '../data/catalog'
import { searchLinks } from '../research/providers'
import type { ItemEval } from '../engine/scoring'
import { valueLabel } from '../engine/scoring'
import { cx, date, inr, inrRange } from '../lib/format'
import { closeItem, href, openItem } from '../lib/router'
import { setStatus } from '../state/actions'
import { todayISO, MAX_BUDGET } from '../state/defaults'
import { dispatch, useAppState, useModel } from '../state/store'
import { ScoreBreakdown } from '../components/charts'
import { requestPurchase, Reasoning } from '../components/item'
import { CategoryGlyph, ClassMark, ScoreRing, StatusBadge } from '../components/marks'
import { Dialog, toast } from '../components/overlay'
import { Button, Field, Input, Select, Switch, Textarea } from '../components/ui'
import { ItemFormDialog } from './ItemForm'
import { ReviewForm } from './Impact'

type ItemPatch = Partial<Omit<ItemState, 'status' | 'updatedAt'>>

const STATUSES: ItemStatus[] = ['candidate', 'wishlist', 'deferred', 'purchased', 'owned', 'unnecessary']

export function ItemDrawer({ id }: { id: string | null }) {
  const model = useModel()
  const e = id ? model.evalById.get(id) : undefined
  return (
    <Dialog open={!!e} onClose={closeItem} title={e ? `${CATEGORY_BY_ID[e.item.category].index} · ${CATEGORY_BY_ID[e.item.category].name}` : ''}>
      {e && <ItemDetail key={e.item.id} e={e} />}
    </Dialog>
  )
}

function ItemDetail({ e }: { e: ItemEval }) {
  const { item, state } = e
  const [editing, setEditing] = useState(false)
  const value = valueLabel(e.current.valueIndex, e.current.paysForItself)

  const status = (s: ItemStatus) => {
    if (s === 'purchased') return requestPurchase(item.id)
    setStatus(item.id, s, item.name)
  }

  return (
    <div className="flex flex-col gap-8 px-5 pt-5 pb-10 sm:px-7">
      {/* Header */}
      <header className="flex items-start gap-4">
        <CategoryGlyph id={item.category} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]" data-autofocus tabIndex={-1}>
            {item.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ClassMark value={item.class} />
            {item.situational && <span className="text-xs text-muted">Situational</span>}
            {item.custom && <span className="text-xs text-muted">Your item</span>}
            <StatusBadge status={state.status} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 rounded-[14px] border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <ScoreRing score={e.score} size={52} />
          <div className="min-w-0">
            <p className="text-xs text-muted">Score</p>
            <p className="text-sm font-medium text-ink">{PRIORITY_META[e.priority].label}</p>
          </div>
        </div>
        <div className="border-l border-line pl-3">
          <p className="text-xs text-muted">Value per rupee</p>
          <p className="mt-1 text-sm font-medium text-ink">{value}</p>
          <p className="text-xs text-muted">index {e.current.valueIndex}/100</p>
        </div>
        <div className="border-l border-line pl-3">
          <p className="text-xs text-muted">To own</p>
          <p className="mt-1 text-sm font-medium text-ink">{inr(e.current.annualCost)}/yr</p>
          <p className="text-xs text-muted">over ~{e.current.lifespan} yrs</p>
        </div>
      </div>

      {/* Status */}
      <section aria-labelledby="st-h">
        <h3 id="st-h" className="eyebrow mb-2.5 text-muted">
          Your decision
        </h3>
        <div className="grid grid-cols-2 gap-1.5 xs:grid-cols-3" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={state.status === s}
              onClick={() => status(s)}
              className={cx(
                'h-10 rounded-[10px] border px-2 text-[0.8125rem] transition-colors',
                state.status === s ? 'border-ink bg-ink font-medium text-on-ink' : 'border-line-strong bg-surface text-ink-2 hover:border-ink/40 hover:text-ink',
              )}
            >
              {s === 'candidate' ? 'Undecided' : STATUS_META[s].label}
            </button>
          ))}
        </div>
        {state.status === 'purchased' && state.purchase && (
          <p className="mt-2.5 text-[0.8125rem] text-ink-2">
            Bought for {inr(state.purchase.price)} on {date(state.purchase.date)}
            {state.purchase.tier ? ` (${TIER_META[state.purchase.tier].label.toLowerCase()} tier)` : ''}.
          </p>
        )}
      </section>

      {state.status === 'purchased' && (
        <section aria-labelledby="rv-h" className="rounded-[14px] border border-line bg-surface p-4">
          <h3 id="rv-h" className="mb-3 text-sm font-medium text-ink">
            How did it turn out?
          </h3>
          <ReviewForm e={e} />
        </section>
      )}

      <section aria-labelledby="why-h">
        <h3 id="why-h" className="eyebrow mb-3 text-muted">
          The reasoning
        </h3>
        <Reasoning e={e} />
      </section>

      <PlanFields e={e} />

      <Tiers e={e} />

      <section aria-labelledby="sc-h">
        <h3 id="sc-h" className="eyebrow mb-3 text-muted">
          How the score of {e.score} is built
        </h3>
        <ScoreBreakdown lines={e.current.lines} />
        <div className="mt-4 rounded-[12px] bg-inset/70 p-3.5 text-[0.8125rem] text-ink-2">
          <p>
            Base {e.current.base.toFixed(1)}
            {e.current.quality !== 1 && ` (first four factors × ${e.current.quality} for the ${e.tier} tier’s quality)`}
          </p>
          {e.modifiers.map((m) => (
            <p key={m.key} className="mt-1.5">
              <span className="num font-medium text-ink">{m.factor ? `× ${m.factor}` : `${m.delta! > 0 ? '+' : ''}${m.delta}`}</span> {m.label}. {m.detail}
            </p>
          ))}
          {e.manual && (
            <p className="mt-1.5">
              <span className="font-medium text-ink">Manual priority:</span> {PRIORITY_META[e.priority].label}, so the score is held at {e.score} (the engine said {e.engineScore}).
            </p>
          )}
          <a href={href('method')} className="mt-2 inline-block font-medium text-ink underline underline-offset-2" onClick={closeItem}>
            The full method
          </a>
        </div>
      </section>

      {item.lookFor.length > 0 && (
        <section aria-labelledby="lf-h">
          <h3 id="lf-h" className="eyebrow mb-3 text-muted">
            What separates a good one
          </h3>
          <ul className="flex flex-col gap-1.5">
            {item.lookFor.map((l) => (
              <li key={l} className="flex gap-2.5 text-sm text-ink">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                {l}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Relations e={e} />

      <section aria-labelledby="rs-h">
        <h3 id="rs-h" className="eyebrow mb-3 text-muted">
          Research it
        </h3>
        <p className="mb-3 text-[0.8125rem] text-ink-2">These open merchant search pages for this item. Add the models you’re considering on the Research page to compare them side by side.</p>
        <div className="flex flex-wrap gap-2">
          {searchLinks(item).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full border border-line-strong bg-surface px-3 text-[0.8125rem] text-ink-2 hover:border-ink/40 hover:text-ink">
              {l.label}
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          ))}
          <a href={href('research', { for: item.id })} onClick={closeItem} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-[0.8125rem] text-on-ink">
            <FlaskConical aria-hidden className="size-3.5" /> Compare models
          </a>
        </div>
      </section>

      <section aria-label="Catalog entry" className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button size="sm" icon={Pencil} onClick={() => setEditing(true)}>
          Edit item
        </Button>
        {SEED_IDS.has(item.id) && (
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={RotateCcw}
              onClick={() => {
                dispatch({ type: 'catalog/reset-item', id: item.id })
                toast('Restored the original catalog entry')
              }}
            >
              Reset to original
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={EyeOff}
              onClick={() => {
                dispatch({ type: 'catalog/hide', id: item.id })
                closeItem()
                toast(`${item.name} hidden. Restore hidden items in Settings.`)
              }}
            >
              Hide from catalog
            </Button>
          </>
        )}
        {item.custom && (
          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => {
              if (!confirm(`Delete “${item.name}” and its notes and research? This can’t be undone.`)) return
              dispatch({ type: 'catalog/delete-custom', id: item.id })
              closeItem()
              toast(`${item.name} deleted`)
            }}
          >
            Delete
          </Button>
        )}
      </section>

      <ItemFormDialog open={editing} onClose={() => setEditing(false)} item={item} />
    </div>
  )
}

/* ---------- Plan fields: tier, dates, price target, priority, notes ---------- */

function PlanFields({ e }: { e: ItemEval }) {
  const { item, state } = e
  const id = item.id
  const patch = (p: ItemPatch) => dispatch({ type: 'item/patch', id, patch: p })
  const [notes, setNotes] = useState(state.notes)
  const [target, setTarget] = useState(state.priceTarget ? String(state.priceTarget) : '')
  const [targetErr, setTargetErr] = useState<string>()

  useEffect(() => {
    if (notes === state.notes) return
    const t = setTimeout(() => patch({ notes }), 400)
    return () => clearTimeout(t)
    // Only the text matters here; patch is recreated every render
  }, [notes])

  const commitTarget = () => {
    const raw = target.replace(/[,\s₹]/g, '')
    if (!raw) return (setTargetErr(undefined), patch({ priceTarget: undefined }))
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return setTargetErr('Enter a price in rupees.')
    if (n > MAX_BUDGET) return setTargetErr('That’s higher than any budget allows.')
    setTargetErr(undefined)
    patch({ priceTarget: Math.round(n) })
  }

  const best = e.current.verified?.price
  const tiers = TIERS.filter((t) => item.tiers[t])

  return (
    <section aria-labelledby="pl-h">
      <h3 id="pl-h" className="eyebrow mb-3 text-muted">
        Your plan for it
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tier" hint={`Best value: ${TIER_META[e.recommendedTier].label}`}>
          {(fid, d) => (
            <Select id={fid} aria-describedby={d} value={state.tier ?? ''} onChange={(ev) => patch({ tier: (ev.target.value || undefined) as TierId | undefined })}>
              <option value="">Automatic ({TIER_META[e.recommendedTier].label})</option>
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {TIER_META[t].label}, {inrRange(item.tiers[t]!.priceMin, item.tiers[t]!.priceMax)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Priority" hint="Overrides the engine’s ranking">
          {(fid, d) => (
            <Select id={fid} aria-describedby={d} value={state.priority} onChange={(ev) => patch({ priority: ev.target.value as ManualPriority })}>
              <option value="auto">Automatic ({PRIORITY_META[priorityOf(e.engineScore)].label})</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          )}
        </Field>
        <Field label="Target purchase date" hint={state.targetDate ? undefined : 'When you mean to buy it'}>
          {(fid, d) => (
            <Input id={fid} aria-describedby={d} type="date" min={todayISO()} value={state.targetDate ?? ''} onChange={(ev) => patch({ targetDate: ev.target.value || undefined })} />
          )}
        </Field>
        <Field
          label="Price target (₹)"
          error={targetErr}
          hint={
            state.priceTarget
              ? best !== undefined
                ? best <= state.priceTarget
                  ? `A shortlisted listing is at or under target: ${inr(best)}`
                  : `Best verified listing is ${inr(best)}, ${inr(best - state.priceTarget)} above target`
                : `Estimate is ${inr(e.current.price)}; add a verified listing to compare`
              : 'Wait for a deal at or below this'
          }
        >
          {(fid, d) => (
            <Input
              id={fid}
              inputMode="numeric"
              placeholder={String(e.current.price)}
              value={target}
              aria-invalid={!!targetErr}
              aria-describedby={d}
              onChange={(ev) => setTarget(ev.target.value)}
              onBlur={commitTarget}
              onKeyDown={(ev) => ev.key === 'Enter' && commitTarget()}
            />
          )}
        </Field>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <Switch
          checked={state.hasAlternative}
          onChange={(v) => patch({ hasAlternative: v })}
          label="I already have something that does this job"
          description="Counts as covered: the score drops and anything that depends on it is unblocked."
        />
        {item.situational && (
          <Switch
            checked={state.situationConfirmed}
            onChange={(v) => patch({ situationConfirmed: v })}
            label="This applies to me"
            description={item.situational}
          />
        )}
      </div>
      <div className="mt-5">
        <Field label="Notes" hint="Saved automatically">
          {(fid, d) => <Textarea id={fid} aria-describedby={d} value={notes} onChange={(ev) => setNotes(ev.target.value)} onBlur={() => notes !== state.notes && patch({ notes })} placeholder="Sizes, models to check, what a friend recommended…" maxLength={4000} />}
        </Field>
      </div>
    </section>
  )
}

/* ---------- Tier comparison with diminishing returns ---------- */

function Tiers({ e }: { e: ItemEval }) {
  const tiers = TIERS.filter((t) => e.tiers[t])
  return (
    <section aria-labelledby="ti-h">
      <h3 id="ti-h" className="eyebrow mb-3 text-muted">
        Is paying more worth it?
      </h3>
      <ul className="flex flex-col gap-2">
        {tiers.map((t) => {
          const te = e.tiers[t]!
          const chosen = e.tier === t
          return (
            <li key={t} className={cx('rounded-[12px] border p-3.5', chosen ? 'border-ink bg-surface' : 'border-line')}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-ink">
                  {TIER_META[t].label}
                  {t === e.recommendedTier && <span className="ml-2 text-xs font-normal text-good">Best value</span>}
                  {chosen && t !== e.recommendedTier && <span className="ml-2 text-xs font-normal text-muted">Your choice</span>}
                </p>
                <p className="num text-sm text-ink">
                  {te.verified ? inr(te.verified.price) : inrRange(te.priceMin, te.priceMax)} <span className="text-xs text-muted">{te.verified ? 'verified' : 'est.'}</span>
                </p>
              </div>
              <p className="mt-1 text-[0.8125rem] text-ink-2">{e.item.tiers[t]!.note}</p>
              <p className="mt-1.5 text-xs text-muted">
                Score {te.score} · lasts ~{te.lifespan} yrs · {inr(te.annualCost)} a year
                {te.upgrade && te.upgrade.extraPrice > 0 && ` · ${inr(te.upgrade.extraPrice)} more than ${te.upgrade.from} for ${te.upgrade.extraScore >= 0 ? '+' : ''}${te.upgrade.extraScore} points`}
              </p>
              {te.diminishing && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">
                  <TrendingDown aria-hidden className="size-3.5" />
                  Diminishing returns: the extra money buys little
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ---------- Dependencies and alternatives ---------- */

function Relations({ e }: { e: ItemEval }) {
  const model = useModel()
  const app = useAppState()
  const groups: [string, string[] | undefined, string][] = [
    ['Needs', e.item.requires, 'Little use without these. The planner buys them together.'],
    ['Builds on', e.item.buildsOn, 'Worth more once you have these.'],
    ['Does the same job as', e.item.alternatives, 'Owning one makes the others mostly redundant.'],
  ]
  const shown = groups.filter(([, ids]) => ids?.length)
  if (!shown.length) return null
  return (
    <section aria-labelledby="rel-h">
      <h3 id="rel-h" className="eyebrow mb-3 text-muted">
        Connected purchases
      </h3>
      <div className="flex flex-col gap-4">
        {shown.map(([label, ids, hint]) => (
          <div key={label}>
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="mb-2 text-xs text-muted">{hint}</p>
            <ul className="flex flex-col gap-1.5">
              {ids!.map((rid) => {
                const r = model.evalById.get(rid)
                if (!r) return null
                const s = app.items[rid]
                return (
                  <li key={rid} className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2">
                    <button type="button" onClick={() => openItem(rid)} className="min-w-0 truncate text-left text-sm text-ink hover:underline">
                      {r.item.name}
                    </button>
                    <span className="shrink-0 text-xs text-muted">
                      {s?.hasAlternative ? 'Covered' : STATUS_META[s?.status ?? 'candidate'].label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
