export default function HomeTab({ events, recipes, series, activities }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  const nextEvent = events[0] ?? null
  const runningSeries = series.filter(s => s.status === 'Läuft').length

  return (
    <div>
      <p className="greeting">{greeting},<br /><em>ihr zwei</em> {hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙'}</p>
      <div className="date-chip">📅 {dateStr}</div>

      {nextEvent && (
        <div className="next-up">
          <div className="next-up-label">Als nächstes</div>
          <div className="next-up-title">{nextEvent.title}</div>
          <div className="next-up-time">{nextEvent.date} · {nextEvent.time}</div>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-number">{events.length}</div>
          <div className="stat-label">Events diesen Monat</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍿</div>
          <div className="stat-number">{runningSeries}</div>
          <div className="stat-label">Serien am Laufen</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍳</div>
          <div className="stat-number">{recipes.length}</div>
          <div className="stat-label">Rezepte gesammelt</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-number">{activities.length}</div>
          <div className="stat-label">Aktivitäten geplant</div>
        </div>
      </div>
    </div>
  )
}
