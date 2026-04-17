import { useState } from 'react'

export default function ListsTab({ series, addSeries, deleteSeries }) {
  const [activeList, setActiveList] = useState('series')
  const [showForm, setShowForm] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', sub: '' })

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

          {!showForm && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
              onClick={() => setShowForm(true)}
            >
              + Serie hinzufügen
            </button>
          )}

          {series.map(s => (
            <div key={s.id} className="list-item">
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
              <button className="btn-delete" onClick={() => { if (window.confirm('Serie löschen?')) deleteSeries(s.id) }}>✕</button>
            </div>
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
