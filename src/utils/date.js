export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]
export const DAY_ABBR = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
export const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function formatISOToGerman(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]}, ${d}. ${SHORT_MONTHS[m - 1]} ${y}`
}

export function toISO(year, month, day) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function offsetMonth(year, month, delta) {
  let m = month + delta
  let y = year
  while (m < 0) { m += 12; y-- }
  while (m > 11) { m -= 12; y++ }
  return { year: y, month: m }
}

export function parseEventDate(dateStr) {
  if (!dateStr) return null
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return { day: parseInt(isoMatch[3], 10), month: parseInt(isoMatch[2], 10) - 1, year: parseInt(isoMatch[1], 10) }
  }
  const match = dateStr.match(/(\d+)\.\s*(\w+)/)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const monthStr = match[2].toLowerCase().slice(0, 3)
  const idx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === monthStr)
  if (idx === -1) return null
  return { day, month: idx }
}
