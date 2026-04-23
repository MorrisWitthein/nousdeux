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
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const updateMovie = async (id, fields) => {
    const res = await fetch(`${API}/api/movies?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(fields),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteMovie = async (id) => {
    const res = await fetch(`${API}/api/movies?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { movies, addMovie, updateMovie, deleteMovie }
}
