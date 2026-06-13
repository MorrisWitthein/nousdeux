import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

// Mirrors useEvents: loads the suggestions that involve the current user and
// subscribes to the suggestions SSE stream so a new request, a counter-proposal,
// or an accept/decline by the other user refreshes the lists without a reload.
//
// The API returns two lists: `received` (pending and awaiting my response) and
// `sent` (threads I started, for status tracking).
export function useEventSuggestions() {
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch(`${API}/api/event-suggestions`, { headers: authHeaders() })
    if (res.ok) {
      const data = await res.json()
      setReceived(data.received ?? [])
      setSent(data.sent ?? [])
    } else handleUnauth(res)
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

  // post sends a body-less or JSON action to an /{id}/{action} endpoint.
  const action = async (id, name, body) => {
    const res = await fetch(`${API}/api/event-suggestions/${id}/${name}`, {
      method: 'POST',
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.ok) { refresh(); return }
    handleUnauth(res)
    if (res.status !== 401) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Fehler ${res.status}`)
    }
  }

  const acceptSuggestion = (id) => action(id, 'accept')
  const declineSuggestion = (id) => action(id, 'decline')
  const counterSuggestion = (id, fields) => action(id, 'counter', fields)

  return { received, sent, loading, suggestEvent, acceptSuggestion, declineSuggestion, counterSuggestion }
}
