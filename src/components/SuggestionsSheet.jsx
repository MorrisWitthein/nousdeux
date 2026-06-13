import { useState } from 'react'
import Sheet from './Sheet.jsx'
import EmptyState from './EmptyState.jsx'
import { CheckIcon, CloseIcon } from './Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { authorColor } from '../utils/authorColor.js'
import { formatISOToGerman } from '../utils/date.js'

// Notifications surface: lists the pending event suggestions directed at the
// current user with accept (→ creates a calendar event) and decline actions.
export default function SuggestionsSheet({ suggestions, currentUser, onAccept, onDecline, onClose }) {
  const showToast = useToast()
  const [busyId, setBusyId] = useState(null)

  const run = async (id, fn, okMsg) => {
    setBusyId(id)
    try {
      await fn(id)
      showToast(okMsg, 'info')
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Sheet title="Vorschläge" onClose={onClose}>
      {suggestions.length === 0 ? (
        <EmptyState emoji="🔔" title="Keine Vorschläge" hint="Hier tauchen Terminvorschläge auf, die dir geschickt werden." />
      ) : (
        suggestions.map(s => {
          const isMultiDay = s.endDate && s.endDate > s.date
          const dateDisplay = isMultiDay
            ? `${formatISOToGerman(s.date)} – ${formatISOToGerman(s.endDate)}`
            : (formatISOToGerman(s.date) || s.date)
          return (
            <div key={s.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{s.title}</div>
                  <div className="card-meta">{dateDisplay}{s.time ? ` · ${s.time}` : ''}</div>
                </div>
                {s.badge && <span className={`badge badge-${s.badgeType}`}>{s.badge}</span>}
              </div>
              <div className="card-footer">
                <div className="who-added">
                  <div className="dot" style={{ background: authorColor(s.suggestedBy, currentUser) }} />
                  Vorschlag von {s.suggestedBy.charAt(0).toUpperCase() + s.suggestedBy.slice(1)}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                    disabled={busyId === s.id}
                    onClick={() => run(s.id, onDecline, 'Vorschlag abgelehnt')}
                  >
                    <CloseIcon /> Ablehnen
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                    disabled={busyId === s.id}
                    onClick={() => run(s.id, onAccept, 'Vorschlag angenommen')}
                  >
                    <CheckIcon /> Annehmen
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </Sheet>
  )
}
