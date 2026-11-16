import type { ReactNode } from 'react'

/* ------------------------------------------------------------------
   Glyphs for the two systems and their overlap. Shape always carries
   the meaning (diamond / circle / ring), colour only reinforces it.
------------------------------------------------------------------- */

export type Sys = 'a' | 'b' | 'both'

export const SYS_LABEL: Record<Sys, string> = {
  a: 'Autism-associated',
  b: 'ADHD-associated',
  both: 'Shared or overlapping',
}

export function SysMark({ sys, size = 12, className = '' }: { sys: Sys; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      {sys === 'a' && <rect x="2.4" y="2.4" width="7.2" height="7.2" transform="rotate(45 6 6)" fill="var(--color-violet)" />}
      {sys === 'b' && <circle cx="6" cy="6" r="4.4" fill="var(--color-cyan)" />}
      {sys === 'both' && (
        <>
          <circle cx="6" cy="6" r="4.6" fill="none" stroke="var(--color-amber)" strokeWidth="1.6" />
          <circle cx="6" cy="6" r="1.7" fill="var(--color-amber)" />
        </>
      )}
    </svg>
  )
}

export function SysTag({ sys, children, className = '' }: { sys: Sys; children?: ReactNode; className?: string }) {
  const tone = sys === 'a' ? 'text-violet' : sys === 'b' ? 'text-cyan' : 'text-amber'
  return (
    <span className={`inline-flex items-center gap-2 eyebrow ${tone} ${className}`}>
      <SysMark sys={sys} size={11} />
      {children ?? SYS_LABEL[sys]}
    </span>
  )
}
