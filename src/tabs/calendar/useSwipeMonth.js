import { useState, useEffect, useRef, useCallback } from 'react'

// Whitespace (px) inserted between month panels so the boundary between two
// months is visible while swiping/holding mid-drag.
const PANEL_GAP = 24

// A flick is a fast release (px per ms); a held drag has to expose more than
// half the neighbour panel before it commits. IDLE_MS treats a finger that
// paused before lifting as velocity 0, so "hold then release" never flicks.
const FLICK_VELOCITY = 0.5
const FLICK_MIN_DX = 10
const IDLE_MS = 100

// Swipe/slide mechanics for the three-panel month carousel. `onCommit(dir)`
// fires once the slide animation lands on the neighbouring month (±1).
export function useSwipeMonth(onCommit) {
  const [dragX, setDragX] = useState(0)        // live finger offset during a swipe
  const [dragging, setDragging] = useState(false)
  const [anim, setAnim] = useState(0)          // -1 prev / +1 next while the slide animation runs
  const [transition, setTransition] = useState(true)
  const touchRef = useRef({ startX: 0, startY: 0, locked: null })
  const calendarRef = useRef(null)

  const onTouchStart = useCallback((e) => {
    if (anim !== 0) return  // ignore touches while a slide is committing
    const t = e.touches[0]
    const now = performance.now()
    touchRef.current = { startX: t.clientX, startY: t.clientY, locked: null, lastX: t.clientX, lastT: now, vx: 0 }
    setDragging(true)
  }, [anim])

  const onTouchMove = useCallback((e) => {
    if (!dragging) return
    const t = e.touches[0]
    const dx = t.clientX - touchRef.current.startX
    const dy = t.clientY - touchRef.current.startY

    if (touchRef.current.locked === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
    }

    if (touchRef.current.locked === 'x') {
      e.preventDefault()
      const now = performance.now()
      const dt = now - touchRef.current.lastT
      if (dt > 0) {
        const instV = (t.clientX - touchRef.current.lastX) / dt
        touchRef.current.vx = touchRef.current.vx * 0.7 + instV * 0.3  // smoothed
      }
      touchRef.current.lastX = t.clientX
      touchRef.current.lastT = now
      setDragX(dx)
    }
  }, [dragging])

  const onTouchEnd = useCallback(() => {
    if (!dragging) return
    const dx = dragX
    const w = calendarRef.current?.offsetWidth ?? 1
    setDragging(false)

    // Finger paused before lifting → not a flick.
    const idle = performance.now() - touchRef.current.lastT
    const vx = idle > IDLE_MS ? 0 : touchRef.current.vx

    const dominant = Math.abs(dx) > w * 0.5                              // new month now fills most of the view
    const flicked = Math.abs(vx) > FLICK_VELOCITY && Math.abs(dx) > FLICK_MIN_DX

    if (touchRef.current.locked === 'x' && (dominant || flicked)) {
      // Commit: a flick follows its own direction, a slow drag follows the
      // finger. The month state is committed in onTransitionEnd.
      const dir = flicked ? (vx > 0 ? -1 : 1) : (dx > 0 ? -1 : 1)
      setAnim(dir)
    } else {
      // Current month still dominant and no flick — animate back to centre.
      setDragX(0)
    }
  }, [dragging, dragX])

  // After committing a slide we briefly disable the transition to re-centre
  // the track without a visible jump; re-enable it on the next frame.
  useEffect(() => {
    if (transition) return
    const id = requestAnimationFrame(() => setTransition(true))
    return () => cancelAnimationFrame(id)
  }, [transition])

  const onTrackTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return
    if (anim === 0) return
    setTransition(false)   // re-centre instantly — neighbour panel already shows this month
    onCommit(anim)
    setDragX(0)
    setAnim(0)
  }

  // Buttons drive the same animated slide as a swipe.
  const slidePrev = () => { if (anim === 0) setAnim(-1) }
  const slideNext = () => { if (anim === 0) setAnim(1) }

  // Header label follows the slide: the committing direction, or — mid-drag —
  // the neighbour month only once it becomes the dominant one on screen (past
  // 50%), so it doesn't flip while the current month is still mostly visible.
  let headerDir = anim
  if (headerDir === 0 && dragging) {
    const w = calendarRef.current?.offsetWidth ?? 1
    if (dragX > w * 0.5) headerDir = -1
    else if (dragX < -w * 0.5) headerDir = 1
  }

  const trackStyle = {
    gap: PANEL_GAP,
    transform: dragging
      ? `translateX(calc(-100% - ${PANEL_GAP}px + ${dragX}px))`
      : anim === 1 ? `translateX(calc(-200% - ${PANEL_GAP * 2}px))`
      : anim === -1 ? 'translateX(0%)'
      : `translateX(calc(-100% - ${PANEL_GAP}px))`,
    transition: dragging || !transition
      ? 'none'
      : 'transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)',
  }

  return {
    calendarRef,
    touchHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    trackStyle,
    onTrackTransitionEnd,
    slidePrev,
    slideNext,
    headerDir,
  }
}
