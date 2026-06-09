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

  // Fetches poster + metadata (genres, platform) from TMDB without persisting.
  const fetchMovieMeta = async (query) => {
    const imgRes = await fetch(
      `${API}/api/movies/image?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() }
    )
    if (!imgRes.ok) {
      const err = await imgRes.json().catch(() => ({}))
      throw new Error(err.error || `Bildfehler ${imgRes.status}`)
    }
    return imgRes.json() // { url, genres, platform }
  }

  const patchMovieImage = async (id, url) => {
    const patchRes = await fetch(`${API}/api/movies/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    })
    if (!patchRes.ok) throw new Error(`Bild speichern fehlgeschlagen`)
  }

  const setMovieImage = async (id, query) => {
    const { url } = await fetchMovieMeta(query)
    await patchMovieImage(id, url)
  }

  const clearMovieImage = async (id) => {
    const res = await fetch(`${API}/api/movies/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url: '' }),
    })
    if (!res.ok) {
      handleUnauth(res)
      if (res.status !== 401) throw new Error(`Bild entfernen fehlgeschlagen`)
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

  return { movies, loading, addMovie, updateMovie, deleteMovie, setMovieImage, clearMovieImage, fetchMovieMeta, patchMovieImage }
}
