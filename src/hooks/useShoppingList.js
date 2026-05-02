import { useState, useEffect, useCallback } from 'react'

// Extracts an optional leading quantity+unit prefix from free-text input.
// "4 Bananen" → {qty:"4", name:"Bananen"}
// "200g Joghurt" → {qty:"200g", name:"Joghurt"}
// "500 ml Milch" → {qty:"500 ml", name:"Milch"}
// "Bananen" → {qty:"", name:"Bananen"}
export function parseQty(input) {
  const m = input.match(/^(\d+\s*[a-zA-ZäöüÄÖÜ]*)\s+(.+)/)
  if (m) return { qty: m[1].trim(), name: m[2].trim() }
  return { qty: '', name: input.trim() }
}
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

export function useShoppingList() {
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])

  const refreshHistory = useCallback(async () => {
    const res = await fetch(`${API}/api/shopping/history`, { headers: authHeaders() })
    if (res.ok) setHistory(await res.json())
  }, [])

  const refresh = useCallback(async () => {
    const res = await fetch(`${API}/api/shopping`, { headers: authHeaders() })
    if (res.ok) setItems(await res.json())
    else handleUnauth(res)
  }, [])

  useEffect(() => {
    refresh()
    refreshHistory()
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/shopping/stream?token=${token}`, refresh)
  }, [])

  const addItem = async (input) => {
    const trimmed = input.trim()
    if (!trimmed) return
    const { qty, name } = parseQty(trimmed)
    const res = await fetch(`${API}/api/shopping`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, qty }),
    })
    if (res.ok) { refresh(); refreshHistory() }
    else handleUnauth(res)
  }

  const toggleItem = async (id, currentChecked) => {
    const res = await fetch(`${API}/api/shopping?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ checked: !currentChecked }),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteItem = async (id) => {
    const res = await fetch(`${API}/api/shopping?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const clearChecked = async () => {
    const checked = items.filter(i => i.checked)
    await Promise.all(checked.map(i =>
      fetch(`${API}/api/shopping?id=${i.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    ))
    refresh()
  }

  return { items, history, addItem, toggleItem, deleteItem, clearChecked }
}
