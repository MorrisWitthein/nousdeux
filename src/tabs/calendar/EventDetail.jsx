import { useState, useEffect, useRef } from 'react'
import { CloseIcon, PaperclipIcon } from '../../components/Icons.jsx'
import ExpandingSheet from '../../components/ExpandingSheet.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { authorColor } from '../../utils/authorColor.js'
import { formatISOToGerman } from '../../utils/date.js'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function EventDetail({ event, onEdit, onClose, currentUser, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }) {
  const showToast = useToast()
  const isMultiDay = event.endDate && event.endDate > event.date
  const dateDisplay = isMultiDay
    ? `${formatISOToGerman(event.date)} – ${formatISOToGerman(event.endDate)}`
    : (formatISOToGerman(event.date) || event.date)

  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    listAttachments(event.id).then(setAttachments)
  }, [event.id])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadAttachment(event.id, file)
      if (result) setAttachments(prev => [...prev, result])
    } catch (err) {
      showToast(err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  // Attachment deletion keeps a native confirm: the file blob can't be
  // restored, so an undo toast would be a lie.
  const handleDelete = async (id) => {
    if (!window.confirm('Anhang löschen?')) return
    try {
      const ok = await deleteAttachment(id)
      if (ok) setAttachments(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <ExpandingSheet title="" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>
          {event.title}
        </div>
        <span className={`badge badge-${event.badgeType}`}>{event.badge}</span>
      </div>

      <div className="recipe-detail-section">
        <div className="recipe-detail-section-title">Datum</div>
        <div style={{ fontSize: 14, color: 'var(--ink)' }}>{dateDisplay}</div>
        {event.time && <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{event.time} Uhr</div>}
      </div>

      <div className="recipe-detail-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="recipe-detail-section-title" style={{ marginBottom: 0 }}>Anhänge</div>
          <button
            className="btn btn-ghost"
            style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <PaperclipIcon />
            {uploading ? 'Lädt…' : 'Hochladen'}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
        {attachments.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Keine Anhänge</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attachments.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', background: 'var(--warm)', borderRadius: 10,
              }}>
                <a
                  href={attachmentUrl(a.id)}
                  download={a.filename}
                  style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}
                >
                  {a.filename}
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatBytes(a.size)}</span>
                  <button className="btn-delete" onClick={() => handleDelete(a.id)}><CloseIcon /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
          <div className="dot" style={{ background: authorColor(event.who, currentUser) }} />
          Von {event.who.charAt(0).toUpperCase() + event.who.slice(1)}
        </div>
        <button className="btn btn-primary" style={{ flex: '0 0 auto', padding: '10px 20px' }} onClick={onEdit}>
          Bearbeiten
        </button>
      </div>
    </ExpandingSheet>
  )
}
