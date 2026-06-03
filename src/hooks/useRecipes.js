import { useState, useEffect } from 'react'
import { connectStream } from './connectStream.js'
import { API, authHeaders, handleUnauth } from './api.js'

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const res = await fetch(`${API}/api/recipes`, { headers: authHeaders() })
    if (res.ok) setRecipes(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/recipes/stream?token=${token}`, refresh)
  }, [])

  const addRecipe = async (recipe) => {
    const res = await fetch(`${API}/api/recipes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(recipe),
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

  const setRecipeImage = async (id, query) => {
    const imgRes = await fetch(
      `${API}/api/recipes/image?q=${encodeURIComponent(query)}`,
      { headers: authHeaders() }
    )
    if (!imgRes.ok) {
      const err = await imgRes.json().catch(() => ({}))
      throw new Error(err.error || `Bildfehler ${imgRes.status}`)
    }
    const { url } = await imgRes.json()
    const patchRes = await fetch(`${API}/api/recipes/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url }),
    })
    if (!patchRes.ok) throw new Error(`Bild speichern fehlgeschlagen`)
  }

  const updateRecipe = async (id, fields) => {
    const res = await fetch(`${API}/api/recipes?id=${id}`, {
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

  const deleteRecipe = async (id) => {
    const res = await fetch(`${API}/api/recipes?id=${id}`, {
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

  const uploadRecipeImage = async (id, file) => {
    const form = new FormData()
    form.append('file', file)
    const uploadRes = await fetch(`${API}/api/recipes/${id}/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: form,
    })
    if (!uploadRes.ok) throw new Error(`Bild hochladen fehlgeschlagen`)
    const { path } = await uploadRes.json()
    const patchRes = await fetch(`${API}/api/recipes/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url: `${API}${path}` }),
    })
    if (!patchRes.ok) throw new Error(`Bild speichern fehlgeschlagen`)
  }

  const importRecipe = async (payload) => {
    const res = await fetch(`${API}/api/recipes/import`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      handleUnauth(res)
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Import fehlgeschlagen')
    }
    return res.json()
  }

  const clearRecipeImage = async (id) => {
    const res = await fetch(`${API}/api/recipes/image?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ url: '' }),
    })
    if (!res.ok) {
      handleUnauth(res)
      if (res.status !== 401) throw new Error(`Bild entfernen fehlgeschlagen`)
    }
  }

  return { recipes, loading, addRecipe, updateRecipe, deleteRecipe, setRecipeImage, uploadRecipeImage, clearRecipeImage, importRecipe }
}
