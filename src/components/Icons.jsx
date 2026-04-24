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
