import type { IsoDate, Quarter } from './types.ts'

const DAY_MS = 86_400_000

const sgDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Singapore',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function todayInSingapore(now: Date = new Date()): IsoDate {
  return sgDate.format(now) as IsoDate
}

function utcMs(d: IsoDate): number {
  return Date.parse(`${d}T00:00:00Z`)
}

export function addDays(d: IsoDate, days: number): IsoDate {
  return new Date(utcMs(d) + days * DAY_MS).toISOString().slice(0, 10) as IsoDate
}

export function diffDays(later: IsoDate, earlier: IsoDate): number {
  return Math.round((utcMs(later) - utcMs(earlier)) / DAY_MS)
}

export function yearOf(d: IsoDate): number {
  return Number(d.slice(0, 4))
}

export function quarterOf(d: IsoDate): Quarter {
  return Math.ceil(Number(d.slice(5, 7)) / 3) as Quarter
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatHuman(d: IsoDate, withYear = false): string {
  const date = new Date(utcMs(d))
  const base = `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
  return withYear ? `${base} ${date.getUTCFullYear()}` : base
}
