import { useState } from 'react'

export default function ActivitiesTab({ activities, addActivity, updateActivity, deleteActivity, currentUser }) {
  const [showForm, setShowForm] = useState(false)
  const [newAct, setNewAct] = useState({ title: '', meta: '' })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ title: '', meta: '', emoji: '' })

  const handleAdd = async () => {
    if (!newAct.title) return
    await addActivity({ emoji: '✨', title: newAct.title, meta: newAct.meta })
    setNewAct({ title: '', meta: '' })
    setShowForm(false)
  }

  const startEdit = (a) => {
    setEditing(a.id)
    setEditFields({ title: a.title, meta: a.meta || '', emoji: a.emoji || '' })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    if (!editFields.title) return
    await updateActivity(editing, editFields)
    setEditing(null)
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

      {!showForm && !editing && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => setShowForm(true)}
        >
          + Aktivität vorschlagen
        </button>
      )}

      {activities.map(a => (
        editing === a.id ? (
          <div key={a.id} className="add-form">
            <div className="add-form-title">Aktivität bearbeiten</div>
            <input
              placeholder="Emoji"
              value={editFields.emoji}
              onChange={e => setEditFields(f => ({ ...f, emoji: e.target.value }))}
            />
            <input
              placeholder="Was wollt ihr machen?"
              value={editFields.title}
              onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
            />
            <input
              placeholder="Wann / Wo?"
              value={editFields.meta}
              onChange={e => setEditFields(f => ({ ...f, meta: e.target.value }))}
            />
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Speichern</button>
            </div>
          </div>
        ) : (
          <div key={a.id} className="activity-card" onClick={() => startEdit(a)}>
            <div className="activity-icon">{a.emoji}</div>
            <div style={{ flex: 1 }}>
              <div className="list-title">{a.title}</div>
              <div className="list-sub">{a.meta}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="dot" style={{ background: a.who === currentUser ? 'var(--accent2)' : 'var(--accent)', width: 10, height: 10 }} />
              <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEdit(a) }}>✎</button>
              <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Aktivität löschen?')) deleteActivity(a.id) }}>✕</button>
            </div>
          </div>
        )
      ))}
    </div>
  )
}
