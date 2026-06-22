import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

// Legacy rows predate the "Fertig" → "Gesehen" watched-status rename; normalise
// them so watched series still collapse into the "Gesehen" dropdown and count
// correctly on the home screen, even before the API data migration has run.
const normalizeStatus = (s) =>
  s.status === 'Fertig' ? { ...s, status: 'Gesehen', statusType: 'red' } : s

export function useSeries() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch(`${API}/api/series`, { headers: authHeaders() })
    if (res.ok) setSeries((await res.json()).map(normalizeStatus))
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

  // Searches TMDB and returns all candidate titles so the user can pick the
  // right one: [{ tmdbId, title, year, posterUrl }]. Nothing is persisted.
  const searchSeries = async (query) => {
    const res = await fetch(
      `${API}/api/series/image?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() }
    )
    if (!res.ok) {
      handleUnauth(res)
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Suche fehlgeschlagen (${res.status})`)
    }
    const data = await res.json()
    return data.results || []
  }

  // Fetches genres + platform for one chosen TMDB title (by id).
  const fetchSeriesDetail = async (tmdbId) => {
    const res = await fetch(`${API}/api/series/image?tmdbId=${tmdbId}`, {
      headers: authHeaders(),
    })
    if (!res.ok) {
      handleUnauth(res)
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Details laden fehlgeschlagen (${res.status})`)
    }
    return res.json() // { genres, platform }
  }

  // Persists (or clears, when url is '') the poster on a series row.
  const patchSeriesImage = async (id, url) => {
    const patchRes = await fetch(`${API}/api/series/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    })
    if (!patchRes.ok) {
      handleUnauth(patchRes)
      if (patchRes.status !== 401) throw new Error(`Poster speichern fehlgeschlagen`)
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

  return { series, loading, addSeries, updateSeries, deleteSeries, searchSeries, fetchSeriesDetail, patchSeriesImage }
}
