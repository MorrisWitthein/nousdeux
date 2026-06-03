import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // showToast(message, type, action?) — action = { label, onClick } renders a
  // tappable button (e.g. "Rückgängig"). Action toasts linger a bit longer.
  const showToast = useCallback((message, type = 'error', action = null) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type, action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), action ? 6000 : 4000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
            <div className="toast-actions">
              {t.action && (
                <button
                  className="toast-action"
                  onClick={() => { t.action.onClick(); dismiss(t.id) }}
                >
                  {t.action.label}
                </button>
              )}
              <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
