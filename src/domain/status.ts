import { addDays, diffDays, quarterOf, yearOf } from './today.ts'
import type { Centre, Closure, DatedClosure, IsoDate, Status } from './types.ts'

const SOON_DAYS = 7

const isDated = (c: Closure): c is DatedClosure => c.kind !== 'tbc'

function reopeningAfter(closure: DatedClosure, dated: DatedClosure[]): IsoDate {
  let reopens = addDays(closure.end, 1)
  for (let chained = dated.find(c => c.start <= reopens && reopens <= c.end); chained; ) {
    reopens = addDays(chained.end, 1)
    chained = dated.find(c => c.start <= reopens && reopens <= c.end)
  }
  return reopens
}

export function statusOn(centre: Centre, today: IsoDate): Status {
  const dated = centre.closures.filter(isDated).sort((a, b) => a.start.localeCompare(b.start))

  const current = dated.find(c => c.start <= today && today <= c.end)
  if (current) return { kind: 'closed', closure: current, reopensOn: reopeningAfter(current, dated) }

  const upcoming = dated.find(c => c.start > today)
  if (upcoming) {
    const daysUntil = diffDays(upcoming.start, today)
    if (daysUntil <= SOON_DAYS) return { kind: 'closing-soon', closure: upcoming, daysUntil }
  }

  const quarter = quarterOf(today)
  const cleaning = dated.filter(c => c.kind === 'cleaning')
  const scheduleIsThisYear = cleaning.length === 0 || cleaning.some(c => yearOf(c.start) === yearOf(today))
  const tbcNow = centre.closures.some(c => c.kind === 'tbc' && c.quarter === quarter)
  const datedNow = cleaning.some(c => c.quarter === quarter && yearOf(c.start) === yearOf(today))
  if (tbcNow && !datedNow && scheduleIsThisYear) return { kind: 'unknown', quarter }

  return upcoming ? { kind: 'open', next: upcoming } : { kind: 'open' }
}

const EARTH_RADIUS_KM = 6371

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function nearestOpen(
  centres: Centre[],
  from: { lat: number; lng: number },
  today: IsoDate,
  excludeId?: string,
): { centre: Centre; km: number } | undefined {
  let best: { centre: Centre; km: number } | undefined
  for (const centre of centres) {
    if (centre.id === excludeId) continue
    const { kind } = statusOn(centre, today)
    if (kind !== 'open' && kind !== 'closing-soon') continue
    const km = distanceKm(from, centre)
    if (!best || km < best.km) best = { centre, km }
  }
  return best
}
