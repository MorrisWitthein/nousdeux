import { useRef } from 'react'
import { CloseIcon, PaperclipIcon } from '../../components/Icons.jsx'
import Sheet from '../../components/Sheet.jsx'

const BADGE_OPTIONS = [
  { label: 'Geplant', type: 'green' },
  { label: 'Bestätigt', type: 'green' },
  { label: 'Idee', type: 'yellow' },
  { label: 'Abgesagt', type: 'red' },
]

export default function EventForm({
  fields, setFields: setFieldsRaw, onSave, onCancel, title,
  error, onErrorClear, pendingFiles, setPendingFiles, submitted,
  canSuggest, suggestMode, setSuggestMode,
}) {
  const fileInputRef = useRef(null)
  const setFields = (...args) => { onErrorClear(); setFieldsRaw(...args) }
  const endDateInvalid = fields.endDate && fields.date && fields.endDate <= fields.date
  const titleMissing = submitted && !fields.title.trim()

  return (
    <Sheet title={title} onClose={onCancel}>
      <input
        className={titleMissing ? 'input-error' : ''}
        placeholder="Titel"
        value={fields.title}
        onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
      />
      {titleMissing && <span className="form-error">Titel ist erforderlich</span>}
      <div className="form-row">
        <div>
          <label className="form-label">Von</label>
          <input
            type="date"
            value={fields.date}
            onChange={e => setFields(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Bis (opt.)</label>
          <input
            type="date"
            value={fields.endDate}
            min={fields.date || undefined}
            style={endDateInvalid ? { borderColor: 'var(--accent)', outline: 'none' } : undefined}
            onChange={e => setFields(f => ({ ...f, endDate: e.target.value }))}
          />
          {endDateInvalid && (
            <div style={{ color: 'var(--accent)', fontSize: 11, marginTop: 3 }}>
              Muss nach dem Startdatum liegen
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="form-label">Uhrzeit (opt.)</label>
        <input
          type="time"
          value={fields.time}
          onChange={e => setFields(f => ({ ...f, time: e.target.value }))}
        />
      </div>
      <select
        value={fields.badge}
        onChange={e => {
          const opt = BADGE_OPTIONS.find(o => o.label === e.target.value)
          setFields(f => ({ ...f, badge: e.target.value, badgeType: opt?.type || 'green' }))
        }}
      >
        {BADGE_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
      </select>
      <div style={{ marginBottom: 10 }}>
        <label className="form-label">Anhänge (opt.)</label>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <PaperclipIcon /> Datei wählen
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) setPendingFiles(prev => [...prev, file])
            e.target.value = ''
          }}
        />
        {pendingFiles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {pendingFiles.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', background: 'var(--warm)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{f.name}</span>
                <button className="btn-delete" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}><CloseIcon /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      {canSuggest && (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '4px 2px 10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={suggestMode}
            onChange={e => setSuggestMode(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: 'var(--accent2)' }}
          />
          <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
            Als Vorschlag senden – muss erst bestätigt werden, bevor der Termin im Kalender erscheint.
          </span>
        </label>
      )}
      {error && (
        <div style={{ color: 'var(--accent)', fontSize: 13, padding: '6px 2px' }}>{error}</div>
      )}
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave} disabled={endDateInvalid || !fields.title.trim()}>
          {canSuggest && suggestMode ? 'Vorschlagen' : 'Speichern'}
        </button>
      </div>
    </Sheet>
  )
}
