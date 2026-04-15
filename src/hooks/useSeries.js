import { useState, useEffect } from 'react'
import { mockDb } from '../mock/db.js'

export function useSeries() {
  const [series, setSeries] = useState([])

  const refresh = async () => {
    const data = await mockDb.select('series')
    setSeries(data)
  }

  useEffect(() => {
    refresh()
    return mockDb.subscribe('series', refresh)
  }, [])

  const addSeries = (item) => mockDb.insert('series', item)

  return { series, addSeries }
}
