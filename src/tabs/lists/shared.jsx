import { useState, useEffect, useRef } from 'react'
import { TvIcon } from '../../components/Icons.jsx'
import ExpandingSheet from '../../components/ExpandingSheet.jsx'
import { authorColor } from '../../utils/authorColor.js'

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

// The major streaming services we support for movies/series. Auto-detection
// (api/list_images.go canonicalPlatform) maps TMDB providers onto these exact
// labels, and the manual Plattform dropdown offers the same set.
export const PLATFORMS = ['Netflix', 'Prime', 'Disney+', 'HBO', 'WOW']

// Movies can additionally be "in cinema" — a manual-only option, since TMDB's
// watch/providers feed only covers streaming, not theatrical runs.
export const MOVIE_PLATFORMS = [...PLATFORMS, 'Kino']

export function activityStatusType(status) {
  const map = { Idee: 'yellow', Geplant: 'green', Gemacht: 'gray' }
  return map[status] || 'yellow'
}

export { pressable } from '../../utils/pressable.js'

// Dropdown for the manual Plattform field, limited to the supported services.
// If the row already holds a value outside the allowlist (e.g. legacy
// comma-separated data), it is shown as an extra option so editing the rest of
// the form never silently drops it.
export function PlatformSelect({ value, onChange, options = PLATFORMS }) {
  const legacy = value && !options.includes(value)
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">– Keine –</option>
      {options.map(p => <option key={p} value={p}>{p}</option>)}
      {legacy && <option value={value}>{value}</option>}
    </select>
  )
}

// Interactive 5-star rating control. Tapping the current value clears it back
// to 0. Used in the movie form and the "mark as watched" sheet.
export function StarRating({ value, onChange, center }) {
  return (
    <div className="star-rating" style={center ? { justifyContent: 'center' } : undefined}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" className={`star ${n <= value ? 'active' : 'inactive'}`}
          aria-label={`${n} Sterne`}
          onClick={() => onChange(n === value ? 0 : n)}>★</button>
      ))}
    </div>
  )
}

// Read-only star display (filled + hollow), gold. Returns null for unrated.
export function Stars({ value }) {
  if (!value) return null
  return <span className="stars-display">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
}

// Popup shown when marking a movie/series as watched: asks for a 0–5 star
// rating, then hands the value back via onConfirm. Shared by both list tabs.
export function RateSheet({ item, prompt = 'Wie hat es euch gefallen?', onConfirm, onCancel }) {
  const [value, setValue] = useState(item.rating || 0)
  return (
    <ExpandingSheet title="Gesehen!" onClose={onCancel}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} className="detail-poster" />
          : <div style={{ fontSize: 48, marginBottom: 8 }}>{item.emoji}</div>}
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>{item.title}</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>{prompt}</p>
        <StarRating value={value} onChange={setValue} center />
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={() => onConfirm(value)}>Als gesehen speichern</button>
      </div>
    </ExpandingSheet>
  )
}

export function AuthorLine({ who, currentUser }) {
  if (!who) return <span />
  return (
    <div className="who-added">
      <div className="dot" style={{ background: authorColor(who, currentUser) }} />
      Von {cap(who)} hinzugefügt
    </div>
  )
}

export function DetailFooter({ who, currentUser, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <AuthorLine who={who} currentUser={currentUser} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  )
}

// Shared color-coded chips for detail sheets: platform first, then neutral
// genre/season chips. Mirrors the in-card meta row but without the spinner.
export function MediaChips({ platform, neutral }) {
  if (!platform && neutral.length === 0) return null
  return (
    <div className="media-meta" style={{ justifyContent: 'center', marginBottom: 4 }}>
      {platform && <span className="chip-platform"><TvIcon width={13} height={13} />{platform}</span>}
      {neutral.map((t, i) => <span key={i} className="chip-genre">{t}</span>)}
    </div>
  )
}

// Color-coded meta row for media cards: a teal platform chip (where to watch)
// first, then neutral genre/season chips.
export function MediaMeta({ platform, neutral }) {
  if (!platform && neutral.length === 0) return null
  return (
    <div className="media-meta">
      {platform && (
        <span className="chip-platform"><TvIcon width={13} height={13} />{platform}</span>
      )}
      {neutral.map((t, i) => <span key={i} className="chip-genre">{t}</span>)}
    </div>
  )
}

// Completed items (watched series/movies, done activities) collapse into a
// section that is hidden by default.
export function DoneSection({ items, open, onToggle, renderRow, label = 'Erledigt' }) {
  if (items.length === 0) return null
  return (
    <>
      <button
        type="button"
        className="done-toggle"
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 7, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 13, padding: '14px 0 10px', marginTop: 4,
        }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
        {label} ({items.length})
      </button>
      {open && items.map(renderRow)}
    </>
  )
}

// Title field at the top of the create/edit forms that doubles as a TMDB
// search box. As the user types, matches are fetched (debounced) and shown in a
// dropdown; picking one disambiguates titles like remakes and applies the
// poster/genres/platform to the form. Typing without picking still works for
// fully manual entry. A poster preview appears once one is set. Nothing is
// persisted here — the form's Save button does that — so the same control works
// for both creating and editing.
//
// `value`/`onChange` drive the title; `imageUrl`/`onClear` the poster preview;
// `onApply(candidate, detail)` receives the chosen match plus its TMDB detail.
export function PosterTitleField({
  imageUrl, onClear, value, onChange,
  search, fetchDetail, onApply, showToast,
  error, errorText, placeholder = 'Titel',
}) {
  // null = no search yet, [] = searched with no hits, [...] = matches.
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  // Skips the search the value change would otherwise trigger: once on mount
  // (so opening an edit form with a title doesn't auto-pop a dropdown) and
  // again right after a pick (which writes the chosen title back into `value`).
  const skipSearch = useRef(true)

  useEffect(() => {
    if (skipSearch.current) { skipSearch.current = false; return }
    const q = (value || '').trim()
    if (q.length < 2) { setResults(null); setOpen(false); return }
    let cancelled = false
    setBusy(true)
    const t = setTimeout(async () => {
      try {
        const r = await search(q)
        if (!cancelled) { setResults(r); setOpen(true) }
      } catch (e) {
        if (!cancelled) showToast(e.message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [value])

  const pick = async (c) => {
    setBusy(true)
    try {
      const detail = await fetchDetail(c.tmdbId)
      skipSearch.current = true
      onApply(c, detail)
      setResults(null)
      setOpen(false)
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {imageUrl && (
        <div className="poster-picker-head" style={{ marginBottom: 12 }}>
          <img className="poster-picker-preview" src={imageUrl} alt="" />
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClear}>Entfernen</button>
        </div>
      )}
      <label className="form-label">Titel</label>
      <div className="title-search">
        <input
          className={error ? 'input-error' : ''}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (results && results.length) setOpen(true) }}
          onBlur={() => setOpen(false)}
        />
        {open && results !== null && (
          results.length === 0
            ? (!busy && <p className="poster-picker-hint">Keine Treffer – Felder manuell ausfüllen.</p>)
            : <ul className="tmdb-results title-search-results">
                {results.map(c => (
                  <li key={c.tmdbId}>
                    <button
                      type="button"
                      className="tmdb-result"
                      disabled={busy}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => pick(c)}
                    >
                      {c.posterUrl
                        ? <img src={c.posterUrl} alt="" loading="lazy" />
                        : <span className="tmdb-result-noimg">🎬</span>}
                      <span className="tmdb-result-title">
                        {c.title}{c.year ? <span className="tmdb-result-year"> ({c.year})</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
        )}
      </div>
      {error && <span className="form-error">{errorText}</span>}
    </div>
  )
}
