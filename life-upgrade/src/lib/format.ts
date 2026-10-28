const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const numFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** ₹1,00,000 — Indian digit grouping */
export const inr = (n: number) => inrFmt.format(Math.round(n))

export const num = (n: number) => numFmt.format(Math.round(n))

/** ₹1.2k, ₹45k, ₹1.5L — for axis ticks and tight labels */
export function inrCompact(n: number) {
  const a = Math.abs(n)
  if (a >= 100000) return `₹${trim(n / 100000)}L`
  if (a >= 1000) return `₹${trim(n / 1000)}k`
  return `₹${Math.round(n)}`
}

const trim = (n: number) => (Math.round(n * 10) / 10).toString()

export const inrRange = (lo: number, hi: number) => (lo === hi ? inr(lo) : `${inr(lo)}–${num(hi)}`)

export function date(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`

export function months(n: number) {
  if (n < 1) return `${Math.max(1, Math.round(n * 4.3))} weeks`
  if (n < 24) return plural(Math.round(n), 'month')
  return `${trim(n / 12)} years`
}

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')
