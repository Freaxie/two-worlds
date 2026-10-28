import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Ban, Bookmark, Check, Clock, PartyPopper } from 'lucide-react'
import type { ItemStatus } from '../domain/types'
import { CATEGORY_BY_ID } from '../domain/taxonomy'
import { useKey } from '../lib/hooks'
import { href, navigate } from '../lib/router'
import { dispatch, store, useModel } from '../state/store'
import { ClassMark, CategoryGlyph, PriceTag } from '../components/marks'
import { Button, Empty } from '../components/ui'

const CHOICES: { status: ItemStatus; label: string; key: string; icon: typeof Check }[] = [
  { status: 'owned', label: 'Already own', key: '1', icon: Check },
  { status: 'wishlist', label: 'Want it', key: '2', icon: Bookmark },
  { status: 'deferred', label: 'Later', key: '3', icon: Clock },
  { status: 'unnecessary', label: 'Don’t need', key: '4', icon: Ban },
]

/** Quick inventory: one undecided item at a time, highest score first, fully keyboard-driven */
export function Triage() {
  const model = useModel()
  // The queue is fixed when the page opens so items don't jump as scores change
  const [queue] = useState(() =>
    model.evals
      .filter((e) => !store.getState().items[e.item.id] || store.getState().items[e.item.id]!.status === 'candidate')
      .sort((a, b) => b.score - a.score)
      .map((e) => e.item.id),
  )
  const [pos, setPos] = useState(0)
  const [history, setHistory] = useState<{ id: string; before: ReturnType<typeof store.getState>['items'][string] | undefined }[]>([])
  const id = queue[pos]
  const e = id ? model.evalById.get(id) : undefined
  const done = pos >= queue.length

  const choose = (status: ItemStatus) => {
    if (!e) return
    setHistory((h) => [...h, { id: e.item.id, before: store.getState().items[e.item.id] }])
    dispatch({ type: 'item/status', id: e.item.id, status })
    setPos((p) => p + 1)
  }
  const skip = () => setPos((p) => Math.min(queue.length, p + 1))
  const back = () => {
    const last = history[history.length - 1]
    if (last && queue[pos - 1] === last.id) {
      dispatch({ type: 'item/restore', id: last.id, state: last.before })
      setHistory((h) => h.slice(0, -1))
    }
    setPos((p) => Math.max(0, p - 1))
  }
  const finish = () => {
    dispatch({ type: 'settings/patch', patch: { inventoryDone: true } })
    navigate('overview')
  }

  useKey('1', () => choose('owned'), !done)
  useKey('2', () => choose('wishlist'), !done)
  useKey('3', () => choose('deferred'), !done)
  useKey('4', () => choose('unnecessary'), !done)
  useKey('ArrowRight', skip, !done)
  useKey('ArrowLeft', back, pos > 0)

  const progress = useMemo(() => (queue.length ? Math.round((pos / queue.length) * 100) : 100), [pos, queue.length])

  if (!queue.length || done) {
    return (
      <div className="animate-rise mx-auto max-w-xl pt-6">
        <Empty
          icon={PartyPopper}
          title={queue.length ? 'Inventory done' : 'Nothing left to sort'}
          action={
            <Button variant="primary" iconRight={ArrowRight} onClick={finish}>
              See your recommendations
            </Button>
          }
        >
          {queue.length ? `You went through ${queue.length} items. Every score now reflects what you actually have and want.` : 'Every item already has a decision. Change any of them from the catalog.'}
        </Empty>
      </div>
    )
  }

  return (
    <div className="animate-rise mx-auto max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <a href={href('overview')} className="text-[0.8125rem] text-ink-2 hover:text-ink">
          ← Overview
        </a>
        <p className="num text-[0.8125rem] text-muted">
          {pos + 1} of {queue.length}
        </p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-inset" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Inventory progress">
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <h1 className="display mt-8 text-center text-[1.75rem] text-ink sm:text-[2rem]">Do you have one of these?</h1>

      {e && (
        <div key={e.item.id} className="card animate-rise mt-6 p-6">
          <div className="flex items-start gap-4">
            <CategoryGlyph id={e.item.category} size="lg" />
            <div className="min-w-0">
              <p className="eyebrow text-muted">{CATEGORY_BY_ID[e.item.category].name}</p>
              <p className="display mt-1 text-[1.5rem] leading-tight text-ink">{e.item.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <ClassMark value={e.item.class} />
                <PriceTag tier={e.current} />
              </div>
            </div>
          </div>
          <p className="pretty mt-5 text-[0.9375rem] leading-relaxed text-ink-2">{e.item.problem}</p>
          {e.item.situational && <p className="mt-3 text-[0.8125rem] text-muted">Only worth it if: {e.item.situational}</p>}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHOICES.map((c) => (
          <button
            key={c.status}
            type="button"
            onClick={() => choose(c.status)}
            className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-[12px] border border-line-strong bg-surface text-sm text-ink transition-colors hover:border-ink hover:bg-inset/60"
          >
            <c.icon aria-hidden className="size-5 text-ink-2" strokeWidth={1.75} />
            {c.label}
            <kbd className="font-mono text-[0.6875rem] text-muted">{c.key}</kbd>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={back} disabled={pos === 0}>
          Back
        </Button>
        <Button size="sm" variant="ghost" onClick={finish}>
          Finish for now
        </Button>
        <Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={skip}>
          Not sure, skip
        </Button>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Keys: 1–4 to answer · → skip · ← back</p>
    </div>
  )
}
