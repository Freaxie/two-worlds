import { test } from 'vitest'
import { writeFileSync } from 'node:fs'
const out: string[] = []
const log = (...a: unknown[]) => out.push(a.join(' '))
import { createDefaultState } from '../state/defaults'
import { buildModel } from './model'
import { planPurchases } from './planner'

test('print ranking', () => {
  const m = buildModel(createDefaultState())
  const rows = [...m.evals].sort((a, b) => b.score - a.score)
  for (const e of rows) {
    log(
      String(e.score).padStart(3), e.priority.padEnd(8), e.item.class.padEnd(9), e.tier.padEnd(8),
      ('₹' + e.current.price).padEnd(8), 'VI', String(e.current.valueIndex).padStart(3), e.verdict.label.padEnd(18), e.item.id,
      e.modifiers.map((x) => x.key).join(','),
    )
  }
  for (const b of [2000, 5000, 10000, 25000, 50000]) {
    for (const mode of ['minimum', 'balanced', 'premium'] as const) {
      const p = planPurchases(m.evals, mode, { budget: b, floor: 55, includeLuxury: false })
      log(`\n${mode} @ ₹${b}: spend ₹${p.total}, keep ₹${p.leftover}, utility ${p.utility.toFixed(0)}/${p.potential.toFixed(0)} (${Math.round(p.share * 100)}%), 80% at ₹${p.eightyAt}`)
      log('  ' + p.lines.map((l) => `${l.id}[${l.tier[0]}]₹${l.price}${l.dependencyOf.length ? '(dep)' : ''}${l.diminishing ? '(dim)' : ''}`).join(' · '))
    }
  }
  writeFileSync(process.env.CAL_OUT ?? 'cal.txt', out.join('\n'))
})
