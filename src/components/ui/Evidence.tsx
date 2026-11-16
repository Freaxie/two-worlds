import { EVIDENCE, EVIDENCE_ORDER, type EvidenceKind } from '../../data/evidence'

const TONE: Record<EvidenceKind, string> = {
  clinical: 'text-ink border-line-2',
  research: 'text-cyan border-cyan/35',
  emerging: 'text-violet border-violet/40',
  practice: 'text-ink-2 border-line-2',
  lived: 'text-amber border-amber/40',
}

/** small label saying what kind of claim something is — icon + text, never colour alone */
export function EvidenceBadge({ kind, className = '' }: { kind: EvidenceKind; className?: string }) {
  const e = EVIDENCE[kind]
  const Icon = e.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.6875rem] leading-none tracking-[0.06em] uppercase ${TONE[kind]} ${className}`}
      title={e.description}
    >
      <Icon aria-hidden="true" className="size-3 shrink-0" strokeWidth={2} />
      <span>
        <span className="sr-only">Evidence type: </span>
        {e.label}
      </span>
    </span>
  )
}

export function EvidenceRow({ kinds, className = '' }: { kinds: EvidenceKind[]; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-2 ${className}`}>
      {kinds.map((k) => (
        <EvidenceBadge key={k} kind={k} />
      ))}
    </span>
  )
}

/** the key that explains the badges — shown in the orientation chapter */
export function EvidenceLegend() {
  return (
    <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
      {EVIDENCE_ORDER.map((k) => (
        <div key={k} className="border-t border-line pt-4">
          <dt>
            <EvidenceBadge kind={k} />
          </dt>
          <dd className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{EVIDENCE[k].description}</dd>
        </div>
      ))}
    </dl>
  )
}
