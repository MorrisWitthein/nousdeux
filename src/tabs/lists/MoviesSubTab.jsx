import { useState, useMemo, useRef } from 'react'
import TagInput from '../../components/TagInput.jsx'
import { PencilIcon, CloseIcon, CheckIcon } from '../../components/Icons.jsx'
import ExpandingSheet from '../../components/ExpandingSheet.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { AuthorLine, DetailFooter, DoneSection, MediaChips, MediaMeta, MOVIE_PLATFORMS, PlatformSelect, PosterTitleField, StarRating, Stars, pressable } from './shared.jsx'

const STATUS_OPTIONS = [
  { label: 'Geplant', type: 'yellow' },
  { label: 'Gesehen', type: 'red' },
]

const EMPTY_MOVIE = { emoji: '🍿', title: '', sub: '', genres: [], status: 'Geplant', statusType: 'yellow', rating: 0, imageUrl: '' }

function MovieDetail({ movie, onEdit, onMarkWatched, onClose, currentUser }) {
  const watched = movie.status === 'Gesehen'
  return (
    <ExpandingSheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {movie.imageUrl
          ? <img src={movie.imageUrl} alt={movie.title} className="detail-poster" />
          : <div style={{ fontSize: 48, marginBottom: 8 }}>{movie.emoji}</div>}
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>{movie.title}</div>
        <span className={`badge badge-${movie.statusType}`} style={{ marginBottom: 12, display: 'inline-block' }}>{movie.status}</span>
        {watched && movie.rating > 0 && (
          <div style={{ color: 'var(--accent3)', fontSize: 20, margin: '4px 0 12px' }}>
            {'★'.repeat(movie.rating)}{'☆'.repeat(5 - movie.rating)}
          </div>
        )}
        <MediaChips platform={movie.sub} neutral={movie.genres || []} />
      </div>
      {!watched && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}
          onClick={onMarkWatched}
        >
          <CheckIcon />Haben wir gesehen
        </button>
      )}
      <DetailFooter who={movie.who} currentUser={currentUser}>
        {watched && (
          <button className="btn btn-secondary" style={{ padding: '10px 16px' }} onClick={onMarkWatched}>
            {movie.rating > 0 ? 'Neu bewerten' : 'Bewerten'}
          </button>
        )}
        <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={onEdit}>Bearbeiten</button>
      </DetailFooter>
    </ExpandingSheet>
  )
}

// Popup shown after tapping "Haben wir gesehen": asks for a 0–5 star rating,
// then flips the movie to "Gesehen" with that rating.
function RateSheet({ movie, onConfirm, onCancel }) {
  const [value, setValue] = useState(movie.rating || 0)
  return (
    <ExpandingSheet title="Gesehen!" onClose={onCancel}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {movie.imageUrl
          ? <img src={movie.imageUrl} alt={movie.title} className="detail-poster" />
          : <div style={{ fontSize: 48, marginBottom: 8 }}>{movie.emoji}</div>}
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>{movie.title}</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>Wie hat euch der Film gefallen?</p>
        <StarRating value={value} onChange={setValue} center />
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={() => onConfirm(value)}>Als gesehen speichern</button>
      </div>
    </ExpandingSheet>
  )
}

function MovieForm({ fields, setFields, onSave, onCancel, title, submitted, knownGenres, search, fetchDetail, showToast }) {
  const titleMissing = submitted && !fields.title.trim()
  const handleStatusChange = (e) => {
    const opt = STATUS_OPTIONS.find(o => o.label === e.target.value)
    setFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
  }
  return (
    <ExpandingSheet title={title} onClose={onCancel}>
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
      {fields.status === 'Gesehen' && (
        <>
          <label className="form-label">Bewertung</label>
          <StarRating value={fields.rating} onChange={v => setFields(f => ({ ...f, rating: v }))} />
        </>
      )}
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" disabled={!fields.title.trim()} onClick={onSave}>Speichern</button>
      </div>
    </ExpandingSheet>
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
  const [ratingId, setRatingId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)

  const knownGenres = useMemo(
    () => [...new Set(movies.flatMap(m => m.genres || []))].sort(),
    [movies]
  )

  const displayedMovies = searchQuery.trim() === ''
    ? movies
    : movies.filter(m => {
        const q = searchQuery.toLowerCase()
        return m.title.toLowerCase().includes(q) || (m.genres || []).some(g => g.toLowerCase().includes(q))
      })

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
        rating: newMovie.status === 'Gesehen' ? newMovie.rating : 0,
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
      rating: m.rating || 0,
      imageUrl: m.imageUrl || '',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    setSubmitted(true)
    if (!editFields.title.trim()) return
    try {
      const { imageUrl, ...rest } = editFields
      // A rating only applies to watched films; drop it otherwise.
      if (rest.status !== 'Gesehen') rest.rating = 0
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

  // Flip a movie to "Gesehen" with the chosen rating. PATCH overwrites the full
  // row, so we send the movie's current fields alongside the new status/rating.
  const handleRate = async (value) => {
    const m = movies.find(x => x.id === ratingId)
    if (!m) { setRatingId(null); return }
    try {
      await updateMovie(ratingId, {
        emoji: m.emoji,
        title: m.title,
        sub: m.sub || '',
        genres: m.genres || [],
        status: 'Gesehen',
        statusType: 'red',
        rating: value,
      })
      setRatingId(null)
      setShowDone(true)
    } catch (err) { showToast(err.message) }
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
        {m.rating > 0 && <div className="media-rating"><Stars value={m.rating} /></div>}
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
  const ratingItem = movies.find(m => m.id === ratingId)

  return (
    <>
      <div className="tag-filter" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={searchRef}
          placeholder="Filme suchen…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          style={{ flex: 1, paddingRight: searchQuery ? 28 : undefined }}
        />
        {searchQuery && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setSearchQuery(''); setSearchOpen(false); searchRef.current?.focus() }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: 2 }}
          >×</button>
        )}
        {searchOpen && (() => {
          const q = searchQuery.toLowerCase()
          const genreSuggestions = knownGenres.filter(g => !q || g.toLowerCase().includes(q))
          return genreSuggestions.length > 0 ? (
            <div className="tag-dropdown">
              {genreSuggestions.map(g => (
                <div key={g} className="tag-dropdown-item" onMouseDown={() => { setSearchQuery(g); setSearchOpen(false) }}>{g}</div>
              ))}
            </div>
          ) : null
        })()}
      </div>

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
          : <EmptyState emoji="🎬" title="Keine Treffer" hint={`Kein Film passt zu „${searchQuery}".`} />
      )}

      {viewingItem && (
        <MovieDetail
          movie={viewingItem}
          onEdit={() => { setViewingId(null); startEdit(viewingItem) }}
          onMarkWatched={() => { setRatingId(viewingItem.id); setViewingId(null) }}
          onClose={() => setViewingId(null)}
          currentUser={currentUser}
        />
      )}

      {ratingItem && (
        <RateSheet
          movie={ratingItem}
          onConfirm={handleRate}
          onCancel={() => setRatingId(null)}
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
