import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export function useSeries() {
  const [series, setSeries] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/series`)
    if (res.ok) setSeries(await res.json())
  }

  useEffect(() => {
    refresh()
    const es = new EventSource(`${API}/api/series/stream`)
    es.onmessage = () => refresh()
    return () => es.close()
  }, [])

  const addSeries = async (item) => {
    const res = await fetch(`${API}/api/series`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (res.ok) refresh()
  }

  return { series, addSeries }
}
