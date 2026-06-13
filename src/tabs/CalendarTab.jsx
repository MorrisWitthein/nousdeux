import { useState, useEffect } from 'react'
import { PencilIcon, CloseIcon, PaperclipIcon } from '../components/Icons.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { authorColor } from '../utils/authorColor.js'
import { pressable } from '../utils/pressable.js'
import { MONTH_NAMES, formatISOToGerman, toISO, offsetMonth, parseEventDate } from '../utils/date.js'
import MonthGrid from './calendar/MonthGrid.jsx'
import EventDetail from './calendar/EventDetail.jsx'
import EventForm from './calendar/EventForm.jsx'
import { useSwipeMonth } from './calendar/useSwipeMonth.js'

const EMPTY_EVENT = { title: '', date: '', endDate: '', time: '', badge: 'Geplant', badgeType: 'green' }
const PAGE_SIZE = 5

export default function CalendarTab({ events, loading, addEvent, updateEvent, deleteEvent, suggestEvent, currentUser, targetDate, onTargetConsumed, prefill, onPrefillConsumed, listAttachments, uploadAttachment, deleteAttachment, attachmentUrl }) {
  const showToast = useToast()
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()
  const nowDay = now.getDate()

  const [year, setYear] = useState(nowYear)
  const [month, setMonth] = useState(nowMonth)
  const [selectedDay, setSelectedDay] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const swipe = useSwipeMonth((dir) => {
    const next = offsetMonth(year, month, dir)
    setMonth(next.month)
    setYear(next.year)
    setSelectedDay(null)
  })

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
  const [suggestMode, setSuggestMode] = useState(false)
  const [newEvent, setNewEvent] = useState({ ...EMPTY_EVENT })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_EVENT })
  const [formError, setFormError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [eventLimit, setEventLimit] = useState(PAGE_SIZE)

  const [pendingFiles, setPendingFiles] = useState([])
  const [pendingEditFiles, setPendingEditFiles] = useState([])

  useEffect(() => { setEventLimit(PAGE_SIZE) }, [year, month, selectedDay])

  const prevM = offsetMonth(year, month, -1)
  const nextM = offsetMonth(year, month, 1)
  const headerMonth = offsetMonth(year, month, swipe.headerDir)

  const handleDayClick = (day) => {
    if (!day) return
    setSelectedDay(selectedDay === day ? null : day)
    setEditing(null)
    setShowForm(false)
  }

  // Drop the day selection when tapping any non-interactive area of the page —
  // clicks on calendar days, buttons, cards, forms, links and the detail sheet
  // are left alone so they keep doing their own thing.
  useEffect(() => {
    if (!selectedDay) return
    const handler = (e) => {
      if (e.target.closest(
        '.cal-day, button, a, input, select, textarea, label, .card, .sheet, .sheet-backdrop'
      )) return
      setSelectedDay(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [selectedDay])

  const handleAdd = async () => {
    setSubmitted(true)
    if (!newEvent.title.trim()) return
    try {
      // In suggest mode the event is proposed to the other user instead of being
      // added directly. Suggestions carry the event fields only (no attachments).
      if (suggestMode && suggestEvent) {
        await suggestEvent(newEvent)
        showToast('Vorschlag gesendet', 'info')
      } else {
        const created = await addEvent(newEvent)
        if (created && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            await uploadAttachment(created.id, file)
          }
        }
      }
      setPendingFiles([])
      setNewEvent({ ...EMPTY_EVENT })
      setSuggestMode(false)
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

  const handleDelete = async (e) => {
    try {
      await deleteEvent(e.id)
      showToast('Termin gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addEvent(e).catch(err => showToast(err.message)),
      })
    } catch (err) {
      showToast(err.message)
    }
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
          <button className="nav-btn" onClick={swipe.slidePrev}>‹</button>
          <button
            className="nav-btn"
            style={{ fontSize: 11, padding: '4px 14px', letterSpacing: 0.3, borderRadius: 999, width: 'auto', height: 'auto' }}
            onClick={() => { setYear(nowYear); setMonth(nowMonth); setSelectedDay(null) }}
          >Heute</button>
          <button className="nav-btn" onClick={swipe.slideNext}>›</button>
        </div>
      </div>

      <div
        ref={swipe.calendarRef}
        {...swipe.touchHandlers}
        style={{ overflow: 'hidden', touchAction: 'pan-y' }}
      >
        <div
          className="cal-track"
          onTransitionEnd={swipe.onTrackTransitionEnd}
          style={swipe.trackStyle}
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

      {!showForm && !editing && (
        <button
          className="fab"
          aria-label="Termin hinzufügen"
          onClick={() => {
            setNewEvent({
              ...EMPTY_EVENT,
              date: selectedDay ? toISO(year, month, selectedDay) : '',
            })
            setSuggestMode(false)
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

        return (
          <div key={e.id} className="card" {...pressable(() => setViewingId(e.id))}>
            <div className="card-header">
              <div>
                <div className="card-title">{e.title}</div>
                <div className="card-meta">{dateDisplay}{e.time ? ` · ${e.time}` : ''}</div>
              </div>
              <span className={`badge badge-${e.badgeType}`}>{e.badge}</span>
            </div>
            <div className="card-footer">
              <div className="who-added">
                <div className="dot" style={{ background: authorColor(e.who, currentUser) }} />
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
                  <button className="btn-delete" onClick={(ev) => { ev.stopPropagation(); handleDelete(e) }}><CloseIcon /></button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {visibleEvents.length === 0 && !showForm && !editing && !loading && (
        selectedDay
          ? <EmptyState emoji="🗓️" title="Keine Termine an diesem Tag" hint="Tippe auf den Tag erneut, um wieder alle Termine zu sehen, oder auf +, um etwas einzutragen." />
          : <EmptyState emoji="🗓️" title="Keine Termine" hint="Für diesen Monat ist nichts geplant. Tippe auf +, um euren ersten Termin einzutragen." />
      )}

      {visibleEvents.length > eventLimit && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 4, marginBottom: 12, borderRadius: 14, padding: '10px' }}
          onClick={() => setEventLimit(l => l + PAGE_SIZE)}
        >
          Mehr anzeigen ({visibleEvents.length - eventLimit} weitere)
        </button>
      )}

      {viewingEvent && (
        <EventDetail
          event={viewingEvent}
          onEdit={() => { setViewingId(null); startEdit(viewingEvent) }}
          onClose={() => setViewingId(null)}
          currentUser={currentUser}
          listAttachments={listAttachments}
          uploadAttachment={uploadAttachment}
          deleteAttachment={deleteAttachment}
          attachmentUrl={attachmentUrl}
        />
      )}

      {showForm && (
        <EventForm
          fields={newEvent} setFields={setNewEvent}
          onSave={handleAdd}
          canSuggest={!!suggestEvent} suggestMode={suggestMode} setSuggestMode={setSuggestMode}
          onCancel={() => { setShowForm(false); setSuggestMode(false); setPendingFiles([]); setFormError(null); setSubmitted(false) }}
          title="Neuer Termin"
          error={formError} onErrorClear={() => setFormError(null)}
          pendingFiles={pendingFiles} setPendingFiles={setPendingFiles}
          submitted={submitted}
        />
      )}

      {editing && (
        <EventForm
          fields={editFields} setFields={setEditFields}
          onSave={handleUpdate}
          onCancel={() => { setEditing(null); setPendingEditFiles([]); setFormError(null); setSubmitted(false) }}
          title="Termin bearbeiten"
          error={formError} onErrorClear={() => setFormError(null)}
          pendingFiles={pendingEditFiles} setPendingFiles={setPendingEditFiles}
          submitted={submitted}
        />
      )}
    </div>
  )
}
