const cards = `
/* CARDS */
.card {
  background: var(--card);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(28,26,23,0.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 400;
  color: var(--ink);
}

.card-meta {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.badge {
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.badge-red { background: #FEE9E5; color: var(--accent); }
.badge-green { background: #E3F0EE; color: var(--accent2); }
.badge-yellow { background: #FDF3DC; color: #9A7030; }
.badge-gray { background: var(--warm); color: var(--muted); }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.who-added {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.dot { width: 8px; height: 8px; border-radius: 50%; }

/* HOME */
.greeting {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 300;
  color: var(--ink);
  line-height: 1.2;
  margin-bottom: 4px;
}

.greeting em { font-style: italic; color: var(--accent); }

.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--warm);
  border-radius: 100px;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 24px;
}

.next-up {
  background: var(--ink);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
  position: relative;
  overflow: hidden;
}

.next-up::before {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 100px; height: 100px;
  background: var(--accent);
  border-radius: 50%;
  opacity: 0.2;
}

.next-up-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.5;
  margin-bottom: 8px;
}

.next-up-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 4px;
}

.next-up-time {
  font-size: 13px;
  opacity: 0.6;
}

.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--card);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
}

.stat-number {
  font-family: 'Fraunces', serif;
  font-size: 36px;
  font-weight: 300;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--muted);
}

.stat-icon {
  font-size: 20px;
  margin-bottom: 8px;
}
`

export default cards
