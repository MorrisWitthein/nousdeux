import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export function useRecipes() {
  const [recipes, setRecipes] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/recipes`)
    if (res.ok) setRecipes(await res.json())
  }

  useEffect(() => {
    refresh()
    const es = new EventSource(`${API}/api/recipes/stream`)
    es.onmessage = () => refresh()
    return () => es.close()
  }, [])

  const addRecipe = async (recipe) => {
    const res = await fetch(`${API}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    })
    if (res.ok) refresh()
  }

  return { recipes, addRecipe }
}
