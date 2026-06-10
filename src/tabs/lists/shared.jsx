import { TvIcon } from '../../components/Icons.jsx'
import { authorColor } from '../../utils/authorColor.js'

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

export function activityStatusType(status) {
  const map = { Idee: 'yellow', Geplant: 'green', Gemacht: 'gray' }
  return map[status] || 'yellow'
}

export { pressable } from '../../utils/pressable.js'

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
// first, then neutral genre/season chips. While the row is being enriched with
// TMDB data, a small spinner chip is shown alongside whatever is already there.
export function MediaMeta({ enriching, platform, neutral }) {
  if (!platform && neutral.length === 0 && !enriching) return null
  return (
    <div className="media-meta">
      {platform && (
        <span className="chip-platform"><TvIcon width={13} height={13} />{platform}</span>
      )}
      {neutral.map((t, i) => <span key={i} className="chip-genre">{t}</span>)}
      {enriching && <span className="chip-loading"><span className="spinner-sm" />Lädt…</span>}
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

// Poster controls shown inside the edit forms. `item` is the live row (so the
// preview reflects stream updates); refetch/clear persist immediately via the
// dedicated image endpoint, independent of the Save button.
export function PosterControls({ item, busy, setBusy, onRefetch, onClear, showToast }) {
  if (!item) return null
  const run = (fn) => async () => {
    setBusy(true)
    try { await fn() } catch (e) { showToast(e.message) } finally { setBusy(false) }
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label">Poster</label>
      {item.imageUrl && (
        <img src={item.imageUrl} alt=""
          style={{ width: 96, height: 144, objectFit: 'cover', borderRadius: 10, display: 'block', marginBottom: 8 }} />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" disabled={busy} onClick={run(onRefetch)}>
          {busy ? 'Suche…' : item.imageUrl ? 'Poster aktualisieren' : 'Poster suchen'}
        </button>
        {item.imageUrl && (
          <button className="btn btn-ghost" disabled={busy} onClick={run(onClear)}>Entfernen</button>
        )}
      </div>
    </div>
  )
}
