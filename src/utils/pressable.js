// Keyboard-accessible click props for card wrappers that contain nested
// buttons (so they can't be <button> themselves).
export const pressable = (onClick) => ({
  role: 'button',
  tabIndex: 0,
  onClick,
  onKeyDown: (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(e)
    }
  },
})
