import { useState } from 'react'

export default function ActivitiesTab({ activities, addActivity, currentUser }) {
  const [showForm, setShowForm] = useState(false)
  const [newAct, setNewAct] = useState({ title: '', meta: '' })

  const handleAdd = async () => {
    if (!newAct.title) return
    await addActivity({ emoji: '✨', title: newAct.title, meta: newAct.meta })
    setNewAct({ title: '', meta: '' })
    setShowForm(false)
  }

  return (
    <div>
      <p className="section-title">Eure <em>Aktivitäten</em></p>
      <p className="section-sub">Was wollt ihr noch erleben?</p>

      {showForm && (
        <div className="add-form">
          <div className="add-form-title">Aktivität hinzufügen</div>
          <input
            placeholder="Was wollt ihr machen?"
            value={newAct.title}
            onChange={e => setNewAct(n => ({ ...n, title: e.target.value }))}
          />
          <input
            placeholder="Wann / Wo?"
            value={newAct.meta}
            onChange={e => setNewAct(n => ({ ...n, meta: e.target.value }))}
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
          + Aktivität vorschlagen
        </button>
      )}

      {activities.map(a => (
        <div key={a.id} className="activity-card">
          <div className="activity-icon">{a.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="list-title">{a.title}</div>
            <div className="list-sub">{a.meta}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="dot" style={{ background: a.who === currentUser ? 'var(--accent2)' : 'var(--accent)', width: 10, height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
