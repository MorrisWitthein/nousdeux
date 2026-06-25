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

.badge-red { background: var(--badge-red-bg); color: var(--accent); }
.badge-green { background: var(--badge-green-bg); color: var(--accent2); }
.badge-yellow { background: var(--badge-yellow-bg); color: var(--badge-yellow-fg); }
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
  border: none;
  font-family: inherit;
}

.next-up {
  display: block;
  width: 100%;
  text-align: left;
  background: var(--hero-bg);
  border: none;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  color: var(--hero-fg);
  position: relative;
  overflow: hidden;
  font-family: inherit;
}

.next-up::before {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 110px; height: 110px;
  /* Accent corner bloom. Alpha is baked into --hero-glow per theme: subtle on
     the near-black light banner, stronger on the warm-dark banner where a faint
     terracotta would otherwise vanish into the background. */
  background: var(--hero-glow);
  border-radius: 50%;
}

.next-up-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  /* Muted on the light banner; tinted accent in dark, where the surface is too
     close to the page colour to rely on the corner bloom alone for accent. */
  color: var(--hero-label);
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
  text-align: left;
  font-family: inherit;
  cursor: pointer;
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

/* STAT POP-UP — grows out of the tapped stat card (see ExpandingStats) */
.stat-pop-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(28,26,23,0.45);
  z-index: 200;
  transition: opacity 0.3s ease;
}

.stat-pop-wrap {
  position: fixed;
  inset: 0;
  z-index: 201;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: none;
}

.stat-pop {
  width: min(360px, 100%);
  background: var(--cream);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(28,26,23,0.28);
  overflow: hidden;
  transform-origin: center center;
  will-change: transform;
  pointer-events: auto;
}

.stat-pop-inner {
  position: relative;
  padding: 26px 22px 28px;
  transform-origin: center center;
  will-change: transform, opacity;
}

.stat-pop-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: var(--warm);
  color: var(--muted);
  cursor: pointer;
}

.stat-sheet-head {
  text-align: center;
  margin-bottom: 8px;
}

.stat-sheet-emoji {
  font-size: 40px;
  margin-bottom: 4px;
}

.stat-rows {
  display: flex;
  flex-direction: column;
}

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row-label {
  font-size: 14px;
  color: var(--muted);
}

.stat-row-value {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 300;
  color: var(--ink);
  line-height: 1;
  white-space: nowrap;
}

.stat-authors {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.stat-author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.stat-author strong {
  color: var(--ink);
  font-weight: 500;
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--muted);
}

.empty-state-emoji {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.empty-state-title {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  color: var(--ink);
  margin-bottom: 6px;
}

.empty-state-hint {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
`

export default cards
