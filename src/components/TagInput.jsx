import { useState, useRef } from 'react'

export default function TagInput({ value = [], onChange, suggestions = [], placeholder = '' }) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const filtered = suggestions.filter(
    s => !value.includes(s) && (input.length === 0 || s.toLowerCase().includes(input.toLowerCase()))
  )

  const addTag = (tag) => {
    const t = tag.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag) => onChange(value.filter(t => t !== tag))

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="tag-input-wrapper" onClick={() => inputRef.current?.focus()}>
      {value.map(t => (
        <span key={t} className="tag-chip">
          {t}
          <button
            type="button"
            className="tag-chip-remove"
            onMouseDown={e => { e.preventDefault(); removeTag(t) }}
          >×</button>
        </span>
      ))}
      <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>
        <input
          ref={inputRef}
          className="tag-input"
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
        />
        {open && filtered.length > 0 && (
          <div className="tag-dropdown">
            {filtered.map(s => (
              <div key={s} className="tag-dropdown-item" onMouseDown={() => addTag(s)}>{s}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
