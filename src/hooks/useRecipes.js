import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function handleUnauth(res) {
  if (res.status === 401 && window.__nosdeux_logout) window.__nosdeux_logout()
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
    const es = new EventSource(`${API}/api/recipes/stream?token=${token}`)
    es.onmessage = () => refresh()
    return () => es.close()
  }, [])

  const addRecipe = async (recipe) => {
    const res = await fetch(`${API}/api/recipes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(recipe),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  return { recipes, addRecipe }
}
