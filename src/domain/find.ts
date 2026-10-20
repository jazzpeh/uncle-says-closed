import { distanceKm, statusOn } from './status.ts'
import type { Centre, IsoDate, Status } from './types.ts'

type Point = { lat: number; lng: number }

const words = (s: string) => s.toLowerCase().split(/\s+/).filter(Boolean)

export function searchCentres(centres: Centre[], query: string): Centre[] {
  const terms = words(query)
  if (terms.length === 0) return []
  return centres.filter(c => {
    const haystack = words(`${c.name} ${c.address}`).join(' ')
    return terms.every(t => haystack.includes(t))
  })
}

export function byDistance(centres: Centre[], from: Point): Array<{ centre: Centre; km: number }> {
  return centres.map(centre => ({ centre, km: distanceKm(from, centre) })).sort((a, b) => a.km - b.km)
}

type Listed<K extends Status['kind']> = { centre: Centre; status: Extract<Status, { kind: K }> }

export function badNews(centres: Centre[], today: IsoDate): {
  closed: Listed<'closed'>[]
  closingSoon: Listed<'closing-soon'>[]
} {
  const closed: Listed<'closed'>[] = []
  const closingSoon: Listed<'closing-soon'>[] = []
  for (const centre of centres) {
    const status = statusOn(centre, today)
    if (status.kind === 'closed') closed.push({ centre, status })
    else if (status.kind === 'closing-soon') closingSoon.push({ centre, status })
  }
  closingSoon.sort((a, b) => a.status.daysUntil - b.status.daysUntil)
  return { closed, closingSoon }
}
