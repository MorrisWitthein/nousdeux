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
    return connectStream(`${API}/api/activities/stream?token=${token}`, refresh)
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

  const updateActivity = async (id, fields) => {
    const res = await fetch(`${API}/api/activities?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(fields),
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

  return { activities, addActivity, updateActivity, deleteActivity }
}
