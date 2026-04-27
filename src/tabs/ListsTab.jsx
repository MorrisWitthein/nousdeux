import { useState, useEffect, useRef, useMemo } from 'react'
import TagInput from '../components/TagInput.jsx'
import { PencilIcon, CloseIcon, CalendarIcon } from '../components/Icons.jsx'

function Sheet({ title, onClose, children }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">{title}</span>
          <button className="btn-delete" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}

function SeriesDetail({ series, onEdit, onClose }) {
  const sub = seriesSubLine(series)
  return (
    <Sheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{series.emoji}</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{series.title}</div>
        <span className={`badge badge-${series.statusType}`}>{series.status}</span>
      </div>
      {sub && (
        <div className="recipe-detail-section">
          <div className="recipe-detail-section-title">Details</div>
          <div style={{ fontSize: 14, color: 'var(--ink)' }}>{sub}</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </div>
    </Sheet>
  )
}

function MovieDetail({ movie, onEdit, onClose }) {
  const sub = movieSubLine(movie)
  return (
    <Sheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{movie.emoji}</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{movie.title}</div>
        <span className={`badge badge-${movie.statusType}`}>{movie.status}</span>
      </div>
      {sub && (
        <div className="recipe-detail-section">
          <div className="recipe-detail-section-title">Details</div>
          <div style={{ fontSize: 14, color: 'var(--ink)' }}>{sub}</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </div>
    </Sheet>
  )
}

function ActivityDetail({ activity, onEdit, onClose, onNavigateToCalendar }) {
  return (
    <Sheet title="" onClose={onClose}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { onClose(); onNavigateToCalendar(null, { title: `${activity.emoji} ${activity.title}` }) }}>
          <CalendarIcon /> Als Termin
        </button>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </div>
    </Sheet>
  )
}

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
const EMPTY_MOVIE    = { emoji: '🍿', title: '', sub: '', genres: [], status: 'Geplant', statusType: 'yellow' }

function seriesSubLine(s) {
  const ep = s.season > 0 ? `Staffel ${s.season}` : ''
  return [ep, s.sub].filter(Boolean).join(' · ')
}

function movieSubLine(m) {
  const genres = (m.genres || []).join(', ')
  return [genres, m.sub].filter(Boolean).join(' · ')
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
  onNavigateToCalendar,
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
  const [activeGenres, setActiveGenres] = useState([])

  // Activity state
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [newAct, setNewAct] = useState({ ...EMPTY_ACTIVITY })
  const [editingActivity, setEditingActivity] = useState(null)
  const [editActivityFields, setEditActivityFields] = useState({ ...EMPTY_ACTIVITY })

  // Detail sheet state
  const [sheet, setSheet] = useState(null) // null | 'series' | 'movie' | 'activity'
  const [viewingId, setViewingId] = useState(null)

  const openDetail = (type, id) => { setSheet(type); setViewingId(id) }
  const closeDetail = () => { setSheet(null); setViewingId(null) }

  const knownGenres = useMemo(
    () => [...new Set(movies.flatMap(m => m.genres || []))].sort(),
    [movies]
  )

  const displayedMovies = activeGenres.length === 0
    ? movies
    : movies.filter(m => activeGenres.some(g => (m.genres || []).includes(g)))

  const toggleGenre = (genre) =>
    setActiveGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre])

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
    await addMovie({
      emoji: newMovie.emoji,
      title: newMovie.title,
      sub: newMovie.sub,
      genres: newMovie.genres,
      status: newMovie.status,
      statusType: newMovie.statusType,
    })
    setNewMovie({ ...EMPTY_MOVIE })
    setShowMovieForm(false)
  }

  const startEditMovie = (m) => {
    setEditingMovie(m.id)
    setEditMovieFields({
      emoji: m.emoji || '🍿',
      title: m.title,
      sub: m.sub || '',
      genres: m.genres || [],
      status: m.status || 'Geplant',
      statusType: m.statusType || 'yellow',
    })
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
            inputMode="numeric"
            pattern="[0-9]*"
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
      <label className="form-label">Genre</label>
      <TagInput
        value={fields.genres}
        onChange={genres => setFields(f => ({ ...f, genres }))}
        suggestions={knownGenres}
        placeholder="Komödie, Thriller, … (Enter)"
      />
      <div className="form-row">
        <div style={{ flex: 1 }}>
          <label className="form-label">Plattform</label>
          <input
            placeholder="Netflix, Kino, …"
            value={fields.sub}
            onChange={e => setFields(f => ({ ...f, sub: e.target.value }))}
          />
        </div>
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

  const viewingSeriesItem = series.find(s => s.id === viewingId)
  const viewingMovieItem = movies.find(m => m.id === viewingId)
  const viewingActivityItem = activities.find(a => a.id === viewingId)

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
              <div key={s.id} className="list-item" onClick={() => openDetail('series', s.id)}>
                <div className="list-emoji">{s.emoji}</div>
                <div className="list-info">
                  <div className="list-title">{s.title}</div>
                  <div className="list-sub">{seriesSubLine(s)}</div>
                </div>
                <span className={`badge badge-${s.statusType}`}>{s.status}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditSeries(s) }}><PencilIcon /></button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Serie löschen?')) deleteSeries(s.id) }}><CloseIcon /></button>
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
              <div key={a.id} className="activity-card" onClick={() => openDetail('activity', a.id)}>
                <div className="activity-icon">{a.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="list-title">{a.title}</div>
                  {a.meta && <div className="list-sub">{a.meta}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`badge badge-${activityStatusType(a.status)}`}>{a.status || 'Idee'}</span>
                  <div className="dot" style={{ background: a.who === currentUser ? 'var(--accent2)' : 'var(--accent)', width: 10, height: 10 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button className="btn-edit" style={{ width: 28, height: 28 }} title="Als Termin eintragen" onClick={(e) => { e.stopPropagation(); onNavigateToCalendar(null, { title: `${a.emoji} ${a.title}` }) }}><CalendarIcon /></button>
                      <button className="btn-edit" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); startEditActivity(a) }}><PencilIcon /></button>
                    </div>
                    <button className="btn-delete" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); if (window.confirm('Aktivität löschen?')) deleteActivity(a.id) }}><CloseIcon /></button>
                  </div>
                </div>
              </div>
            )
          ))}
        </>
      )}

      {activeList === 'movies' && (
        <>
          {knownGenres.length > 0 && (
            <div className="filter-bar">
              {knownGenres.map(genre => (
                <button
                  key={genre}
                  className={`filter-chip${activeGenres.includes(genre) ? ' active' : ''}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}

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

          {displayedMovies.map(m => (
            editingMovie === m.id ? (
              <div key={m.id} ref={formRef}>
                {renderMovieForm(
                  editMovieFields, setEditMovieFields,
                  handleUpdateMovie, () => setEditingMovie(null),
                  'Film bearbeiten'
                )}
              </div>
            ) : (
              <div key={m.id} className="list-item" onClick={() => openDetail('movie', m.id)}>
                <div className="list-emoji">{m.emoji}</div>
                <div className="list-info">
                  <div className="list-title">{m.title}</div>
                  <div className="list-sub">{movieSubLine(m)}</div>
                </div>
                <span className={`badge badge-${m.statusType}`}>{m.status}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditMovie(m) }}><PencilIcon /></button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Film löschen?')) deleteMovie(m.id) }}><CloseIcon /></button>
                </div>
              </div>
            )
          ))}
        </>
      )}

      {sheet === 'series' && viewingSeriesItem && (
        <SeriesDetail
          series={viewingSeriesItem}
          onEdit={() => { closeDetail(); startEditSeries(viewingSeriesItem) }}
          onClose={closeDetail}
        />
      )}
      {sheet === 'movie' && viewingMovieItem && (
        <MovieDetail
          movie={viewingMovieItem}
          onEdit={() => { closeDetail(); startEditMovie(viewingMovieItem) }}
          onClose={closeDetail}
        />
      )}
      {sheet === 'activity' && viewingActivityItem && (
        <ActivityDetail
          activity={viewingActivityItem}
          onEdit={() => { closeDetail(); startEditActivity(viewingActivityItem) }}
          onClose={closeDetail}
          onNavigateToCalendar={onNavigateToCalendar}
        />
      )}
    </div>
  )
}
