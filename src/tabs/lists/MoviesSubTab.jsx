import { useState, useMemo } from 'react'
import TagInput from '../../components/TagInput.jsx'
import { PencilIcon, CloseIcon } from '../../components/Icons.jsx'
import Sheet from '../../components/Sheet.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { AuthorLine, DetailFooter, DoneSection, MediaChips, MediaMeta, MOVIE_PLATFORMS, PlatformSelect, PosterTitleField, pressable } from './shared.jsx'

const STATUS_OPTIONS = [
  { label: 'Geplant', type: 'yellow' },
  { label: 'Gesehen', type: 'red' },
]

const EMPTY_MOVIE = { emoji: '🍿', title: '', sub: '', genres: [], status: 'Geplant', statusType: 'yellow', imageUrl: '' }

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

function MovieForm({ fields, setFields, onSave, onCancel, title, submitted, knownGenres, search, fetchDetail, showToast }) {
  const titleMissing = submitted && !fields.title.trim()
  const handleStatusChange = (e) => {
    const opt = STATUS_OPTIONS.find(o => o.label === e.target.value)
    setFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
  }
  return (
    <Sheet title={title} onClose={onCancel}>
      <PosterTitleField
        imageUrl={fields.imageUrl}
        onClear={() => setFields(f => ({ ...f, imageUrl: '' }))}
        value={fields.title}
        onChange={title => setFields(f => ({ ...f, title }))}
        search={search}
        fetchDetail={fetchDetail}
        onApply={(c, detail) => setFields(f => ({
          ...f,
          title: c.title,
          imageUrl: c.posterUrl,
          genres: detail.genres?.length ? detail.genres : f.genres,
          sub: detail.platform || f.sub,
        }))}
        showToast={showToast}
        error={titleMissing}
        errorText="Titel ist erforderlich"
      />
      <label className="form-label">Genre</label>
      <TagInput
        value={fields.genres}
        onChange={genres => setFields(f => ({ ...f, genres }))}
        suggestions={knownGenres}
        placeholder="Über Suche oder manuell (Enter)"
      />
      <div className="form-row">
        <div style={{ flex: 1 }}>
          <label className="form-label">Plattform</label>
          <PlatformSelect
            value={fields.sub}
            onChange={sub => setFields(f => ({ ...f, sub }))}
            options={MOVIE_PLATFORMS}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Status</label>
          <select value={fields.status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" disabled={!fields.title.trim()} onClick={onSave}>Speichern</button>
      </div>
    </Sheet>
  )
}

export default function MoviesSubTab({
  movies, addMovie, updateMovie, deleteMovie, moviesLoading,
  searchMovies, fetchMovieDetail, patchMovieImage,
  currentUser,
}) {
  const showToast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [newMovie, setNewMovie] = useState({ ...EMPTY_MOVIE })
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_MOVIE })
  const [viewingId, setViewingId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [activeGenres, setActiveGenres] = useState([])

  const knownGenres = useMemo(
    () => [...new Set(movies.flatMap(m => m.genres || []))].sort(),
    [movies]
  )

  const displayedMovies = activeGenres.length === 0
    ? movies
    : movies.filter(m => activeGenres.some(g => (m.genres || []).includes(g)))

  const toggleGenre = (genre) =>
    setActiveGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre])

  const handleAdd = async () => {
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
      // Poster persists separately; the row already exists, so a failure here
      // must not block closing the form (retrying would duplicate the movie).
      if (id && newMovie.imageUrl) {
        try { await patchMovieImage(id, newMovie.imageUrl) } catch (e) { showToast(e.message) }
      }
      setNewMovie({ ...EMPTY_MOVIE })
      setSubmitted(false)
      setShowForm(false)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const startEdit = (m) => {
    setSubmitted(false)
    if (m.status === 'Gesehen') setShowDone(true)
    setEditingId(m.id)
    setEditFields({
      emoji: m.emoji || '🍿',
      title: m.title,
      sub: m.sub || '',
      genres: m.genres || [],
      status: m.status || 'Geplant',
      statusType: m.statusType || 'yellow',
      imageUrl: m.imageUrl || '',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    setSubmitted(true)
    if (!editFields.title.trim()) return
    try {
      const { imageUrl, ...rest } = editFields
      await updateMovie(editingId, rest)
      const row = movies.find(m => m.id === editingId)
      if ((row?.imageUrl || '') !== (imageUrl || '')) await patchMovieImage(editingId, imageUrl || '')
      setSubmitted(false)
      setEditingId(null)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const handleDelete = async (id) => {
    const item = movies.find(m => m.id === id)
    try {
      await deleteMovie(id)
      showToast('Film gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addMovie(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const renderRow = (m) => (
    <div key={m.id} className="media-card" {...pressable(() => setViewingId(m.id))}>
      {m.imageUrl
        ? <img className="media-poster" src={m.imageUrl} alt="" loading="lazy" />
        : <div className="media-poster media-poster-fallback">{m.emoji}</div>}
      <div className="media-body">
        <div className="media-body-top">
          <div className="card-title">{m.title}</div>
          <span className={`badge badge-${m.statusType}`}>{m.status}</span>
        </div>
        <MediaMeta platform={m.sub} neutral={m.genres || []} />
        <div className="media-footer">
          <AuthorLine who={m.who} currentUser={currentUser} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEdit(m) }}><PencilIcon /></button>
            <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}><CloseIcon /></button>
          </div>
        </div>
      </div>
    </div>
  )

  const viewingItem = movies.find(m => m.id === viewingId)

  return (
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

      {!showForm && !editingId && (
        <button
          className="fab"
          aria-label="Film hinzufügen"
          onClick={() => { setNewMovie({ ...EMPTY_MOVIE }); setShowForm(true) }}
        >+</button>
      )}

      {displayedMovies.filter(m => m.status !== 'Gesehen').map(renderRow)}
      <DoneSection
        items={displayedMovies.filter(m => m.status === 'Gesehen')}
        open={showDone}
        onToggle={() => setShowDone(v => !v)}
        renderRow={renderRow}
        label="Gesehen"
      />
      {displayedMovies.length === 0 && !showForm && !moviesLoading && (
        movies.length === 0
          ? <EmptyState emoji="🎬" title="Noch keine Filme" hint="Tippe auf +, um euren ersten Film zu eurer Watchlist hinzuzufügen." />
          : <EmptyState emoji="🎬" title="Keine Treffer" hint="Kein Film passt zu den gewählten Genres." />
      )}

      {viewingItem && (
        <MovieDetail
          movie={viewingItem}
          onEdit={() => { setViewingId(null); startEdit(viewingItem) }}
          onClose={() => setViewingId(null)}
          currentUser={currentUser}
        />
      )}

      {showForm && (
        <MovieForm
          fields={newMovie} setFields={setNewMovie}
          onSave={handleAdd} onCancel={() => { setShowForm(false); setSubmitted(false) }}
          title="Film hinzufügen" submitted={submitted} knownGenres={knownGenres}
          search={searchMovies} fetchDetail={fetchMovieDetail} showToast={showToast}
        />
      )}
      {editingId && (
        <MovieForm
          fields={editFields} setFields={setEditFields}
          onSave={handleUpdate} onCancel={() => { setEditingId(null); setSubmitted(false) }}
          title="Film bearbeiten" submitted={submitted} knownGenres={knownGenres}
          search={searchMovies} fetchDetail={fetchMovieDetail} showToast={showToast}
        />
      )}
    </>
  )
}
