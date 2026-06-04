import { useState } from 'react'
import { changePassword } from '../hooks/api.js'

// Self-service password change, shown to every user in the profile sheet.
// Collapsed to a button until opened; re-asks for the current password.
export default function PasswordChange() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setCurrent(''); setNext(''); setConfirm(''); setError('')
  }

  const close = () => { reset(); setOpen(false) }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (next.length < 8) { setError('Mindestens 8 Zeichen'); return }
    if (next !== confirm) { setError('Passwörter stimmen nicht überein'); return }

    setLoading(true)
    try {
      await changePassword(current, next)
      reset()
      setOpen(false)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      setError(err.message === 'current password incorrect'
        ? 'Aktuelles Passwort falsch'
        : (err.message || 'Fehler'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        className="btn btn-secondary"
        style={{ width: '100%', padding: '14px', borderRadius: 14, marginBottom: 12 }}
        onClick={() => { setDone(false); setOpen(true) }}
      >
        {done ? 'Passwort geändert ✓' : 'Passwort ändern'}
      </button>
    )
  }

  return (
    <form className="add-form" onSubmit={submit} style={{ marginBottom: 12 }}>
      <input
        type="password" placeholder="Aktuelles Passwort" value={current}
        onChange={e => setCurrent(e.target.value)} autoComplete="current-password" autoFocus
      />
      <input
        type="password" placeholder="Neues Passwort" value={next}
        onChange={e => setNext(e.target.value)} autoComplete="new-password"
      />
      <input
        type="password" placeholder="Neues Passwort bestätigen" value={confirm}
        onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
      />
      {error && (
        <p style={{ color: 'var(--accent)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button" className="btn btn-secondary"
          style={{ flex: 1, padding: '12px', borderRadius: 14 }} onClick={close}
        >
          Abbrechen
        </button>
        <button className="btn btn-primary" style={{ flex: 1, padding: '12px', borderRadius: 14 }} disabled={loading}>
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
