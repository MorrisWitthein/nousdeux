import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

export function useMovies() {
  const [movies, setMovies] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/movies`, { headers: authHeaders() })
    if (res.ok) setMovies(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/movies/stream?token=${token}`, refresh)
  }, [])

  const addMovie = async (item) => {
    const res = await fetch(`${API}/api/movies`, {
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

  return { movies, addMovie, updateMovie, deleteMovie }
}
