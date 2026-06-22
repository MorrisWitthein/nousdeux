// Records the screen rect of the last interactive element the user activated, so
// a pop-up that opens as a result can grow out of (and shrink back into) it
// without every call site having to thread a ref/rect through its handlers.
//
// We listen in the capture phase so we still see the trigger even when its
// handler calls stopPropagation (e.g. the edit/delete buttons inside a card),
// and we measure at press time — before the click handler runs and possibly
// removes the element (e.g. the FAB hides itself when its form opens).

let last = { rect: null, t: 0 }

// Climb to the nearest semantically-tappable element so we grow from the whole
// card/button the user aimed at, not an inner text node.
const TRIGGER = 'button, a, [role="button"]'

function record(e) {
  const el = e.target?.closest?.(TRIGGER)
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return
  last = { rect, t: Date.now() }
}

if (typeof document !== 'undefined') {
  // pointerdown covers mouse + touch; click is the fallback for keyboard
  // activation (Enter/Space on a role="button"), which has no pointer event.
  document.addEventListener('pointerdown', record, true)
  document.addEventListener('click', record, true)
}

// Returns the most recent trigger rect, or null when it's too old to plausibly
// belong to whatever is opening now (so the pop-up falls back to a centred grow).
export function consumeClickOrigin(maxAgeMs = 1000) {
  if (last.rect && Date.now() - last.t <= maxAgeMs) return last.rect
  return null
}
