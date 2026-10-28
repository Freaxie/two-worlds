import { describe, expect, test } from 'vitest'
import { createDefaultState } from './defaults'
import { reducer } from './store'
import { exportEnvelope, listing, parseState, ValidationError } from './validation'

describe('reducer', () => {
  test('purchasing records the purchase; un-purchasing clears it and its review', () => {
    let s = createDefaultState()
    s = reducer(s, { type: 'item/status', id: 'kitchen-scale', status: 'purchased', purchase: { price: 899, date: '2026-10-01' } })
    expect(s.items['kitchen-scale']!.purchase?.price).toBe(899)
    s = reducer(s, { type: 'item/review', id: 'kitchen-scale', review: { usefulness: 5, usage: 'daily', solved: 'yes', buyAgain: true, ratedAt: '' } })
    s = reducer(s, { type: 'item/status', id: 'kitchen-scale', status: 'candidate' })
    expect(s.items['kitchen-scale']!.purchase).toBeUndefined()
    expect(s.items['kitchen-scale']!.review).toBeUndefined()
  })

  test('goal weights are clamped to 0–5 and budgets to sane amounts', () => {
    let s = reducer(createDefaultState(), { type: 'goals/set', goal: 'fitness', weight: 9 })
    expect(s.goals.fitness).toBe(5)
    s = reducer(s, { type: 'budget/set', amount: -50 })
    expect(s.budget.amount).toBe(0)
  })

  test('restoring a previous item state undoes a change', () => {
    const s0 = createDefaultState()
    const s1 = reducer(s0, { type: 'item/status', id: 'pillow', status: 'owned' })
    const s2 = reducer(s1, { type: 'item/restore', id: 'pillow', state: s0.items.pillow })
    expect(s2.items.pillow).toBeUndefined()
  })
})

describe('import/export', () => {
  test('an export round-trips exactly', () => {
    let s = createDefaultState()
    s = reducer(s, { type: 'item/patch', id: 'pillow', patch: { notes: 'Side sleeper', priceTarget: 1800, targetDate: '2026-12-01' } })
    s = reducer(s, { type: 'item/status', id: 'pillow', status: 'wishlist' })
    const round = parseState(JSON.parse(JSON.stringify(exportEnvelope(s))))
    expect(round.items.pillow).toEqual(s.items.pillow)
    expect(round.goals).toEqual(s.goals)
  })

  test('rejects files that are not exports of this app', () => {
    expect(() => parseState({ hello: 'world' })).toThrow(ValidationError)
    expect(() => parseState('nope')).toThrow(ValidationError)
  })

  test('drops invalid entries instead of failing the whole import', () => {
    const s = createDefaultState() as unknown as Record<string, unknown>
    const parsed = parseState({ ...s, items: { pillow: { status: 'owned' }, 'Bad ID!': { status: 'owned' }, sunscreen: { status: 'banana' } } })
    expect(Object.keys(parsed.items)).toEqual(['pillow'])
  })

  test('a purchased item without purchase details becomes owned', () => {
    const s = createDefaultState() as unknown as Record<string, unknown>
    expect(parseState({ ...s, items: { pillow: { status: 'purchased' } } }).items.pillow!.status).toBe('owned')
  })
})

describe('listings', () => {
  test('a price is only verified with a source and a date', () => {
    expect(listing({ itemId: 'kitchen-scale', brand: 'Acme', model: 'K1', price: 999, priceStatus: 'verified' })!.priceStatus).toBe('estimate')
    expect(
      listing({ itemId: 'kitchen-scale', brand: 'Acme', model: 'K1', price: 999, priceStatus: 'verified', source: 'Store page', verifiedAt: '2026-10-20' })!.priceStatus,
    ).toBe('verified')
  })

  test('non-http links are dropped', () => {
    expect(listing({ itemId: 'x', brand: 'A', model: 'B', url: 'javascript:alert(1)' })!.url).toBeUndefined()
  })
})
