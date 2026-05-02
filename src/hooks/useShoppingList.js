import { useState, useEffect, useCallback } from 'react'

const STORE_KEY = 'nousdeux_shopping'
const HISTORY_KEY = 'nousdeux_shopping_history'

function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) ?? [] } catch { return [] }
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [] } catch { return [] }
}

function saveItems(items) {
  localStorage.setItem(STORE_KEY, JSON.stringify(items))
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function useShoppingList() {
  const [items, setItems] = useState(loadItems)
  const [history, setHistory] = useState(loadHistory)

  useEffect(() => { saveItems(items) }, [items])
  useEffect(() => { saveHistory(history) }, [history])

  const addItem = useCallback((name, who) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const item = { id: Date.now(), name: trimmed, checked: false, who }
    setItems(prev => [item, ...prev])
    setHistory(prev => {
      const merged = [trimmed, ...prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase())]
      return merged.slice(0, 100)
    })
  }, [])

  const toggleItem = useCallback((id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }, [])

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearChecked = useCallback(() => {
    setItems(prev => prev.filter(i => !i.checked))
  }, [])

  return { items, history, addItem, toggleItem, deleteItem, clearChecked }
}
