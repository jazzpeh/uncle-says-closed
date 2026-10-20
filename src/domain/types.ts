export type IsoDate = string & { readonly __brand: 'IsoDate' }
export type Quarter = 1 | 2 | 3 | 4

export type Closure =
  | { kind: 'cleaning'; quarter: Quarter; start: IsoDate; end: IsoDate; remarks?: string }
  | { kind: 'works'; start: IsoDate; end: IsoDate; remarks?: string }
  | { kind: 'tbc'; quarter: Quarter }

export type Centre = {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  foodStalls: number
  marketStalls: number
  description: string
  photoUrl?: string
  closures: Closure[]
}

export type Status =
  | { kind: 'closed'; closure: Closure; reopensOn: IsoDate }
  | { kind: 'closing-soon'; closure: Closure; daysUntil: number }
  | { kind: 'unknown'; quarter: Quarter }
  | { kind: 'open'; next?: Closure }

export type Snapshot = { fetchedAt: string; centres: Centre[] }
