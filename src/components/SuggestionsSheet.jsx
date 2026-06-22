import { useState } from 'react'
import ExpandingSheet from './ExpandingSheet.jsx'
import EmptyState from './EmptyState.jsx'
import { CheckIcon, CloseIcon } from './Icons.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { authorColor } from '../utils/authorColor.js'
import { formatISOToGerman } from '../utils/date.js'

const STATUS_LABEL = {
  pending:  { text: 'Ausstehend',  type: 'yellow' },
  accepted: { text: 'Angenommen',  type: 'green' },
  declined: { text: 'Abgelehnt',   type: 'red' },
}

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

function dateLine(s) {
  const isMultiDay = s.endDate && s.endDate > s.date
  const dateDisplay = isMultiDay
    ? `${formatISOToGerman(s.date)} – ${formatISOToGerman(s.endDate)}`
    : (formatISOToGerman(s.date) || s.date)
  return `${dateDisplay}${s.time ? ` · ${s.time}` : ''}`
}

// Notifications surface: "Erhalten" lists suggestions awaiting my response with
// accept / decline / counter-propose; "Gesendet" tracks the status of requests
// I started.
export default function SuggestionsSheet({ received, sent, currentUser, onAccept, onDecline, onCounter, onClose }) {
  const showToast = useToast()
  const [tab, setTab] = useState('received')
  const [busyId, setBusyId] = useState(null)
  const [counteringId, setCounteringId] = useState(null)
  const [counterFields, setCounterFields] = useState({ date: '', endDate: '', time: '' })

  const run = async (id, fn, okMsg) => {
    setBusyId(id)
    try {
      await fn()
      showToast(okMsg, 'info')
      setCounteringId(null)
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const openCounter = (s) => {
    setCounteringId(s.id)
    setCounterFields({ date: s.date || '', endDate: s.endDate || '', time: s.time || '' })
  }

  const counterInvalid = counterFields.endDate && counterFields.date && counterFields.endDate <= counterFields.date

  const renderReceived = (s) => {
    const isCounter = s.suggestedBy === currentUser // bounced back to me
    const proposer = s.lastProposedBy || s.suggestedBy
    return (
      <div key={s.id} className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{s.title}</div>
            <div className="card-meta">{dateLine(s)}</div>
          </div>
          {s.badge && <span className={`badge badge-${s.badgeType}`}>{s.badge}</span>}
        </div>
        <div className="who-added" style={{ marginTop: 4 }}>
          <div className="dot" style={{ background: authorColor(proposer, currentUser) }} />
          {isCounter ? 'Gegenvorschlag' : 'Vorschlag'} von {capitalize(proposer)}
        </div>

        {counteringId === s.id ? (
          <div style={{ marginTop: 10 }}>
            <div className="form-row">
              <div>
                <label className="form-label">Von</label>
                <input type="date" value={counterFields.date}
                  onChange={e => setCounterFields(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Bis (opt.)</label>
                <input type="date" value={counterFields.endDate} min={counterFields.date || undefined}
                  style={counterInvalid ? { borderColor: 'var(--accent)', outline: 'none' } : undefined}
                  onChange={e => setCounterFields(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Uhrzeit (opt.)</label>
              <input type="time" value={counterFields.time}
                onChange={e => setCounterFields(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div className="btn-row" style={{ marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => setCounteringId(null)}>Abbrechen</button>
              <button
                className="btn btn-primary"
                disabled={busyId === s.id || !counterFields.date || counterInvalid}
                onClick={() => run(s.id, () => onCounter(s.id, {
                  date: counterFields.date, endDate: counterFields.endDate, time: counterFields.time,
                }), 'Gegenvorschlag gesendet')}
              >Gegenvorschlag senden</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              disabled={busyId === s.id}
              onClick={() => run(s.id, () => onDecline(s.id), 'Vorschlag abgelehnt')}
            ><CloseIcon /> Ablehnen</button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, padding: '6px 10px' }}
              disabled={busyId === s.id}
              onClick={() => openCounter(s)}
            >Anderer Termin</button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              disabled={busyId === s.id}
              onClick={() => run(s.id, () => onAccept(s.id), 'Vorschlag angenommen')}
            ><CheckIcon /> Annehmen</button>
          </div>
        )}
      </div>
    )
  }

  const renderSent = (s) => {
    const status = STATUS_LABEL[s.status] || STATUS_LABEL.pending
    return (
      <div key={s.id} className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{s.title}</div>
            <div className="card-meta">{dateLine(s)}</div>
          </div>
          <span className={`badge badge-${status.type}`}>{status.text}</span>
        </div>
      </div>
    )
  }

  const list = tab === 'received' ? received : sent

  return (
    <ExpandingSheet title="Vorschläge" onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'received', label: `Erhalten${received.length ? ` (${received.length})` : ''}` },
          { id: 'sent', label: 'Gesendet' },
        ].map(t => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '7px 10px' }}
            onClick={() => { setTab(t.id); setCounteringId(null) }}
          >{t.label}</button>
        ))}
      </div>

      {list.length === 0 ? (
        tab === 'received'
          ? <EmptyState emoji="🔔" title="Keine Vorschläge" hint="Hier tauchen Terminvorschläge auf, die dir geschickt werden." />
          : <EmptyState emoji="📤" title="Nichts gesendet" hint="Hier siehst du den Status der Termine, die du vorgeschlagen hast." />
      ) : (
        list.map(tab === 'received' ? renderReceived : renderSent)
      )}
    </ExpandingSheet>
  )
}
