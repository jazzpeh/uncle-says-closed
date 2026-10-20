import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { nearestArea, parseForecast, weatherLine } from '../src/domain/weather.ts'
import { centreNamed } from './fixture.ts'

const raw = JSON.parse(readFileSync('e2e/fixtures/two-hr-forecast.json', 'utf8')) as unknown

describe('parseForecast', () => {
  it('reads the 47 areas and the valid period from a real response', () => {
    const f = parseForecast(raw)
    expect(f?.areas).toHaveLength(47)
    expect(f?.areas[0]).toEqual({ area: 'Ang Mo Kio', forecast: 'Cloudy', lat: 1.375, lng: 103.839 })
    expect(f?.validText).toBe('11.30 pm to 1.30 am')
  })

  it('rejects a response with the wrong shape', () => {
    expect(parseForecast({ code: 0, data: { items: [] } })).toBeUndefined()
    expect(parseForecast(null)).toBeUndefined()
    expect(parseForecast({ code: 0, data: { area_metadata: [], items: [{ forecasts: [], valid_period: { text: 'x' } }] } })).toBeUndefined()
  })
})

describe('nearestArea', () => {
  const f = parseForecast(raw)!

  it('picks the closest label location to a centre', () => {
    expect(nearestArea(f, centreNamed('Bukit Timah Market')).area).toBe('Bukit Timah')
    expect(nearestArea(f, centreNamed('Adam Road Food Centre')).area).toBe('Novena')
  })
})

describe('weatherLine', () => {
  const at = (forecast: string) => weatherLine({ area: 'Bukit Timah', forecast, lat: 0, lng: 0 }, '12 to 2 pm')

  it('tells you to bring an umbrella for rain', () => {
    expect(at('Thundery Showers')).toBe(
      'Thundery Showers over Bukit Timah, 12 to 2 pm. Bring umbrella, and sit in the middle, away from the edge.',
    )
    expect(at('Light Rain')).toContain('Bring umbrella')
  })

  it('suggests sugarcane when it is fair', () => {
    expect(at('Fair (Day)')).toBe('Fair (Day) over Bukit Timah, 12 to 2 pm. Hot hot day. Drink sugarcane, add lemon.')
  })

  it('says something neutral for cloud, haze and anything unknown', () => {
    expect(at('Cloudy')).toBe('Cloudy over Bukit Timah, 12 to 2 pm. Weather okay lah, just go.')
    expect(at('Hazy')).toBe('Hazy over Bukit Timah, 12 to 2 pm. Weather okay lah, just go.')
  })
})
