/** two interfering ring systems and the point where they meet */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <g fill="none" strokeWidth="1.4">
        <circle cx="12.5" cy="16" r="3.6" stroke="var(--color-violet)" />
        <circle cx="12.5" cy="16" r="8" stroke="var(--color-violet)" opacity="0.5" />
        <circle cx="19.5" cy="16" r="3.6" stroke="var(--color-cyan)" />
        <circle cx="19.5" cy="16" r="8" stroke="var(--color-cyan)" opacity="0.5" />
      </g>
      <circle cx="16" cy="16" r="1.6" fill="var(--color-amber)" />
    </svg>
  )
}
