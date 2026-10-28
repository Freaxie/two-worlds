import { useRef, useState } from 'react'
import { Download, Eye, PlugZap, RotateCcw, Upload } from 'lucide-react'
import type { AppState, ThemePref } from '../domain/types'
import { SEED_CATALOG } from '../data/catalog'
import { fetchListings, INTEGRATION_SCHEMA, ResearchError } from '../research/providers'
import { date, plural } from '../lib/format'
import { downloadJSON } from '../lib/hooks'
import { todayISO } from '../state/defaults'
import { exportEnvelope, isHttpUrl, parseState, ValidationError } from '../state/validation'
import { dispatch, store, useAppState } from '../state/store'
import { Dialog, toast } from '../components/overlay'
import { BudgetEditor, GoalsPanel } from '../components/panels'
import { Button, Field, Input, Segmented, SectionHead } from '../components/ui'

export function Settings() {
  const state = useAppState()
  return (
    <div className="animate-rise max-w-3xl">
      <p className="eyebrow text-muted">Settings</p>
      <h1 className="display mt-2 mb-10 text-[2.25rem] text-ink sm:text-[2.75rem]">Your setup</h1>

      <Block title="Appearance">
        <Segmented<ThemePref>
          label="Theme"
          value={state.settings.theme}
          onChange={(theme) => dispatch({ type: 'settings/patch', patch: { theme } })}
          options={[
            { value: 'system', label: 'Match system' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Block>

      <Block title="Budget" lede="Purchases dated on or after the period start count against it.">
        <BudgetEditor />
        <div className="mt-5 max-w-xs">
          <Field label="Budget period starts" hint={`Currently ${date(state.budget.periodStart)}`}>
            {(id, d) => (
              <Input
                id={id}
                type="date"
                max={todayISO()}
                aria-describedby={d}
                value={state.budget.periodStart}
                onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && dispatch({ type: 'budget/period', date: e.target.value })}
              />
            )}
          </Field>
        </div>
      </Block>

      <Block title="Priorities">
        <GoalsPanel />
      </Block>

      <Block title="Value bar" lede="The minimum score the planner needs before it spends money on something.">
        <div className="flex max-w-md items-center gap-4">
          <input
            type="range"
            min={40}
            max={80}
            value={state.settings.valueFloor}
            aria-label="Value bar"
            onChange={(e) => dispatch({ type: 'settings/patch', patch: { valueFloor: Number(e.target.value) } })}
            className="h-5 flex-1"
          />
          <span className="num w-8 text-right text-sm font-medium text-ink">{state.settings.valueFloor}</span>
        </div>
      </Block>

      <DataBlock state={state} />

      <Block title="Catalog" lede={`${SEED_CATALOG.length} curated items, ${plural(state.catalog.custom.length, 'item')} of yours, ${plural(Object.keys(state.catalog.overrides).length, 'edited entry', 'edited entries')}.`}>
        <Button
          icon={Eye}
          disabled={!state.catalog.hidden.length}
          onClick={() => {
            dispatch({ type: 'catalog/unhide-all' })
            toast('Hidden items restored')
          }}
        >
          {state.catalog.hidden.length ? `Restore ${plural(state.catalog.hidden.length, 'hidden item')}` : 'No hidden items'}
        </Button>
      </Block>

      <IntegrationBlock endpoint={state.settings.researchEndpoint} />
    </div>
  )
}

function Block({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8">
      <SectionHead as="h3" title={title} lede={lede} />
      {children}
    </section>
  )
}

/* ---------- Export, import, reset ---------- */

function DataBlock({ state }: { state: AppState }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<AppState | null>(null)
  const [error, setError] = useState<string>()
  const [confirmReset, setConfirmReset] = useState(false)

  const onFile = async (file: File) => {
    setError(undefined)
    if (file.size > 5_000_000) return setError('That file is over 5 MB, which is far larger than any export. Is it the right file?')
    try {
      setPending(parseState(JSON.parse(await file.text())))
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : 'That file isn’t valid JSON.')
    }
  }

  const decisions = (s: AppState) => Object.values(s.items).filter((i) => i.status !== 'candidate').length

  return (
    <Block title="Your data" lede="Everything is stored in this browser only. Export a copy to back it up or move it to another device.">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon={Download} onClick={() => downloadJSON(`life-upgrade-${todayISO()}.json`, exportEnvelope(store.getState()))}>
          Export JSON
        </Button>
        <Button icon={Upload} onClick={() => fileRef.current?.click()}>
          Import JSON
        </Button>
        <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
          Reset everything
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && (onFile(e.target.files[0]), (e.target.value = ''))} />
      </div>
      <p className="mt-3 text-[0.8125rem] text-muted">
        {plural(decisions(state), 'decision')}, {plural(state.listings.length, 'researched product')}, last changed {new Date(state.meta.updatedAt).toLocaleString('en-IN')}.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-[10px] bg-bad/8 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}

      <Dialog open={!!pending} onClose={() => setPending(null)} variant="modal" title="Replace your data with this file?">
        {pending && (
          <div className="flex flex-col gap-4 p-5">
            <p className="text-sm text-ink-2">The file is valid. Importing replaces everything currently in this browser:</p>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li className="rounded-[10px] bg-inset px-3 py-2">{plural(decisions(pending), 'decision')}</li>
              <li className="rounded-[10px] bg-inset px-3 py-2">{plural(pending.listings.length, 'product')}</li>
              <li className="rounded-[10px] bg-inset px-3 py-2">{plural(pending.catalog.custom.length, 'custom item')}</li>
              <li className="rounded-[10px] bg-inset px-3 py-2">Budget ₹{pending.budget.amount.toLocaleString('en-IN')}</li>
            </ul>
            <p className="text-[0.8125rem] text-muted">Tip: export your current data first if you might want it back.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const before = store.getState()
                  dispatch({ type: 'state/replace', state: pending })
                  setPending(null)
                  toast('Data imported', { label: 'Undo', run: () => dispatch({ type: 'state/replace', state: before }) })
                }}
              >
                Replace and import
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} variant="modal" title="Reset everything?">
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-ink-2">This clears every decision, rating, note, custom item and researched product, and restores the default budget and priorities.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const before = store.getState()
                dispatch({ type: 'state/reset' })
                setConfirmReset(false)
                toast('Everything reset', { label: 'Undo', run: () => dispatch({ type: 'state/replace', state: before }) })
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Dialog>
    </Block>
  )
}

/* ---------- Optional research integration ---------- */

function IntegrationBlock({ endpoint }: { endpoint: string }) {
  const [value, setValue] = useState(endpoint)
  const [error, setError] = useState<string>()
  const [testing, setTesting] = useState(false)
  const save = () => {
    const v = value.trim()
    if (v && !v.includes('{query}')) return setError('Include {query} where the search term should go.')
    if (v && !isHttpUrl(v.replace('{query}', 'q'))) return setError('Use a full https:// URL.')
    setError(undefined)
    dispatch({ type: 'settings/patch', patch: { researchEndpoint: v } })
    toast(v ? 'Research integration saved' : 'Research integration removed')
  }
  const test = async () => {
    setTesting(true)
    setError(undefined)
    try {
      const found = await fetchListings(endpoint, SEED_CATALOG.find((i) => i.id === 'kitchen-scale')!)
      toast(`Connection works: ${plural(found.length, 'valid listing')} for “kitchen scale”`)
    } catch (e) {
      setError(e instanceof ResearchError ? e.message : 'The test request failed.')
    } finally {
      setTesting(false)
    }
  }
  return (
    <Block
      title="Research integration (optional)"
      lede="The app works fully without this. If you run or subscribe to a price service, point it here and the Research page gains a “Fetch live results” button. Results are validated and kept separate until you shortlist them."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field label="Endpoint URL" error={error} className="flex-1" hint="GET request; {query} is replaced with the item name">
          {(id, d) => <Input id={id} value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://example.com/search?q={query}" aria-invalid={!!error} aria-describedby={d} />}
        </Field>
        <div className="flex gap-2 sm:pt-6">
          <Button variant="primary" onClick={save}>
            Save
          </Button>
          <Button icon={PlugZap} onClick={test} disabled={!endpoint || testing || value.trim() !== endpoint}>
            {testing ? 'Testing…' : 'Test'}
          </Button>
        </div>
      </div>
      <details className="mt-4 text-[0.8125rem]">
        <summary className="text-ink-2 hover:text-ink">Expected response format</summary>
        <pre className="mt-2 overflow-x-auto rounded-[10px] bg-inset p-3 font-mono text-xs text-ink-2">{INTEGRATION_SCHEMA}</pre>
      </details>
    </Block>
  )
}
