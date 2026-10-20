import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseClosuresCsv } from '../scripts/parse.ts'
import { centreNamed, centres, FIXTURE_PATH } from './fixture.ts'

const countKind = (kind: string) => centres.flatMap(c => c.closures).filter(c => c.kind === kind).length

describe('parseClosuresCsv on the fixture', () => {
  it('yields 123 centres with 466 cleaning, 47 works and 26 tbc closures', () => {
    expect(centres).toHaveLength(123)
    expect([countKind('cleaning'), countKind('works'), countKind('tbc')]).toEqual([466, 47, 26])
  })

  it('parses Adam Road Q4 cleaning from D/M/YYYY to ISO', () => {
    const adam = centreNamed('Adam Road Food Centre')
    expect(adam.id).toBe('adam-road-food-centre')
    expect(adam.closures).toContainEqual({ kind: 'cleaning', quarter: 4, start: '2026-12-07', end: '2026-12-08' })
  })

  it('keeps commas and quotes inside quoted fields', () => {
    expect(centreNamed('Adam Road Food Centre').address).toBe('2, Adam Road, Singapore 289876')
  })

  it('maps TBC quarters to tbc closures', () => {
    const teckGhee = centreNamed('Ang Mo Kio Ave 10 Blk 409 (Teck Ghee Square)')
    expect(teckGhee.closures.filter(c => c.kind === 'tbc')).toEqual([
      { kind: 'tbc', quarter: 2 },
      { kind: 'tbc', quarter: 3 },
    ])
  })
})

describe('parseClosuresCsv errors', () => {
  const csv = readFileSync(FIXTURE_PATH, 'utf8')

  it('names the centre and column for a malformed date', () => {
    const bad = csv.replace('7/12/2026,8/12/2026', '7/12/2026,32/12/2026')
    expect(() => parseClosuresCsv(bad)).toThrow(
      'Adam Road Food Centre: cannot parse column q4_cleaningenddate from "32/12/2026"',
    )
  })

  it('names the centre and column for a malformed coordinate', () => {
    const bad = csv.replace('1.324131966', 'north')
    expect(() => parseClosuresCsv(bad)).toThrow('Adam Road Food Centre: cannot parse column latitude_hc')
  })

  it('throws on a duplicate id', () => {
    const lines = csv.trimEnd().split('\n')
    const header = lines[0]
    const adam = lines.find(l => l.includes('Adam Road Food Centre'))
    expect(() => parseClosuresCsv([header, adam, adam].join('\n'))).toThrow('duplicate centre id "adam-road-food-centre"')
  })
})
