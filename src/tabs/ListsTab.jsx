import { useState } from 'react'

export default function ListsTab({ series, addSeries, updateSeries, deleteSeries }) {
  const [activeList, setActiveList] = useState('series')
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', sub: '' })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ title: '', sub: '', emoji: '', progress: 0, status: '', statusType: '' })

  const handleAdd = async () => {
    if (!newItem.title) return
    await addSeries({
      emoji: '🎬',
      title: newItem.title,
      sub: newItem.sub,
      progress: 0,
      status: 'Geplant',
      statusType: 'yellow',
    })
    setNewItem({ title: '', sub: '' })
    setShowForm(false)
  }

  const startEdit = (s) => {
    setEditing(s.id)
    setEditFields({
      title: s.title,
      sub: s.sub || '',
      emoji: s.emoji || '',
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

  const statusOptions = [
    { label: 'Geplant', type: 'yellow' },
    { label: 'Läuft', type: 'green' },
    { label: 'Fertig', type: 'red' },
  ]

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
          {showForm && (
            <div className="add-form">
              <div className="add-form-title">Serie hinzufügen</div>
              <input
                placeholder="Titel"
                value={newItem.title}
                onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
              />
              <input
                placeholder="Staffel · Plattform"
                value={newItem.sub}
                onChange={e => setNewItem(n => ({ ...n, sub: e.target.value }))}
              />
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
                <button className="btn btn-primary" onClick={handleAdd}>Hinzufügen</button>
              </div>
            </div>
          )}

          {!showForm && !editing && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
              onClick={() => setShowForm(true)}
            >
              + Serie hinzufügen
            </button>
          )}

          {series.map(s => (
            editing === s.id ? (
              <div key={s.id} className="add-form">
                <div className="add-form-title">Serie bearbeiten</div>
                <input
                  placeholder="Emoji"
                  value={editFields.emoji}
                  onChange={e => setEditFields(f => ({ ...f, emoji: e.target.value }))}
                />
                <input
                  placeholder="Titel"
                  value={editFields.title}
                  onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                />
                <input
                  placeholder="Staffel · Plattform"
                  value={editFields.sub}
                  onChange={e => setEditFields(f => ({ ...f, sub: e.target.value }))}
                />
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Fortschritt %"
                    value={editFields.progress}
                    onChange={e => setEditFields(f => ({ ...f, progress: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <select
                    value={editFields.status}
                    onChange={e => {
                      const opt = statusOptions.find(o => o.label === e.target.value)
                      setEditFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
                    }}
                    style={{ flex: 1 }}
                  >
                    {statusOptions.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                  </select>
                </div>
                <div className="btn-row">
                  <button className="btn btn-secondary" onClick={() => setEditing(null)}>Abbrechen</button>
                  <button className="btn btn-primary" onClick={handleUpdate}>Speichern</button>
                </div>
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
