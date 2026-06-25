import { useState } from 'react'
import { PencilIcon, CloseIcon, CalendarIcon } from '../../components/Icons.jsx'
import ExpandingSheet from '../../components/ExpandingSheet.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { AuthorLine, DetailFooter, DoneSection, activityStatusType, pressable } from './shared.jsx'

const STATUS_OPTIONS = [
  { label: 'Idee', type: 'yellow' },
  { label: 'Geplant', type: 'green' },
  { label: 'Gemacht', type: 'gray' },
]

const EMPTY_ACTIVITY = { emoji: '✨', title: '', meta: '', status: 'Idee', statusType: 'yellow' }

function ActivityDetail({ activity, onEdit, onClose, onNavigateToCalendar, currentUser }) {
  return (
    <ExpandingSheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{activity.emoji}</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{activity.title}</div>
        <span className={`badge badge-${activityStatusType(activity.status)}`}>{activity.status || 'Idee'}</span>
      </div>
      {activity.meta && (
        <div className="recipe-detail-section">
          <div className="recipe-detail-section-title">Notizen</div>
          <div style={{ fontSize: 14, color: 'var(--ink)' }}>{activity.meta}</div>
        </div>
      )}
      <DetailFooter who={activity.who} currentUser={currentUser}>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { onClose(); onNavigateToCalendar(null, { title: `${activity.emoji} ${activity.title}` }) }}>
          <CalendarIcon /> Als Termin
        </button>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </DetailFooter>
    </ExpandingSheet>
  )
}

function ActivityForm({ fields, setFields, onSave, onCancel, title, submitted }) {
  const titleMissing = submitted && !fields.title.trim()
  return (
    <ExpandingSheet title={title} onClose={onCancel}>
      <div className="form-row">
        <div style={{ flex: '0 0 70px' }}>
          <label className="form-label">Emoji</label>
          <input
            value={fields.emoji}
            onChange={e => setFields(f => ({ ...f, emoji: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Was?</label>
          <input
            className={titleMissing ? 'input-error' : ''}
            placeholder="Keramikkurs, Wanderung, …"
            value={fields.title}
            onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
          />
          {titleMissing && <span className="form-error">Bitte ausfüllen</span>}
        </div>
      </div>
      <input
        placeholder="Notizen (Wo, Infos, …)"
        value={fields.meta}
        onChange={e => setFields(f => ({ ...f, meta: e.target.value }))}
      />
      <div className="form-row">
        <div style={{ flex: 1 }}>
          <label className="form-label">Status</label>
          <select value={fields.status} onChange={e => setFields(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" disabled={!fields.title.trim()} onClick={onSave}>Speichern</button>
      </div>
    </ExpandingSheet>
  )
}

export default function ActivitiesSubTab({
  activities, addActivity, updateActivity, deleteActivity, activitiesLoading,
  currentUser, onNavigateToCalendar,
}) {
  const showToast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [newAct, setNewAct] = useState({ ...EMPTY_ACTIVITY })
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_ACTIVITY })
  const [viewingId, setViewingId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const handleAdd = async () => {
    setSubmitted(true)
    if (!newAct.title.trim()) return
    try {
      await addActivity({ emoji: newAct.emoji, title: newAct.title, meta: newAct.meta, status: newAct.status })
      setNewAct({ ...EMPTY_ACTIVITY })
      setSubmitted(false)
      setShowForm(false)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const startEdit = (a) => {
    setSubmitted(false)
    if (a.status === 'Gemacht') setShowDone(true)
    setEditingId(a.id)
    setEditFields({
      emoji: a.emoji || '✨',
      title: a.title,
      meta: a.meta || '',
      status: a.status || 'Idee',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    setSubmitted(true)
    if (!editFields.title.trim()) return
    try {
      await updateActivity(editingId, editFields)
      setSubmitted(false)
      setEditingId(null)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const handleDelete = async (id) => {
    const item = activities.find(a => a.id === id)
    try {
      await deleteActivity(id)
      showToast('Aktivität gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addActivity(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const renderRow = (a) => (
    <div key={a.id} className="card" {...pressable(() => setViewingId(a.id))}>
      <div className="list-card-head">
        <div className="list-emoji">{a.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card-title">{a.title}</div>
          {a.meta && <div className="card-meta">{a.meta}</div>}
        </div>
        <span className={`badge badge-${activityStatusType(a.status)}`}>{a.status || 'Idee'}</span>
      </div>
      <div className="card-footer">
        <AuthorLine who={a.who} currentUser={currentUser} />
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-edit" title="Als Termin eintragen" onClick={(e) => { e.stopPropagation(); onNavigateToCalendar(null, { title: `${a.emoji} ${a.title}` }) }}><CalendarIcon /></button>
          <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEdit(a) }}><PencilIcon /></button>
          <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(a.id) }}><CloseIcon /></button>
        </div>
      </div>
    </div>
  )

  const viewingItem = activities.find(a => a.id === viewingId)

  const openItems = activities.filter(a => a.status !== 'Gemacht')

  return (
    <>
      {!showForm && !editingId && (
        <button
          className="fab"
          aria-label="Aktivität vorschlagen"
          onClick={() => { setNewAct({ ...EMPTY_ACTIVITY }); setShowForm(true) }}
        >+</button>
      )}

      {openItems.map(renderRow)}
      <DoneSection
        items={activities.filter(a => a.status === 'Gemacht')}
        open={showDone}
        onToggle={() => setShowDone(v => !v)}
        renderRow={renderRow}
      />
      {activities.length === 0 && !showForm && !activitiesLoading && (
        <EmptyState emoji="✨" title="Noch keine Aktivitäten" hint="Tippe auf +, um eine gemeinsame Idee festzuhalten." />
      )}

      {viewingItem && (
        <ActivityDetail
          activity={viewingItem}
          onEdit={() => { setViewingId(null); startEdit(viewingItem) }}
          onClose={() => setViewingId(null)}
          onNavigateToCalendar={onNavigateToCalendar}
          currentUser={currentUser}
        />
      )}

      {showForm && (
        <ActivityForm
          fields={newAct} setFields={setNewAct}
          onSave={handleAdd} onCancel={() => { setShowForm(false); setSubmitted(false) }}
          title="Aktivität hinzufügen" submitted={submitted}
        />
      )}
      {editingId && (
        <ActivityForm
          fields={editFields} setFields={setEditFields}
          onSave={handleUpdate} onCancel={() => { setEditingId(null); setSubmitted(false) }}
          title="Aktivität bearbeiten" submitted={submitted}
        />
      )}
    </>
  )
}
