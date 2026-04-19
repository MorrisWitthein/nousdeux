import { useState, useEffect, useRef } from 'react'

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]
const DAY_ABBR = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (firstDay + 6) % 7
  const grid = []
  for (let i = 0; i < offset; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

// Format ISO date (YYYY-MM-DD) to German display string
function formatISOToGerman(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]}, ${d}. ${SHORT_MONTHS[m - 1]} ${y}`
}

// Build ISO date string from year, month (0-based), day
function toISO(year, month, day) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// Parse event date — handles ISO (YYYY-MM-DD) and legacy German format
function parseEventDate(dateStr) {
  if (!dateStr) return null
  // ISO format
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return { day: parseInt(isoMatch[3], 10), month: parseInt(isoMatch[2], 10) - 1, year: parseInt(isoMatch[1], 10) }
  }
  // Legacy German format: "19. Apr" or "Sa, 19. Apr"
  const match = dateStr.match(/(\d+)\.\s*(\w+)/)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const monthStr = match[2].toLowerCase().slice(0, 3)
  const idx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === monthStr)
  if (idx === -1) return null
  return { day, month: idx }
}

// Build a map of day -> { stripes: [{role, eventId}], hasSingle: bool }
// stripes: one entry per multi-day event covering that day (in array order → consistent stacking)
// hasSingle: true if any single-day event also falls on that day
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
    if (!parsed || parsed.month !== month) return
    const d = parsed.day
    if (map.has(d)) {
      map.get(d).hasSingle = true
    } else {
      map.set(d, { stripes: [], hasSingle: true })
    }
  })

  return map
}

const EMPTY_EVENT = { title: '', date: '', endDate: '', time: '', badge: 'Geplant', badgeType: 'green' }

export default function CalendarTab({ events, addEvent, updateEvent, deleteEvent, currentUser, targetDate, onTargetConsumed }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    if (!targetDate) return
    const parsed = parseEventDate(targetDate)
    if (!parsed) return
    setYear(parsed.year ?? now.getFullYear())
    setMonth(parsed.month)
    setSelectedDay(parsed.day)
    onTargetConsumed?.()
  }, [targetDate])
  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ ...EMPTY_EVENT })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_EVENT })

  const formRef = useRef(null)
  useEffect(() => {
    if (showForm || editing) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
    }
  }, [showForm, editing])

  const grid = buildMonthGrid(year, month)
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null
  const eventDayMap = buildEventDayMap(events, year, month)

  const prevMonth = () => {
    setSelectedDay(null)
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    setSelectedDay(null)
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleDayClick = (day) => {
    if (!day) return
    setSelectedDay(selectedDay === day ? null : day)
    setEditing(null)
    setShowForm(false)
  }

  const handleAdd = async () => {
    if (!newEvent.title) return
    await addEvent(newEvent)
    setNewEvent({ ...EMPTY_EVENT })
    setShowForm(false)
  }

  const startEdit = (e) => {
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
    if (!editFields.title) return
    await updateEvent(editing, editFields)
    setEditing(null)
  }

  const badgeOptions = [
    { label: 'Geplant', type: 'green' },
    { label: 'Bestätigt', type: 'green' },
    { label: 'Idee', type: 'yellow' },
    { label: 'Abgesagt', type: 'red' },
  ]

  const renderForm = (fields, setFields, onSave, onCancel, title) => (
    <div className="add-form">
      <div className="add-form-title">{title}</div>
      <input
        placeholder="Titel"
        value={fields.title}
        onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
      />
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
            onFocus={() => { if (!fields.endDate && fields.date) setFields(f => ({ ...f, endDate: f.date })) }}
            onChange={e => setFields(f => ({ ...f, endDate: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="form-label">Uhrzeit</label>
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
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
      </div>
    </div>
  )

  // Filter events visible for the selected day — includes multi-day events spanning it
  const selectedDayISO = selectedDay ? toISO(year, month, selectedDay) : null
  const visibleEvents = (selectedDayISO
    ? events.filter(e => {
        const startISO = e.date
        const endISO = e.endDate && e.endDate > e.date ? e.endDate : e.date
        return startISO && selectedDayISO >= startISO && selectedDayISO <= endISO
      })
    : events.filter(e => (e.date ?? '') >= now.toISOString().slice(0, 10))
  ).slice().sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.time ?? '').localeCompare(b.time ?? ''))

  return (
    <div>
      <p className="section-title">Eure <em>Termine</em></p>

      <div className="month-nav">
        <div className="month-name">{MONTH_NAMES[month]} {year}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nav-btn" onClick={prevMonth}>‹</button>
          <button className="nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      <div className="calendar-grid">
        {DAY_ABBR.map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {grid.map((day, i) => {
          const info = day ? eventDayMap.get(day) : undefined
          const stripes = info?.stripes ?? []
          const hasSingle = info?.hasSingle ?? false
          const hasMulti = stripes.length > 0
          const isSelected = day === selectedDay
          // If a single-day dot coexists with stripes, shift stripes up to leave room at bottom
          const stripeBottom = hasMulti && hasSingle ? 11 : 4
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
              onClick={() => handleDayClick(day)}
            >
              {day}
              {stripes.map((seg, idx) => (
                <span
                  key={seg.eventId}
                  className={['cal-stripe', `cal-stripe-${seg.role}`, isSelected ? 'dimmed' : ''].filter(Boolean).join(' ')}
                  style={{ bottom: `${stripeBottom + idx * 7}px` }}
                />
              ))}
              {hasMulti && hasSingle && <span className="cal-dot-extra" />}
            </div>
          )
        })}
      </div>

      {showForm && <div ref={formRef}>{renderForm(
        newEvent,
        setNewEvent,
        handleAdd,
        () => setShowForm(false),
        'Neuer Termin'
      )}</div>}

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
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => {
            setNewEvent({
              ...EMPTY_EVENT,
              date: selectedDay ? toISO(year, month, selectedDay) : '',
            })
            setShowForm(true)
          }}
        >
          + Termin hinzufügen
        </button>
      )}

      {visibleEvents.map(e => {
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
              () => setEditing(null),
              'Termin bearbeiten'
            )}
          </div>
        ) : (
          <div key={e.id} className="card" onClick={() => {
              const parsed = parseEventDate(e.date)
              if (parsed) {
                if (parsed.year) setYear(parsed.year)
                setMonth(parsed.month)
                setSelectedDay(parsed.day)
              }
              setEditing(null)
              setShowForm(false)
            }}>
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
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-edit" onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}>✎</button>
                <button className="btn-delete" onClick={(ev) => { ev.stopPropagation(); if (window.confirm('Termin löschen?')) deleteEvent(e.id) }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
