import { useState, useEffect, useCallback } from 'react'

// Per-device theme preference. Stored in localStorage (not the global,
// admin-gated settings table) because a theme is a personal display choice.
const STORAGE_KEY = 'theme'

export function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function prefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// The stored choice, or the OS preference when the user hasn't chosen yet.
export function getPreferredTheme() {
  return getStoredTheme() ?? (prefersDark() ? 'dark' : 'light')
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function persistTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* localStorage unavailable (private mode) — theme still applies this session */
  }
}

// Reads the current theme, applies it to <html>, and persists changes.
// The pre-paint script in index.html has already set the attribute on load,
// so the initial state here matches what is on screen (no flash).
export function useTheme() {
  const [theme, setThemeState] = useState(getPreferredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    persistTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      persistTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
