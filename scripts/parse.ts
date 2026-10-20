import { parse } from 'csv-parse/sync'
import type { Centre, Closure, IsoDate, Quarter } from '../src/domain/types.ts'

type Row = Record<string, string>

const QUARTERS: Quarter[] = [1, 2, 3, 4]

function fail(centre: string, column: string, value: string): never {
  throw new Error(`${centre}: cannot parse column ${column} from ${JSON.stringify(value)}`)
}

function parseDate(centre: string, column: string, raw: string): IsoDate {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim())
  if (!m) return fail(centre, column, raw)
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const probe = new Date(Date.UTC(y, mo - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    return fail(centre, column, raw)
  }
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` as IsoDate
}

function parseNumber(centre: string, column: string, raw: string): number {
  const n = Number(raw)
  if (raw.trim() === '' || !Number.isFinite(n)) return fail(centre, column, raw)
  return n
}

function parseRemarks(raw: string): { remarks?: string } {
  const v = raw.trim()
  return v === '' || v.toLowerCase() === 'nil' ? {} : { remarks: raw }
}

function isBlank(v: string): boolean {
  return v.trim() === '' || v.trim() === 'NA'
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function cleaningClosure(name: string, row: Row, quarter: Quarter): Closure {
  const startCol = `q${quarter}_cleaningstartdate`
  const endCol = `q${quarter}_cleaningenddate`
  const start = row[startCol] ?? ''
  const end = row[endCol] ?? ''
  if (start.trim() === 'TBC' && end.trim() === 'TBC') return { kind: 'tbc', quarter }
  return {
    kind: 'cleaning',
    quarter,
    start: parseDate(name, startCol, start),
    end: parseDate(name, endCol, end),
    ...parseRemarks(row[`remarks_q${quarter}`] ?? ''),
  }
}

function worksClosure(name: string, row: Row): Closure | undefined {
  const start = row.other_works_startdate ?? ''
  const end = row.other_works_enddate ?? ''
  if (isBlank(start) && isBlank(end)) return undefined
  return {
    kind: 'works',
    start: parseDate(name, 'other_works_startdate', start),
    end: parseDate(name, 'other_works_enddate', end),
    ...parseRemarks(row.remarks_other_works ?? ''),
  }
}

function parseRow(row: Row): Centre {
  const name = (row.name ?? '').trim()
  if (name === '') throw new Error(`row ${row.serial_no ?? '?'}: empty name`)
  const photo = (row.photourl ?? '').trim()
  const works = worksClosure(name, row)
  return {
    id: slug(name),
    name,
    address: (row.address_myenv ?? '').trim(),
    lat: parseNumber(name, 'latitude_hc', row.latitude_hc ?? ''),
    lng: parseNumber(name, 'longitude_hc', row.longitude_hc ?? ''),
    foodStalls: parseNumber(name, 'no_of_food_stalls', row.no_of_food_stalls ?? ''),
    marketStalls: parseNumber(name, 'no_of_market_stalls', row.no_of_market_stalls ?? ''),
    description: (row.description_myenv ?? '').trim(),
    ...(photo === '' || photo.toLowerCase() === 'nil' || photo === 'NA' ? {} : { photoUrl: photo }),
    closures: [...QUARTERS.map(q => cleaningClosure(name, row, q)), ...(works ? [works] : [])],
  }
}

export function parseClosuresCsv(text: string): Centre[] {
  const rows: Row[] = parse(text, { columns: true, skip_empty_lines: true, bom: true })
  const centres = rows.map(parseRow)
  const seen = new Set<string>()
  for (const c of centres) {
    if (seen.has(c.id)) throw new Error(`${c.name}: duplicate centre id ${JSON.stringify(c.id)}`)
    seen.add(c.id)
  }
  return centres
}
