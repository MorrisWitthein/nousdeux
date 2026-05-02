import { useState, useMemo, useRef, useEffect } from 'react'
import TagInput from '../components/TagInput.jsx'
import { PencilIcon, CloseIcon, ImportIcon } from '../components/Icons.jsx'
import Sheet from '../components/Sheet.jsx'

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
  title: '', emoji: '', tags: [], rating: 0,
  ingredients: [], steps: [], prepTime: '', servings: '',
}

function parseIngredient(s) {
  const m = s.match(/^(\d[\d.,/]*[a-zA-ZäöüÄÖÜ]*)\s+(.+)$/)
  if (m) return { qty: m[1], name: m[2] }
  return { qty: '', name: s }
}

function recipeToFields(r) {
  return {
    title: r.title || '',
    emoji: r.emoji || '',
    tags: r.tags || [],
    rating: r.rating || 0,
    ingredients: parseLines(r.ingredients).map(parseIngredient),
    steps: parseLines(r.steps),
    prepTime: r.prepTime || '',
    servings: r.servings || '',
  }
}

function RecipeForm({ fields, setFields, onSave, onCancel, title, knownTags, currentImageUrl, onImageSelected, onClearImage }) {
  const ingRefs = useRef([])
  const stepRefs = useRef([])
  const fileInputRef = useRef(null)
  const [focusIng, setFocusIng] = useState(null)
  const [focusStep, setFocusStep] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    return () => { if (localPreview) URL.revokeObjectURL(localPreview) }
  }, [localPreview])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onImageSelected) return
    const blobUrl = URL.createObjectURL(file)
    setLocalPreview(blobUrl)
    setUploading(true)
    await onImageSelected(file)
    setUploading(false)
    e.target.value = ''
  }

  const handleClear = () => {
    if (localPreview) { URL.revokeObjectURL(localPreview); setLocalPreview(null) }
    onClearImage?.()
  }

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
      next.splice(idx, 0, { qty: '', name: '' })
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
      {onImageSelected && (
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Bild</label>
          {(localPreview || currentImageUrl) && (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <img src={localPreview || currentImageUrl} alt=""
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }} />
              <button className="btn-delete"
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.45)', borderRadius: '50%' }}
                onClick={handleClear}>
                <CloseIcon />
              </button>
            </div>
          )}
          <button className="btn btn-secondary" style={{ width: '100%' }}
            onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Lädt hoch…' : (localPreview || currentImageUrl) ? 'Bild ersetzen' : 'Bild hochladen'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      <label className="form-label">Name</label>
      <input
        className={submitted && !fields.title.trim() ? 'input-error' : ''}
        placeholder="Name des Rezepts"
        value={fields.title}
        onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
      />
      {submitted && !fields.title.trim() && (
        <span className="form-error">Name ist erforderlich</span>
      )}

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
            className="ingredient-qty"
            placeholder="Menge"
            value={ing.qty}
            onChange={e => {
              const next = [...fields.ingredients]
              next[i] = { ...next[i], qty: e.target.value }
              setFields(f => ({ ...f, ingredients: next }))
            }}
          />
          <input
            ref={el => { ingRefs.current[i] = el }}
            style={{ flex: 1, minWidth: 0 }}
            placeholder={`Zutat ${i + 1}`}
            value={ing.name}
            onChange={e => {
              const next = [...fields.ingredients]
              next[i] = { ...next[i], name: e.target.value }
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
          <textarea
            ref={el => { stepRefs.current[i] = el }}
            placeholder={`Schritt ${i + 1}`}
            value={step}
            rows={1}
            style={{ resize: 'none', overflow: 'auto', minHeight: '38px', maxHeight: '160px' }}
            onChange={e => {
              const el = e.target
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 160) + 'px'
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
        <button className="btn btn-primary" onClick={() => { setSubmitted(true); if (fields.title.trim()) onSave() }}>Speichern</button>
      </div>
    </Sheet>
  )
}

function ImportSheet({ onImport, onClose }) {
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [imageBase64, setImageBase64] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageBase64(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const urlValid = (() => {
    try { return ['http:', 'https:'].includes(new URL(url).protocol) } catch { return false }
  })()

  const handleImport = async () => {
    if (mode === 'url' && !urlValid) {
      setError('Bitte eine gültige URL eingeben (https://…)')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onImport(mode === 'url' ? { url } : { imageBase64 })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = mode === 'url' ? urlValid : imageBase64 !== null

  return (
    <Sheet title="Rezept importieren" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`filter-chip${mode === 'url' ? ' active' : ''}`} onClick={() => setMode('url')}>
          URL
        </button>
        <button className={`filter-chip${mode === 'image' ? ' active' : ''}`} onClick={() => setMode('image')}>
          Bild
        </button>
      </div>

      {mode === 'url' && (
        <>
          <label className="form-label">Rezept-URL</label>
          <input
            type="url"
            placeholder="https://example.com/rezept"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canSubmit && !loading) handleImport() }}
          />
        </>
      )}

      {mode === 'image' && (
        <>
          <label className="form-label">Foto des Rezepts</label>
          {imageBase64 ? (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <img src={imageBase64} alt=""
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }} />
              <button className="btn-delete"
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.45)', borderRadius: '50%' }}
                onClick={() => setImageBase64(null)}>
                <CloseIcon />
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" style={{ width: '100%' }}
              onClick={() => fileRef.current?.click()}>
              Bild auswählen
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={handleFileChange} />
        </>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0 8px' }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent2)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Rezept wird analysiert…</span>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8 }}>{error}</div>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Abbrechen</button>
        <button className="btn btn-primary" disabled={loading || !canSubmit} onClick={handleImport}>
          Importieren
        </button>
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

export default function RecipesTab({ recipes, addRecipe, updateRecipe, deleteRecipe, setRecipeImage, uploadRecipeImage, clearRecipeImage, importRecipe, currentUser }) {
  const [sheet, setSheet] = useState(null) // null | 'add' | 'edit' | 'detail' | 'import'
  const [fabOpen, setFabOpen] = useState(false)
  const [viewingId, setViewingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [fields, setFields] = useState({ ...EMPTY_FIELDS })
  const [pendingImageFile, setPendingImageFile] = useState(null)
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
    setPendingImageFile(null)
    setSheet('add')
  }

  const openImport = () => setSheet('import')

  const handleImport = async (payload) => {
    const parsed = await importRecipe(payload)
    setFields(recipeToFields(parsed))
    setPendingImageFile(null)
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
    setPendingImageFile(null)
    setFabOpen(false)
  }

  const handleAdd = async () => {
    if (!fields.title.trim()) return
    const title = fields.title
    const file = pendingImageFile
    const id = await addRecipe({
      title,
      emoji: fields.emoji || undefined,
      tags: fields.tags,
      rating: fields.rating,
      ingredients: joinLines(fields.ingredients.map(i => [i.qty, i.name].filter(Boolean).join(' '))),
      steps: joinLines(fields.steps),
      prepTime: fields.prepTime ? parseInt(fields.prepTime, 10) : null,
      servings: fields.servings ? parseInt(fields.servings, 10) : null,
    })
    closeSheet()
    if (id) {
      if (file) uploadRecipeImage(id, file)      // use the chosen file
      else setRecipeImage(id, title)             // fall back to Unsplash
    }
  }

  const handleUpdate = async () => {
    if (!fields.title.trim()) return
    await updateRecipe(editingId, {
      title: fields.title,
      tags: fields.tags,
      rating: fields.rating,
      ingredients: joinLines(fields.ingredients.map(i => [i.qty, i.name].filter(Boolean).join(' '))),
      steps: joinLines(fields.steps),
      prepTime: fields.prepTime ? parseInt(fields.prepTime, 10) : null,
      servings: fields.servings ? parseInt(fields.servings, 10) : null,
    })
    closeSheet()
  }

  const viewingRecipe = recipes.find(r => r.id === viewingId)
  const editingRecipe = recipes.find(r => r.id === editingId)

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

      {sheet === null && (
        <>
          {fabOpen && (
            <>
              <div className="fab-backdrop" onClick={() => setFabOpen(false)} />
              <div className="fab-menu">
                <button className="fab-sub" onClick={() => { setFabOpen(false); openImport() }}>
                  <span className="fab-sub-label">Importieren</span>
                  <span className="fab-sub-icon import"><ImportIcon /></span>
                </button>
                <button className="fab-sub" onClick={() => { setFabOpen(false); openAdd() }}>
                  <span className="fab-sub-label">Erstellen</span>
                  <span className="fab-sub-icon create">+</span>
                </button>
              </div>
            </>
          )}
          <button
            className={`fab${fabOpen ? ' fab-open' : ''}`}
            aria-label="Rezept hinzufügen"
            onClick={() => setFabOpen(o => !o)}
          >+</button>
        </>
      )}

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
          onImageSelected={(file) => setPendingImageFile(file)}
          onClearImage={() => setPendingImageFile(null)}
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
          currentImageUrl={editingRecipe?.imageUrl}
          onImageSelected={(file) => uploadRecipeImage(editingId, file)}
          onClearImage={() => clearRecipeImage(editingId)}
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

      {sheet === 'import' && (
        <ImportSheet onImport={handleImport} onClose={closeSheet} />
      )}
    </div>
  )
}
