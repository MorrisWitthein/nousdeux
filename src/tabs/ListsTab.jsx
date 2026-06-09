import { useState, useRef, useMemo } from 'react'
import TagInput from '../components/TagInput.jsx'
import { PencilIcon, CloseIcon, CalendarIcon, TvIcon } from '../components/Icons.jsx'
import { useShoppingList, parseQty } from '../hooks/useShoppingList.js'
import Sheet from '../components/Sheet.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { authorColor } from '../utils/authorColor.js'

function DetailFooter({ who, currentUser, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      {who
        ? <div className="who-added">
            <div className="dot" style={{ background: authorColor(who, currentUser) }} />
            Von {cap(who)} hinzugefügt
          </div>
        : <span />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  )
}

// Shared color-coded chips for detail sheets: platform first, then neutral
// genre/season chips. Mirrors the in-card meta row but without the spinner.
function MediaChips({ platform, neutral }) {
  if (!platform && neutral.length === 0) return null
  return (
    <div className="media-meta" style={{ justifyContent: 'center', marginBottom: 4 }}>
      {platform && <span className="chip-platform"><TvIcon width={13} height={13} />{platform}</span>}
      {neutral.map((t, i) => <span key={i} className="chip-genre">{t}</span>)}
    </div>
  )
}

function SeriesDetail({ series, onEdit, onClose, currentUser }) {
  const neutral = series.season > 0 ? [`Staffel ${series.season}`] : []
  return (
    <Sheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {series.imageUrl
          ? <img src={series.imageUrl} alt={series.title} className="detail-poster" />
          : <div style={{ fontSize: 48, marginBottom: 8 }}>{series.emoji}</div>}
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{series.title}</div>
        <span className={`badge badge-${series.statusType}`} style={{ marginBottom: 12, display: 'inline-block' }}>{series.status}</span>
        <MediaChips platform={series.sub} neutral={neutral} />
      </div>
      <DetailFooter who={series.who} currentUser={currentUser}>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </DetailFooter>
    </Sheet>
  )
}

function MovieDetail({ movie, onEdit, onClose, currentUser }) {
  return (
    <Sheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {movie.imageUrl
          ? <img src={movie.imageUrl} alt={movie.title} className="detail-poster" />
          : <div style={{ fontSize: 48, marginBottom: 8 }}>{movie.emoji}</div>}
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{movie.title}</div>
        <span className={`badge badge-${movie.statusType}`} style={{ marginBottom: 12, display: 'inline-block' }}>{movie.status}</span>
        <MediaChips platform={movie.sub} neutral={movie.genres || []} />
      </div>
      <DetailFooter who={movie.who} currentUser={currentUser}>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </DetailFooter>
    </Sheet>
  )
}

function ActivityDetail({ activity, onEdit, onClose, onNavigateToCalendar, currentUser }) {
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
      <DetailFooter who={activity.who} currentUser={currentUser}>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { onClose(); onNavigateToCalendar(null, { title: `${activity.emoji} ${activity.title}` }) }}>
          <CalendarIcon /> Als Termin
        </button>
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </DetailFooter>
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

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

function activityStatusType(status) {
  const map = { Idee: 'yellow', Geplant: 'green', Gemacht: 'gray' }
  return map[status] || 'yellow'
}

export default function ListsTab({
  series, addSeries, updateSeries, deleteSeries, seriesLoading, setSeriesImage, clearSeriesImage, fetchSeriesMeta, patchSeriesImage,
  activities, addActivity, updateActivity, deleteActivity, activitiesLoading,
  movies, addMovie, updateMovie, deleteMovie, moviesLoading, setMovieImage, clearMovieImage, fetchMovieMeta, patchMovieImage,
  currentUser,
  onNavigateToCalendar,
  activeList,
  setActiveList,
}) {
  const showToast = useToast()
  const { items: shopItems, history: shopHistory, loading: shopLoading, addItem: addShopItem, toggleItem, deleteItem, clearChecked } = useShoppingList()
  const [shopInput, setShopInput] = useState('')
  const [shopSuggestions, setShopSuggestions] = useState([])
  const shopInputRef = useRef(null)

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

  const [submitted, setSubmitted] = useState(false)
  const [posterBusy, setPosterBusy] = useState(false)

  // Ids of newly-added movies/series currently being enriched with TMDB
  // metadata (genre/platform). Drives the inline "Lädt…" spinner on the card.
  const [enrichingIds, setEnrichingIds] = useState(() => new Set())
  const markEnriching = (id) => setEnrichingIds(s => new Set(s).add(id))
  const unmarkEnriching = (id) => setEnrichingIds(s => { const n = new Set(s); n.delete(id); return n })

  // After creating a movie/series, fetch TMDB metadata and fill the poster plus
  // any fields the user left blank (genre/platform). Never overwrites manual
  // input. The row PATCH is a full replace, so we merge into the original
  // payload. Runs in the background; failures are silent (poster stays default).
  const enrichMovie = async (id, base) => {
    markEnriching(id)
    try {
      const meta = await fetchMovieMeta(base.title)
      const patch = { ...base }
      let changed = false
      if (!(base.genres || []).length && meta.genres?.length) { patch.genres = meta.genres; changed = true }
      if (!(base.sub || '').trim() && meta.platform) { patch.sub = meta.platform; changed = true }
      if (changed) await updateMovie(id, patch)
      if (meta.url) await patchMovieImage(id, meta.url)
    } catch { /* keep default poster/fields */ }
    finally { unmarkEnriching(id) }
  }

  const enrichSeries = async (id, base) => {
    markEnriching(id)
    try {
      const meta = await fetchSeriesMeta(base.title)
      if (!(base.sub || '').trim() && meta.platform) await updateSeries(id, { ...base, sub: meta.platform })
      if (meta.url) await patchSeriesImage(id, meta.url)
    } catch { /* keep default poster/fields */ }
    finally { unmarkEnriching(id) }
  }

  // Completed items (watched series/movies, done activities) collapse into an
  // "Erledigt" section that is hidden by default, per list type.
  const [showDone, setShowDone] = useState({ series: false, movies: false, activities: false })

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

  // Series handlers
  const handleAddSeries = async () => {
    setSubmitted(true)
    if (!newSeries.title.trim()) return
    try {
      const payload = {
        emoji: newSeries.emoji,
        title: newSeries.title,
        sub: newSeries.sub,
        season: parseInt(newSeries.season, 10) || 0,
        status: newSeries.status,
        statusType: newSeries.statusType,
      }
      const id = await addSeries(payload)
      if (id) enrichSeries(id, payload)
      setNewSeries({ ...EMPTY_SERIES })
      setSubmitted(false)
      setShowSeriesForm(false)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const startEditSeries = (s) => {
    setSubmitted(false)
    if (s.status === 'Fertig') setShowDone(prev => ({ ...prev, series: true }))
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
    setSubmitted(true)
    if (!editSeriesFields.title.trim()) return
    try {
      await updateSeries(editingSeries, {
        ...editSeriesFields,
        season: parseInt(editSeriesFields.season, 10) || 0,
      })
      setSubmitted(false)
      setEditingSeries(null)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
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
    setSubmitted(true)
    if (!newMovie.title.trim()) return
    try {
      const payload = {
        emoji: newMovie.emoji,
        title: newMovie.title,
        sub: newMovie.sub,
        genres: newMovie.genres,
        status: newMovie.status,
        statusType: newMovie.statusType,
      }
      const id = await addMovie(payload)
      if (id) enrichMovie(id, payload)
      setNewMovie({ ...EMPTY_MOVIE })
      setSubmitted(false)
      setShowMovieForm(false)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const startEditMovie = (m) => {
    setSubmitted(false)
    if (m.status === 'Gesehen') setShowDone(prev => ({ ...prev, movies: true }))
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
    setSubmitted(true)
    if (!editMovieFields.title.trim()) return
    try {
      await updateMovie(editingMovie, editMovieFields)
      setSubmitted(false)
      setEditingMovie(null)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  // Activity handlers
  const handleAddActivity = async () => {
    setSubmitted(true)
    if (!newAct.title.trim()) return
    try {
      await addActivity({ emoji: newAct.emoji, title: newAct.title, meta: newAct.meta, status: newAct.status })
      setNewAct({ ...EMPTY_ACTIVITY })
      setSubmitted(false)
      setShowActivityForm(false)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const startEditActivity = (a) => {
    setSubmitted(false)
    if (a.status === 'Gemacht') setShowDone(prev => ({ ...prev, activities: true }))
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
    setSubmitted(true)
    if (!editActivityFields.title.trim()) return
    try {
      await updateActivity(editingActivity, editActivityFields)
      setSubmitted(false)
      setEditingActivity(null)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const handleDeleteSeries = async (id) => {
    const item = series.find(s => s.id === id)
    try {
      await deleteSeries(id)
      showToast('Serie gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addSeries(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const handleDeleteMovie = async (id) => {
    const item = movies.find(m => m.id === id)
    try {
      await deleteMovie(id)
      showToast('Film gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addMovie(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const handleDeleteActivity = async (id) => {
    const item = activities.find(a => a.id === id)
    try {
      await deleteActivity(id)
      showToast('Aktivität gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addActivity(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const handleAddShopItem = async (input) => {
    try { await addShopItem(input) } catch (err) { showToast(err.message) }
  }

  const handleToggleItem = async (id, checked) => {
    try { await toggleItem(id, checked) } catch (err) { showToast(err.message) }
  }

  const handleDeleteItem = async (id) => {
    try { await deleteItem(id) } catch (err) { showToast(err.message) }
  }

  const handleClearChecked = async () => {
    try { await clearChecked() } catch (err) { showToast(err.message) }
  }

  const renderSeriesForm = (fields, setFields, onSave, onCancel, title, submitted, imageBlock) => {
    const titleMissing = submitted && !fields.title.trim()
    return (
    <Sheet title={title} onClose={onCancel}>
      {imageBlock}
      <div>
        <label className="form-label">Titel</label>
        <input
          className={titleMissing ? 'input-error' : ''}
          placeholder="Titel"
          value={fields.title}
          onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
        />
        {titleMissing && <span className="form-error">Titel ist erforderlich</span>}
      </div>
      <div>
        <label className="form-label">Plattform</label>
        <input
          placeholder="Wird automatisch erkannt – oder manuell eingeben"
          value={fields.sub}
          onChange={e => setFields(f => ({ ...f, sub: e.target.value }))}
        />
      </div>
      <div className="form-row">
        <div>
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
        <div>
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
    </Sheet>
  )
  }

  const renderMovieForm = (fields, setFields, onSave, onCancel, title, submitted, imageBlock) => {
    const titleMissing = submitted && !fields.title.trim()
    return (
    <Sheet title={title} onClose={onCancel}>
      {imageBlock}
      <div>
        <label className="form-label">Titel</label>
        <input
          className={titleMissing ? 'input-error' : ''}
          placeholder="Titel"
          value={fields.title}
          onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
        />
        {titleMissing && <span className="form-error">Titel ist erforderlich</span>}
      </div>
      <label className="form-label">Genre</label>
      <TagInput
        value={fields.genres}
        onChange={genres => setFields(f => ({ ...f, genres }))}
        suggestions={knownGenres}
        placeholder="Wird automatisch erkannt (Enter)"
      />
      <div className="form-row">
        <div style={{ flex: 1 }}>
          <label className="form-label">Plattform</label>
          <input
            placeholder="Automatisch erkannt"
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
    </Sheet>
  )
  }

  const renderActivityForm = (fields, setFields, onSave, onCancel, title, submitted) => {
    const titleMissing = submitted && !fields.title.trim()
    return (
    <Sheet title={title} onClose={onCancel}>
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
          <select value={fields.status} onChange={handleActivityStatusChange(setFields)}>
            {ACTIVITY_STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
      </div>
    </Sheet>
  )
  }

  const viewingSeriesItem = series.find(s => s.id === viewingId)
  const viewingMovieItem = movies.find(m => m.id === viewingId)
  const viewingActivityItem = activities.find(a => a.id === viewingId)

  // Poster controls shown inside the edit forms. `item` is the live row (so the
  // preview reflects stream updates); refetch/clear persist immediately via the
  // dedicated image endpoint, independent of the Save button.
  const renderPosterControls = (item, onRefetch, onClear) => {
    if (!item) return null
    const run = (fn) => async () => {
      setPosterBusy(true)
      try { await fn() } catch (e) { showToast(e.message) } finally { setPosterBusy(false) }
    }
    return (
      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Poster</label>
        {item.imageUrl && (
          <img src={item.imageUrl} alt=""
            style={{ width: 96, height: 144, objectFit: 'cover', borderRadius: 10, display: 'block', marginBottom: 8 }} />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" disabled={posterBusy} onClick={run(onRefetch)}>
            {posterBusy ? 'Suche…' : item.imageUrl ? 'Poster aktualisieren' : 'Poster suchen'}
          </button>
          {item.imageUrl && (
            <button className="btn btn-ghost" disabled={posterBusy} onClick={run(onClear)}>Entfernen</button>
          )}
        </div>
      </div>
    )
  }

  const renderAuthor = (who) => (
    who
      ? <div className="who-added">
          <div className="dot" style={{ background: authorColor(who, currentUser) }} />
          Von {cap(who)} hinzugefügt
        </div>
      : <span />
  )

  // Color-coded meta row for media cards: a teal platform chip (where to watch)
  // first, then neutral genre/season chips. While the row is being enriched with
  // TMDB data, a small spinner chip is shown alongside whatever is already there.
  const renderMediaMeta = (id, platform, neutralChips) => {
    const enriching = enrichingIds.has(id)
    if (!platform && neutralChips.length === 0 && !enriching) return null
    return (
      <div className="media-meta">
        {platform && (
          <span className="chip-platform"><TvIcon width={13} height={13} />{platform}</span>
        )}
        {neutralChips.map((t, i) => <span key={i} className="chip-genre">{t}</span>)}
        {enriching && <span className="chip-loading"><span className="spinner-sm" />Lädt…</span>}
      </div>
    )
  }

  const renderSeriesRow = (s) => {
    const neutral = s.season > 0 ? [`Staffel ${s.season}`] : []
    return (
      <div key={s.id} className="media-card" onClick={() => openDetail('series', s.id)}>
        {s.imageUrl
          ? <img className="media-poster" src={s.imageUrl} alt="" loading="lazy" />
          : <div className="media-poster media-poster-fallback">{s.emoji}</div>}
        <div className="media-body">
          <div className="media-body-top">
            <div className="card-title">{s.title}</div>
            <span className={`badge badge-${s.statusType}`}>{s.status}</span>
          </div>
          {renderMediaMeta(s.id, s.sub, neutral)}
          <div className="media-footer">
            {renderAuthor(s.who)}
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditSeries(s) }}><PencilIcon /></button>
              <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteSeries(s.id) }}><CloseIcon /></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMovieRow = (m) => {
    return (
      <div key={m.id} className="media-card" onClick={() => openDetail('movie', m.id)}>
        {m.imageUrl
          ? <img className="media-poster" src={m.imageUrl} alt="" loading="lazy" />
          : <div className="media-poster media-poster-fallback">{m.emoji}</div>}
        <div className="media-body">
          <div className="media-body-top">
            <div className="card-title">{m.title}</div>
            <span className={`badge badge-${m.statusType}`}>{m.status}</span>
          </div>
          {renderMediaMeta(m.id, m.sub, m.genres || [])}
          <div className="media-footer">
            {renderAuthor(m.who)}
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditMovie(m) }}><PencilIcon /></button>
              <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteMovie(m.id) }}><CloseIcon /></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderActivityRow = (a) => (
      <div key={a.id} className="card" onClick={() => openDetail('activity', a.id)}>
        <div className="list-card-head">
          <div className="list-emoji">{a.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card-title">{a.title}</div>
            {a.meta && <div className="card-meta">{a.meta}</div>}
          </div>
          <span className={`badge badge-${activityStatusType(a.status)}`}>{a.status || 'Idee'}</span>
        </div>
        <div className="card-footer">
          {renderAuthor(a.who)}
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-edit" title="Als Termin eintragen" onClick={(e) => { e.stopPropagation(); onNavigateToCalendar(null, { title: `${a.emoji} ${a.title}` }) }}><CalendarIcon /></button>
            <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEditActivity(a) }}><PencilIcon /></button>
            <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteActivity(a.id) }}><CloseIcon /></button>
          </div>
        </div>
      </div>
  )

  const renderDoneSection = (key, doneItems, renderRow, label = 'Erledigt') => {
    if (doneItems.length === 0) return null
    const open = showDone[key]
    return (
      <>
        <button
          type="button"
          className="done-toggle"
          onClick={() => setShowDone(prev => ({ ...prev, [key]: !prev[key] }))}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 7, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 13, padding: '14px 0 10px', marginTop: 4,
          }}
        >
          <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
          {label} ({doneItems.length})
        </button>
        {open && doneItems.map(renderRow)}
      </>
    )
  }

  return (
    <div>
      <p className="section-title">Eure <em>Listen</em></p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          ['series', '🍿 Serien'],
          ['movies', '🎬 Filme'],
          ['activities', '✨ Aktivitäten'],
          ['shopping', '🛒 Einkauf'],
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
          {!showSeriesForm && !editingSeries && (
            <button
              className="fab"
              aria-label="Serie hinzufügen"
              onClick={() => { setNewSeries({ ...EMPTY_SERIES }); setShowSeriesForm(true) }}
            >+</button>
          )}

          {series.filter(s => s.status !== 'Fertig').map(renderSeriesRow)}
          {renderDoneSection('series', series.filter(s => s.status === 'Fertig'), renderSeriesRow)}
          {series.length === 0 && !showSeriesForm && !seriesLoading && (
            <EmptyState emoji="🍿" title="Noch keine Serien" hint="Tippe auf +, um eure erste Serie zu eurer Watchlist hinzuzufügen." />
          )}
        </>
      )}

      {activeList === 'activities' && (
        <>
          {!showActivityForm && !editingActivity && (
            <button
              className="fab"
              aria-label="Aktivität vorschlagen"
              onClick={() => { setNewAct({ ...EMPTY_ACTIVITY }); setShowActivityForm(true) }}
            >+</button>
          )}

          {activities.filter(a => a.status !== 'Gemacht').map(renderActivityRow)}
          {renderDoneSection('activities', activities.filter(a => a.status === 'Gemacht'), renderActivityRow)}
          {activities.length === 0 && !showActivityForm && !activitiesLoading && (
            <EmptyState emoji="✨" title="Noch keine Aktivitäten" hint="Tippe auf +, um eine gemeinsame Idee festzuhalten." />
          )}
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

          {!showMovieForm && !editingMovie && (
            <button
              className="fab"
              aria-label="Film hinzufügen"
              onClick={() => { setNewMovie({ ...EMPTY_MOVIE }); setShowMovieForm(true) }}
            >+</button>
          )}

          {displayedMovies.filter(m => m.status !== 'Gesehen').map(renderMovieRow)}
          {renderDoneSection('movies', displayedMovies.filter(m => m.status === 'Gesehen'), renderMovieRow, 'Gesehen')}
          {displayedMovies.length === 0 && !showMovieForm && !moviesLoading && (
            movies.length === 0
              ? <EmptyState emoji="🎬" title="Noch keine Filme" hint="Tippe auf +, um euren ersten Film zu eurer Watchlist hinzuzufügen." />
              : <EmptyState emoji="🎬" title="Keine Treffer" hint="Kein Film passt zu den gewählten Genres." />
          )}
        </>
      )}

      {activeList === 'shopping' && (
        <>
          <div className="shopping-input-row">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={shopInputRef}
                className="shopping-input"
                placeholder="Artikel hinzufügen…"
                value={shopInput}
                onChange={e => {
                  const val = e.target.value
                  setShopInput(val)
                  const { qty, name } = parseQty(val.trim())
                  const namePart = name.toLowerCase()
                  if (namePart.length > 0) {
                    setShopSuggestions(
                      shopHistory
                        .filter(h => h.toLowerCase().startsWith(namePart) && h.toLowerCase() !== namePart)
                        .map(h => qty ? `${qty} ${h}` : h)
                        .slice(0, 5)
                    )
                  } else {
                    setShopSuggestions([])
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && shopInput.trim()) {
                    handleAddShopItem(shopInput)
                    setShopInput('')
                    setShopSuggestions([])
                  } else if (e.key === 'Escape') {
                    setShopSuggestions([])
                  }
                }}
              />
              {shopSuggestions.length > 0 && (
                <div className="shop-suggestions">
                  {shopSuggestions.map(s => (
                    <div
                      key={s}
                      className="shop-suggestion-item"
                      onMouseDown={e => { e.preventDefault(); setShopInput(s); setShopSuggestions([]); shopInputRef.current?.focus() }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              className="shop-add-btn"
              onClick={() => {
                if (shopInput.trim()) { handleAddShopItem(shopInput); setShopInput(''); setShopSuggestions([]) }
              }}
            >+</button>
          </div>

          {shopItems.some(i => i.checked) && (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
              onClick={handleClearChecked}
            >Erledigte löschen</button>
          )}

          <div>
            {shopItems.filter(i => !i.checked).map(item => (
              <div key={item.id} className="shop-item">
                <button className="shop-check" onClick={() => handleToggleItem(item.id, item.checked)} aria-label="Abhaken">
                  <span className="shop-check-inner" />
                </button>
                <span className="shop-item-name">
                  {item.qty && <span style={{ color: 'var(--muted)', marginRight: 4 }}>{item.qty}</span>}
                  {item.name}
                </span>
                <span
                  className="shop-author-dot"
                  style={{ background: authorColor(item.who, currentUser) }}
                  title={item.who}
                />
                <button className="btn-delete" style={{ width: 32, height: 32 }} onClick={() => handleDeleteItem(item.id)}><CloseIcon /></button>
              </div>
            ))}
            {shopItems.some(i => i.checked) && (
              <>
                <div className="shop-divider">Erledigt</div>
                {shopItems.filter(i => i.checked).map(item => (
                  <div key={item.id} className="shop-item shop-item-checked">
                    <button className="shop-check shop-check-done" onClick={() => handleToggleItem(item.id, item.checked)} aria-label="Wiederherstellen">
                      <span className="shop-check-inner shop-check-inner-done">✓</span>
                    </button>
                    <span className="shop-item-name shop-item-name-checked">
                      {item.qty && <span style={{ marginRight: 4 }}>{item.qty}</span>}
                      {item.name}
                    </span>
                    <span
                      className="shop-author-dot"
                      style={{ background: authorColor(item.who, currentUser), opacity: 0.4 }}
                      title={item.who}
                    />
                    <button className="btn-delete" style={{ width: 32, height: 32 }} onClick={() => handleDeleteItem(item.id)}><CloseIcon /></button>
                  </div>
                ))}
              </>
            )}
            {shopItems.length === 0 && !shopLoading && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, padding: '32px 0' }}>
                Liste ist leer 🛒
              </div>
            )}
          </div>
        </>
      )}

      {sheet === 'series' && viewingSeriesItem && (
        <SeriesDetail
          series={viewingSeriesItem}
          onEdit={() => { closeDetail(); startEditSeries(viewingSeriesItem) }}
          onClose={closeDetail}
          currentUser={currentUser}
        />
      )}
      {sheet === 'movie' && viewingMovieItem && (
        <MovieDetail
          movie={viewingMovieItem}
          onEdit={() => { closeDetail(); startEditMovie(viewingMovieItem) }}
          onClose={closeDetail}
          currentUser={currentUser}
        />
      )}
      {sheet === 'activity' && viewingActivityItem && (
        <ActivityDetail
          activity={viewingActivityItem}
          onEdit={() => { closeDetail(); startEditActivity(viewingActivityItem) }}
          onClose={closeDetail}
          onNavigateToCalendar={onNavigateToCalendar}
          currentUser={currentUser}
        />
      )}

      {showSeriesForm && renderSeriesForm(
        newSeries, setNewSeries,
        handleAddSeries, () => { setShowSeriesForm(false); setSubmitted(false) },
        'Serie hinzufügen', submitted
      )}
      {editingSeries && renderSeriesForm(
        editSeriesFields, setEditSeriesFields,
        handleUpdateSeries, () => { setEditingSeries(null); setSubmitted(false) },
        'Serie bearbeiten', submitted,
        renderPosterControls(
          series.find(s => s.id === editingSeries),
          () => setSeriesImage(editingSeries, editSeriesFields.title),
          () => clearSeriesImage(editingSeries),
        )
      )}

      {showMovieForm && renderMovieForm(
        newMovie, setNewMovie,
        handleAddMovie, () => { setShowMovieForm(false); setSubmitted(false) },
        'Film hinzufügen', submitted
      )}
      {editingMovie && renderMovieForm(
        editMovieFields, setEditMovieFields,
        handleUpdateMovie, () => { setEditingMovie(null); setSubmitted(false) },
        'Film bearbeiten', submitted,
        renderPosterControls(
          movies.find(m => m.id === editingMovie),
          () => setMovieImage(editingMovie, editMovieFields.title),
          () => clearMovieImage(editingMovie),
        )
      )}

      {showActivityForm && renderActivityForm(
        newAct, setNewAct,
        handleAddActivity, () => { setShowActivityForm(false); setSubmitted(false) },
        'Aktivität hinzufügen', submitted
      )}
      {editingActivity && renderActivityForm(
        editActivityFields, setEditActivityFields,
        handleUpdateActivity, () => { setEditingActivity(null); setSubmitted(false) },
        'Aktivität bearbeiten', submitted
      )}
    </div>
  )
}
