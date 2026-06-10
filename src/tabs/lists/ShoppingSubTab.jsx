import { useState, useRef } from 'react'
import { CloseIcon } from '../../components/Icons.jsx'
import { useShoppingList, parseQty } from '../../hooks/useShoppingList.js'
import { useToast } from '../../context/ToastContext.jsx'
import { authorColor } from '../../utils/authorColor.js'

export default function ShoppingSubTab({ currentUser }) {
  const showToast = useToast()
  const { items, history, loading, addItem, toggleItem, deleteItem, clearChecked } = useShoppingList()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

  const handleAdd = async (value) => {
    try { await addItem(value) } catch (err) { showToast(err.message) }
  }

  const handleToggle = async (id, checked) => {
    try { await toggleItem(id, checked) } catch (err) { showToast(err.message) }
  }

  const handleDelete = async (id) => {
    try { await deleteItem(id) } catch (err) { showToast(err.message) }
  }

  const handleClearChecked = async () => {
    try { await clearChecked() } catch (err) { showToast(err.message) }
  }

  const submitInput = () => {
    if (!input.trim()) return
    handleAdd(input)
    setInput('')
    setSuggestions([])
  }

  return (
    <>
      <div className="shopping-input-row">
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            className="shopping-input"
            placeholder="Artikel hinzufügen…"
            value={input}
            onChange={e => {
              const val = e.target.value
              setInput(val)
              const { qty, name } = parseQty(val.trim())
              const namePart = name.toLowerCase()
              if (namePart.length > 0) {
                setSuggestions(
                  history
                    .filter(h => h.toLowerCase().startsWith(namePart) && h.toLowerCase() !== namePart)
                    .map(h => qty ? `${qty} ${h}` : h)
                    .slice(0, 5)
                )
              } else {
                setSuggestions([])
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                submitInput()
              } else if (e.key === 'Escape') {
                setSuggestions([])
              }
            }}
          />
          {suggestions.length > 0 && (
            <div className="shop-suggestions">
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  className="shop-suggestion-item"
                  onMouseDown={e => { e.preventDefault(); setInput(s); setSuggestions([]); inputRef.current?.focus() }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="shop-add-btn" onClick={submitInput}>+</button>
      </div>

      {items.some(i => i.checked) && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
          onClick={handleClearChecked}
        >Erledigte löschen</button>
      )}

      <div>
        {items.filter(i => !i.checked).map(item => (
          <div key={item.id} className="shop-item">
            <button className="shop-check" onClick={() => handleToggle(item.id, item.checked)} aria-label="Abhaken">
              <span className="shop-check-inner" />
            </button>
            <span className="shop-item-name">
              {item.qty && <span style={{ color: 'var(--muted)', marginRight: 4 }}>{item.qty}</span>}
              {item.name}
            </span>
            <span
              className="shop-author-dot"
              style={{ background: authorColor(item.who, currentUser) }}
              title={item.who}
            />
            <button className="btn-delete" style={{ width: 32, height: 32 }} onClick={() => handleDelete(item.id)}><CloseIcon /></button>
          </div>
        ))}
        {items.some(i => i.checked) && (
          <>
            <div className="shop-divider">Erledigt</div>
            {items.filter(i => i.checked).map(item => (
              <div key={item.id} className="shop-item shop-item-checked">
                <button className="shop-check shop-check-done" onClick={() => handleToggle(item.id, item.checked)} aria-label="Wiederherstellen">
                  <span className="shop-check-inner shop-check-inner-done">✓</span>
                </button>
                <span className="shop-item-name shop-item-name-checked">
                  {item.qty && <span style={{ marginRight: 4 }}>{item.qty}</span>}
                  {item.name}
                </span>
                <span
                  className="shop-author-dot"
                  style={{ background: authorColor(item.who, currentUser), opacity: 0.4 }}
                  title={item.who}
                />
                <button className="btn-delete" style={{ width: 32, height: 32 }} onClick={() => handleDelete(item.id)}><CloseIcon /></button>
              </div>
            ))}
          </>
        )}
        {items.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, padding: '32px 0' }}>
            Liste ist leer 🛒
          </div>
        )}
      </div>
    </>
  )
}
