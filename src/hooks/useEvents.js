import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function handleUnauth(res) {
  if (res.status === 401 && window.__nosdeux_logout) window.__nosdeux_logout()
}

export function useEvents() {
  const [events, setEvents] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/events`, { headers: authHeaders() })
    if (res.ok) setEvents(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
    const token = localStorage.getItem('token')
    const es = new EventSource(`${API}/api/events/stream?token=${token}`)
    es.onmessage = () => refresh()
    return () => es.close()
  }, [])

  const addEvent = async (event) => {
    const res = await fetch(`${API}/api/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(event),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteEvent = async (id) => {
    const res = await fetch(`${API}/api/events?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { events, addEvent, deleteEvent }
}
