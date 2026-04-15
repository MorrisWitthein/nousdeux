/**
 * Mock in-memory database server.
 *
 * Mirrors the async interface the real Supabase hooks will use, so swapping
 * to the real backend only requires changing the hook implementations —
 * the tab components stay untouched.
 *
 * Supports:
 *   - select(table)        → returns all rows
 *   - insert(table, item)  → adds a row, notifies subscribers
 *   - subscribe(table, cb) → calls cb whenever the table changes
 *                            returns an unsubscribe function
 */

import { initialData } from '../data.js'

// Deep-copy initial data so mutations don't affect the source
let store = {
  events:     [...initialData.events],
  recipes:    [...initialData.recipes],
  series:     [...initialData.series],
  activities: [...initialData.activities],
}

const listeners = {}

function notify(table) {
  ;(listeners[table] ?? []).forEach(cb => cb())
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockDb = {
  /** Subscribe to changes on a table. Returns an unsubscribe function. */
  subscribe(table, callback) {
    if (!listeners[table]) listeners[table] = []
    listeners[table].push(callback)
    return () => {
      listeners[table] = listeners[table].filter(cb => cb !== callback)
    }
  },

  /** Fetch all rows from a table (newest first by id). */
  async select(table) {
    await delay(40)
    return [...store[table]]
  },

  /** Insert a new row. The mock assigns an id if not provided. */
  async insert(table, item) {
    await delay(80)
    const newItem = { id: Date.now(), ...item }
    store[table] = [newItem, ...store[table]]
    notify(table)
    return newItem
  },

  /** Delete a row by id. */
  async delete(table, id) {
    await delay(80)
    store[table] = store[table].filter(item => item.id !== id)
    notify(table)
  },
}
