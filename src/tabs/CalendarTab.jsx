import { useState, useEffect, useRef, useCallback } from 'react'
import { PencilIcon, CloseIcon } from '../components/Icons.jsx'

function Sheet({ title, onClose, children }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">{title}</span>
          <button className="btn-delete" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}

function EventDetail({ event, onEdit, onClose, currentUser, formatDate }) {
  const isMultiDay = event.endDate && event.endDate > event.date
  const dateDisplay = isMultiDay
    ? `${formatDate(event.date)} – ${formatDate(event.endDate)}`
    : (formatDate(event.date) || event.date)

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

const EMPTY_EVENT = { title: '', date: '', endDate: '', time: '', badge: 'Geplant', badgeType: 'green' }

export default function CalendarTab({ events, addEvent, updateEvent, deleteEvent, currentUser, targetDate, onTargetConsumed, prefill, onPrefillConsumed }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [sheet, setSheet] = useState(null) // null | 'detail'
  const [viewingId, setViewingId] = useState(null)

  useEffect(() => {
    if (!targetDate) return
    const parsed = parseEventDate(targetDate)
    if (!parsed) return
    setYear(parsed.year ?? now.getFullYear())
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

  const formRef = useRef(null)
  const gridRef = useRef(null)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const animatingRef = useRef(false)
  const [animDir, setAnimDir] = useState(null)
  const prevGridDataRef = useRef(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const onTouchMove = (e) => {
      if (touchStartX.current === null || animatingRef.current) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault()
        el.style.transform = `translateX(${dx}px)`
      }
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [])

  useEffect(() => {
    if (showForm || editing) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
    }
  }, [showForm, editing])

  const grid = buildMonthGrid(year, month)
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null
  const eventDayMap = buildEventDayMap(events, year, month)

  const doSwipe = useCallback((dir) => {
    if (animatingRef.current) return
    animatingRef.current = true

    const _now = new Date()
    prevGridDataRef.current = {
      grid: buildMonthGrid(year, month),
      eventDayMap: buildEventDayMap(events, year, month),
      todayDay: year === _now.getFullYear() && month === _now.getMonth() ? _now.getDate() : null,
    }

    if (gridRef.current) {
      gridRef.current.style.transition = ''
      gridRef.current.style.transform = ''
    }

    setSelectedDay(null)
    setAnimDir(dir)
    if (dir < 0) {
      if (month === 0) { setMonth(11); setYear(y => y - 1) }
      else setMonth(m => m - 1)
    } else {
      if (month === 11) { setMonth(0); setYear(y => y + 1) }
      else setMonth(m => m + 1)
    }

    setTimeout(() => {
      setAnimDir(null)
      prevGridDataRef.current = null
      animatingRef.current = false
    }, 300)
  }, [year, month, events])

  const prevMonth = () => doSwipe(-1)
  const nextMonth = () => doSwipe(1)

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

  const renderForm = (fields, setFields, onSave, onCancel, title) => {
    const endDateInvalid = fields.endDate && fields.date && fields.endDate <= fields.date
    return (
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
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
          <button className="btn btn-primary" onClick={onSave} disabled={endDateInvalid}>Speichern</button>
        </div>
      </div>
    )
  }

  const viewingEvent = events.find(e => e.id === viewingId)

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
          <button
            className="nav-btn"
            style={{ fontSize: 11, padding: '4px 14px', letterSpacing: 0.3, borderRadius: 999, width: 'auto', height: 'auto' }}
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(now.getDate()) }}
          >Heute</button>
          <button className="nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {animDir !== null && prevGridDataRef.current && (() => {
          const prev = prevGridDataRef.current
          return (
            <div
              className="calendar-grid"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                animation: `${animDir > 0 ? 'slideOutToLeft' : 'slideOutToRight'} 0.28s ease-in forwards`,
                pointerEvents: 'none',
              }}
            >
              {DAY_ABBR.map(d => (
                <div key={d} className="cal-day-name">{d}</div>
              ))}
              {prev.grid.map((day, i) => {
                const info = day ? prev.eventDayMap.get(day) : undefined
                const stripes = info?.stripes ?? []
                const hasSingle = info?.hasSingle ?? false
                const hasMulti = stripes.length > 0
                const totalIndicators = stripes.length + (hasMulti && hasSingle ? 1 : 0)
                const indBase = totalIndicators > 1 ? 2 : 4
                const indStep = totalIndicators > 1 ? 6 : 7
                return (
                  <div
                    key={i}
                    className={[
                      'cal-day',
                      !day ? 'empty' : '',
                      day === prev.todayDay ? 'today' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {day}
                    {stripes.map((seg, idx) => (
                      <span
                        key={seg.eventId}
                        className={['cal-stripe', `cal-stripe-${seg.role}`].filter(Boolean).join(' ')}
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
        })()}
        <div
          ref={gridRef}
          className="calendar-grid"
          style={animDir !== null ? {
            animation: `${animDir > 0 ? 'slideInFromRight' : 'slideInFromLeft'} 0.28s ease-out forwards`
          } : undefined}
          onTouchStart={e => {
            if (animatingRef.current) return
            touchStartX.current = e.touches[0].clientX
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(delta) < 50) {
              gridRef.current.style.transition = 'transform 0.2s ease-out'
              gridRef.current.style.transform = 'translateX(0)'
              setTimeout(() => { if (gridRef.current) gridRef.current.style.transition = '' }, 220)
              return
            }
            doSwipe(delta > 0 ? -1 : 1)
          }}
        >
          {DAY_ABBR.map(d => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}
          {grid.map((day, i) => {
            const info = day ? eventDayMap.get(day) : undefined
            const stripes = info?.stripes ?? []
            const hasSingle = info?.hasSingle ?? false
            const hasMulti = stripes.length > 0
            const isSelected = day === selectedDay
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
                onClick={() => handleDayClick(day)}
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
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-edit" onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}><PencilIcon /></button>
                <button className="btn-delete" onClick={(ev) => { ev.stopPropagation(); if (window.confirm('Termin löschen?')) deleteEvent(e.id) }}><CloseIcon /></button>
              </div>
            </div>
          </div>
        )
      })}

      {sheet === 'detail' && viewingEvent && (
        <EventDetail
          event={viewingEvent}
          onEdit={() => { closeSheet(); startEdit(viewingEvent) }}
          onClose={closeSheet}
          currentUser={currentUser}
          formatDate={formatISOToGerman}
        />
      )}
    </div>
  )
}
