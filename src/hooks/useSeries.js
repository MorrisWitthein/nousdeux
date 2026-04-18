import { useState, useEffect } from 'react'

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

  const updateSeries = async (id, fields) => {
    const res = await fetch(`${API}/api/series?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(fields),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteSeries = async (id) => {
    const res = await fetch(`${API}/api/series?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { series, addSeries, updateSeries, deleteSeries }
}
