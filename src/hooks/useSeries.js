import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

export function useSeries() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch(`${API}/api/series`, { headers: authHeaders() })
    if (res.ok) setSeries(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/series/stream?token=${token}`, refresh)
  }, [])

  const addSeries = async (item) => {
    const res = await fetch(`${API}/api/series`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(item),
    })
    if (res.ok) {
      const created = await res.json()
      refresh()
      return created.id
    }
    handleUnauth(res)
    if (res.status !== 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Fehler ${res.status}`)
    }
  }

  const setSeriesImage = async (id, query) => {
    const imgRes = await fetch(
      `${API}/api/series/image?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() }
    )
    if (!imgRes.ok) {
      const err = await imgRes.json().catch(() => ({}))
      throw new Error(err.error || `Bildfehler ${imgRes.status}`)
    }
    const { url } = await imgRes.json()
    const patchRes = await fetch(`${API}/api/series/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    })
    if (!patchRes.ok) throw new Error(`Bild speichern fehlgeschlagen`)
  }

  const clearSeriesImage = async (id) => {
    const res = await fetch(`${API}/api/series/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url: '' }),
    })
    if (!res.ok) {
      handleUnauth(res)
      if (res.status !== 401) throw new Error(`Bild entfernen fehlgeschlagen`)
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

  return { series, loading, addSeries, updateSeries, deleteSeries, setSeriesImage, clearSeriesImage }
}
