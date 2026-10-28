import {
  Armchair,
  Ban,
  Check,
  CheckCheck,
  CircleCheck,
  CircleMinus,
  CircleHelp,
  CircuitBoard,
  Clock,
  CookingPot,
  Dumbbell,
  Gem,
  Laptop,
  LifeBuoy,
  Moon,
  Package,
  Scissors,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId, ItemClass, ItemStatus } from '../domain/types'
import { CLASS_META, STATUS_META } from '../domain/taxonomy'
import type { TierEval, Verdict, VerdictKind } from '../engine/scoring'
import { cx, inr, inrRange } from '../lib/format'

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  daily: Package,
  fitness: Dumbbell,
  grooming: Scissors,
  sleep: Moon,
  focus: Timer,
  room: Armchair,
  tech: Laptop,
  kitchen: CookingPot,
  making: CircuitBoard,
  safety: LifeBuoy,
  convenience: Zap,
  luxury: Gem,
}

export function CategoryGlyph({ id, size = 'md' }: { id: CategoryId; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = CATEGORY_ICONS[id]
  return (
    <span
      aria-hidden
      className={cx(
        'grid shrink-0 place-items-center rounded-[10px] border border-line bg-inset/70 text-ink-2',
        size === 'sm' ? 'size-8' : size === 'lg' ? 'size-14 rounded-[14px]' : 'size-10',
      )}
    >
      <Icon className={size === 'lg' ? 'size-6' : 'size-[18px]'} strokeWidth={1.5} />
    </span>
  )
}

/** Needs are solid squares; discretionary purchases are outlined and hatched, so the split never relies on colour */
export function ClassMark({ value, withLabel = true, className }: { value: ItemClass; withLabel?: boolean; className?: string }) {
  const meta = CLASS_META[value]
  const tone = { essential: 'text-accent', useful: 'text-indigo', optional: 'text-muted', luxury: 'text-brass' }[value]
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-medium text-ink-2', className)} title={meta.blurb}>
      <span
        aria-hidden
        className={cx(
          'inline-block size-2.5 shrink-0',
          tone,
          meta.discretionary ? 'hatch rounded-[2px] border border-current' : 'rounded-[2px] bg-current',
          value === 'luxury' && 'rotate-45 rounded-[1px]',
        )}
      />
      {withLabel && meta.label}
    </span>
  )
}

/** A thin ring gauge with the number in the middle */
export function ScoreRing({ score, size = 44, label = 'Score' }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  const tone = score >= 80 ? 'var(--accent)' : score >= 65 ? 'var(--ink)' : score >= 50 ? 'var(--ink-2)' : 'var(--muted)'
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label} ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={2.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
          style={{ transition: 'stroke-dasharray 0.6s var(--ease-soft)' }}
        />
      </svg>
      <span aria-hidden className={cx('absolute font-semibold tracking-tight text-ink', size >= 56 ? 'text-lg' : 'text-[0.8125rem]')}>
        {score}
      </span>
    </span>
  )
}

const VERDICT_STYLE: Record<VerdictKind, { icon: LucideIcon; cls: string }> = {
  'buy-now': { icon: CircleCheck, cls: 'text-good border-good/35 bg-good/8' },
  'buy-if': { icon: CircleHelp, cls: 'text-ink border-line-strong bg-surface' },
  wait: { icon: Clock, cls: 'text-warn border-warn/35 bg-warn/8' },
  skip: { icon: CircleMinus, cls: 'text-muted border-line-strong bg-inset/60' },
  covered: { icon: CheckCheck, cls: 'text-good border-good/35 bg-good/8' },
  'not-needed': { icon: Ban, cls: 'text-muted border-line-strong bg-inset/60' },
}

export function VerdictPill({ verdict, className }: { verdict: Verdict; className?: string }) {
  const { icon: Icon, cls } = VERDICT_STYLE[verdict.kind]
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap', cls, className)}>
      <Icon aria-hidden className="size-3.5" strokeWidth={2} />
      {verdict.label}
    </span>
  )
}

/** Price with its provenance always attached: verified, or an illustrative estimate */
export function PriceTag({ tier, compact = false }: { tier: TierEval; compact?: boolean }) {
  if (tier.verified) {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-semibold text-ink">{inr(tier.verified.price)}</span>
        <span className="inline-flex items-center gap-0.5 text-[0.6875rem] font-medium text-good">
          <Check aria-hidden className="size-3" strokeWidth={2.5} />
          verified
        </span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-baseline gap-1.5" title="Illustrative estimate for the Indian market, not a live price. Verify before buying.">
      <span className="font-semibold text-ink">{compact ? `~${inr(tier.price)}` : inrRange(tier.priceMin, tier.priceMax)}</span>
      <span className="text-[0.6875rem] text-muted">est.</span>
    </span>
  )
}

const STATUS_TONE: Partial<Record<ItemStatus, string>> = {
  wishlist: 'bg-ink text-on-ink',
  purchased: 'bg-good/12 text-good',
  owned: 'bg-good/12 text-good',
  deferred: 'bg-warn/12 text-warn',
  unnecessary: 'bg-inset text-muted line-through decoration-1',
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  if (status === 'candidate') return null
  return <span className={cx('inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] font-medium', STATUS_TONE[status])}>{STATUS_META[status].label}</span>
}
