import { useState } from 'react'
import { calDays, today } from '../data.js'

export default function CalendarTab({ events, addEvent }) {
  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' })

  const eventDays = new Set(
    events
      .map(e => {
        const match = e.date?.match(/(\d+)\.\s/)
        return match ? parseInt(match[1], 10) : null
      })
      .filter(Boolean)
  )

  const handleAdd = async () => {
    if (!newEvent.title) return
    await addEvent({ ...newEvent, who: 'M', badge: 'Geplant', badgeType: 'green' })
    setNewEvent({ title: '', date: '', time: '' })
    setShowForm(false)
  }

  return (
    <div>
      <p className="section-title">Eure <em>Termine</em></p>
      <p className="section-sub">April 2026</p>

      <div className="month-nav">
        <div className="month-name">April 2026</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nav-btn">‹</button>
          <button className="nav-btn">›</button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {calDays.map((day, i) => (
          <div
            key={i}
            className={[
              'cal-day',
              !day ? 'empty' : '',
              day === today ? 'today' : '',
              eventDays.has(day) ? 'has-event' : '',
            ].join(' ').trim()}
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

      {!showForm && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => setShowForm(true)}
        >
          + Termin hinzufügen
        </button>
      )}

      {events.map(e => (
        <div key={e.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{e.title}</div>
              <div className="card-meta">{e.date} · {e.time}</div>
            </div>
            <span className={`badge badge-${e.badgeType}`}>{e.badge}</span>
          </div>
          <div className="card-footer">
            <div className="who-added">
              <div className="dot" style={{ background: e.who === 'L' ? '#C8553D' : '#4A7C6F' }} />
              {e.who === 'L' ? 'Von Lena hinzugefügt' : 'Von Max hinzugefügt'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
