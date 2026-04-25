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

export function useRecipes() {
  const [recipes, setRecipes] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/recipes`, { headers: authHeaders() })
    if (res.ok) setRecipes(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
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
    } else {
      handleUnauth(res)
    }
  }

  const setRecipeImage = async (id, query) => {
    try {
      const imgRes = await fetch(
        `${API}/api/recipes/image?q=${encodeURIComponent(query)}`,
        { headers: authHeaders() }
      )
      if (!imgRes.ok) {
        const err = await imgRes.json().catch(() => ({}))
        console.error('[recipes] image fetch failed', imgRes.status, err)
        return
      }
      const { url } = await imgRes.json()
      const patchRes = await fetch(`${API}/api/recipes/image?id=${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ url }),
      })
      if (!patchRes.ok) {
        console.error('[recipes] image patch failed', patchRes.status)
      }
      // broker notification from PATCH triggers refresh via SSE
    } catch (e) {
      console.error('[recipes] image error', e)
    }
  }

  const updateRecipe = async (id, fields) => {
    const res = await fetch(`${API}/api/recipes?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(fields),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteRecipe = async (id) => {
    const res = await fetch(`${API}/api/recipes?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { recipes, addRecipe, updateRecipe, deleteRecipe, setRecipeImage }
}
