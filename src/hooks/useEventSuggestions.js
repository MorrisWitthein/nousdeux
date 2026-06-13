import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

// Mirrors useEvents: load the pending suggestions directed at the current user
// and subscribe to the suggestions SSE stream so a new one (or an accept/decline
// by the other user) refreshes the list without a reload.
export function useEventSuggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch(`${API}/api/event-suggestions`, { headers: authHeaders() })
    if (res.ok) setSuggestions(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/event-suggestions/stream?token=${token}`, refresh)
  }, [])

  const suggestEvent = async (event) => {
    const res = await fetch(`${API}/api/event-suggestions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(event),
    })
    if (res.ok) {
      const created = await res.json()
      refresh()
      return created
    }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
    return null
  }

  const acceptSuggestion = async (id) => {
    const res = await fetch(`${API}/api/event-suggestions/${id}/accept`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (res.ok) { refresh(); return }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
  }

  const declineSuggestion = async (id) => {
    const res = await fetch(`${API}/api/event-suggestions/${id}/decline`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (res.ok) { refresh(); return }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
  }

  return { suggestions, loading, suggestEvent, acceptSuggestion, declineSuggestion }
}
