const calendar = `
/* CALENDAR */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.month-name {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 400;
  color: var(--ink);
}

.nav-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--muted);
  transition: all 0.15s;
}

.nav-btn:hover { background: var(--ink); color: white; border-color: var(--ink); }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 20px;
  will-change: transform;
  backface-visibility: hidden;
}

.cal-day-name {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding: 4px 0;
  font-weight: 500;
}

.cal-day {
  height: 52px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  position: relative;
}

.cal-day-num {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: inherit;
  position: relative;
}

.cal-day.today .cal-day-num::before,
.cal-day.selected .cal-day-num::before {
  content: '';
  position: absolute;
  width: 28px; height: 28px;
  border-radius: 50%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
}

.cal-day.today .cal-day-num::before { background: var(--ink); }
.cal-day.selected .cal-day-num::before { background: var(--accent3); }
.cal-day.today.selected .cal-day-num::before { background: var(--ink); }

.cal-day.today .cal-day-num { color: white; font-weight: 600; }
.cal-day.selected .cal-day-num { color: var(--ink); font-weight: 600; }
.cal-day.today.selected .cal-day-num { color: white; }

.cal-event-lanes {
  height: 22px;
  position: relative;
  overflow: visible;
  flex-shrink: 0;
}

.cal-day.today:hover .cal-day-num::before { filter: brightness(2.5); }
.cal-day.selected:hover .cal-day-num::before { filter: brightness(0.93); }

.cal-day:hover:not(.today):not(.selected) .cal-day-num::before {
  content: '';
  position: absolute;
  width: 28px; height: 28px;
  border-radius: 50%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  background: var(--warm);
}
.cal-day.empty { opacity: 0; pointer-events: none; }

/* Event bars — one per lane, consistent across cells */
.cal-bar {
  position: absolute;
  height: 4px;
  opacity: 0.8;
  pointer-events: none;
}
.cal-dot {
  position: absolute;
  width: 5px; height: 5px;
  border-radius: 50%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0.85;
}
.cal-day.today .cal-dot, .cal-day.selected .cal-dot { opacity: 1; }
.cal-bar-start  { left: 50%; right: -2px; border-radius: 2px 0 0 2px; }
.cal-bar-mid    { left: -2px; right: -2px; }
.cal-bar-end    { left: -2px; right: 50%; border-radius: 0 2px 2px 0; }
.cal-day.today .cal-bar, .cal-day.selected .cal-bar { opacity: 1; }
`

export default calendar
