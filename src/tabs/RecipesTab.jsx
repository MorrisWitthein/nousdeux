import { useState, useMemo, useRef, useEffect } from 'react'
import TagInput from '../components/TagInput.jsx'
import { PencilIcon, CloseIcon, ImportIcon, CartIcon, PaperclipIcon } from '../components/Icons.jsx'
import Sheet from '../components/Sheet.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useShoppingList } from '../hooks/useShoppingList.js'
import { useToast } from '../context/ToastContext.jsx'
import { authorColor } from '../utils/authorColor.js'
import { pressable } from '../utils/pressable.js'

function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" className={`star ${n <= value ? 'active' : 'inactive'}`}
          aria-label={`${n} Sterne`}
          onClick={() => onChange(n === value ? 0 : n)}>★</button>
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
    stepRefs.current.forEach(el => {
      if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
    })
  }, [fields.steps])

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
          <button className="btn btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <PaperclipIcon />{uploading ? 'Lädt hoch…' : (localPreview || currentImageUrl) ? 'Bild ersetzen' : 'Bild hochladen'}
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
            style={{ resize: 'none', overflow: 'hidden', minHeight: '44px', maxHeight: '160px' }}
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
        <button className="btn btn-primary" disabled={!fields.title.trim()} onClick={() => { setSubmitted(true); if (fields.title.trim()) onSave() }}>Speichern</button>
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
            <button className="btn btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => fileRef.current?.click()}>
              <PaperclipIcon />Bild auswählen
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

function ShoppingListSheet({ recipe, onClose, addItem }) {
  const [items, setItems] = useState(() =>
    parseLines(recipe.ingredients).map(parseIngredient).filter(i => i.name.trim())
  )
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    const valid = items.filter(i => i.name.trim())
    if (!valid.length) return
    setLoading(true)
    for (const item of valid) {
      const text = [item.qty, item.name].filter(Boolean).join(' ')
      await addItem(text)
    }
    setLoading(false)
    onClose()
  }

  return (
    <Sheet title="Einkaufsliste" onClose={onClose}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        Zutaten aus „{recipe.title}" hinzufügen
      </p>
      {items.map((item, i) => (
        <div key={i} className="ingredient-row">
          <input
            className="ingredient-qty"
            placeholder="Menge"
            value={item.qty}
            onChange={e => {
              const next = [...items]
              next[i] = { ...next[i], qty: e.target.value }
              setItems(next)
            }}
          />
          <input
            style={{ flex: 1, minWidth: 0 }}
            placeholder="Zutat"
            value={item.name}
            onChange={e => {
              const next = [...items]
              next[i] = { ...next[i], name: e.target.value }
              setItems(next)
            }}
          />
          <button className="btn-delete" onClick={() => setItems(items.filter((_, j) => j !== i))}>
            <CloseIcon />
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
          Keine Zutaten vorhanden.
        </p>
      )}
      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Abbrechen</button>
        <button className="btn btn-primary" onClick={handleConfirm}
          disabled={loading || items.every(i => !i.name.trim())}>
          {loading ? 'Wird hinzugefügt…' : 'Zur Liste hinzufügen'}
        </button>
      </div>
    </Sheet>
  )
}

function RecipeDetail({ recipe, onEdit, onClose, onShopping, currentUser }) {
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
          <div className="dot" style={{ background: authorColor(recipe.who, currentUser) }} />
          Von {recipe.who.charAt(0).toUpperCase() + recipe.who.slice(1)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ingredients.length > 0 && (
            <button className="btn btn-secondary" style={{ flex: '0 0 auto', padding: '10px 14px' }} onClick={onShopping}>
              <CartIcon />
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: '0 0 auto', padding: '10px 20px' }} onClick={onEdit}>
            Bearbeiten
          </button>
        </div>
      </div>
    </Sheet>
  )
}

export default function RecipesTab({ recipes, loading, addRecipe, updateRecipe, deleteRecipe, setRecipeImage, uploadRecipeImage, clearRecipeImage, importRecipe, currentUser }) {
  const showToast = useToast()
  const { addItem } = useShoppingList()
  const [sheet, setSheet] = useState(null) // null | 'add' | 'edit' | 'detail' | 'import' | 'shopping'
  const [fabOpen, setFabOpen] = useState(false)
  const [viewingId, setViewingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [fields, setFields] = useState({ ...EMPTY_FIELDS })
  const [pendingImageFile, setPendingImageFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)

  const knownTags = useMemo(
    () => [...new Set(recipes.flatMap(r => r.tags || []))].sort(),
    [recipes]
  )

  const displayed = searchQuery.trim() === ''
    ? recipes
    : recipes.filter(r => {
        const q = searchQuery.toLowerCase()
        return r.title.toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q))
      })

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

  const openShopping = (r) => {
    setViewingId(r.id)
    setSheet('shopping')
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
    try {
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
        if (file) uploadRecipeImage(id, file).catch(err => showToast(err.message))
        else setRecipeImage(id, title).catch(err => showToast(err.message))
      }
    } catch (err) {
      showToast(err.message)
    }
  }

  const handleUpdate = async () => {
    if (!fields.title.trim()) return
    try {
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
    } catch (err) {
      showToast(err.message)
    }
  }

  const handleDeleteRecipe = async (id) => {
    const item = recipes.find(r => r.id === id)
    try {
      await deleteRecipe(id)
      showToast('Rezept gelöscht', 'info', {
        label: 'Rückgängig',
        onClick: () => addRecipe(item).catch(err => showToast(err.message)),
      })
    } catch (err) { showToast(err.message) }
  }

  const viewingRecipe = recipes.find(r => r.id === viewingId)
  const editingRecipe = recipes.find(r => r.id === editingId)

  return (
    <div>
      <p className="section-title">Eure <em>Rezepte</em></p>
      <p className="section-sub">{recipes.length} Gerichte gesammelt</p>

      <div className="tag-filter" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={searchRef}
          placeholder="Rezepte suchen…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          style={{ flex: 1, paddingRight: searchQuery ? 28 : undefined }}
        />
        {searchQuery && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setSearchQuery(''); setSearchOpen(false); searchRef.current?.focus() }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: 2 }}
          >×</button>
        )}
        {searchOpen && (() => {
          const q = searchQuery.toLowerCase()
          const tagSuggestions = knownTags.filter(t => !q || t.toLowerCase().includes(q))
          return tagSuggestions.length > 0 ? (
            <div className="tag-dropdown">
              {tagSuggestions.map(t => (
                <div key={t} className="tag-dropdown-item" onMouseDown={() => { setSearchQuery(t); setSearchOpen(false) }}>{t}</div>
              ))}
            </div>
          ) : null
        })()}
      </div>

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
        <div key={r.id} className="recipe-card" {...pressable(() => openDetail(r))}>
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
                <div className="dot" style={{ background: authorColor(r.who, currentUser) }} />
                Von {r.who.charAt(0).toUpperCase() + r.who.slice(1)}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {r.ingredients && <button className="btn-edit" onClick={e => { e.stopPropagation(); openShopping(r) }}><CartIcon /></button>}
                <button className="btn-edit" onClick={e => { e.stopPropagation(); openEdit(r) }}><PencilIcon /></button>
                <button className="btn-delete" onClick={e => { e.stopPropagation(); handleDeleteRecipe(r.id) }}><CloseIcon /></button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {displayed.length === 0 && !loading && (
        searchQuery.trim() !== ''
          ? <EmptyState emoji="🔍" title="Keine Treffer" hint={`Keine Rezepte für „${searchQuery}".`} />
          : <EmptyState emoji="🍽️" title="Noch keine Rezepte" hint="Tippe auf +, um euer erstes Rezept zu sammeln oder zu importieren." />
      )}

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
          onImageSelected={(file) => uploadRecipeImage(editingId, file).catch(err => showToast(err.message))}
          onClearImage={() => clearRecipeImage(editingId).catch(err => showToast(err.message))}
        />
      )}

      {sheet === 'detail' && viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onEdit={() => openEdit(viewingRecipe)}
          onClose={closeSheet}
          onShopping={() => setSheet('shopping')}
          currentUser={currentUser}
        />
      )}

      {sheet === 'shopping' && viewingRecipe && (
        <ShoppingListSheet
          recipe={viewingRecipe}
          onClose={closeSheet}
          addItem={addItem}
        />
      )}

      {sheet === 'import' && (
        <ImportSheet onImport={handleImport} onClose={closeSheet} />
      )}
    </div>
  )
}
