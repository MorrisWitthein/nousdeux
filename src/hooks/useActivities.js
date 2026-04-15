import { useState, useEffect } from 'react'
import { mockDb } from '../mock/db.js'

export function useActivities() {
  const [activities, setActivities] = useState([])

  const refresh = async () => {
    const data = await mockDb.select('activities')
    setActivities(data)
  }

  useEffect(() => {
    refresh()
    return mockDb.subscribe('activities', refresh)
  }, [])

  const addActivity = (activity) => mockDb.insert('activities', activity)

  return { activities, addActivity }
}
