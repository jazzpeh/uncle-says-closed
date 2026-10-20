import { describe, expect, it } from 'vitest'
import { nearestOpen, statusOn } from '../src/domain/status.ts'
import { addDays, diffDays, formatHuman, todayInSingapore } from '../src/domain/today.ts'
import { uncleSays } from '../src/domain/uncle.ts'
import { centreNamed, centres, iso } from './fixture.ts'

describe('todayInSingapore', () => {
  it('rolls over at 16:00 UTC', () => {
    expect(todayInSingapore(new Date('2026-10-20T23:30:00Z'))).toBe('2026-10-21')
    expect(todayInSingapore(new Date('2026-10-20T15:59:00Z'))).toBe('2026-10-20')
  })
})

describe('date helpers', () => {
  it('adds and diffs days across month and year ends', () => {
    expect(addDays(iso('2026-12-31'), 1)).toBe('2027-01-01')
    expect(diffDays(iso('2026-12-07'), iso('2026-12-01'))).toBe(6)
    expect(formatHuman(iso('2026-12-08'))).toBe('Tue 8 Dec')
    expect(formatHuman(iso('2030-01-01'), true)).toBe('Tue 1 Jan 2030')
  })
})

describe('statusOn', () => {
  const adam = centreNamed('Adam Road Food Centre')

  it('is closed for Bukit Timah Market on 2026-10-20 (redevelopment till 2029)', () => {
    const s = statusOn(centreNamed('Bukit Timah Market'), iso('2026-10-20'))
    expect(s.kind).toBe('closed')
    expect(s).toMatchObject({ reopensOn: '2030-01-01' })
  })

  it('is closing-soon 6 days before Adam Road Q4 cleaning', () => {
    const s = statusOn(adam, iso('2026-12-01'))
    expect(s).toMatchObject({ kind: 'closing-soon', daysUntil: 6 })
  })

  it('treats the last day as closed, then open the day after', () => {
    expect(statusOn(adam, iso('2026-12-08'))).toMatchObject({ kind: 'closed', reopensOn: '2026-12-09' })
    expect(statusOn(adam, iso('2026-12-09'))).toEqual({ kind: 'open' })
  })

  it('is open with the next closure when one is more than 7 days away', () => {
    expect(statusOn(adam, iso('2026-11-01'))).toMatchObject({ kind: 'open', next: { kind: 'cleaning', quarter: 4, start: '2026-12-07' } })
  })

  it('has exactly 3 closed centres on 2026-10-20', () => {
    const closed = centres.filter(c => statusOn(c, iso('2026-10-20')).kind === 'closed').map(c => c.name)
    expect(closed).toEqual([
      'Bukit Timah Market',
      'Clementi West Street 2 Blk 726',
      'Toa Payoh Lorong 7 Blk 22 (Kim Keat Palm Market and Food Centre)',
    ])
  })

  it('chains a closure that starts the day another ends', () => {
    const c = {
      ...adam,
      closures: [
        { kind: 'cleaning' as const, quarter: 1 as const, start: iso('2026-02-02'), end: iso('2026-02-03') },
        { kind: 'works' as const, start: iso('2026-02-04'), end: iso('2026-02-10') },
      ],
    }
    expect(statusOn(c, iso('2026-02-02'))).toMatchObject({ kind: 'closed', reopensOn: '2026-02-11' })
  })

  it('is unknown in a TBC quarter with no dated cleaning', () => {
    const teckGhee = centreNamed('Ang Mo Kio Ave 10 Blk 409 (Teck Ghee Square)')
    expect(teckGhee.closures).toContainEqual({ kind: 'tbc', quarter: 2 })
    expect(statusOn(teckGhee, iso('2026-05-15'))).toEqual({ kind: 'unknown', quarter: 2 })
  })

  it('does not call a TBC quarter unknown in a later year', () => {
    const teckGhee = centreNamed('Ang Mo Kio Ave 10 Blk 409 (Teck Ghee Square)')
    expect(statusOn(teckGhee, iso('2027-05-15'))).toEqual({ kind: 'open' })
  })
})

describe('nearestOpen', () => {
  const today = iso('2026-10-20')
  const bukitTimah = centreNamed('Bukit Timah Market')

  it('skips closed centres and the excluded one', () => {
    const found = nearestOpen(centres, bukitTimah, today, bukitTimah.id)
    expect(found?.centre.name).toBe('Clementi Ave 2 Blk 353 (Clementi Ave 2 Market/Cooked Food Centre)')
    expect(found?.km).toBeCloseTo(2.87, 2)
    expect(statusOn(found!.centre, today).kind).not.toBe('closed')
  })

  it('returns undefined when nothing is eligible', () => {
    expect(nearestOpen([], bukitTimah, today)).toBeUndefined()
  })
})

describe('uncleSays', () => {
  const speak = (name: string, date: string, i = 0) => {
    const c = centreNamed(name)
    return uncleSays(statusOn(c, iso(date)), c, () => i)
  }

  it('speaks a works line for Bukit Timah Market redevelopment', () => {
    const line = speak('Bukit Timah Market', '2026-10-20')
    expect(line).toBe('Aiyoh, Bukit Timah Market closed for works lah. Open back Tue 1 Jan 2030.')
    expect(line).not.toMatch(/clean|wash/i)
  })

  it('speaks a cleaning line for Adam Road Food Centre', () => {
    expect(speak('Adam Road Food Centre', '2026-12-08')).toBe(
      'Aiyoh, Adam Road Food Centre closed for cleaning lah. Open back Wed 9 Dec.',
    )
  })

  it('never mentions cleaning in any works line', () => {
    let checked = 0
    for (const c of centres) {
      for (const date of ['2026-10-20', '2026-12-08']) {
        const s = statusOn(c, iso(date))
        if ((s.kind !== 'closed' && s.kind !== 'closing-soon') || s.closure.kind !== 'works') continue
        for (const i of [0, 1, 2]) {
          expect(uncleSays(s, c, () => i)).not.toMatch(/clean|wash/i)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})
