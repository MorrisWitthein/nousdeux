import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { PencilIcon, CloseIcon, PaperclipIcon } from '../components/Icons.jsx'
import Sheet from '../components/Sheet.jsx'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function EventDetail({ event, onEdit, onClose, currentUser, formatDate, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }) {
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
    const result = await uploadAttachment(event.id, file)
    if (result) setAttachments(prev => [...prev, result])
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Anhang löschen?')) return
    const ok = await deleteAttachment(id)
    if (ok) setAttachments(prev => prev.filter(a => a.id !== id))
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
            className="btn btn-secondary"
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
  while (grid.length % 7 !== 0) grid.push(null)
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

function buildEventDayMap(events, year, month) {
  const map = new Map()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthStart = toISO(year, month, 1)
  const monthEnd = toISO(year, month, daysInMonth)

  const multiDay = events.filter(e => e.endDate && e.endDate > e.date)
  const singleDay = events.filter(e => !e.endDate || e.endDate <= e.date)

  multiDay.forEach(e => {
    if (!e.date) return
    if (e.endDate < monthStart || e.date > monthEnd) return
    for (let d = 1; d <= daysInMonth; d++) {
      const dayISO = toISO(year, month, d)
      if (dayISO < e.date || dayISO > e.endDate) continue
      const isStart = dayISO === e.date
      const isEnd = dayISO === e.endDate
      const role = isStart ? 'start' : isEnd ? 'end' : 'mid'
      if (!map.has(d)) map.set(d, { stripes: [], hasSingle: false })
      map.get(d).stripes.push({ role, eventId: e.id })
    }
  })

  singleDay.forEach(e => {
    const parsed = parseEventDate(e.date)
    if (!parsed || parsed.month !== month || (parsed.year !== undefined && parsed.year !== year)) return
    const d = parsed.day
    if (map.has(d)) {
      map.get(d).hasSingle = true
    } else {
      map.set(d, { stripes: [], hasSingle: true })
    }
  })

  return map
}

function offsetMonth(year, month, delta) {
  let m = month + delta
  let y = year
  while (m < 0) { m += 12; y-- }
  while (m > 11) { m -= 12; y++ }
  return { year: y, month: m }
}

function MonthGrid({ year, month, events, selectedDay, onDayClick, nowYear, nowMonth, nowDay }) {
  const grid = buildMonthGrid(year, month)
  const todayDay = nowYear === year && nowMonth === month ? nowDay : null
  const eventDayMap = buildEventDayMap(events, year, month)

  return (
    <div className="calendar-grid">
      {DAY_ABBR.map(d => (
        <div key={d} className="cal-day-name">{d}</div>
      ))}
      {grid.map((day, i) => {
        const info = day ? eventDayMap.get(day) : undefined
        const stripes = info?.stripes ?? []
        const hasSingle = info?.hasSingle ?? false
        const hasMulti = stripes.length > 0
        const isSelected = !!onDayClick && day === selectedDay
        const totalIndicators = stripes.length + (hasMulti && hasSingle ? 1 : 0)
        const indBase = totalIndicators > 1 ? 2 : 4
        const indStep = totalIndicators > 1 ? 6 : 7
        return (
          <div
            key={i}
            className={[
              'cal-day',
              !day ? 'empty' : '',
              day === todayDay ? 'today' : '',
              isSelected ? 'selected' : '',
              !hasMulti && hasSingle ? 'has-event' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onDayClick?.(day)}
          >
            {day}
            {stripes.map((seg, idx) => (
              <span
                key={seg.eventId}
                className={['cal-stripe', `cal-stripe-${seg.role}`, isSelected ? 'dimmed' : ''].filter(Boolean).join(' ')}
                style={{ bottom: `${indBase + idx * indStep}px` }}
              />
            ))}
            {hasMulti && hasSingle && (
              <span className="cal-dot-extra" style={{ bottom: `${indBase + stripes.length * indStep + 2}px` }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const EMPTY_EVENT = { title: '', date: '', endDate: '', time: '', badge: 'Geplant', badgeType: 'green' }
const PAGE_SIZE = 5

export default function CalendarTab({ events, addEvent, updateEvent, deleteEvent, currentUser, targetDate, onTargetConsumed, prefill, onPrefillConsumed, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }) {
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()
  const nowDay = now.getDate()

  const [year, setYear] = useState(nowYear)
  const [month, setMonth] = useState(nowMonth)
  const [selectedDay, setSelectedDay] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const [headerOffset, setHeaderOffset] = useState(0)

  // duration: 8 keeps the snap animation under ~100ms — fast enough that
  // the brief window before the carousel re-centres is imperceptible.
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: false, duration: 4 })

  const yearRef = useRef(year)
  const monthRef = useRef(month)
  useEffect(() => { yearRef.current = year }, [year])
  useEffect(() => { monthRef.current = month }, [month])

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

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setHeaderOffset(emblaApi.selectedScrollSnap() - 1)
    }

    const onSettle = () => {
      const idx = emblaApi.selectedScrollSnap()
      setHeaderOffset(0)
      if (idx === 1) return
      const dir = idx - 1
      let m = monthRef.current
      let y = yearRef.current
      if (dir < 0) {
        if (m === 0) { m = 11; y = y - 1 }
        else m = m - 1
      } else {
        if (m === 11) { m = 0; y = y + 1 }
        else m = m + 1
      }
      monthRef.current = m
      yearRef.current = y
      setSelectedDay(null)
      setMonth(m)
      setYear(y)
    }

    emblaApi.on('select', onSelect)
    emblaApi.on('settle', onSettle)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('settle', onSettle)
    }
  }, [emblaApi])

  useLayoutEffect(() => {
    if (!emblaApi) return
    emblaApi.scrollTo(1, true)
  }, [year, month, emblaApi])

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

  const prevMonth = () => emblaApi?.scrollTo(0)
  const nextMonth = () => emblaApi?.scrollTo(2)

  const prevM = offsetMonth(year, month, -1)
  const nextM = offsetMonth(year, month, 1)

  const headerMonth = offsetMonth(year, month, headerOffset)

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
            className="btn btn-secondary"
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
  const visibleEvents = (selectedDayISO
    ? events.filter(e => {
        const startISO = e.date
        const endISO = e.endDate && e.endDate > e.date ? e.endDate : e.date
        return startISO && selectedDayISO >= startISO && selectedDayISO <= endISO
      })
    : events.filter(e => (e.date ?? '') >= monthStartISO)
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

      <div ref={emblaRef} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            <MonthGrid
              year={prevM.year} month={prevM.month} events={events}
              selectedDay={null} onDayClick={null}
              nowYear={nowYear} nowMonth={nowMonth} nowDay={nowDay}
            />
          </div>
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            <MonthGrid
              year={year} month={month} events={events}
              selectedDay={selectedDay} onDayClick={handleDayClick}
              nowYear={nowYear} nowMonth={nowMonth} nowDay={nowDay}
            />
          </div>
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            <MonthGrid
              year={nextM.year} month={nextM.month} events={events}
              selectedDay={null} onDayClick={null}
              nowYear={nowYear} nowMonth={nowMonth} nowDay={nowDay}
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
                  <button className="btn-delete" onClick={(ev) => { ev.stopPropagation(); if (window.confirm('Termin löschen?')) deleteEvent(e.id) }}><CloseIcon /></button>
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
