export type Chapter = { id: string; num: string; label: string }

export const CHAPTERS: Chapter[] = [
  { id: 'top', num: '00', label: 'Prologue' },
  { id: 'orientation', num: '01', label: 'Orientation' },
  { id: 'engine', num: '02', label: 'Contradictions' },
  { id: 'inner', num: '03', label: 'Inner experience' },
  { id: 'reflection', num: '04', label: 'Reflection' },
  { id: 'masking', num: '05', label: 'Masking' },
  { id: 'toolkit', num: '06', label: 'Toolkit' },
  { id: 'resources', num: '07', label: 'Resources' },
  { id: 'coda', num: '08', label: 'Coda' },
]

/** chapters shown as links in the desktop navigation */
export const NAV_CHAPTERS = CHAPTERS.filter((c) => !['top', 'coda'].includes(c.id))
