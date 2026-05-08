import { useState, useEffect } from 'react'
import { API, authHeaders, handleUnauth } from './api.js'

export function useSettings() {
  const [settings, setSettings] = useState({})

  const refresh = async () => {
    const res = await fetch(`${API}/api/settings`, { headers: authHeaders() })
    if (res.ok) setSettings(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => { refresh() }, [])

  const updateSetting = async (key, value) => {
    const res = await fetch(`${API}/api/settings`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ [key]: value }),
    })
    if (res.ok) setSettings(await res.json())
    else handleUnauth(res)
  }

  return { settings, updateSetting }
}
