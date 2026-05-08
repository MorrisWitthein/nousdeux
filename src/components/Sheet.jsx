import { useRef, useState, useCallback, useEffect } from 'react'
import { CloseIcon } from './Icons.jsx'

const CLOSE_THRESHOLD = 80

export default function Sheet({ title, onClose, children }) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const touchRef = useRef({ startY: 0, locked: null })
  const sheetRef = useRef(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const onTouchStart = useCallback((e) => {
    touchRef.current = { startY: e.touches[0].clientY, locked: null }
    setDragging(true)
  }, [])

  const onTouchMove = useCallback((e) => {
    const dy = e.touches[0].clientY - touchRef.current.startY

    if (touchRef.current.locked === null) {
      touchRef.current.locked = Math.abs(dy) > 6 ? 'y' : 'x'
    }

    if (touchRef.current.locked === 'y') {
      const clamped = Math.max(0, dy)
      setDragY(clamped)
      if (clamped > 0) e.preventDefault()
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    setDragging(false)
    if (dragY >= CLOSE_THRESHOLD) {
      onClose()
    } else {
      setDragY(0)
    }
  }, [dragY, onClose])

  const opacity = Math.max(0, 1 - dragY / 300)

  return (
    <>
      <div
        className="sheet-backdrop"
        style={{ opacity }}
        onClick={onClose}
        onTouchMove={e => e.preventDefault()}
      />
      <div
        ref={sheetRef}
        className="sheet"
        style={{
          transform: `translateX(-50%) translateY(${dragY}px)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          className="sheet-handle"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        <div
          className="sheet-header"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <span className="sheet-title">{title}</span>
          <button className="btn-delete" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  )
}
