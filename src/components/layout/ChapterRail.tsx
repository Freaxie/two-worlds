import { CHAPTERS } from '../../data/chapters'
import { useActiveSection } from '../../lib/hooks'

const IDS = CHAPTERS.map((c) => c.id)

/** quiet vertical index on wide screens; a mouse convenience that mirrors the main nav */
export function ChapterRail() {
  const active = useActiveSection(IDS)
  const idx = IDS.indexOf(active)
  return (
    <div aria-hidden="true" className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 2xl:block">
      <ol className="flex flex-col items-end gap-3">
        {CHAPTERS.map((c, i) => {
          const on = c.id === active
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                tabIndex={-1}
                className="group flex items-center justify-end gap-3 py-0.5 no-underline"
              >
                <span
                  className={`font-mono text-[0.6875rem] tracking-[0.08em] uppercase transition-all duration-500 ${
                    on ? 'translate-x-0 text-ink opacity-100' : 'translate-x-1 text-ink-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`}
                >
                  {c.label}
                </span>
                <span
                  className={`block h-px transition-all duration-500 ${
                    on ? 'w-8 bg-amber' : i < idx ? 'w-4 bg-ink-3 group-hover:w-6' : 'w-3 bg-ink-4 group-hover:w-6'
                  }`}
                />
              </a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
