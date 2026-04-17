const styles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #F5F0E8;
  --warm: #EDE5D5;
  --ink: #1C1A17;
  --muted: #8A8070;
  --accent: #C8553D;
  --accent2: #4A7C6F;
  --accent3: #D4A853;
  --card: #FFFFFF;
  --border: rgba(28,26,23,0.1);
}

.app {
  font-family: 'DM Sans', sans-serif;
  background: var(--cream);
  min-height: 100vh;
  max-width: 390px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 150px;
}

/* HEADER */
.header {
  padding: 52px 24px 20px;
  background: var(--cream);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.logo {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.5px;
}

.logo span {
  color: var(--accent);
  font-style: italic;
}

.avatar-pair {
  display: flex;
  gap: 4px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: white;
  border: 2px solid var(--cream);
}

.avatar-a { background: var(--accent); margin-right: -8px; }
.avatar-b { background: var(--accent2); }

/* TABS */
.tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }

.tab {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab.active {
  background: var(--ink);
  border-color: var(--ink);
  color: white;
  font-weight: 500;
}

/* CONTENT */
.content {
  padding: 16px 24px 100px;
  animation: fadeUp 0.3s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* SECTION TITLE */
.section-title {
  font-family: 'Fraunces', serif;
  font-size: 28px;
  font-weight: 300;
  color: var(--ink);
  margin-bottom: 4px;
  line-height: 1.1;
}

.section-title em {
  font-style: italic;
  color: var(--accent);
}

.section-sub {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 20px;
}

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

/* HOME specific */
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

/* RECIPES */
.recipe-card {
  background: var(--card);
  border-radius: 16px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
}

.recipe-card:hover { transform: translateY(-1px); }

.recipe-img {
  height: 120px;
  background: var(--warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
}

.recipe-img-label {
  position: absolute;
  bottom: 8px; left: 8px;
  background: var(--ink);
  color: white;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 100px;
  font-weight: 500;
}

.recipe-body {
  padding: 14px;
}

.recipe-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 100px;
  background: var(--warm);
  color: var(--muted);
}

/* LISTS (series) */
.list-item {
  background: var(--card);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}

.list-item:hover { transform: translateX(3px); }

.list-emoji {
  font-size: 28px;
  width: 44px;
  height: 44px;
  background: var(--warm);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-info { flex: 1; }
.list-title {
  font-family: 'Fraunces', serif;
  font-size: 15px;
  color: var(--ink);
  margin-bottom: 2px;
}
.list-sub { font-size: 12px; color: var(--muted); }

.progress-bar {
  height: 3px;
  background: var(--warm);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent2);
  transition: width 0.5s ease;
}

/* ADD BUTTON */
.fab {
  position: fixed;
  bottom: 84px;
  right: 24px;
  width: 52px; height: 52px;
  background: var(--accent);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(200,85,61,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, box-shadow 0.15s;
  z-index: 20;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 28px rgba(200,85,61,0.5);
}

/* BOTTOM NAV */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 390px;
  background: rgba(245,240,232,0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  display: flex;
  padding: 10px 0 24px;
  z-index: 20;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 0.15s;
}

.nav-item:hover { opacity: 0.7; }

.nav-icon {
  font-size: 22px;
  transition: transform 0.2s;
}

.nav-item.active .nav-icon { transform: scale(1.15); }

.nav-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  transition: color 0.15s;
}

.nav-item.active .nav-label { color: var(--ink); font-weight: 600; }

/* ACTIVITY CARDS */
.activity-card {
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 10px;
  display: flex;
  gap: 14px;
  align-items: center;
  cursor: pointer;
  border: 1.5px solid var(--border);
  background: var(--card);
  transition: transform 0.15s;
}

.activity-card:hover { transform: translateY(-1px); }

.activity-icon {
  font-size: 32px;
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--warm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.add-form {
  background: var(--card);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  animation: fadeUp 0.25s ease;
}

.add-form input, .add-form select {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: var(--ink);
  background: var(--cream);
  margin-bottom: 10px;
  outline: none;
  transition: border-color 0.15s;
}

.add-form input:focus, .add-form select:focus {
  border-color: var(--ink);
}

.add-form-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  margin-bottom: 14px;
  color: var(--ink);
}

.btn-row {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary { background: var(--ink); color: white; }
.btn-secondary { background: var(--warm); color: var(--muted); }
.btn:hover { opacity: 0.85; }

.btn-delete {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-delete:hover {
  background: #FEE9E5;
  color: var(--accent);
}
`

export default styles
