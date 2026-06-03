// Author attribution color, relative to the viewer: the current user's own
// records are shown in teal (--accent2), the partner's in red (--accent).
// This is a per-viewer scheme (not a fixed per-identity color), kept in one
// place so the header avatar, profile modal, and every author dot agree.
export function authorColor(who, currentUser) {
  return who === currentUser ? 'var(--accent2)' : 'var(--accent)'
}
