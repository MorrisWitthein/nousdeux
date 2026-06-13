import Sheet from './Sheet.jsx'
import PasswordChange from './PasswordChange.jsx'
import { authorColor } from '../utils/authorColor.js'
import { useTheme } from '../utils/theme.js'

export default function ProfileModal({ currentUser, userIsAdmin, settings, updateSetting, onLogout, onClose }) {
  const displayName = currentUser
    ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1)
    : null
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Sheet title="Profil" onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: authorColor(currentUser, currentUser), display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: 'white', fontWeight: 500,
        }}>
          {currentUser?.charAt(0).toUpperCase()}
        </div>
      </div>
      <p style={{
        fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 300,
        color: 'var(--ink)', textAlign: 'center', marginBottom: 4,
      }}>
        {displayName}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 28 }}>
        {currentUser}@nousdeux
      </p>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Darstellung
        </p>
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 14, background: 'var(--warm)',
          }}
        >
          <span style={{ fontSize: 14, color: 'var(--ink)' }}>Dunkelmodus</span>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Dunkelmodus"
            style={{
              width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
              background: isDark ? 'var(--accent)' : 'var(--muted)',
              position: 'relative', transition: 'background 0.2s',
              border: 'none', padding: 0,
            }}
            onClick={toggleTheme}
          >
            <div style={{
              position: 'absolute', top: 3, left: isDark ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%', background: 'white',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>
      {userIsAdmin && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Admin
          </p>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 14, background: 'var(--warm)',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--ink)' }}>Gen-Z Modus</span>
            <button
              type="button"
              role="switch"
              aria-checked={!!settings.genz_mode}
              aria-label="Gen-Z Modus"
              style={{
                width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
                background: settings.genz_mode ? 'var(--accent)' : 'var(--muted)',
                position: 'relative', transition: 'background 0.2s',
                opacity: settings.genz_mode === undefined ? 0.4 : 1,
                border: 'none', padding: 0,
              }}
              onClick={() => updateSetting('genz_mode', !settings.genz_mode)}
            >
              <div style={{
                position: 'absolute', top: 3, left: settings.genz_mode ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>
      )}
      <PasswordChange />
      <button
        className="btn btn-secondary"
        style={{ width: '100%', padding: '14px', borderRadius: 14 }}
        onClick={onLogout}
      >
        Ausloggen
      </button>
      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16, opacity: 0.5 }}>
        <a
          href={`https://github.com/MorrisWitthein/nousdeux/releases/tag/v${__APP_VERSION__}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          v{__APP_VERSION__}
        </a>
      </p>
    </Sheet>
  )
}
