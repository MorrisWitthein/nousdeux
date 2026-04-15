import { useState } from 'react'

export default function RecipesTab({ recipes, addRecipe }) {
  const [showForm, setShowForm] = useState(false)
  const [newRecipe, setNewRecipe] = useState({ title: '', tags: '' })

  const handleAdd = async () => {
    if (!newRecipe.title) return
    await addRecipe({
      emoji: '🍽️',
      title: newRecipe.title,
      tags: newRecipe.tags.split(',').map(t => t.trim()).filter(Boolean),
      who: 'M',
      rating: '–',
    })
    setNewRecipe({ title: '', tags: '' })
    setShowForm(false)
  }

  return (
    <div>
      <p className="section-title">Eure <em>Rezepte</em></p>
      <p className="section-sub">{recipes.length} Gerichte gesammelt</p>

      {showForm && (
        <div className="add-form">
          <div className="add-form-title">Rezept hinzufügen</div>
          <input
            placeholder="Name des Rezepts"
            value={newRecipe.title}
            onChange={e => setNewRecipe(n => ({ ...n, title: e.target.value }))}
          />
          <input
            placeholder="Tags (z.B. 30 Min, Veggie, Einfach)"
            value={newRecipe.tags}
            onChange={e => setNewRecipe(n => ({ ...n, tags: e.target.value }))}
          />
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Abbrechen</button>
            <button className="btn btn-primary" onClick={handleAdd}>Speichern</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => setShowForm(true)}
        >
          + Rezept hinzufügen
        </button>
      )}

      {recipes.map(r => (
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
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="dot" style={{ background: r.who === 'L' ? '#C8553D' : '#4A7C6F' }} />
              {r.who === 'L' ? 'Von Lena' : 'Von Max'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
