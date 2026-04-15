import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export function useEvents() {
  const [events, setEvents] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/events`)
    if (res.ok) setEvents(await res.json())
  }

  useEffect(() => {
    refresh()
  }, [])

  const addEvent = async (event) => {
    const res = await fetch(`${API}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    if (res.ok) refresh()
  }

  return { events, addEvent }
}
