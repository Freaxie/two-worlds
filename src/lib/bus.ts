/* tiny cross-section messaging: lets any chapter open the toolkit on a given category */

export const TOOLKIT_EVENT = 'nim:toolkit-filter'

export function openToolkit(category: string) {
  window.dispatchEvent(new CustomEvent(TOOLKIT_EVENT, { detail: category }))
  const el = document.getElementById('toolkit')
  if (el) {
    const reduce = document.documentElement.dataset.motion === 'reduced'
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
}
