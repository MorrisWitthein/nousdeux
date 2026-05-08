import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

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
    return connectStream(`${API}/api/series/stream?token=${token}`, refresh)
  }, [])

  const addSeries = async (item) => {
    const res = await fetch(`${API}/api/series`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(item),
    })
    if (res.ok) { refresh(); return }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
  }

  const updateSeries = async (id, fields) => {
    const res = await fetch(`${API}/api/series?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(fields),
    })
    if (res.ok) { refresh(); return }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
  }

  const deleteSeries = async (id) => {
    const res = await fetch(`${API}/api/series?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) { refresh(); return }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
  }

  return { series, addSeries, updateSeries, deleteSeries }
}
