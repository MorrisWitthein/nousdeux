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

export function useActivities() {
  const [activities, setActivities] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/activities`, { headers: authHeaders() })
    if (res.ok) setActivities(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
    const token = localStorage.getItem('token')
    const es = new EventSource(`${API}/api/activities/stream?token=${token}`)
    es.onmessage = () => refresh()
    return () => es.close()
  }, [])

  const addActivity = async (activity) => {
    const res = await fetch(`${API}/api/activities`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(activity),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteActivity = async (id) => {
    const res = await fetch(`${API}/api/activities?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { activities, addActivity, deleteActivity }
}
