import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChartBar, Table2 } from 'lucide-react'
import type { CategoryOpportunity } from '../engine/insights'
import type { FrontierPoint } from '../engine/planner'
import type { Line } from '../engine/scoring'
import { cx, inr, inrCompact, num } from '../lib/format'

/* ------------------------------------------------------------------
   Charts. Two categorical series at most (orange = needs, indigo =
   discretionary; validated for colour-blind separation in both themes),
   thin marks, a legend whenever there are two series, hover and focus
   tooltips, and a table view for every chart.
------------------------------------------------------------------- */

export function ChartFrame({ title, caption, legend, table, children }: { title: ReactNode; caption?: ReactNode; legend?: ReactNode; table: ReactNode; children: ReactNode }) {
  const [asTable, setAsTable] = useState(false)
  return (
    <figure className="m-0">
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium text-ink">{title}</p>
          {caption && <p className="mt-0.5 text-[0.8125rem] text-muted">{caption}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex h-7 items-center gap-1.5 rounded-[8px] border border-line px-2 text-xs text-ink-2 hover:border-line-strong hover:text-ink"
          aria-pressed={asTable}
        >
          {asTable ? <ChartBar aria-hidden className="size-3.5" /> : <Table2 aria-hidden className="size-3.5" />}
          {asTable ? 'Chart' : 'Table'}
        </button>
      </figcaption>
      {asTable ? <div className="overflow-x-auto">{table}</div> : children}
      {!asTable && legend && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-2">{legend}</div>}
    </figure>
  )
}

export function LegendKey({ color, label, hatch }: { color: string; label: string; hatch?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cx('inline-block h-2.5 w-3.5 rounded-[2px]', hatch && 'hatch')} style={{ background: hatch ? undefined : color, color }} />
      {label}
    </span>
  )
}

function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="num w-full text-left text-[0.8125rem]">
      <thead>
        <tr className="border-b border-line text-muted">
          {head.map((h, i) => (
            <th key={h} scope="col" className={cx('py-2 pr-3 font-medium', i > 0 && 'text-right')}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line/60 last:border-0">
            {r.map((c, j) => (
              <td key={j} className={cx('py-2 pr-3', j === 0 ? 'text-ink' : 'text-right text-ink-2')}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ---------- Opportunity by category: horizontal stacked bars ---------- */

export function OpportunityChart({ data, onSelect }: { data: CategoryOpportunity[]; onSelect?: (id: string) => void }) {
  const max = Math.max(1, ...data.map((d) => d.total))
  const [hover, setHover] = useState<string | null>(null)
  return (
    <ChartFrame
      title="Where the biggest gains are"
      caption="Value still on the table per category: each open item’s score above 50, summed."
      legend={
        <>
          <LegendKey color="var(--accent)" label="Essential & useful" />
          <LegendKey color="var(--indigo)" label="Optional & luxury" />
        </>
      }
      table={
        <DataTable
          head={['Category', 'Needs', 'Wants', 'Open items', 'Top item']}
          rows={data.map((d) => [d.name, num(d.needs), num(d.wants), num(d.open), d.top?.item.name ?? '—'])}
        />
      }
    >
      <ul className="flex flex-col gap-1">
        {data.map((d) => {
          const active = hover === d.id
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onSelect?.(d.id)}
                onPointerEnter={() => setHover(d.id)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(d.id)}
                onBlur={() => setHover(null)}
                className={cx('group grid w-full grid-cols-[minmax(7.5rem,10rem)_1fr_2.5rem] items-center gap-3 rounded-[8px] px-1.5 py-1.5 text-left transition-colors', active && 'bg-inset/70')}
                aria-label={`${d.name}: ${num(d.total)} value points open (${num(d.needs)} needs, ${num(d.wants)} wants). Show in catalog.`}
              >
                <span className="truncate text-[0.8125rem] text-ink-2 group-hover:text-ink">{d.name}</span>
                <span className="relative flex h-3 items-center gap-[2px]">
                  {d.needs > 0 && <span className="h-3 rounded-l-[2px] bg-accent transition-[width] duration-500" style={{ width: `${(d.needs / max) * 100}%`, borderRadius: d.wants ? '2px 0 0 2px' : '2px 4px 4px 2px' }} />}
                  {d.wants > 0 && <span className="h-3 bg-indigo transition-[width] duration-500" style={{ width: `${(d.wants / max) * 100}%`, borderRadius: d.needs ? '0 4px 4px 0' : '2px 4px 4px 2px' }} />}
                  {d.total === 0 && <span className="h-px w-full bg-line" />}
                  {active && (
                    <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 rounded-[8px] border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[var(--shadow)]">
                      <span className="font-semibold text-ink">{num(d.total)}</span> <span className="text-muted">points open · {d.open} items</span>
                      {d.top && <span className="block text-muted">Top: {d.top.item.name}</span>}
                    </span>
                  )}
                </span>
                <span className="num text-right text-[0.8125rem] text-ink">{num(d.total)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </ChartFrame>
  )
}

/* ---------- Budget meter: spent · wishlist · free ---------- */

export function BudgetMeter({ amount, spent, committed }: { amount: number; spent: number; committed: number }) {
  const over = spent > amount
  const scale = Math.max(amount, spent + committed, 1)
  const pct = (v: number) => `${(v / scale) * 100}%`
  return (
    <div>
      <div
        className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-[4px] bg-inset"
        role="img"
        aria-label={`Spent ${inr(spent)} and ${inr(committed)} on the wishlist, of a ${inr(amount)} budget`}
      >
        {spent > 0 && <span className={cx('h-full', over ? 'bg-bad' : 'bg-accent')} style={{ width: pct(spent) }} />}
        {committed > 0 && <span className="h-full bg-indigo" style={{ width: pct(committed) }} />}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <LegendKey color={over ? 'var(--bad)' : 'var(--accent)'} label={`Spent ${inr(spent)}`} />
        <LegendKey color="var(--indigo)" label={`Wishlist ${inr(committed)} est.`} />
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-[2px] bg-inset" />
          {over ? `Over by ${inr(spent - amount)}` : `Free ${inr(Math.max(0, amount - spent - committed))}`}
        </span>
      </div>
    </div>
  )
}

/* ---------- Value curve: cumulative value against cumulative spend ---------- */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e!.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function ValueCurve({ points, budget, eightyAt }: { points: FrontierPoint[]; budget: number; eightyAt?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const H = 220
  const pad = { l: 40, r: 14, t: 14, b: 28 }
  const all = [{ id: 'start', name: 'Nothing bought', spend: 0, value: 0, inPlan: true }, ...points]
  const maxX = Math.max(budget, ...all.map((p) => p.spend), 1)
  const x = (v: number) => pad.l + (v / maxX) * (width - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v) * (H - pad.t - pad.b)
  const lastIn = all.reduce((i, p, idx) => (p.inPlan ? idx : i), 0)
  const path = (pts: typeof all) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.spend).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const planPts = all.slice(0, lastIn + 1)
  const restPts = all.slice(lastIn)
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const xTicks = [0, maxX / 2, maxX]
  const h = hover !== null ? all[hover] : null

  const onMove = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect()
    const px = clientX - rect.left
    let best = 0
    all.forEach((p, i) => {
      if (Math.abs(x(p.spend) - px) < Math.abs(x(all[best]!.spend) - px)) best = i
    })
    setHover(best)
  }

  return (
    <ChartFrame
      title="What each extra rupee buys"
      caption="Share of all available value captured as you buy in sequence. The line flattens where returns diminish."
      legend={
        <>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4 rounded bg-accent" /> In this plan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4 rounded bg-line-strong" /> Beyond the budget or bar
          </span>
        </>
      }
      table={
        <DataTable
          head={['After buying', 'Total spend', 'Value captured', 'In plan']}
          rows={points.map((p) => [p.name, inr(p.spend), `${Math.round(p.value * 100)}%`, p.inPlan ? 'Yes' : 'No'])}
        />
      }
    >
      <div
        ref={ref}
        className="relative touch-pan-y"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        role="img"
        aria-label={`Value curve. ${points.filter((p) => p.inPlan).length} purchases in plan. Use arrow keys to step through.`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setHover((v) => Math.min(all.length - 1, (v ?? -1) + 1))
          if (e.key === 'ArrowLeft') setHover((v) => Math.max(0, (v ?? 1) - 1))
        }}
        onBlur={() => setHover(null)}
      >
        <svg width={width} height={H} className="block overflow-visible" aria-hidden>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-[var(--muted)] text-[10px]">
                {Math.round(t * 100)}%
              </text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} x={x(t)} y={H - 8} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} className="num fill-[var(--muted)] text-[10px]">
              {inrCompact(t)}
            </text>
          ))}
          <line x1={x(budget)} x2={x(budget)} y1={pad.t} y2={H - pad.b} stroke="var(--ink-2)" strokeWidth={1} />
          <text x={x(budget) - 4} y={pad.t + 10} textAnchor="end" className="fill-[var(--ink-2)] text-[10px]">
            Budget
          </text>
          {eightyAt !== undefined && (
            <g>
              <line x1={x(eightyAt)} x2={x(eightyAt)} y1={y(0)} y2={y(all.find((p) => p.spend === eightyAt)?.value ?? 0)} stroke="var(--accent)" strokeWidth={1} opacity={0.6} />
            </g>
          )}
          <path d={`${path(planPts)} L${x(planPts[planPts.length - 1]!.spend)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="var(--accent)" opacity={0.1} />
          {restPts.length > 1 && <path d={path(restPts)} fill="none" stroke="var(--line-strong)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          <path d={path(planPts)} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(planPts[planPts.length - 1]!.spend)} cy={y(planPts[planPts.length - 1]!.value)} r={4.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          {h && (
            <g>
              <line x1={x(h.spend)} x2={x(h.spend)} y1={pad.t} y2={H - pad.b} stroke="var(--ink)" strokeWidth={1} opacity={0.35} />
              <circle cx={x(h.spend)} cy={y(h.value)} r={4.5} fill={h.inPlan ? 'var(--accent)' : 'var(--muted)'} stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max max-w-[14rem] rounded-[8px] border border-line bg-surface px-2.5 py-1.5 text-xs shadow-[var(--shadow)]"
            style={{ left: Math.min(Math.max(x(h.spend) + 10, 0), width - 200) }}
          >
            <p className="font-semibold text-ink">
              {Math.round(h.value * 100)}% <span className="font-normal text-muted">of value · {inr(h.spend)}</span>
            </p>
            <p className="mt-0.5 text-muted">{hover === 0 ? 'Starting point' : `After ${h.name}${h.inPlan ? '' : ' (not in plan)'}`}</p>
          </div>
        )}
      </div>
    </ChartFrame>
  )
}

/* ---------- Score breakdown: one row per component, one hue ---------- */

export function ScoreBreakdown({ lines }: { lines: Line[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {lines.map((l) => (
        <li key={l.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1">
          <span className="text-[0.8125rem] text-ink">
            {l.label} <span className="text-muted">· {l.detail}</span>
          </span>
          <span className="num text-[0.8125rem] text-ink-2">
            {l.points.toFixed(1)} <span className="text-muted">/ {l.max}</span>
          </span>
          <span className="col-span-2 flex h-1.5 overflow-hidden rounded-full bg-inset" aria-hidden>
            <span className="h-full rounded-full bg-ink-2 transition-[width] duration-500" style={{ width: `${Math.min(100, (l.points / l.max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}
