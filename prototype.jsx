import { useState } from “react”;

const styles = `
@import url(‘https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap’);

- { box-sizing: border-box; margin: 0; padding: 0; }

:root {
–cream: #F5F0E8;
–warm: #EDE5D5;
–ink: #1C1A17;
–muted: #8A8070;
–accent: #C8553D;
–accent2: #4A7C6F;
–accent3: #D4A853;
–card: #FFFFFF;
–border: rgba(28,26,23,0.1);
}

.app {
font-family: ‘DM Sans’, sans-serif;
background: var(–cream);
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
background-image: url(“data:image/svg+xml,%3Csvg viewBox=‘0 0 256 256’ xmlns=‘http://www.w3.org/2000/svg’%3E%3Cfilter id=‘noise’%3E%3CfeTurbulence type=‘fractalNoise’ baseFrequency=‘0.9’ numOctaves=‘4’ stitchTiles=‘stitch’/%3E%3C/filter%3E%3Crect width=‘100%25’ height=‘100%25’ filter=‘url(%23noise)’/%3E%3C/svg%3E”);
background-size: 150px;
}

/* HEADER */
.header {
padding: 52px 24px 20px;
background: var(–cream);
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
font-family: ‘Fraunces’, serif;
font-size: 22px;
font-weight: 600;
color: var(–ink);
letter-spacing: -0.5px;
}

.logo span {
color: var(–accent);
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
border: 2px solid var(–cream);
}

.avatar-a { background: var(–accent); margin-right: -8px; }
.avatar-b { background: var(–accent2); }

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
border: 1.5px solid var(–border);
background: transparent;
font-family: ‘DM Sans’, sans-serif;
font-size: 13px;
font-weight: 400;
color: var(–muted);
cursor: pointer;
transition: all 0.2s;
white-space: nowrap;
}

.tab.active {
background: var(–ink);
border-color: var(–ink);
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
font-family: ‘Fraunces’, serif;
font-size: 28px;
font-weight: 300;
color: var(–ink);
margin-bottom: 4px;
line-height: 1.1;
}

.section-title em {
font-style: italic;
color: var(–accent);
}

.section-sub {
font-size: 13px;
color: var(–muted);
margin-bottom: 20px;
}

/* CARDS */
.card {
background: var(–card);
border-radius: 16px;
padding: 16px;
margin-bottom: 10px;
border: 1px solid var(–border);
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
font-family: ‘Fraunces’, serif;
font-size: 16px;
font-weight: 400;
color: var(–ink);
}

.card-meta {
font-size: 12px;
color: var(–muted);
margin-top: 2px;
}

.badge {
padding: 3px 10px;
border-radius: 100px;
font-size: 11px;
font-weight: 500;
flex-shrink: 0;
}

.badge-red { background: #FEE9E5; color: var(–accent); }
.badge-green { background: #E3F0EE; color: var(–accent2); }
.badge-yellow { background: #FDF3DC; color: #9A7030; }
.badge-gray { background: var(–warm); color: var(–muted); }

.card-footer {
display: flex;
align-items: center;
justify-content: space-between;
margin-top: 10px;
padding-top: 10px;
border-top: 1px solid var(–border);
}

.who-added {
display: flex;
align-items: center;
gap: 6px;
font-size: 12px;
color: var(–muted);
}

.dot { width: 8px; height: 8px; border-radius: 50%; }

/* HOME specific */
.greeting {
font-family: ‘Fraunces’, serif;
font-size: 32px;
font-weight: 300;
color: var(–ink);
line-height: 1.2;
margin-bottom: 4px;
}

.greeting em { font-style: italic; color: var(–accent); }

.date-chip {
display: inline-flex;
align-items: center;
gap: 6px;
background: var(–warm);
border-radius: 100px;
padding: 5px 12px;
font-size: 12px;
color: var(–muted);
margin-bottom: 24px;
}

.next-up {
background: var(–ink);
border-radius: 20px;
padding: 20px;
margin-bottom: 16px;
color: white;
position: relative;
overflow: hidden;
}

.next-up::before {
content: ‘’;
position: absolute;
top: -20px; right: -20px;
width: 100px; height: 100px;
background: var(–accent);
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
font-family: ‘Fraunces’, serif;
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
background: var(–card);
border-radius: 16px;
padding: 16px;
border: 1px solid var(–border);
}

.stat-number {
font-family: ‘Fraunces’, serif;
font-size: 36px;
font-weight: 300;
color: var(–ink);
line-height: 1;
margin-bottom: 4px;
}

.stat-label {
font-size: 12px;
color: var(–muted);
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
font-family: ‘Fraunces’, serif;
font-size: 20px;
font-weight: 400;
color: var(–ink);
}

.nav-btn {
width: 32px; height: 32px;
border-radius: 50%;
border: 1.5px solid var(–border);
background: transparent;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
font-size: 16px;
color: var(–muted);
transition: all 0.15s;
}

.nav-btn:hover { background: var(–ink); color: white; border-color: var(–ink); }

.calendar-grid {
display: grid;
grid-template-columns: repeat(7, 1fr);
gap: 4px;
margin-bottom: 20px;
}

.cal-day-name {
text-align: center;
font-size: 11px;
color: var(–muted);
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
color: var(–ink);
cursor: pointer;
position: relative;
gap: 2px;
}

.cal-day:hover { background: var(–warm); }
.cal-day.today { background: var(–ink); color: white; font-weight: 600; }
.cal-day.has-event::after {
content: ‘’;
width: 4px; height: 4px;
border-radius: 50%;
background: var(–accent);
position: absolute;
bottom: 3px;
}
.cal-day.today.has-event::after { background: var(–accent3); }
.cal-day.empty { opacity: 0; pointer-events: none; }

/* RECIPES */
.recipe-card {
background: var(–card);
border-radius: 16px;
margin-bottom: 10px;
border: 1px solid var(–border);
overflow: hidden;
cursor: pointer;
transition: transform 0.15s;
}

.recipe-card:hover { transform: translateY(-1px); }

.recipe-img {
height: 120px;
background: var(–warm);
display: flex;
align-items: center;
justify-content: center;
font-size: 48px;
position: relative;
}

.recipe-img-label {
position: absolute;
bottom: 8px; left: 8px;
background: var(–ink);
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
background: var(–warm);
color: var(–muted);
}

/* LISTS (series) */
.list-item {
background: var(–card);
border-radius: 14px;
padding: 14px 16px;
margin-bottom: 8px;
border: 1px solid var(–border);
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
background: var(–warm);
border-radius: 12px;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
}

.list-info { flex: 1; }
.list-title {
font-family: ‘Fraunces’, serif;
font-size: 15px;
color: var(–ink);
margin-bottom: 2px;
}
.list-sub { font-size: 12px; color: var(–muted); }

.progress-bar {
height: 3px;
background: var(–warm);
border-radius: 2px;
margin-top: 6px;
overflow: hidden;
}

.progress-fill {
height: 100%;
border-radius: 2px;
background: var(–accent2);
transition: width 0.5s ease;
}

/* ADD BUTTON */
.fab {
position: fixed;
bottom: 84px;
right: 24px;
width: 52px; height: 52px;
background: var(–accent);
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
border-top: 1px solid var(–border);
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
color: var(–muted);
transition: color 0.15s;
}

.nav-item.active .nav-label { color: var(–ink); font-weight: 600; }

/* ACTIVITY CARDS */
.activity-card {
border-radius: 16px;
padding: 18px;
margin-bottom: 10px;
display: flex;
gap: 14px;
align-items: center;
cursor: pointer;
border: 1.5px solid var(–border);
background: var(–card);
transition: transform 0.15s;
}

.activity-card:hover { transform: translateY(-1px); }

.activity-icon {
font-size: 32px;
width: 52px; height: 52px;
border-radius: 14px;
background: var(–warm);
display: flex; align-items: center; justify-content: center;
flex-shrink: 0;
}

.add-form {
background: var(–card);
border-radius: 20px;
padding: 20px;
margin-bottom: 16px;
border: 1px solid var(–border);
animation: fadeUp 0.25s ease;
}

.add-form input, .add-form select {
width: 100%;
padding: 12px 14px;
border: 1.5px solid var(–border);
border-radius: 12px;
font-family: ‘DM Sans’, sans-serif;
font-size: 14px;
color: var(–ink);
background: var(–cream);
margin-bottom: 10px;
outline: none;
transition: border-color 0.15s;
}

.add-form input:focus, .add-form select:focus {
border-color: var(–ink);
}

.add-form-title {
font-family: ‘Fraunces’, serif;
font-size: 18px;
margin-bottom: 14px;
color: var(–ink);
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
font-family: ‘DM Sans’, sans-serif;
font-size: 14px;
font-weight: 500;
cursor: pointer;
transition: opacity 0.15s;
}

.btn-primary { background: var(–ink); color: white; }
.btn-secondary { background: var(–warm); color: var(–muted); }
.btn:hover { opacity: 0.85; }
`;

// –– DATA ––
const initialData = {
events: [
{ id: 1, title: “Weinprobe in der Altstadt”, date: “Sa, 19. Apr”, time: “18:00 Uhr”, who: “L”, badge: “Datum fix”, badgeType: “red” },
{ id: 2, title: “Yoga im Park”, date: “So, 20. Apr”, time: “10:00 Uhr”, who: “M”, badge: “Geplant”, badgeType: “green” },
{ id: 3, title: “Konzert – Cigarettes After Sex”, date: “Fr, 25. Apr”, time: “20:00 Uhr”, who: “L”, badge: “Tickets kaufen”, badgeType: “yellow” },
],
recipes: [
{ id: 1, emoji: “🍝”, title: “Pasta Cacio e Pepe”, tags: [“30 Min”, “Veggie”, “Einfach”], who: “M”, rating: “4.8” },
{ id: 2, emoji: “🥘”, title: “Marokkanisches Hähnchen”, tags: [“60 Min”, “Meal Prep”], who: “L”, rating: “4.6” },
{ id: 3, emoji: “🥗”, title: “Sommersalat mit Burrata”, tags: [“15 Min”, “Leicht”, “Veggie”], who: “M”, rating: “4.9” },
{ id: 4, emoji: “🍜”, title: “Ramen von Grund auf”, tags: [“3h”, “Wochenende”], who: “L”, rating: “5.0” },
],
series: [
{ id: 1, emoji: “🎭”, title: “The Bear”, sub: “Staffel 3 · Hulu”, progress: 40, status: “Läuft”, statusType: “green” },
{ id: 2, emoji: “🌊”, title: “White Lotus”, sub: “Staffel 2 · HBO”, progress: 100, status: “Fertig”, statusType: “gray” },
{ id: 3, emoji: “🔪”, title: “Severance”, sub: “Staffel 2 · Apple TV+”, progress: 0, status: “Geplant”, statusType: “yellow” },
{ id: 4, emoji: “🤖”, title: “Silo”, sub: “Staffel 2 · Apple TV+”, progress: 70, status: “Läuft”, statusType: “green” },
],
activities: [
{ id: 1, emoji: “🎨”, title: “Keramikkurs”, meta: “Sa Vormittag · Altstadt”, who: “L” },
{ id: 2, emoji: “🚴”, title: “Radtour ans Meer”, meta: “Wochenende · ~40 km”, who: “M” },
{ id: 3, emoji: “🎭”, title: “Improtheater-Abend”, meta: “Fr Abend · Innenstadt”, who: “L” },
{ id: 4, emoji: “🧗”, title: “Kletterhalle ausprobieren”, meta: “Unter der Woche”, who: “M” },
],
};

const calDays = [
null, null, 1, 2, 3, 4, 5,
6, 7, 8, 9, 10, 11, 12,
13, 14, 15, 16, 17, 18, 19,
20, 21, 22, 23, 24, 25, 26,
27, 28, 29, 30, null, null, null,
];
const eventDays = new Set([5, 14, 19, 20, 25]);

// –– COMPONENTS ––

function HomeTab() {
return (
<div>
<p className="greeting">Guten Abend,<br /><em>ihr zwei</em> 🌙</p>
<div className="date-chip">📅 Dienstag, 14. April 2026</div>

```
  <div className="next-up">
    <div className="next-up-label">Als nächstes</div>
    <div className="next-up-title">Weinprobe in der Altstadt</div>
    <div className="next-up-time">Sa, 19. Apr · 18:00 Uhr · in 5 Tagen</div>
  </div>

  <div className="quick-stats">
    <div className="stat-card">
      <div className="stat-icon">📅</div>
      <div className="stat-number">3</div>
      <div className="stat-label">Events diesen Monat</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon">🍿</div>
      <div className="stat-number">2</div>
      <div className="stat-label">Serien am Laufen</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon">🍳</div>
      <div className="stat-number">4</div>
      <div className="stat-label">Rezepte gesammelt</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon">✨</div>
      <div className="stat-number">4</div>
      <div className="stat-label">Aktivitäten geplant</div>
    </div>
  </div>
</div>
```

);
}

function CalendarTab({ data, setData }) {
const [showForm, setShowForm] = useState(false);
const [newEvent, setNewEvent] = useState({ title: “”, date: “”, time: “” });

const addEvent = () => {
if (!newEvent.title) return;
setData(d => ({ …d, events: [{ id: Date.now(), …newEvent, who: “M”, badge: “Geplant”, badgeType: “green” }, …d.events] }));
setNewEvent({ title: “”, date: “”, time: “” });
setShowForm(false);
};

return (
<div>
<p className="section-title">Eure <em>Termine</em></p>
<p className="section-sub">April 2026</p>

```
  <div className="month-nav">
    <div className="month-name">April 2026</div>
    <div style={{ display: "flex", gap: 8 }}>
      <button className="nav-btn">‹</button>
      <button className="nav-btn">›</button>
    </div>
  </div>

  <div className="calendar-grid">
    {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
      <div key={d} className="cal-day-name">{d}</div>
    ))}
    {calDays.map((day, i) => (
      <div
        key={i}
        className={`cal-day${!day ? " empty" : ""}${day === 14 ? " today" : ""}${eventDays.has(day) ? " has-event" : ""}`}
      >
        {day}
      </div>
    ))}
  </div>

  {showForm && (
    <div className="add-form">
      <div className="add-form-title">Neuer Termin</div>
      <input placeholder="Was plant ihr?" value={newEvent.title} onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))} />
      <input placeholder="Datum (z.B. Sa, 26. Apr)" value={newEvent.date} onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))} />
      <input placeholder="Uhrzeit" value={newEvent.time} onChange={e => setNewEvent(n => ({ ...n, time: e.target.value }))} />
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
        <button className="btn btn-primary" onClick={addEvent}>Speichern</button>
      </div>
    </div>
  )}

  {!showForm && (
    <button
      className="btn btn-primary"
      style={{ width: "100%", marginBottom: 16, borderRadius: 14, padding: "13px" }}
      onClick={() => setShowForm(true)}
    >
      + Termin hinzufügen
    </button>
  )}

  {data.events.map(e => (
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
          <div className="dot" style={{ background: e.who === "L" ? "#C8553D" : "#4A7C6F" }} />
          {e.who === "L" ? "Von Lena hinzugefügt" : "Von Max hinzugefügt"}
        </div>
      </div>
    </div>
  ))}
</div>
```

);
}

function ListsTab({ data, setData }) {
const [activeList, setActiveList] = useState(“series”);
const [showForm, setShowForm] = useState(false);
const [newItem, setNewItem] = useState({ title: “”, sub: “” });

const addSeries = () => {
if (!newItem.title) return;
setData(d => ({ …d, series: [{ id: Date.now(), emoji: “🎬”, title: newItem.title, sub: newItem.sub, progress: 0, status: “Geplant”, statusType: “yellow” }, …d.series] }));
setNewItem({ title: “”, sub: “” });
setShowForm(false);
};

return (
<div>
<p className="section-title">Eure <em>Listen</em></p>
<div style={{ display: “flex”, gap: 8, marginBottom: 16 }}>
{[[“series”,“🍿 Serien”],[“movies”,“🎬 Filme”],[“books”,“📚 Bücher”]].map(([key, label]) => (
<button
key={key}
className={`tab${activeList === key ? " active" : ""}`}
onClick={() => setActiveList(key)}
>{label}</button>
))}
</div>

```
  {activeList === "series" && (
    <>
      {showForm && (
        <div className="add-form">
          <div className="add-form-title">Serie hinzufügen</div>
          <input placeholder="Titel" value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))} />
          <input placeholder="Staffel · Plattform" value={newItem.sub} onChange={e => setNewItem(n => ({ ...n, sub: e.target.value }))} />
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
            <button className="btn btn-primary" onClick={addSeries}>Hinzufügen</button>
          </div>
        </div>
      )}
      {!showForm && (
        <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16, borderRadius: 14, padding: "13px" }} onClick={() => setShowForm(true)}>
          + Serie hinzufügen
        </button>
      )}
      {data.series.map(s => (
        <div key={s.id} className="list-item">
          <div className="list-emoji">{s.emoji}</div>
          <div className="list-info">
            <div className="list-title">{s.title}</div>
            <div className="list-sub">{s.sub}</div>
            {s.progress > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${s.progress}%`, background: s.progress === 100 ? "#C8553D" : "#4A7C6F" }} />
              </div>
            )}
          </div>
          <span className={`badge badge-${s.statusType}`}>{s.status}</span>
        </div>
      ))}
    </>
  )}
  {activeList !== "series" && (
    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, marginBottom: 6, color: "var(--ink)" }}>Noch leer</div>
      <div style={{ fontSize: 13 }}>Fügt eure ersten Einträge hinzu</div>
    </div>
  )}
</div>
```

);
}

function RecipesTab({ data, setData }) {
const [showForm, setShowForm] = useState(false);
const [newRecipe, setNewRecipe] = useState({ title: “”, tags: “” });

const addRecipe = () => {
if (!newRecipe.title) return;
setData(d => ({ …d, recipes: [{ id: Date.now(), emoji: “🍽”, title: newRecipe.title, tags: newRecipe.tags.split(”,”).map(t => t.trim()).filter(Boolean), who: “M”, rating: “–” }, …d.recipes] }));
setNewRecipe({ title: “”, tags: “” });
setShowForm(false);
};

return (
<div>
<p className="section-title">Eure <em>Rezepte</em></p>
<p className="section-sub">{data.recipes.length} Gerichte gesammelt</p>

```
  {showForm && (
    <div className="add-form">
      <div className="add-form-title">Rezept hinzufügen</div>
      <input placeholder="Name des Rezepts" value={newRecipe.title} onChange={e => setNewRecipe(n => ({ ...n, title: e.target.value }))} />
      <input placeholder="Tags (z.B. 30 Min, Veggie, Einfach)" value={newRecipe.tags} onChange={e => setNewRecipe(n => ({ ...n, tags: e.target.value }))} />
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
        <button className="btn btn-primary" onClick={addRecipe}>Speichern</button>
      </div>
    </div>
  )}
  {!showForm && (
    <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16, borderRadius: 14, padding: "13px" }} onClick={() => setShowForm(true)}>
      + Rezept hinzufügen
    </button>
  )}

  {data.recipes.map(r => (
    <div key={r.id} className="recipe-card">
      <div className="recipe-img">
        {r.emoji}
        <div className="recipe-img-label">⭐ {r.rating}</div>
      </div>
      <div className="recipe-body">
        <div className="card-title">{r.title}</div>
        <div className="recipe-tags">
          {r.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <div className="dot" style={{ background: r.who === "L" ? "#C8553D" : "#4A7C6F" }} />
          {r.who === "L" ? "Von Lena" : "Von Max"}
        </div>
      </div>
    </div>
  ))}
</div>
```

);
}

function ActivitiesTab({ data, setData }) {
const [showForm, setShowForm] = useState(false);
const [newAct, setNewAct] = useState({ title: “”, meta: “” });

const addActivity = () => {
if (!newAct.title) return;
setData(d => ({ …d, activities: [{ id: Date.now(), emoji: “✨”, title: newAct.title, meta: newAct.meta, who: “M” }, …d.activities] }));
setNewAct({ title: “”, meta: “” });
setShowForm(false);
};

return (
<div>
<p className="section-title">Eure <em>Aktivitäten</em></p>
<p className="section-sub">Was wollt ihr noch erleben?</p>

```
  {showForm && (
    <div className="add-form">
      <div className="add-form-title">Aktivität hinzufügen</div>
      <input placeholder="Was wollt ihr machen?" value={newAct.title} onChange={e => setNewAct(n => ({ ...n, title: e.target.value }))} />
      <input placeholder="Wann / Wo?" value={newAct.meta} onChange={e => setNewAct(n => ({ ...n, meta: e.target.value }))} />
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
        <button className="btn btn-primary" onClick={addActivity}>Hinzufügen</button>
      </div>
    </div>
  )}
  {!showForm && (
    <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16, borderRadius: 14, padding: "13px" }} onClick={() => setShowForm(true)}>
      + Aktivität vorschlagen
    </button>
  )}

  {data.activities.map(a => (
    <div key={a.id} className="activity-card">
      <div className="activity-icon">{a.emoji}</div>
      <div style={{ flex: 1 }}>
        <div className="list-title">{a.title}</div>
        <div className="list-sub">{a.meta}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div className="dot" style={{ background: a.who === "L" ? "#C8553D" : "#4A7C6F", width: 10, height: 10 }} />
      </div>
    </div>
  ))}
</div>
```

);
}

// –– MAIN APP ––
export default function App() {
const [tab, setTab] = useState(“home”);
const [data, setData] = useState(initialData);

const tabs = [
{ id: “home”, icon: “🏠”, label: “Home” },
{ id: “calendar”, icon: “📅”, label: “Termine” },
{ id: “lists”, icon: “🍿”, label: “Listen” },
{ id: “recipes”, icon: “🍳”, label: “Rezepte” },
{ id: “activities”, icon: “✨”, label: “Aktivitäten” },
];

return (
<>
<style>{styles}</style>
<div className="app">
<div className="grain" />

```
    <div className="header">
      <div className="header-top">
        <div className="logo">nous<span>deux</span></div>
        <div className="avatar-pair">
          <div className="avatar avatar-a">L</div>
          <div className="avatar avatar-b">M</div>
        </div>
      </div>
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>

    <div className="content">
      {tab === "home" && <HomeTab />}
      {tab === "calendar" && <CalendarTab data={data} setData={setData} />}
      {tab === "lists" && <ListsTab data={data} setData={setData} />}
      {tab === "recipes" && <RecipesTab data={data} setData={setData} />}
      {tab === "activities" && <ActivitiesTab data={data} setData={setData} />}
    </div>

    <div className="bottom-nav">
      {tabs.map(t => (
        <div key={t.id} className={`nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
          <div className="nav-icon">{t.icon}</div>
          <div className="nav-label">{t.label}</div>
        </div>
      ))}
    </div>
  </div>
</>
```

);
}