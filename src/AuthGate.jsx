import { useState, useEffect } from 'react'
import styles from './styles/index.js'

const API = import.meta.env.VITE_API_URL

export default function AuthGate({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Expose logout globally so hooks can trigger it on 401.
  useEffect(() => {
    window.__nousdeux_logout = () => {
      localStorage.removeItem('token')
      setToken(null)
    }
    return () => { delete window.__nousdeux_logout }
  }, [])

  if (token) return children

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Login fehlgeschlagen')
        return
      }

      const { token: jwt } = await res.json()
      localStorage.setItem('token', jwt)
      setToken(jwt)
    } catch {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <style>{loginStyles}</style>
      <div className="app">
        <div className="grain" />
        <div className="login-container">
          <div className="logo" style={{ textAlign: 'center', fontSize: 28, marginBottom: 8 }}>
            nous<span>deux</span>
          </div>
          <p className="login-sub">Bitte einloggen</p>

          <form className="add-form" onSubmit={handleLogin} style={{ marginTop: 20 }}>
            <input
              placeholder="Benutzername"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Laden...' : 'Einloggen'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

const loginStyles = `
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.login-sub {
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}

.login-error {
  color: var(--accent);
  font-size: 13px;
  text-align: center;
  margin-bottom: 10px;
}
`
