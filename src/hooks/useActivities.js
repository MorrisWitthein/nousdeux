import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export function useActivities() {
  const [activities, setActivities] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/activities`)
    if (res.ok) setActivities(await res.json())
  }

  useEffect(() => {
    refresh()
  }, [])

  const addActivity = async (activity) => {
    const res = await fetch(`${API}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity),
    })
    if (res.ok) refresh()
  }

  return { activities, addActivity }
}
