import type { ItemStatus, Purchase } from '../domain/types'
import { toast } from '../components/overlay'
import { dispatch, store } from './store'

/* Status changes go through here so every one can be undone from the toast */

const MESSAGES: Record<ItemStatus, string> = {
  candidate: 'Status cleared',
  wishlist: 'Added to wishlist',
  deferred: 'Deferred until later',
  purchased: 'Marked as purchased. Rate it in a couple of weeks.',
  owned: 'Marked as owned',
  unnecessary: 'Marked as not needed',
}

export function setStatus(id: string, status: ItemStatus, name: string, purchase?: Purchase) {
  const before = store.getState().items[id]
  const toggledOff = before?.status === status && status !== 'purchased'
  const next = toggledOff ? 'candidate' : status
  dispatch({ type: 'item/status', id, status: next, purchase })
  toast(toggledOff ? `${name}: status cleared` : `${name}: ${MESSAGES[next].charAt(0).toLowerCase()}${MESSAGES[next].slice(1)}`, {
    label: 'Undo',
    run: () => dispatch({ type: 'item/restore', id, state: before }),
  })
}

export function setManyStatus(ids: string[], status: ItemStatus, message: string) {
  const before = Object.fromEntries(ids.map((id) => [id, store.getState().items[id]]))
  dispatch({ type: 'items/status', ids, status })
  toast(message, {
    label: 'Undo',
    run: () => {
      for (const id of ids) dispatch({ type: 'item/restore', id, state: before[id] })
    },
  })
}
