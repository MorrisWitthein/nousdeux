export default function EmptyState({ emoji, title, hint }) {
  return (
    <div className="empty-state">
      {emoji && <div className="empty-state-emoji">{emoji}</div>}
      <div className="empty-state-title">{title}</div>
      {hint && <div className="empty-state-hint">{hint}</div>}
    </div>
  )
}
