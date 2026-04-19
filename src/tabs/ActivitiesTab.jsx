import { useState, useEffect, useRef } from 'react'

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function formatISOToGerman(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]}, ${d}. ${SHORT_MONTHS[m - 1]} ${y}`
}

const EMPTY_ACTIVITY = { emoji: '✨', title: '', meta: '', date: '', time: '' }

export default function ActivitiesTab({ activities, addActivity, updateActivity, deleteActivity, currentUser }) {
  const [showForm, setShowForm] = useState(false)
  const [newAct, setNewAct] = useState({ ...EMPTY_ACTIVITY })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_ACTIVITY })

  const formRef = useRef(null)
  useEffect(() => {
    if (showForm || editing) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
    }
  }, [showForm, editing])

  const handleAdd = async () => {
    if (!newAct.title) return
    await addActivity(newAct)
    setNewAct({ ...EMPTY_ACTIVITY })
    setShowForm(false)
  }

  const startEdit = (a) => {
    setEditing(a.id)
    setEditFields({
      emoji: a.emoji || '✨',
      title: a.title,
      meta: a.meta || '',
      date: a.date || '',
      time: a.time || '',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    if (!editFields.title) return
    await updateActivity(editing, editFields)
    setEditing(null)
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
            placeholder="Was wollt ihr machen?"
            value={fields.title}
            onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
          />
        </div>
      </div>
      <input
        placeholder="Notizen (Wo, Was, ...)"
        value={fields.meta}
        onChange={e => setFields(f => ({ ...f, meta: e.target.value }))}
      />
      <div className="form-row">
        <div>
          <label className="form-label">Datum (optional)</label>
          <input
            type="date"
            value={fields.date}
            onChange={e => setFields(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Uhrzeit (optional)</label>
          <input
            type="time"
            value={fields.time}
            onChange={e => setFields(f => ({ ...f, time: e.target.value }))}
          />
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
      <p className="section-title">Eure <em>Aktivitäten</em></p>
      <p className="section-sub">Was wollt ihr noch erleben?</p>

      {showForm && <div ref={formRef}>{renderForm(
        newAct,
        setNewAct,
        handleAdd,
        () => setShowForm(false),
        'Aktivität hinzufügen'
      )}</div>}

      {!showForm && !editing && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => { setNewAct({ ...EMPTY_ACTIVITY }); setShowForm(true) }}
        >
          + Aktivität vorschlagen
        </button>
      )}

      {activities.map(a => (
        editing === a.id ? (
          <div key={a.id} ref={formRef}>
            {renderForm(
              editFields,
              setEditFields,
              handleUpdate,
              () => setEditing(null),
              'Aktivität bearbeiten'
            )}
          </div>
        ) : (
          <div key={a.id} className="activity-card" onClick={() => startEdit(a)}>
            <div className="activity-icon">{a.emoji}</div>
            <div style={{ flex: 1 }}>
              <div className="list-title">{a.title}</div>
              <div className="list-sub">
                {a.meta}
                {a.date && (
                  <span>{a.meta ? ' · ' : ''}{formatISOToGerman(a.date)}{a.time ? ` ${a.time}` : ''}</span>
                )}
              </div>
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
