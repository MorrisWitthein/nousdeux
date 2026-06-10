import { DAY_ABBR, toISO } from '../../utils/date.js'
import { authorColor } from '../../utils/authorColor.js'

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

export default function MonthGrid({ year, month, events, selectedDay, onDayClick, nowYear, nowMonth, nowDay, currentUser }) {
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
        const className = [
          'cal-day',
          !day ? 'empty' : '',
          day === todayDay ? 'today' : '',
          isSelected ? 'selected' : '',
        ].filter(Boolean).join(' ')
        const content = (
          <>
            <span className="cal-day-num">{day}</span>
            <div className="cal-event-lanes">
              {bars.map((bar, idx) => {
                const color = authorColor(bar.who, currentUser)
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
          </>
        )
        // Real days in the interactive (centre) panel are buttons for keyboard
        // access; filler cells and side panels stay non-focusable divs.
        return day && onDayClick
          ? <button key={i} type="button" className={className} onClick={() => onDayClick(day)}>{content}</button>
          : <div key={i} className={className}>{content}</div>
      })}
    </div>
  )
}
