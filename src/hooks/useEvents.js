import { useState, useEffect } from 'react'
import { mockDb } from '../mock/db.js'

export function useEvents() {
  const [events, setEvents] = useState([])

  const refresh = async () => {
    const data = await mockDb.select('events')
    setEvents(data)
  }

  useEffect(() => {
    refresh()
    return mockDb.subscribe('events', refresh)
  }, [])

  const addEvent = (event) => mockDb.insert('events', event)

  return { events, addEvent }
}
