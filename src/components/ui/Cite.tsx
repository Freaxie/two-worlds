import { REF_BY_ID } from '../../data/references'

/** inline citation that jumps to the full reference in the Resources chapter */
export function Cite({ ids, bare = false }: { ids: string[]; bare?: boolean }) {
  const refs = ids.map((id) => REF_BY_ID[id]).filter(Boolean)
  if (!refs.length) return null
  const body = refs.map((r, i) => (
    <span key={r.id}>
      {i > 0 && '; '}
      <a href={`#ref-${r.id}`} className="link whitespace-nowrap text-ink-2 hover:text-ink">
        {r.short}
      </a>
    </span>
  ))
  return <span className="text-[0.92em]">{bare ? body : <>({body})</>}</span>
}
