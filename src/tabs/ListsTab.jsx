import { useState } from 'react'

const STATUS_OPTIONS = [
  { label: 'Geplant', type: 'yellow' },
  { label: 'Läuft', type: 'green' },
  { label: 'Fertig', type: 'red' },
]

const EMPTY_SERIES = { title: '', sub: '', emoji: '🎬', progress: 0, status: 'Geplant', statusType: 'yellow' }

export default function ListsTab({ series, addSeries, updateSeries, deleteSeries }) {
  const [activeList, setActiveList] = useState('series')
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ ...EMPTY_SERIES })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_SERIES })

  const handleAdd = async () => {
    if (!newItem.title) return
    await addSeries({
      emoji: newItem.emoji,
      title: newItem.title,
      sub: newItem.sub,
      progress: parseInt(newItem.progress, 10) || 0,
      status: newItem.status,
      statusType: newItem.statusType,
    })
    setNewItem({ ...EMPTY_SERIES })
    setShowForm(false)
  }

  const startEdit = (s) => {
    setEditing(s.id)
    setEditFields({
      title: s.title,
      sub: s.sub || '',
      emoji: s.emoji || '🎬',
      progress: s.progress || 0,
      status: s.status || 'Geplant',
      statusType: s.statusType || 'yellow',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    if (!editFields.title) return
    await updateSeries(editing, {
      ...editFields,
      progress: parseInt(editFields.progress, 10) || 0,
    })
    setEditing(null)
  }

  const handleStatusChange = (setFields) => (e) => {
    const opt = STATUS_OPTIONS.find(o => o.label === e.target.value)
    setFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
  }

  const renderForm = (fields, setFields, onSave, onCancel, title) => (
    <div className="add-form">
      <div className="add-form-title">{title}</div>
      <div className="form-row">
        <div style={{ flex: '0 0 70px' }}>
          <label className="form-label">Emoji</label>
          <input
            value={fields.emoji}
            onChange={e => setFields(f => ({ ...f, emoji: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Titel</label>
          <input
            placeholder="Titel"
            value={fields.title}
            onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
          />
        </div>
      </div>
      <input
        placeholder="Staffel / Plattform"
        value={fields.sub}
        onChange={e => setFields(f => ({ ...f, sub: e.target.value }))}
      />
      <div className="form-row">
        <div>
          <label className="form-label">Fortschritt %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={fields.progress}
            onChange={e => setFields(f => ({ ...f, progress: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select value={fields.status} onChange={handleStatusChange(setFields)}>
            {STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
      </div>
    </div>
  )

  return (
    <div>
      <p className="section-title">Eure <em>Listen</em></p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['series', '🍿 Serien'], ['movies', '🎬 Filme'], ['books', '📚 Bücher']].map(([key, label]) => (
          <button
            key={key}
            className={`tab${activeList === key ? ' active' : ''}`}
            onClick={() => setActiveList(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeList === 'series' && (
        <>
          {showForm && renderForm(
            newItem,
            setNewItem,
            handleAdd,
            () => setShowForm(false),
            'Serie hinzufügen'
          )}

          {!showForm && !editing && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
              onClick={() => { setNewItem({ ...EMPTY_SERIES }); setShowForm(true) }}
            >
              + Serie hinzufügen
            </button>
          )}

          {series.map(s => (
            editing === s.id ? (
              <div key={s.id}>
                {renderForm(
                  editFields,
                  setEditFields,
                  handleUpdate,
                  () => setEditing(null),
                  'Serie bearbeiten'
                )}
              </div>
            ) : (
              <div key={s.id} className="list-item" onClick={() => startEdit(s)}>
                <div className="list-emoji">{s.emoji}</div>
                <div className="list-info">
                  <div className="list-title">{s.title}</div>
                  <div className="list-sub">{s.sub}</div>
                  {s.progress > 0 && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${s.progress}%`,
                          background: s.progress === 100 ? '#C8553D' : '#4A7C6F',
                        }}
                      />
                    </div>
                  )}
                </div>
                <span className={`badge badge-${s.statusType}`}>{s.status}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEdit(s) }}>✎</button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Serie löschen?')) deleteSeries(s.id) }}>✕</button>
                </div>
              </div>
            )
          ))}
        </>
      )}

      {activeList !== 'series' && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, marginBottom: 6, color: 'var(--ink)' }}>
            Noch leer
          </div>
          <div style={{ fontSize: 13 }}>Fügt eure ersten Einträge hinzu</div>
        </div>
      )}
    </div>
  )
}
