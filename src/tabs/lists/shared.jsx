import { useState } from 'react'
import { TvIcon } from '../../components/Icons.jsx'
import { authorColor } from '../../utils/authorColor.js'

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

// The major streaming services we support for movies/series. Auto-detection
// (api/list_images.go canonicalPlatform) maps TMDB providers onto these exact
// labels, and the manual Plattform dropdown offers the same set.
export const PLATFORMS = ['Netflix', 'Prime', 'Disney+', 'HBO', 'WOW']

export function activityStatusType(status) {
  const map = { Idee: 'yellow', Geplant: 'green', Gemacht: 'gray' }
  return map[status] || 'yellow'
}

export { pressable } from '../../utils/pressable.js'

// Dropdown for the manual Plattform field, limited to the supported services.
// If the row already holds a value outside the allowlist (e.g. legacy
// comma-separated data), it is shown as an extra option so editing the rest of
// the form never silently drops it.
export function PlatformSelect({ value, onChange }) {
  const legacy = value && !PLATFORMS.includes(value)
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">– Keine –</option>
      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
      {legacy && <option value={value}>{value}</option>}
    </select>
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

// Poster + metadata picker shown at the top of the create/edit forms. Lets the
// user search TMDB by the current title, pick the right match from the results
// (disambiguating titles like remakes), and have its poster/genres/platform
// applied to the form. Nothing is persisted here — the form's Save button does
// that — so the same control works for both creating and editing.
//
// `imageUrl` is the poster currently held in form state; `onClear` drops it;
// `onApply(candidate, detail)` receives the chosen match plus its TMDB detail.
export function PosterPicker({ imageUrl, onClear, query, search, fetchDetail, onApply, showToast }) {
  // null = idle (not searched yet), [] = searched with no hits, [...] = results.
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)

  const runSearch = async () => {
    const q = (query || '').trim()
    if (!q) return
    setBusy(true)
    try {
      setResults(await search(q))
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  const pick = async (c) => {
    setBusy(true)
    try {
      const detail = await fetchDetail(c.tmdbId)
      onApply(c, detail)
      setResults(null)
    } catch (e) {
      showToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label">Poster &amp; Infos</label>
      <div className="poster-picker-head">
        {imageUrl
          ? <img className="poster-picker-preview" src={imageUrl} alt="" />
          : <div className="poster-picker-preview poster-picker-empty">🎬</div>}
        <div className="poster-picker-actions">
          <button type="button" className="btn btn-ghost" disabled={busy || !(query || '').trim()} onClick={runSearch}>
            {busy ? 'Suche…' : '🔍 In TMDB suchen'}
          </button>
          {imageUrl && (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClear}>Entfernen</button>
          )}
        </div>
      </div>
      {results !== null && (
        results.length === 0
          ? <p className="poster-picker-hint">Nichts gefunden – Felder unten manuell ausfüllen.</p>
          : <ul className="tmdb-results">
              {results.map(c => (
                <li key={c.tmdbId}>
                  <button type="button" className="tmdb-result" disabled={busy} onClick={() => pick(c)}>
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
  )
}
