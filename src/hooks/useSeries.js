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

export function useSeries() {
  const [series, setSeries] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/series`, { headers: authHeaders() })
    if (res.ok) setSeries(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
    const token = localStorage.getItem('token')
    const es = new EventSource(`${API}/api/series/stream?token=${token}`)
    es.onmessage = () => refresh()
    return () => es.close()
  }, [])

  const addSeries = async (item) => {
    const res = await fetch(`${API}/api/series`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(item),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { series, addSeries }
}
