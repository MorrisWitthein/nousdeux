import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { CloseIcon } from './Icons.jsx'
import { consumeClickOrigin } from '../utils/clickOrigin.js'

const EXPAND_EASE = 'cubic-bezier(0.34, 1.12, 0.64, 1)'
const DURATION = 0.34

// Shared "grow out of a rect" mechanics (two-layer FLIP). On open the outer
// panel is transformed down onto `fromRect` while an inner layer is
// counter-scaled so the content never distorts; both animate back to identity.
// On close the panel keeps its content but fades the whole thing to transparent
// as it shrinks, dissolving into whatever sits underneath instead of vanishing
// and letting the content beneath pop in afterwards.
//
// Returns refs to wire onto a panel and its single inner child, plus the
// open/close state and handlers. When `fromRect` is null it falls back to a
// gentle centred scale-up.
export function useExpandCollapse({ fromRect, onClose }) {
  const panelRef = useRef(null)
  const innerRef = useRef(null)
  const [closing, setClosing] = useState(false)
  const [shown, setShown] = useState(false)

  // Map the natural (final) panel layout onto the origin rect (collapse), or
  // back to identity. Only touches transforms — opacity is handled separately.
  const flip = useCallback((collapse) => {
    const panel = panelRef.current
    const inner = innerRef.current
    if (!panel || !inner) return
    if (!collapse) {
      panel.style.transform = 'translate(0, 0) scale(1, 1)'
      inner.style.transform = 'scale(1, 1)'
      return
    }
    const final = panel.getBoundingClientRect()
    let sx, sy, dx, dy
    if (fromRect) {
      sx = fromRect.width / final.width
      sy = fromRect.height / final.height
      dx = fromRect.left + fromRect.width / 2 - (final.left + final.width / 2)
      dy = fromRect.top + fromRect.height / 2 - (final.top + final.height / 2)
    } else {
      sx = sy = 0.9
      dx = dy = 0
    }
    panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    inner.style.transform = `scale(${1 / sx}, ${1 / sy})`
  }, [fromRect])

  // Open: start mapped onto the origin with the content hidden (no transition),
  // force a reflow, then grow to the natural layout while the content fades in.
  useLayoutEffect(() => {
    const panel = panelRef.current
    const inner = innerRef.current
    panel.style.transition = 'none'
    inner.style.transition = 'none'
    flip(true)
    inner.style.opacity = '0'
    panel.getBoundingClientRect() // flush the collapsed state before transitioning
    panel.style.transition = `transform ${DURATION}s ${EXPAND_EASE}`
    inner.style.transition = `transform ${DURATION}s ${EXPAND_EASE}, opacity 0.22s ease 0.04s`
    setShown(true)
    flip(false)
    inner.style.opacity = '1'
  }, [flip])

  const beginClose = useCallback(() => {
    if (closing) return
    const panel = panelRef.current
    const inner = innerRef.current
    panel.style.transition = `transform ${DURATION}s ${EXPAND_EASE}, opacity 0.3s ease`
    inner.style.transition = `transform ${DURATION}s ${EXPAND_EASE}`
    flip(true)
    panel.style.opacity = '0'
    setClosing(true)
  }, [closing, flip])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') beginClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beginClose])

  const onTransitionEnd = useCallback((e) => {
    if (e.target !== panelRef.current || e.propertyName !== 'transform') return
    if (closing) { onClose(); return }
    // Open settled: drop the helper transforms so text is pixel-crisp and a
    // scrollable body behaves normally.
    if (innerRef.current) { innerRef.current.style.transform = ''; innerRef.current.style.willChange = '' }
    if (panelRef.current) panelRef.current.style.willChange = ''
  }, [closing, onClose])

  return { panelRef, innerRef, closing, shown, beginClose, onTransitionEnd }
}

// Drop-in replacement for <Sheet> that grows out of the element that was tapped.
// Same props (title / onClose / children); `fromRect` is optional and only
// needed when the origin isn't the last click (the stat pop-up passes its own).
export default function ExpandingSheet({ title, onClose, children, fromRect }) {
  const [origin] = useState(() => fromRect ?? consumeClickOrigin())
  const { panelRef, innerRef, shown, closing, beginClose, onTransitionEnd } =
    useExpandCollapse({ fromRect: origin, onClose })

  return (
    <>
      <div
        className="exp-backdrop"
        style={{ opacity: shown && !closing ? 1 : 0 }}
        onClick={beginClose}
      />
      <div className="exp-wrap">
        <div className="exp-panel" ref={panelRef} onTransitionEnd={onTransitionEnd}>
          <div className="exp-inner" ref={innerRef}>
            <div className="sheet-header">
              <span className="sheet-title">{title}</span>
              <button className="btn-delete" onClick={beginClose}><CloseIcon /></button>
            </div>
            <div className="sheet-body">{children}</div>
          </div>
        </div>
      </div>
    </>
  )
}
