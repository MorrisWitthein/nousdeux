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
}

.cal-day-name {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding: 4px 0;
  font-weight: 500;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  position: relative;
  gap: 2px;
}

.cal-day:hover { background: var(--warm); }
.cal-day.today { background: var(--ink); color: white; font-weight: 600; }
.cal-day.selected { background: var(--accent3); color: var(--ink); font-weight: 600; }
.cal-day.today.selected { background: var(--accent3); color: var(--ink); }
.cal-day.has-event::after {
  content: '';
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--accent);
  position: absolute;
  bottom: 3px;
}
.cal-day.today.has-event::after { background: var(--accent3); }
.cal-day.empty { opacity: 0; pointer-events: none; }

/* Multi-day event stripes — rendered as child spans to support stacking */
.cal-stripe {
  position: absolute;
  height: 5px;
  background: var(--accent3);
  opacity: 0.7;
  z-index: 0;
  pointer-events: none;
}
.cal-stripe.cal-stripe-start { left: 50%; right: -2px; border-radius: 3px 0 0 3px; }
.cal-stripe.cal-stripe-mid   { left: -2px; right: -2px; border-radius: 0; }
.cal-stripe.cal-stripe-end   { left: -2px; right: 50%; border-radius: 0 3px 3px 0; }
.cal-stripe.dimmed { opacity: 0.4; }

/* Dot for a single-day event coexisting with a multi-day stripe */
.cal-dot-extra {
  position: absolute;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--accent);
  z-index: 1;
  pointer-events: none;
}
`

export default calendar
