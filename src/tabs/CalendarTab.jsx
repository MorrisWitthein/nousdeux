import { useState, useEffect, useRef, useCallback } from 'react'
import { PencilIcon, CloseIcon, PaperclipIcon } from '../components/Icons.jsx'
import Sheet from '../components/Sheet.jsx'
import { useToast } from '../context/ToastContext.jsx'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function EventDetail({ event, onEdit, onClose, currentUser, formatDate, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }) {
  const showToast = useToast()
  const isMultiDay = event.endDate && event.endDate > event.date
  const dateDisplay = isMultiDay
    ? `${formatDate(event.date)} – ${formatDate(event.endDate)}`
    : (formatDate(event.date) || event.date)

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
    <Sheet title="" onClose={onClose}>
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
          <div className="dot" style={{ background: event.who === currentUser ? 'var(--accent2)' : 'var(--accent)' }} />
          Von {event.who.charAt(0).toUpperCase() + event.who.slice(1)}
        </div>
        <button className="btn btn-primary" style={{ flex: '0 0 auto', padding: '10px 20px' }} onClick={onEdit}>
          Bearbeiten
        </button>
      </div>
    </Sheet>
  )
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]
const DAY_ABBR = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (firstDay + 6) % 7
  const grid = []
  for (let i = 0; i < offset; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  // Always reserve 6 rows so every month has the same height — keeps the
  // carousel from jumping vertically when sliding between months.
  while (grid.length < 42) grid.push(null)
  return grid
}

function formatISOToGerman(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]}, ${d}. ${SHORT_MONTHS[m - 1]} ${y}`
}

function toISO(year, month, day) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function parseEventDate(dateStr) {
  if (!dateStr) return null
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return { day: parseInt(isoMatch[3], 10), month: parseInt(isoMatch[2], 10) - 1, year: parseInt(isoMatch[1], 10) }
  }
  const match = dateStr.match(/(\d+)\.\s*(\w+)/)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const monthStr = match[2].toLowerCase().slice(0, 3)
  const idx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === monthStr)
  if (idx === -1) return null
  return { day, month: idx }
}

function buildWeekLaneMap(events, year, month, grid) {
  const laneMap = new Map()
  const weekCount = grid.length / 7

  for (let w = 0; w < weekCount; w++) {
    const weekDays = grid.slice(w * 7, (w + 1) * 7).filter(Boolean)
    if (!weekDays.length) continue
    const weekStartISO = toISO(year, month, Math.min(...weekDays))
    const weekEndISO = toISO(year, month, Math.max(...weekDays))

    const active = events.filter(e => {
      if (!e.date) return false
      const end = e.endDate && e.endDate > e.date ? e.endDate : e.date
      return e.date <= weekEndISO && end >= weekStartISO
    })

    active.sort((a, b) => {
      const aM = !!(a.endDate && a.endDate > a.date)
      const bM = !!(b.endDate && b.endDate > b.date)
      if (aM !== bM) return aM ? -1 : 1
      return (a.date ?? '').localeCompare(b.date ?? '')
    })

    const lanes = []
    active.forEach(e => {
      const end = e.endDate && e.endDate > e.date ? e.endDate : e.date
      const visStart = e.date > weekStartISO ? e.date : weekStartISO
      const visEnd = end < weekEndISO ? end : weekEndISO

      let lane = 0
      while (true) {
        if (!lanes[lane]) lanes[lane] = []
        if (!lanes[lane].some(([s, en]) => visStart <= en && visEnd >= s)) {
          lanes[lane].push([visStart, visEnd])
          break
        }
        lane++
      }
      laneMap.set(`${e.id}-${w}`, lane)
    })
  }

  return laneMap
}

function buildEventDayMap(events, year, month, grid, laneMap) {
  const map = new Map()
  const weekCount = grid.length / 7

  for (let w = 0; w < weekCount; w++) {
    const weekDays = grid.slice(w * 7, (w + 1) * 7).filter(Boolean)
    if (!weekDays.length) continue
    const weekStartISO = toISO(year, month, Math.min(...weekDays))
    const weekEndISO = toISO(year, month, Math.max(...weekDays))

    events.forEach(e => {
      if (!e.date) return
      const isMultiDay = !!(e.endDate && e.endDate > e.date)
      const endISO = isMultiDay ? e.endDate : e.date
      if (e.date > weekEndISO || endISO < weekStartISO) return

      const visStart = e.date > weekStartISO ? e.date : weekStartISO
      const visEnd = endISO < weekEndISO ? endISO : weekEndISO
      const lane = laneMap.get(`${e.id}-${w}`) ?? 0

      for (let d = 0; d < 7; d++) {
        const day = grid[w * 7 + d]
        if (!day) continue
        const dayISO = toISO(year, month, day)
        if (dayISO < visStart || dayISO > visEnd) continue

        let role
        if (!isMultiDay || visStart === visEnd) {
          role = 'single'
        } else if (dayISO === visStart) {
          role = e.date === dayISO ? 'start' : 'mid'
        } else if (dayISO === visEnd) {
          role = endISO === dayISO ? 'end' : 'mid'
        } else {
          role = 'mid'
        }

        if (!map.has(day)) map.set(day, [])
        map.get(day).push({ role, who: e.who, eventId: e.id, lane })
      }
    })
  }

  return map
}

function offsetMonth(year, month, delta) {
  let m = month + delta
  let y = year
  while (m < 0) { m += 12; y-- }
  while (m > 11) { m -= 12; y++ }
  return { year: y, month: m }
}

function MonthGrid({ year, month, events, selectedDay, onDayClick, nowYear, nowMonth, nowDay, currentUser }) {
  const grid = buildMonthGrid(year, month)
  const todayDay = nowYear === year && nowMonth === month ? nowDay : null
  const laneMap = buildWeekLaneMap(events, year, month, grid)
  const eventDayMap = buildEventDayMap(events, year, month, grid, laneMap)

  return (
    <div className="calendar-grid">
      {DAY_ABBR.map(d => (
        <div key={d} className="cal-day-name">{d}</div>
      ))}
      {grid.map((day, i) => {
        const allBars = day ? (eventDayMap.get(day) ?? []) : []
        let dotSeen = false
        const bars = allBars.filter(bar => {
          if (bar.role !== 'single') return true
          if (dotSeen) return false
          return (dotSeen = true)
        })
        const isSelected = !!onDayClick && day === selectedDay
        return (
          <div
            key={i}
            className={[
              'cal-day',
              !day ? 'empty' : '',
              day === todayDay ? 'today' : '',
              isSelected ? 'selected' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onDayClick?.(day)}
          >
            <span className="cal-day-num">{day}</span>
            <div className="cal-event-lanes">
              {bars.map((bar, idx) => {
                const color = bar.who === currentUser ? 'var(--accent2)' : 'var(--accent)'
                const top = `${bar.lane * 7}px`
                return bar.role === 'single'
                  ? (
                    <span
                      key={`${bar.eventId}-${idx}`}
                      className="cal-dot"
                      style={{ top, background: color }}
                    />
                  ) : (
                    <span
                      key={`${bar.eventId}-${idx}`}
                      className={`cal-bar cal-bar-${bar.role}`}
                      style={{ top, background: color }}
                    />
                  )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const EMPTY_EVENT = { title: '', date: '', endDate: '', time: '', badge: 'Geplant', badgeType: 'green' }
const PAGE_SIZE = 5

export default function CalendarTab({ events, addEvent, updateEvent, deleteEvent, currentUser, targetDate, onTargetConsumed, prefill, onPrefillConsumed, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }) {
  const showToast = useToast()
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()
  const nowDay = now.getDate()

  const [year, setYear] = useState(nowYear)
  const [month, setMonth] = useState(nowMonth)
  const [selectedDay, setSelectedDay] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const [dragX, setDragX] = useState(0)        // live finger offset during a swipe
  const [dragging, setDragging] = useState(false)
  const [anim, setAnim] = useState(0)          // -1 prev / +1 next while the slide animation runs
  const [transition, setTransition] = useState(true)
  const touchRef = useRef({ startX: 0, startY: 0, locked: null })
  const calendarRef = useRef(null)

  useEffect(() => {
    if (!targetDate) return
    const parsed = parseEventDate(targetDate)
    if (!parsed) return
    setYear(parsed.year ?? nowYear)
    setMonth(parsed.month)
    setSelectedDay(parsed.day)
    onTargetConsumed?.()
  }, [targetDate])

  useEffect(() => {
    if (!prefill) return
    setNewEvent({ ...EMPTY_EVENT, ...prefill })
    setEditing(null)
    setShowForm(true)
    onPrefillConsumed?.()
  }, [prefill])

  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ ...EMPTY_EVENT })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_EVENT })
  const [formError, setFormError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [eventLimit, setEventLimit] = useState(PAGE_SIZE)

  const [pendingFiles, setPendingFiles] = useState([])
  const pendingFileInputRef = useRef(null)
  const [pendingEditFiles, setPendingEditFiles] = useState([])
  const pendingEditFileInputRef = useRef(null)
  const formRef = useRef(null)

  const SWIPE_THRESHOLD = 50

  const onTouchStart = useCallback((e) => {
    if (anim !== 0) return  // ignore touches while a slide is committing
    const t = e.touches[0]
    touchRef.current = { startX: t.clientX, startY: t.clientY, locked: null }
    setDragging(true)
  }, [anim])

  const onTouchMove = useCallback((e) => {
    if (!dragging) return
    const t = e.touches[0]
    const dx = t.clientX - touchRef.current.startX
    const dy = t.clientY - touchRef.current.startY

    if (touchRef.current.locked === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
    }

    if (touchRef.current.locked === 'x') {
      e.preventDefault()
      setDragX(dx)
    }
  }, [dragging])

  const onTouchEnd = useCallback(() => {
    if (!dragging) return
    const dx = dragX
    const w = calendarRef.current?.offsetWidth ?? 1
    setDragging(false)

    if (touchRef.current.locked === 'x' && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > w * 0.15) {
      // Past the threshold — let the track finish sliding in the swipe
      // direction; the month state is committed in onTransitionEnd.
      setAnim(dx > 0 ? -1 : 1)
    } else {
      // Not far enough — animate back to centre.
      setDragX(0)
    }
  }, [dragging, dragX])

  // After committing a slide we briefly disable the transition to re-centre
  // the track without a visible jump; re-enable it on the next frame.
  useEffect(() => {
    if (transition) return
    const id = requestAnimationFrame(() => setTransition(true))
    return () => cancelAnimationFrame(id)
  }, [transition])

  const handleTrackTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return
    if (anim === 0) return
    const next = offsetMonth(year, month, anim)
    setTransition(false)   // re-centre instantly — neighbour panel already shows this month
    setMonth(next.month)
    setYear(next.year)
    setSelectedDay(null)
    setDragX(0)
    setAnim(0)
  }

  useEffect(() => {
    if (showForm || editing) {
      requestAnimationFrame(() => {
        const el = formRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const navHeight = document.querySelector('.bottom-nav')?.offsetHeight ?? 0
        window.scrollBy({ top: rect.bottom - (window.innerHeight - navHeight), behavior: 'smooth' })
      })
    }
  }, [showForm, editing])

  useEffect(() => { setEventLimit(PAGE_SIZE) }, [year, month, selectedDay])

  // Buttons drive the same animated slide as a swipe.
  const prevMonth = () => { if (anim === 0) setAnim(-1) }
  const nextMonth = () => { if (anim === 0) setAnim(1) }

  const prevM = offsetMonth(year, month, -1)
  const nextM = offsetMonth(year, month, 1)

  // Header label follows the slide: the committing direction, or — mid-drag —
  // the month we'd land on once past the threshold.
  let headerDir = anim
  if (headerDir === 0 && dragging) {
    const w = calendarRef.current?.offsetWidth ?? 1
    if (dragX > w * 0.25) headerDir = -1
    else if (dragX < -w * 0.25) headerDir = 1
  }
  const headerMonth = offsetMonth(year, month, headerDir)

  const handleDayClick = (day) => {
    if (!day) return
    setSelectedDay(selectedDay === day ? null : day)
    setEditing(null)
    setShowForm(false)
  }

  const openDetail = (e) => {
    setViewingId(e.id)
    setSheet('detail')
  }

  const closeSheet = () => {
    setSheet(null)
    setViewingId(null)
  }

  const handleAdd = async () => {
    setSubmitted(true)
    if (!newEvent.title.trim()) return
    try {
      const created = await addEvent(newEvent)
      if (created && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadAttachment(created.id, file)
        }
      }
      setPendingFiles([])
      setNewEvent({ ...EMPTY_EVENT })
      setFormError(null)
      setSubmitted(false)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    }
  }

  const startEdit = (e) => {
    setSubmitted(false)
    setEditing(e.id)
    setEditFields({
      title: e.title,
      date: e.date || '',
      endDate: e.endDate || '',
      time: e.time || '',
      badge: e.badge || 'Geplant',
      badgeType: e.badgeType || 'green',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    setSubmitted(true)
    if (!editFields.title.trim()) return
    try {
      await updateEvent(editing, editFields)
      if (pendingEditFiles.length > 0) {
        for (const file of pendingEditFiles) {
          await uploadAttachment(editing, file)
        }
        setPendingEditFiles([])
      }
      setFormError(null)
      setSubmitted(false)
      setEditing(null)
    } catch (err) {
      setFormError(err.message)
    }
  }

  const badgeOptions = [
    { label: 'Geplant', type: 'green' },
    { label: 'Bestätigt', type: 'green' },
    { label: 'Idee', type: 'yellow' },
    { label: 'Abgesagt', type: 'red' },
  ]

  const renderForm = (fields, setFieldsRaw, onSave, onCancel, title, error, pendingFiles, setPendingFiles, fileInputRef, submitted) => {
    const setFields = (...args) => { setFormError(null); setFieldsRaw(...args) }
    const endDateInvalid = fields.endDate && fields.date && fields.endDate <= fields.date
    const titleMissing = submitted && !fields.title.trim()
    return (
      <div className="add-form">
        <div className="add-form-title">{title}</div>
        <input
          className={titleMissing ? 'input-error' : ''}
          placeholder="Titel"
          value={fields.title}
          onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
        />
        {titleMissing && <span className="form-error">Titel ist erforderlich</span>}
        <div className="form-row">
          <div>
            <label className="form-label">Von</label>
            <input
              type="date"
              value={fields.date}
              onChange={e => setFields(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Bis (opt.)</label>
            <input
              type="date"
              value={fields.endDate}
              min={fields.date || undefined}
              style={endDateInvalid ? { borderColor: 'var(--accent)', outline: 'none' } : undefined}
              onChange={e => setFields(f => ({ ...f, endDate: e.target.value }))}
            />
            {endDateInvalid && (
              <div style={{ color: 'var(--accent)', fontSize: 11, marginTop: 3 }}>
                Muss nach dem Startdatum liegen
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="form-label">Uhrzeit (opt.)</label>
          <input
            type="time"
            value={fields.time}
            onChange={e => setFields(f => ({ ...f, time: e.target.value }))}
          />
        </div>
        <select
          value={fields.badge}
          onChange={e => {
            const opt = badgeOptions.find(o => o.label === e.target.value)
            setFields(f => ({ ...f, badge: e.target.value, badgeType: opt?.type || 'green' }))
          }}
        >
          {badgeOptions.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
        </select>
        <div style={{ marginBottom: 10 }}>
          <label className="form-label">Anhänge (opt.)</label>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon /> Datei wählen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) setPendingFiles(prev => [...prev, file])
              e.target.value = ''
            }}
          />
          {pendingFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
              {pendingFiles.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', background: 'var(--warm)', borderRadius: 10,
                }}>
                  <span style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{f.name}</span>
                  <button className="btn-delete" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}><CloseIcon /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && (
          <div style={{ color: 'var(--accent)', fontSize: 13, padding: '6px 2px' }}>{error}</div>
        )}
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
          <button className="btn btn-primary" onClick={onSave} disabled={endDateInvalid}>Speichern</button>
        </div>
      </div>
    )
  }

  const viewingEvent = events.find(e => e.id === viewingId)

  const selectedDayISO = selectedDay ? toISO(year, month, selectedDay) : null
  const monthStartISO = `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-01`
  const todayISO = toISO(nowYear, nowMonth, nowDay)
  const visibleEvents = (selectedDayISO
    ? events.filter(e => {
        const startISO = e.date
        const endISO = e.endDate && e.endDate > e.date ? e.endDate : e.date
        return startISO && selectedDayISO >= startISO && selectedDayISO <= endISO
      })
    : events.filter(e => {
        const endISO = e.endDate && e.endDate > e.date ? e.endDate : e.date
        return (e.date ?? '') >= monthStartISO && (endISO ?? '') >= todayISO
      })
  ).slice().sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.time ?? '').localeCompare(b.time ?? ''))
  const displayedEvents = visibleEvents.slice(0, eventLimit)

  return (
    <div>
      <p className="section-title">Eure <em>Termine</em></p>

      <div className="month-nav">
        <div className="month-name">{MONTH_NAMES[headerMonth.month]} {headerMonth.year}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nav-btn" onClick={prevMonth}>‹</button>
          <button
            className="nav-btn"
            style={{ fontSize: 11, padding: '4px 14px', letterSpacing: 0.3, borderRadius: 999, width: 'auto', height: 'auto' }}
            onClick={() => { setYear(nowYear); setMonth(nowMonth); setSelectedDay(nowDay) }}
          >Heute</button>
          <button className="nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      <div
        ref={calendarRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ overflow: 'hidden', touchAction: 'pan-y' }}
      >
        <div
          className="cal-track"
          onTransitionEnd={handleTrackTransitionEnd}
          style={{
            transform: dragging
              ? `translateX(calc(-100% + ${dragX}px))`
              : anim === 1 ? 'translateX(-200%)'
              : anim === -1 ? 'translateX(0%)'
              : 'translateX(-100%)',
            transition: dragging || !transition
              ? 'none'
              : 'transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        >
          <div className="cal-panel">
            <MonthGrid
              year={prevM.year} month={prevM.month} events={events}
              selectedDay={null} onDayClick={null}
              nowYear={nowYear} nowMonth={nowMonth} nowDay={nowDay}
              currentUser={currentUser}
            />
          </div>
          <div className="cal-panel">
            <MonthGrid
              year={year} month={month} events={events}
              selectedDay={selectedDay} onDayClick={handleDayClick}
              nowYear={nowYear} nowMonth={nowMonth} nowDay={nowDay}
              currentUser={currentUser}
            />
          </div>
          <div className="cal-panel">
            <MonthGrid
              year={nextM.year} month={nextM.month} events={events}
              selectedDay={null} onDayClick={null}
              nowYear={nowYear} nowMonth={nowMonth} nowDay={nowDay}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div ref={formRef}>
          {renderForm(
            newEvent,
            setNewEvent,
            handleAdd,
            () => { setShowForm(false); setPendingFiles([]); setFormError(null); setSubmitted(false) },
            'Neuer Termin',
            formError,
            pendingFiles,
            setPendingFiles,
            pendingFileInputRef,
            submitted
          )}
        </div>
      )}

      {selectedDay && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 12, borderRadius: 14, padding: '10px' }}
          onClick={() => setSelectedDay(null)}
        >
          Alle anzeigen
        </button>
      )}

      {!showForm && !editing && (
        <button
          className="fab"
          aria-label="Termin hinzufügen"
          onClick={() => {
            setNewEvent({
              ...EMPTY_EVENT,
              date: selectedDay ? toISO(year, month, selectedDay) : '',
            })
            setShowForm(true)
          }}
        >
          +
        </button>
      )}

      {displayedEvents.map(e => {
        const isMultiDay = e.endDate && e.endDate > e.date
        const dateDisplay = isMultiDay
          ? `${formatISOToGerman(e.date)} – ${formatISOToGerman(e.endDate)}`
          : (formatISOToGerman(e.date) || e.date)

        return editing === e.id ? (
          <div key={e.id} ref={formRef}>
            {renderForm(
              editFields,
              setEditFields,
              handleUpdate,
              () => { setEditing(null); setPendingEditFiles([]); setFormError(null); setSubmitted(false) },
              'Termin bearbeiten',
              formError,
              pendingEditFiles,
              setPendingEditFiles,
              pendingEditFileInputRef,
              submitted
            )}
          </div>
        ) : (
          <div key={e.id} className="card" onClick={() => openDetail(e)}>
            <div className="card-header">
              <div>
                <div className="card-title">{e.title}</div>
                <div className="card-meta">{dateDisplay}{e.time ? ` · ${e.time}` : ''}</div>
              </div>
              <span className={`badge badge-${e.badgeType}`}>{e.badge}</span>
            </div>
            <div className="card-footer">
              <div className="who-added">
                <div className="dot" style={{ background: e.who === currentUser ? 'var(--accent2)' : 'var(--accent)' }} />
                Von {e.who.charAt(0).toUpperCase() + e.who.slice(1)} hinzugefügt
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {e.attachmentCount > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--muted)' }}>
                    <PaperclipIcon />{e.attachmentCount}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-edit" onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}><PencilIcon /></button>
                  <button className="btn-delete" onClick={async (ev) => { ev.stopPropagation(); if (window.confirm('Termin löschen?')) try { await deleteEvent(e.id) } catch (err) { showToast(err.message) } }}><CloseIcon /></button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {visibleEvents.length > eventLimit && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 4, marginBottom: 12, borderRadius: 14, padding: '10px' }}
          onClick={() => setEventLimit(l => l + PAGE_SIZE)}
        >
          Mehr anzeigen ({visibleEvents.length - eventLimit} weitere)
        </button>
      )}

      {sheet === 'detail' && viewingEvent && (
        <EventDetail
          event={viewingEvent}
          onEdit={() => { closeSheet(); startEdit(viewingEvent) }}
          onClose={closeSheet}
          currentUser={currentUser}
          formatDate={formatISOToGerman}
          listAttachments={listAttachments}
          uploadAttachment={uploadAttachment}
          deleteAttachment={deleteAttachment}
          attachmentUrl={attachmentUrl}
        />
      )}
    </div>
  )
}
