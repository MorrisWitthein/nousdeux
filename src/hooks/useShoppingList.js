import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'

const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function handleUnauth(res) {
  if (res.status === 401 && window.__nousdeux_logout) window.__nousdeux_logout()
}

export function useShoppingList() {
  const [items, setItems] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/shopping`, { headers: authHeaders() })
    if (res.ok) setItems(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/shopping/stream?token=${token}`, refresh)
  }, [])

  const history = [...new Set(items.map(i => i.name))]

  const addItem = async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const res = await fetch(`${API}/api/shopping`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) refresh()
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
