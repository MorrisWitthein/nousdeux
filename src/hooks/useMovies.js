import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

export function useMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch(`${API}/api/movies`, { headers: authHeaders() })
    if (res.ok) setMovies(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/movies/stream?token=${token}`, refresh)
  }, [])

  const addMovie = async (item) => {
    const res = await fetch(`${API}/api/movies`, {
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
  const searchMovies = async (query) => {
    const res = await fetch(
      `${API}/api/movies/image?q=${encodeURIComponent(query)}`,
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
  const fetchMovieDetail = async (tmdbId) => {
    const res = await fetch(`${API}/api/movies/image?tmdbId=${tmdbId}`, {
      headers: authHeaders(),
    })
    if (!res.ok) {
      handleUnauth(res)
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Details laden fehlgeschlagen (${res.status})`)
    }
    return res.json() // { genres, platform }
  }

  // Persists (or clears, when url is '') the poster on a movie row.
  const patchMovieImage = async (id, url) => {
    const patchRes = await fetch(`${API}/api/movies/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    })
    if (!patchRes.ok) {
      handleUnauth(patchRes)
      if (patchRes.status !== 401) throw new Error(`Poster speichern fehlgeschlagen`)
    }
  }

  const updateMovie = async (id, fields) => {
    const res = await fetch(`${API}/api/movies?id=${id}`, {
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

  const deleteMovie = async (id) => {
    const res = await fetch(`${API}/api/movies?id=${id}`, {
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

  return { movies, loading, addMovie, updateMovie, deleteMovie, searchMovies, fetchMovieDetail, patchMovieImage }
}
