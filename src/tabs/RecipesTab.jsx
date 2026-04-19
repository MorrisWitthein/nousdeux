import { useState, useEffect, useRef } from 'react'

function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= value ? 'active' : 'inactive'}`}
          onClick={() => onChange(n === value ? 0 : n)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

const EMPTY_RECIPE = {
  emoji: '🍽️', title: '', tags: '', rating: 0,
  ingredients: '', steps: '', prepTime: '', servings: '',
}

export default function RecipesTab({ recipes, addRecipe, updateRecipe, deleteRecipe, currentUser }) {
  const [showForm, setShowForm] = useState(false)
  const [newRecipe, setNewRecipe] = useState({ ...EMPTY_RECIPE })
  const [editing, setEditing] = useState(null)
  const [editFields, setEditFields] = useState({ ...EMPTY_RECIPE })

  const formRef = useRef(null)
  useEffect(() => {
    if (showForm || editing) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    }
  }, [showForm, editing])

  const handleAdd = async () => {
    if (!newRecipe.title) return
    await addRecipe({
      emoji: newRecipe.emoji,
      title: newRecipe.title,
      tags: newRecipe.tags.split(',').map(t => t.trim()).filter(Boolean),
      rating: newRecipe.rating,
      ingredients: newRecipe.ingredients,
      steps: newRecipe.steps,
      prepTime: newRecipe.prepTime ? parseInt(newRecipe.prepTime, 10) : null,
      servings: newRecipe.servings ? parseInt(newRecipe.servings, 10) : null,
    })
    setNewRecipe({ ...EMPTY_RECIPE })
    setShowForm(false)
  }

  const startEdit = (r) => {
    setEditing(r.id)
    setEditFields({
      emoji: r.emoji || '🍽️',
      title: r.title,
      tags: (r.tags || []).join(', '),
      rating: r.rating || 0,
      ingredients: r.ingredients || '',
      steps: r.steps || '',
      prepTime: r.prepTime || '',
      servings: r.servings || '',
    })
    setShowForm(false)
  }

  const handleUpdate = async () => {
    if (!editFields.title) return
    await updateRecipe(editing, {
      emoji: editFields.emoji,
      title: editFields.title,
      tags: editFields.tags.split(',').map(t => t.trim()).filter(Boolean),
      rating: editFields.rating,
      ingredients: editFields.ingredients,
      steps: editFields.steps,
      prepTime: editFields.prepTime ? parseInt(editFields.prepTime, 10) : null,
      servings: editFields.servings ? parseInt(editFields.servings, 10) : null,
    })
    setEditing(null)
  }

  const renderStars = (rating) => {
    if (!rating) return '–'
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const renderForm = (fields, setFields, onSave, onCancel, title) => (
    <div className="add-form">
      <div className="add-form-title">{title}</div>
      <div className="form-row">
        <div style={{ flex: '0 0 70px' }}>
          <label className="form-label">Emoji</label>
          <input
            value={fields.emoji}
            onChange={e => setFields(f => ({ ...f, emoji: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Name</label>
          <input
            placeholder="Name des Rezepts"
            value={fields.title}
            onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
          />
        </div>
      </div>
      <input
        placeholder="Tags (kommagetrennt, z.B. Veggie, Einfach)"
        value={fields.tags}
        onChange={e => setFields(f => ({ ...f, tags: e.target.value }))}
      />
      <label className="form-label">Bewertung</label>
      <StarRating value={fields.rating} onChange={v => setFields(f => ({ ...f, rating: v }))} />
      <textarea
        placeholder="Zutaten (eine pro Zeile)"
        value={fields.ingredients}
        onChange={e => setFields(f => ({ ...f, ingredients: e.target.value }))}
      />
      <textarea
        placeholder="Zubereitung"
        value={fields.steps}
        onChange={e => setFields(f => ({ ...f, steps: e.target.value }))}
      />
      <div className="form-row">
        <div>
          <label className="form-label">Zubereitungszeit (Min.)</label>
          <input
            type="number"
            min="1"
            placeholder="z.B. 30"
            value={fields.prepTime}
            onChange={e => setFields(f => ({ ...f, prepTime: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Portionen</label>
          <input
            type="number"
            min="1"
            placeholder="z.B. 4"
            value={fields.servings}
            onChange={e => setFields(f => ({ ...f, servings: e.target.value }))}
          />
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave}>Speichern</button>
      </div>
    </div>
  )

  return (
    <div>
      <p className="section-title">Eure <em>Rezepte</em></p>
      <p className="section-sub">{recipes.length} Gerichte gesammelt</p>

      {showForm && <div ref={formRef}>{renderForm(
        newRecipe,
        setNewRecipe,
        handleAdd,
        () => setShowForm(false),
        'Rezept hinzufügen'
      )}</div>}

      {!showForm && !editing && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
          onClick={() => { setNewRecipe({ ...EMPTY_RECIPE }); setShowForm(true) }}
        >
          + Rezept hinzufügen
        </button>
      )}

      {recipes.map(r => (
        editing === r.id ? (
          <div key={r.id} ref={formRef}>
            {renderForm(
              editFields,
              setEditFields,
              handleUpdate,
              () => setEditing(null),
              'Rezept bearbeiten'
            )}
          </div>
        ) : (
          <div key={r.id} className="recipe-card" onClick={() => startEdit(r)}>
            <div className="recipe-img">
              {r.emoji}
              <div className="recipe-img-label">
                {r.rating ? renderStars(r.rating) : '–'}
              </div>
            </div>
            <div className="recipe-body">
              <div className="card-title">{r.title}</div>
              <div className="recipe-tags">
                {(r.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
                {r.prepTime > 0 && <span className="tag">{r.prepTime} Min.</span>}
                {r.servings > 0 && <span className="tag">{r.servings} Portionen</span>}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="dot" style={{ background: r.who === currentUser ? 'var(--accent2)' : 'var(--accent)' }} />
                  Von {r.who.charAt(0).toUpperCase() + r.who.slice(1)}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-edit" onClick={(e) => { e.stopPropagation(); startEdit(r) }}>✎</button>
                  <button className="btn-delete" onClick={(e) => { e.stopPropagation(); if (window.confirm('Rezept löschen?')) deleteRecipe(r.id) }}>✕</button>
                </div>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  )
}
