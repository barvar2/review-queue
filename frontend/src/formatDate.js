import { MESSAGES } from './constants/messages'

const LOCALE = 'en'

const absoluteFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

const RELATIVE_UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60]
]

export function formatDateTime(value) {
  return absoluteFormat.format(new Date(value))
}

export function formatRelative(value) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) return relativeFormat.format(Math.round(seconds / unitSeconds), unit)
  }

  return MESSAGES.common.justNow
}
