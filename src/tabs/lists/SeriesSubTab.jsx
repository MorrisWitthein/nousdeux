import { useState } from 'react'
import { PencilIcon, CloseIcon } from '../../components/Icons.jsx'
import Sheet from '../../components/Sheet.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { AuthorLine, DetailFooter, DoneSection, MediaChips, MediaMeta, PosterControls, pressable } from './shared.jsx'

const STATUS_OPTIONS = [
  { label: 'Geplant', type: 'yellow' },
  { label: 'Läuft', type: 'green' },
  { label: 'Fertig', type: 'red' },
]

const EMPTY_SERIES = { title: '', sub: '', emoji: '🎬', season: '', status: 'Geplant', statusType: 'yellow' }

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

function SeriesForm({ fields, setFields, onSave, onCancel, title, submitted, imageBlock }) {
  const titleMissing = submitted && !fields.title.trim()
  const handleStatusChange = (e) => {
    const opt = STATUS_OPTIONS.find(o => o.label === e.target.value)
    setFields(f => ({ ...f, status: e.target.value, statusType: opt?.type || 'yellow' }))
  }
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

export default function SeriesSubTab({
  series, addSeries, updateSeries, deleteSeries, seriesLoading,
  setSeriesImage, clearSeriesImage, fetchSeriesMeta, patchSeriesImage,
  currentUser,
}) {
  const showToast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [newSeries, setNewSeries] = useState({ ...EMPTY_SERIES })
  const [editingId, setEditingId] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_SERIES })
  const [viewingId, setViewingId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [posterBusy, setPosterBusy] = useState(false)
  const [showDone, setShowDone] = useState(false)

  // Ids of newly-added series currently being enriched with TMDB metadata
  // (platform). Drives the inline "Lädt…" spinner on the card.
  const [enrichingIds, setEnrichingIds] = useState(() => new Set())

  // After creating a series, fetch TMDB metadata and fill the poster plus any
  // fields the user left blank (platform). Never overwrites manual input. The
  // row PATCH is a full replace, so we merge into the original payload. Runs
  // in the background; failures are silent (poster stays default).
  const enrich = async (id, base) => {
    setEnrichingIds(s => new Set(s).add(id))
    try {
      const meta = await fetchSeriesMeta(base.title)
      if (!(base.sub || '').trim() && meta.platform) await updateSeries(id, { ...base, sub: meta.platform })
      if (meta.url) await patchSeriesImage(id, meta.url)
    } catch { /* keep default poster/fields */ }
    finally { setEnrichingIds(s => { const n = new Set(s); n.delete(id); return n }) }
  }

  const handleAdd = async () => {
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
      if (id) enrich(id, payload)
      setNewSeries({ ...EMPTY_SERIES })
      setSubmitted(false)
      setShowForm(false)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const startEdit = (s) => {
    setSubmitted(false)
    if (s.status === 'Fertig') setShowDone(true)
    setEditingId(s.id)
    setEditFields({
      title: s.title,
      sub: s.sub || '',
      emoji: s.emoji || '🎬',
      season: s.season || '',
      status: s.status || 'Geplant',
      statusType: s.statusType || 'yellow',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    setSubmitted(true)
    if (!editFields.title.trim()) return
    try {
      await updateSeries(editingId, {
        ...editFields,
        season: parseInt(editFields.season, 10) || 0,
      })
      setSubmitted(false)
      setEditingId(null)
    } catch (err) {
      showToast(err.message)
      setSubmitted(false)
    }
  }

  const handleDelete = async (id) => {
    const item = series.find(s => s.id === id)
    try {
      await deleteSeries(id)
      showToast('Serie gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addSeries(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const renderRow = (s) => {
    const neutral = s.season > 0 ? [`Staffel ${s.season}`] : []
    return (
      <div key={s.id} className="media-card" {...pressable(() => setViewingId(s.id))}>
        {s.imageUrl
          ? <img className="media-poster" src={s.imageUrl} alt="" loading="lazy" />
          : <div className="media-poster media-poster-fallback">{s.emoji}</div>}
        <div className="media-body">
          <div className="media-body-top">
            <div className="card-title">{s.title}</div>
            <span className={`badge badge-${s.statusType}`}>{s.status}</span>
          </div>
          <MediaMeta enriching={enrichingIds.has(s.id)} platform={s.sub} neutral={neutral} />
          <div className="media-footer">
            <AuthorLine who={s.who} currentUser={currentUser} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEdit(s) }}><PencilIcon /></button>
              <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}><CloseIcon /></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const viewingItem = series.find(s => s.id === viewingId)

  return (
    <>
      {!showForm && !editingId && (
        <button
          className="fab"
          aria-label="Serie hinzufügen"
          onClick={() => { setNewSeries({ ...EMPTY_SERIES }); setShowForm(true) }}
        >+</button>
      )}

      {series.filter(s => s.status !== 'Fertig').map(renderRow)}
      <DoneSection
        items={series.filter(s => s.status === 'Fertig')}
        open={showDone}
        onToggle={() => setShowDone(v => !v)}
        renderRow={renderRow}
      />
      {series.length === 0 && !showForm && !seriesLoading && (
        <EmptyState emoji="🍿" title="Noch keine Serien" hint="Tippe auf +, um eure erste Serie zu eurer Watchlist hinzuzufügen." />
      )}

      {viewingItem && (
        <SeriesDetail
          series={viewingItem}
          onEdit={() => { setViewingId(null); startEdit(viewingItem) }}
          onClose={() => setViewingId(null)}
          currentUser={currentUser}
        />
      )}

      {showForm && (
        <SeriesForm
          fields={newSeries} setFields={setNewSeries}
          onSave={handleAdd} onCancel={() => { setShowForm(false); setSubmitted(false) }}
          title="Serie hinzufügen" submitted={submitted}
        />
      )}
      {editingId && (
        <SeriesForm
          fields={editFields} setFields={setEditFields}
          onSave={handleUpdate} onCancel={() => { setEditingId(null); setSubmitted(false) }}
          title="Serie bearbeiten" submitted={submitted}
          imageBlock={
            <PosterControls
              item={series.find(s => s.id === editingId)}
              busy={posterBusy} setBusy={setPosterBusy} showToast={showToast}
              onRefetch={() => setSeriesImage(editingId, editFields.title)}
              onClear={() => clearSeriesImage(editingId)}
            />
          }
        />
      )}
    </>
  )
}
