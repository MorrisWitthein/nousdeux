import { useState } from 'react'

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]
const DAY_ABBR = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Convert Sunday=0 to Monday-based offset (Mon=0..Sun=6)
  const offset = (firstDay + 6) % 7
  const grid = []
  for (let i = 0; i < offset; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function formatDateGerman(day, month, year) {
  const date = new Date(year, month, day)
  const weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()]
  return `${weekday}, ${day}. ${SHORT_MONTHS[month]}`
}

function parseEventDate(dateStr) {
  if (!dateStr) return null
  // Match patterns like "19. Apr", "Sa, 19. Apr", "1. Jan" etc.
  const match = dateStr.match(/(\d+)\.\s*(\w+)/)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const monthStr = match[2].toLowerCase().slice(0, 3)
  const idx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === monthStr)
  if (idx === -1) return null
  return { day, month: idx }
}

export default function CalendarTab({ events, addEvent, updateEvent, deleteEvent, currentUser }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ title: '', date: '', time: '', badge: '', badgeType: '' })

  const grid = buildMonthGrid(year, month)
  const todayDay = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null

  // Build set of days in this month that have events
  const eventDays = new Set()
  events.forEach(e => {
    const parsed = parseEventDate(e.date)
    if (parsed && parsed.month === month) eventDays.add(parsed.day)
  })

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
    await addEvent({ ...newEvent, badge: 'Geplant', badgeType: 'green' })
    setNewEvent({ title: '', date: '', time: '' })
    setShowForm(false)
  }

  const startEdit = (e) => {
    setEditing(e.id)
    setEditFields({ title: e.title, date: e.date || '', time: e.time || '', badge: e.badge || '', badgeType: e.badgeType || '' })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    if (!editFields.title) return
    await updateEvent(editing, editFields)
    setEditing(null)
  }

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
        {grid.map((day, i) => (
          <div
            key={i}
            className={[
              'cal-day',
              !day ? 'empty' : '',
              day === todayDay ? 'today' : '',
              day === selectedDay ? 'selected' : '',
              eventDays.has(day) ? 'has-event' : '',
            ].join(' ').trim()}
            onClick={() => handleDayClick(day)}
          >
            {day}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="add-form">
          <div className="add-form-title">Neuer Termin</div>
          <input
            placeholder="Was plant ihr?"
            value={newEvent.title}
            onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))}
          />
          <input
            placeholder="Datum (z.B. Sa, 26. Apr)"
            value={newEvent.date}
            onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))}
          />
          <input
            placeholder="Uhrzeit"
            value={newEvent.time}
            onChange={e => setNewEvent(n => ({ ...n, time: e.target.value }))}
          />
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
            <button className="btn btn-primary" onClick={handleAdd}>Speichern</button>
          </div>
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
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => {
            setNewEvent({ title: '', date: selectedDay ? formatDateGerman(selectedDay, month, year) : '', time: '' })
            setShowForm(true)
          }}
        >
          + Termin hinzufügen
        </button>
      )}

      {(selectedDay
        ? events.filter(e => {
            const parsed = parseEventDate(e.date)
            return parsed && parsed.month === month && parsed.day === selectedDay
          })
        : events
      ).map(e => (
        editing === e.id ? (
          <div key={e.id} className="add-form">
            <div className="add-form-title">Termin bearbeiten</div>
            <input
              placeholder="Was plant ihr?"
              value={editFields.title}
              onChange={ev => setEditFields(f => ({ ...f, title: ev.target.value }))}
            />
            <input
              placeholder="Datum (z.B. Sa, 26. Apr)"
              value={editFields.date}
              onChange={ev => setEditFields(f => ({ ...f, date: ev.target.value }))}
            />
            <input
              placeholder="Uhrzeit"
              value={editFields.time}
              onChange={ev => setEditFields(f => ({ ...f, time: ev.target.value }))}
            />
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Speichern</button>
            </div>
          </div>
        ) : (
          <div key={e.id} className="card" onClick={() => startEdit(e)}>
            <div className="card-header">
              <div>
                <div className="card-title">{e.title}</div>
                <div className="card-meta">{e.date} · {e.time}</div>
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
      ))}
    </div>
  )
}
