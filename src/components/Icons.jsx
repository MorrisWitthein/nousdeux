const props = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function PencilIcon() {
  return (
    <svg {...props}>
      <path d="M11 2L14 5L5 14H2V11L11 2Z" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg {...props}>
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  )
}

export function PaperclipIcon() {
  return (
    <svg {...props}>
      <path d="M13.5 7L6.5 14a3.5 3.5 0 0 1-5-5l7-7a2.333 2.333 0 0 1 3.3 3.3L5 12a1.167 1.167 0 0 1-1.65-1.65L9.5 4" />
    </svg>
  )
}

export function ImportIcon() {
  return (
    <svg {...props}>
      <path d="M10 2H14V6" />
      <line x1="14" y1="2" x2="8" y2="8" />
      <path d="M7 4H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" />
    </svg>
  )
}

export function CalendarIcon() {
  return (
    <svg {...props}>
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <line x1="2" y1="7" x2="14" y2="7" />
      <line x1="6" y1="1" x2="6" y2="5" />
      <line x1="10" y1="1" x2="10" y2="5" />
    </svg>
  )
}

export function CartIcon() {
  return (
    <svg {...props}>
      <path d="M1 1.5h2.5l2 8h7l1.5-5H5" />
      <circle cx="7" cy="13.5" r="1" />
      <circle cx="12" cy="13.5" r="1" />
    </svg>
  )
}

export function BellIcon(p) {
  return (
    <svg {...props} {...p}>
      <path d="M8 1.5a4 4 0 0 0-4 4c0 3-1.5 4.5-1.5 4.5h11S12 8.5 12 5.5a4 4 0 0 0-4-4Z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}

export function CheckIcon(p) {
  return (
    <svg {...props} {...p}>
      <path d="M3 8.5L6.5 12L13 4" />
    </svg>
  )
}

// Streaming/TV glyph — a screen with a play triangle. Accepts size overrides
// (e.g. <TvIcon width={13} height={13} />) for use inside compact chips.
export function TvIcon(p) {
  return (
    <svg {...props} {...p}>
      <rect x="1.5" y="3" width="13" height="8.5" rx="1.5" />
      <line x1="5" y1="14" x2="11" y2="14" />
      <path d="M7 6.2 L9.8 8 L7 9.8 Z" />
    </svg>
  )
}
