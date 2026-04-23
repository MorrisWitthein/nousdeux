import { useState, useEffect, useRef } from 'react'

const SERIES_STATUS_OPTIONS = [
  { label: 'Geplant', type: 'yellow' },
  { label: 'Läuft', type: 'green' },
  { label: 'Fertig', type: 'red' },
]

const MOVIE_STATUS_OPTIONS = [
  { label: 'Geplant', type: 'yellow' },
  { label: 'Gesehen', type: 'green' },
]

const ACTIVITY_STATUS_OPTIONS = [
  { label: 'Idee', type: 'yellow' },
  { label: 'Geplant', type: 'green' },
  { label: 'Gemacht', type: 'gray' },
]

const EMPTY_SERIES   = { title: '', sub: '', emoji: '🎬', season: '', status: 'Geplant', statusType: 'yellow' }
const EMPTY_ACTIVITY = { emoji: '✨', title: '', meta: '', status: 'Idee', statusType: 'yellow' }
const EMPTY_MOVIE    = { emoji: '🍿', title: '', sub: '', genre: '', status: 'Geplant', statusType: 'yellow' }

function seriesSubLine(s) {
  const ep = s.season > 0 ? `Staffel ${s.season}` : ''
  return [ep, s.sub].filter(Boolean).join(' · ')
}

function movieSubLine(m) {
  return [m.genre, m.sub].filter(Boolean).join(' · ')
}

function activityStatusType(status) {
  const map = { Idee: 'yellow', Geplant: 'green', Gemacht: 'gray' }
  return map[status] || 'yellow'
}

export default function ListsTab({
  series, addSeries, updateSeries, deleteSeries,
  activities, addActivity, updateActivity, deleteActivity,
  movies, addMovie, updateMovie, deleteMovie,
  currentUser,
}) {
  const [activeList, setActiveList] = useState('series')

  // Series state
  const [showSeriesForm, setShowSeriesForm] = useState(false)
  const [newSeries, setNewSeries] = useState({ ...EMPTY_SERIES })
  const [editingSeries, setEditingSeries] = useState(null)
  const [editSeriesFields, setEditSeriesFields] = useState({ ...EMPTY_SERIES })

  // Movie state
  const [showMovieForm, setShowMovieForm] = useState(false)
  const [newMovie, setNewMovie] = useState({ ...EMPTY_MOVIE })
  const [editingMovie, setEditingMovie] = useState(null)
  const [editMovieFields, setEditMovieFields] = useState({ ...EMPTY_MOVIE })

  // Activity state
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [newAct, setNewAct] = useState({ ...EMPTY_ACTIVITY })
  const [editingActivity, setEditingActivity] = useState(null)
  const [editActivityFields, setEditActivityFields] = useState({ ...EMPTY_ACTIVITY })

  const formRef = useRef(null)
  useEffect(() => {
    if (showSeriesForm || editingSeries || showActivityForm || editingActivity || showMovieForm || editingMovie) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
    }
  }, [showSeriesForm, editingSeries, showActivityForm, editingActivity, showMovieForm, editingMovie])

  // Series handlers
  const handleAddSeries = async () => {
    if (!newSeries.title) return
    await addSeries({
      emoji: newSeries.emoji,
      title: newSeries.title,
      sub: newSeries.sub,
      season: parseInt(newSeries.season, 10) || 0,
      status: newSeries.status,
      statusType: newSeries.statusType,
    })
    setNewSeries({ ...EMPTY_SERIES })
    setShowSeriesForm(false)
  }

  const startEditSeries = (s) => {
    setEditingSeries(s.id)
    setEditSeriesFields({
      title: s.title,
      sub: s.sub || '',
      emoji: s.emoji || '🎬',
      season: s.season || '',
      status: s.status || 'Geplant',
      statusType: s.statusType || 'yellow',
    })
    setShowSeriesForm(false)
  }

  const handleUpdateSeries = async () => {
    if (!editSeriesFields.title) return
    await updateSeries(editingSeries, {
      ...editSeriesFields,
      season: parseInt(editSeriesFields.season, 10) || 0,
    })
    setEditingSeries(null)
  }

  const handleSeriesStatusChange = (setFields) => (e) => {
    const opt = SERIES_STATUS_OPTIONS.find(o => o.label === e.target.value)
    setFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
  }

  const handleMovieStatusChange = (setFields) => (e) => {
    const opt = MOVIE_STATUS_OPTIONS.find(o => o.label === e.target.value)
    setFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
  }

  const handleActivityStatusChange = (setFields) => (e) => {
    setFields(f => ({ ...f, status: e.target.value }))
  }

  // Movie handlers
  const handleAddMovie = async () => {
    if (!newMovie.title) return
    await addMovie({ emoji: newMovie.emoji, title: newMovie.title, sub: newMovie.sub, genre: newMovie.genre, status: newMovie.status, statusType: newMovie.statusType })
    setNewMovie({ ...EMPTY_MOVIE })
    setShowMovieForm(false)
  }

  const startEditMovie = (m) => {
    setEditingMovie(m.id)
    setEditMovieFields({ emoji: m.emoji || '🍿', title: m.title, sub: m.sub || '', genre: m.genre || '', status: m.status || 'Geplant', statusType: m.statusType || 'yellow' })
    setShowMovieForm(false)
  }

  const handleUpdateMovie = async () => {
    if (!editMovieFields.title) return
    await updateMovie(editingMovie, editMovieFields)
    setEditingMovie(null)
  }

  // Activity handlers
  const handleAddActivity = async () => {
    if (!newAct.title) return
    await addActivity({ emoji: newAct.emoji, title: newAct.title, meta: newAct.meta, status: newAct.status })
    setNewAct({ ...EMPTY_ACTIVITY })
    setShowActivityForm(false)
  }

  const startEditActivity = (a) => {
    setEditingActivity(a.id)
    setEditActivityFields({
      emoji: a.emoji || '✨',
      title: a.title,
      meta: a.meta || '',
      status: a.status || 'Idee',
    })
    setShowActivityForm(false)
  }

  const handleUpdateActivity = async () => {
    if (!editActivityFields.title) return
    await updateActivity(editingActivity, editActivityFields)
    setEditingActivity(null)
  }

  const renderSeriesForm = (fields, setFields, onSave, onCancel, title) => (
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
        placeholder="Plattform (Netflix, HBO, …)"
        value={fields.sub}
        onChange={e => setFields(f => ({ ...f, sub: e.target.value }))}
      />
      <div className="form-row">
        <div style={{ flex: '0 0 120px' }}>
          <label className="form-label">Staffel</label>
          <input
            type="number"
            min="0"
            max="50"
            placeholder="–"
            value={fields.season}
            onChange={e => setFields(f => ({ ...f, season: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Status</label>
          <select value={fields.status} onChange={handleSeriesStatusChange(setFields)}>
            {SERIES_STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
      </div>
    </div>
  )

  const renderMovieForm = (fields, setFields, onSave, onCancel, title) => (
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
      <div className="form-row">
        <div style={{ flex: 1 }}>
          <label className="form-label">Genre</label>
          <input
            placeholder="Komödie, Thriller, …"
            value={fields.genre}
            onChange={e => setFields(f => ({ ...f, genre: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Plattform</label>
          <input
            placeholder="Netflix, Kino, …"
            value={fields.sub}
            onChange={e => setFields(f => ({ ...f, sub: e.target.value }))}
          />
        </div>
      </div>
      <div className="form-row">
        <div style={{ flex: 1 }}>
          <label className="form-label">Status</label>
          <select value={fields.status} onChange={handleMovieStatusChange(setFields)}>
            {MOVIE_STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
      </div>
    </div>
  )

  const renderActivityForm = (fields, setFields, onSave, onCancel, title) => (
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
          <label className="form-label">Was?</label>
          <input
            placeholder="Keramikkurs, Wanderung, …"
            value={fields.title}
            onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
          />
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
          <select value={fields.status} onChange={handleActivityStatusChange(setFields)}>
            {ACTIVITY_STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['series', '🍿 Serien'],
          ['movies', '🎬 Filme'],
          ['activities', '✨ Aktivitäten'],
        ].map(([key, label]) => (
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
          {showSeriesForm && <div ref={formRef}>{renderSeriesForm(
            newSeries, setNewSeries,
            handleAddSeries, () => setShowSeriesForm(false),
            'Serie hinzufügen'
          )}</div>}

          {!showSeriesForm && !editingSeries && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
              onClick={() => { setNewSeries({ ...EMPTY_SERIES }); setShowSeriesForm(true) }}
            >
              + Serie hinzufügen
            </button>
          )}

          {series.map(s => (
            editingSeries === s.id ? (
              <div key={s.id} ref={formRef}>
                {renderSeriesForm(
                  editSeriesFields, setEditSeriesFields,
                  handleUpdateSeries, () => setEditingSeries(null),
                  'Serie bearbeiten'
                )}
              </div>
            ) : (
              <div key={s.id} className="list-item" onClick={() => startEditSeries(s)}>
                <div className="list-emoji">{s.emoji}</div>
                <div className="list-info">
                  <div className="list-title">{s.title}</div>
                  <div className="list-sub">{seriesSubLine(s)}</div>
                </div>
                <span className={`badge badge-${s.statusType}`}>{s.status}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditSeries(s) }}>✎</button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Serie löschen?')) deleteSeries(s.id) }}>✕</button>
                </div>
              </div>
            )
          ))}
        </>
      )}

      {activeList === 'activities' && (
        <>
          {showActivityForm && <div ref={formRef}>{renderActivityForm(
            newAct, setNewAct,
            handleAddActivity, () => setShowActivityForm(false),
            'Aktivität hinzufügen'
          )}</div>}

          {!showActivityForm && !editingActivity && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
              onClick={() => { setNewAct({ ...EMPTY_ACTIVITY }); setShowActivityForm(true) }}
            >
              + Aktivität vorschlagen
            </button>
          )}

          {activities.map(a => (
            editingActivity === a.id ? (
              <div key={a.id} ref={formRef}>
                {renderActivityForm(
                  editActivityFields, setEditActivityFields,
                  handleUpdateActivity, () => setEditingActivity(null),
                  'Aktivität bearbeiten'
                )}
              </div>
            ) : (
              <div key={a.id} className="activity-card" onClick={() => startEditActivity(a)}>
                <div className="activity-icon">{a.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="list-title">{a.title}</div>
                  {a.meta && <div className="list-sub">{a.meta}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge badge-${activityStatusType(a.status)}`}>{a.status || 'Idee'}</span>
                  <div className="dot" style={{ background: a.who === currentUser ? 'var(--accent2)' : 'var(--accent)', width: 10, height: 10 }} />
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditActivity(a) }}>✎</button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Aktivität löschen?')) deleteActivity(a.id) }}>✕</button>
                </div>
              </div>
            )
          ))}
        </>
      )}

      {activeList === 'movies' && (
        <>
          {showMovieForm && <div ref={formRef}>{renderMovieForm(
            newMovie, setNewMovie,
            handleAddMovie, () => setShowMovieForm(false),
            'Film hinzufügen'
          )}</div>}

          {!showMovieForm && !editingMovie && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
              onClick={() => { setNewMovie({ ...EMPTY_MOVIE }); setShowMovieForm(true) }}
            >
              + Film hinzufügen
            </button>
          )}

          {movies.map(m => (
            editingMovie === m.id ? (
              <div key={m.id} ref={formRef}>
                {renderMovieForm(
                  editMovieFields, setEditMovieFields,
                  handleUpdateMovie, () => setEditingMovie(null),
                  'Film bearbeiten'
                )}
              </div>
            ) : (
              <div key={m.id} className="list-item" onClick={() => startEditMovie(m)}>
                <div className="list-emoji">{m.emoji}</div>
                <div className="list-info">
                  <div className="list-title">{m.title}</div>
                  <div className="list-sub">{movieSubLine(m)}</div>
                </div>
                <span className={`badge badge-${m.statusType}`}>{m.status}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditMovie(m) }}>✎</button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Film löschen?')) deleteMovie(m.id) }}>✕</button>
                </div>
              </div>
            )
          ))}
        </>
      )}
    </div>
  )
}
