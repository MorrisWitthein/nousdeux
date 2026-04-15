import { useState, useEffect } from 'react'
import { mockDb } from '../mock/db.js'

export function useRecipes() {
  const [recipes, setRecipes] = useState([])

  const refresh = async () => {
    const data = await mockDb.select('recipes')
    setRecipes(data)
  }

  useEffect(() => {
    refresh()
    return mockDb.subscribe('recipes', refresh)
  }, [])

  const addRecipe = (recipe) => mockDb.insert('recipes', recipe)

  return { recipes, addRecipe }
}
