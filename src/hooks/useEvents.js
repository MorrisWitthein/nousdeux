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

export function useEvents() {
  const [events, setEvents] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/events`, { headers: authHeaders() })
    if (res.ok) setEvents(await res.json())
    else handleUnauth(res)
  }

  useEffect(() => {
    refresh()
    const token = localStorage.getItem('token')
    return connectStream(`${API}/api/events/stream?token=${token}`, refresh)
  }, [])

  const addEvent = async (event) => {
    const res = await fetch(`${API}/api/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(event),
    })
    if (res.ok) {
      const created = await res.json()
      refresh()
      return created
    }
    handleUnauth(res)
    return null
  }

  const updateEvent = async (id, fields) => {
    const res = await fetch(`${API}/api/events?id=${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(fields),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const deleteEvent = async (id) => {
    const res = await fetch(`${API}/api/events?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) refresh()
    else handleUnauth(res)
  }

  const listAttachments = async (eventId) => {
    const res = await fetch(`${API}/api/events/${eventId}/attachments`, { headers: authHeaders() })
    if (res.ok) return res.json()
    handleUnauth(res)
    return []
  }

  const uploadAttachment = async (eventId, file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API}/api/events/${eventId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: form,
    })
    if (res.ok) return res.json()
    handleUnauth(res)
    return null
  }

  const deleteAttachment = async (attachmentId) => {
    const res = await fetch(`${API}/api/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    handleUnauth(res)
    return res.ok
  }

  const attachmentUrl = (attachmentId) => {
    const token = localStorage.getItem('token')
    return `${API}/api/attachments/${attachmentId}?token=${token}`
  }

  return { events, addEvent, updateEvent, deleteEvent, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }
}
