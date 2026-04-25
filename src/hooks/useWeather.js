import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export function useWeather() {
  const [weatherEmoji, setWeatherEmoji] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/weather`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.emoji) setWeatherEmoji(data.emoji) })
      .catch(() => {})
  }, [])

  return weatherEmoji
}
