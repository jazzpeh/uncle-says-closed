import { describe, expect, it } from 'vitest'
import { badNews, byDistance, searchCentres } from '../src/domain/find.ts'
import { centres, iso } from './fixture.ts'

describe('searchCentres', () => {
  it('ignores case and extra spaces', () => {
    expect(searchCentres(centres, '  BUKIT   timah ').map(c => c.name)).toEqual(['Bukit Timah Market'])
  })

  it('matches the address as well as the name', () => {
    expect(searchCentres(centres, '289876').map(c => c.name)).toEqual(['Adam Road Food Centre'])
  })

  it('needs every word to match, and an empty query matches nothing', () => {
    expect(searchCentres(centres, 'adam road').map(c => c.name)).toEqual(['Adam Road Food Centre'])
    expect(searchCentres(centres, 'adam rd')).toEqual([])
    expect(searchCentres(centres, '   ')).toEqual([])
  })
})

describe('byDistance', () => {
  it('sorts nearest first from Adam Road', () => {
    const near = byDistance(centres, { lat: 1.324131966, lng: 103.8141632 }).slice(0, 2)
    expect(near.map(n => n.centre.name)).toEqual([
      'Adam Road Food Centre',
      'Empress Road Blk 7 (Empress Road Market and Food Centre)',
    ])
    expect(near[1]?.km).toBeCloseTo(1.28, 2)
  })
})

describe('badNews', () => {
  it('lists the 3 closed centres and the closing-soon ones on 2026-10-20', () => {
    const board = badNews(centres, iso('2026-10-20'))
    expect(board.closed.map(b => b.centre.name)).toEqual([
      'Bukit Timah Market',
      'Clementi West Street 2 Blk 726',
      'Toa Payoh Lorong 7 Blk 22 (Kim Keat Palm Market and Food Centre)',
    ])
    expect(board.closingSoon.map(b => [b.centre.name, b.status.daysUntil])).toEqual([
      ['Golden Mile Food Centre', 6],
      ['Redhill Lane Blk 79 (Redhill Market)', 6],
      ['Redhill Lane Blk 85 (Redhill Food Centre)', 6],
    ])
  })

  it('puts the soonest closure first', () => {
    const first = badNews(centres, iso('2026-12-01')).closingSoon[0]
    expect([first?.centre.name, first?.status.daysUntil]).toEqual(['Zion Riverside Food Centre', 1])
  })
})
