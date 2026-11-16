import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type Props = {
  id: string
  num: string
  kicker: string
  title: ReactNode
  dek?: ReactNode
  aside?: ReactNode
  className?: string
}

/** editorial chapter opener: running number, kicker, expressive title, dek */
export function ChapterHeader({ id, num, kicker, title, dek, aside, className = '' }: Props) {
  return (
    <header className={`grid grid-cols-12 gap-x-6 gap-y-8 ${className}`}>
      <Reveal className="col-span-12 flex items-center gap-4 text-ink-3" y={0}>
        <span className="eyebrow text-amber">{num}</span>
        <span aria-hidden="true" className="h-px w-10 bg-line-2" />
        <span className="eyebrow">{kicker}</span>
      </Reveal>
      <div className={aside ? 'col-span-12 lg:col-span-8' : 'col-span-12 lg:col-span-10'}>
        <Reveal delay={0.06}>
          <h2 id={`${id}-title`} className="display text-[clamp(2.6rem,1.5rem+4.4vw,6rem)] text-ink">
            {title}
          </h2>
        </Reveal>
        {dek && (
          <Reveal delay={0.14}>
            <div className="lede mt-8 max-w-[40rem]">{dek}</div>
          </Reveal>
        )}
      </div>
      {aside && (
        <Reveal delay={0.2} className="col-span-12 self-end lg:col-span-4">
          {aside}
        </Reveal>
      )}
    </header>
  )
}
