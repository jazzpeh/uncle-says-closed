import { readFileSync } from 'node:fs'
import { parseClosuresCsv } from '../scripts/parse.ts'
import type { Centre, IsoDate } from '../src/domain/types.ts'

export const FIXTURE_PATH = 'scripts/fixtures/closures-2026-10-20.csv'
export const centres: Centre[] = parseClosuresCsv(readFileSync(FIXTURE_PATH, 'utf8'))
export const iso = (s: string) => s as IsoDate

export function centreNamed(name: string): Centre {
  const c = centres.find(c => c.name === name)
  if (!c) throw new Error(`fixture has no centre ${name}`)
  return c
}
