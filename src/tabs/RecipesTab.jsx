import { useState, useMemo, useRef, useEffect } from 'react'
import TagInput from '../components/TagInput.jsx'
import { PencilIcon, CloseIcon } from '../components/Icons.jsx'

function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= value ? 'active' : 'inactive'}`}
          onClick={() => onChange(n === value ? 0 : n)}>★</span>
      ))}
    </div>
  )
}

function parseLines(str) {
  return (str || '').split('\n').map(s => s.trim()).filter(Boolean)
}

function joinLines(arr) {
  return arr.filter(s => s.trim()).join('\n')
}

const EMPTY_FIELDS = {
  title: '', tags: [], rating: 0,
  ingredients: [], steps: [], prepTime: '', servings: '',
}

function recipeToFields(r) {
  return {
    title: r.title || '',
    tags: r.tags || [],
    rating: r.rating || 0,
    ingredients: parseLines(r.ingredients),
    steps: parseLines(r.steps),
    prepTime: r.prepTime || '',
    servings: r.servings || '',
  }
}

function Sheet({ title, onClose, children }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span className="sheet-title">{title}</span>
          <button className="btn-delete" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}

function RecipeForm({ fields, setFields, onSave, onCancel, title, knownTags }) {
  const ingRefs = useRef([])
  const stepRefs = useRef([])
  const [focusIng, setFocusIng] = useState(null)
  const [focusStep, setFocusStep] = useState(null)

  useEffect(() => {
    if (focusIng !== null && ingRefs.current[focusIng]) {
      ingRefs.current[focusIng].focus()
      setFocusIng(null)
    }
  }, [focusIng])

  useEffect(() => {
    if (focusStep !== null && stepRefs.current[focusStep]) {
      stepRefs.current[focusStep].focus()
      setFocusStep(null)
    }
  }, [focusStep])

  const addIngredient = (afterIndex) => {
    const idx = afterIndex ?? fields.ingredients.length
    setFields(f => {
      const next = [...f.ingredients]
      next.splice(idx, 0, '')
      return { ...f, ingredients: next }
    })
    setFocusIng(idx)
  }

  const addStep = (afterIndex) => {
    const idx = afterIndex ?? fields.steps.length
    setFields(f => {
      const next = [...f.steps]
      next.splice(idx, 0, '')
      return { ...f, steps: next }
    })
    setFocusStep(idx)
  }

  return (
    <Sheet title={title} onClose={onCancel}>
      <label className="form-label">Name</label>
      <input
        placeholder="Name des Rezepts"
        value={fields.title}
        onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
      />

      <label className="form-label">Tags</label>
      <TagInput
        value={fields.tags}
        onChange={tags => setFields(f => ({ ...f, tags }))}
        suggestions={knownTags}
        placeholder="Veggie, Einfach, … (Enter)"
      />

      <label className="form-label">Bewertung</label>
      <StarRating value={fields.rating} onChange={v => setFields(f => ({ ...f, rating: v }))} />

      <label className="form-label">Zutaten</label>
      {fields.ingredients.map((ing, i) => (
        <div key={i} className="ingredient-row">
          <input
            ref={el => { ingRefs.current[i] = el }}
            placeholder={`Zutat ${i + 1}`}
            value={ing}
            onChange={e => {
              const next = [...fields.ingredients]
              next[i] = e.target.value
              setFields(f => ({ ...f, ingredients: next }))
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                addIngredient(i + 1)
              }
            }}
          />
          <button className="btn-delete"
            onClick={() => setFields(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))}>
            <CloseIcon />
          </button>
        </div>
      ))}
      <button className="add-row-btn" onClick={() => addIngredient()}>
        + Zutat hinzufügen
      </button>

      <label className="form-label">Zubereitung</label>
      {fields.steps.map((step, i) => (
        <div key={i} className="step-row">
          <div className="step-number">{i + 1}</div>
          <input
            ref={el => { stepRefs.current[i] = el }}
            placeholder={`Schritt ${i + 1}`}
            value={step}
            onChange={e => {
              const next = [...fields.steps]
              next[i] = e.target.value
              setFields(f => ({ ...f, steps: next }))
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                addStep(i + 1)
              }
            }}
          />
          <button className="btn-delete"
            onClick={() => setFields(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}>
            <CloseIcon />
          </button>
        </div>
      ))}
      <button className="add-row-btn" onClick={() => addStep()}>
        + Schritt hinzufügen
      </button>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">Zeit (Min.)</label>
          <input type="number" min="1" placeholder="z.B. 30"
            value={fields.prepTime}
            onChange={e => setFields(f => ({ ...f, prepTime: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Portionen</label>
          <input type="number" min="1" placeholder="z.B. 4"
            value={fields.servings}
            onChange={e => setFields(f => ({ ...f, servings: e.target.value }))} />
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onCancel}>Abbrechen</button>
        <button className="btn btn-primary" onClick={onSave} disabled={!fields.title}>Speichern</button>
      </div>
    </Sheet>
  )
}

function RecipeDetail({ recipe, onEdit, onClose, currentUser }) {
  const ingredients = parseLines(recipe.ingredients)
  const steps = parseLines(recipe.steps)

  return (
    <Sheet title="" onClose={onClose}>
      {recipe.imageUrl
        ? <img src={recipe.imageUrl} alt={recipe.title}
            style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 16, marginBottom: 16 }} />
        : <div className="recipe-detail-emoji">{recipe.emoji}</div>
      }

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>
          {recipe.title}
        </div>
        {recipe.rating > 0 && (
          <div style={{ color: 'var(--accent3)', fontSize: 18, marginBottom: 8 }}>
            {'★'.repeat(recipe.rating)}{'☆'.repeat(5 - recipe.rating)}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {(recipe.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
          {recipe.prepTime > 0 && <span className="tag">{recipe.prepTime} Min.</span>}
          {recipe.servings > 0 && <span className="tag">{recipe.servings} Portionen</span>}
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="recipe-detail-section">
          <div className="recipe-detail-section-title">Zutaten</div>
          {ingredients.map((ing, i) => (
            <div key={i} className="recipe-detail-ingredient">
              <span style={{ color: 'var(--muted)', flexShrink: 0 }}>·</span>
              {ing}
            </div>
          ))}
        </div>
      )}

      {steps.length > 0 && (
        <div className="recipe-detail-section">
          <div className="recipe-detail-section-title">Zubereitung</div>
          {steps.map((step, i) => (
            <div key={i} className="recipe-detail-step">
              <div className="step-number" style={{ marginTop: 2 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>{step}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
          <div className="dot" style={{ background: recipe.who === currentUser ? 'var(--accent2)' : 'var(--accent)' }} />
          Von {recipe.who.charAt(0).toUpperCase() + recipe.who.slice(1)}
        </div>
        <button className="btn btn-primary" style={{ flex: '0 0 auto', padding: '10px 20px' }} onClick={onEdit}>
          Bearbeiten
        </button>
      </div>
    </Sheet>
  )
}

export default function RecipesTab({ recipes, addRecipe, updateRecipe, deleteRecipe, setRecipeImage, currentUser }) {
  const [sheet, setSheet] = useState(null) // null | 'add' | 'edit' | 'detail'
  const [viewingId, setViewingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [fields, setFields] = useState({ ...EMPTY_FIELDS })
  const [activeTags, setActiveTags] = useState([])

  const knownTags = useMemo(
    () => [...new Set(recipes.flatMap(r => r.tags || []))].sort(),
    [recipes]
  )

  const toggleFilter = tag =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const displayed = activeTags.length === 0
    ? recipes
    : recipes.filter(r => activeTags.some(t => (r.tags || []).includes(t)))

  const openAdd = () => {
    setFields({ ...EMPTY_FIELDS })
    setSheet('add')
  }

  const openDetail = (r) => {
    setViewingId(r.id)
    setSheet('detail')
  }

  const openEdit = (r) => {
    setEditingId(r.id)
    setFields(recipeToFields(r))
    setSheet('edit')
  }

  const closeSheet = () => {
    setSheet(null)
    setViewingId(null)
    setEditingId(null)
  }

  const handleAdd = async () => {
    if (!fields.title) return
    const title = fields.title
    const id = await addRecipe({
      title,
      tags: fields.tags,
      rating: fields.rating,
      ingredients: joinLines(fields.ingredients),
      steps: joinLines(fields.steps),
      prepTime: fields.prepTime ? parseInt(fields.prepTime, 10) : null,
      servings: fields.servings ? parseInt(fields.servings, 10) : null,
    })
    closeSheet()
    if (id) setRecipeImage(id, title) // fire-and-forget, image appears via SSE
  }

  const handleUpdate = async () => {
    if (!fields.title) return
    await updateRecipe(editingId, {
      title: fields.title,
      tags: fields.tags,
      rating: fields.rating,
      ingredients: joinLines(fields.ingredients),
      steps: joinLines(fields.steps),
      prepTime: fields.prepTime ? parseInt(fields.prepTime, 10) : null,
      servings: fields.servings ? parseInt(fields.servings, 10) : null,
    })
    closeSheet()
  }

  const viewingRecipe = recipes.find(r => r.id === viewingId)

  return (
    <div>
      <p className="section-title">Eure <em>Rezepte</em></p>
      <p className="section-sub">{recipes.length} Gerichte gesammelt</p>

      {knownTags.length > 0 && (
        <div className="filter-bar">
          {knownTags.map(tag => (
            <button key={tag}
              className={`filter-chip${activeTags.includes(tag) ? ' active' : ''}`}
              onClick={() => toggleFilter(tag)}>
              {tag}
            </button>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 16, borderRadius: 14, padding: '13px' }}
        onClick={openAdd}
      >
        + Rezept hinzufügen
      </button>

      {displayed.map(r => (
        <div key={r.id} className="recipe-card" onClick={() => openDetail(r)}>
          <div className="recipe-img">
            {r.imageUrl
              ? <img src={r.imageUrl} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (r.emoji || '🍽️')
            }
            {r.rating > 0 && (
              <div className="recipe-img-label">
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </div>
            )}
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
                <button className="btn-edit" onClick={e => { e.stopPropagation(); openEdit(r) }}><PencilIcon /></button>
                <button className="btn-delete" onClick={e => { e.stopPropagation(); if (window.confirm('Rezept löschen?')) deleteRecipe(r.id) }}><CloseIcon /></button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {sheet === 'add' && (
        <RecipeForm
          fields={fields}
          setFields={setFields}
          onSave={handleAdd}
          onCancel={closeSheet}
          title="Rezept hinzufügen"
          knownTags={knownTags}
        />
      )}

      {sheet === 'edit' && (
        <RecipeForm
          fields={fields}
          setFields={setFields}
          onSave={handleUpdate}
          onCancel={closeSheet}
          title="Rezept bearbeiten"
          knownTags={knownTags}
        />
      )}

      {sheet === 'detail' && viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onEdit={() => openEdit(viewingRecipe)}
          onClose={closeSheet}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
