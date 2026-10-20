import { distanceKm } from './status.ts'

export type AreaForecast = { area: string; forecast: string; lat: number; lng: number }
export type Forecast = { areas: AreaForecast[]; validText: string }

type RawForecast = {
  data?: {
    area_metadata?: Array<{ name?: unknown; label_location?: { latitude?: unknown; longitude?: unknown } }>
    items?: Array<{ forecasts?: Array<{ area?: unknown; forecast?: unknown }>; valid_period?: { text?: unknown } }>
  }
}

export function parseForecast(json: unknown): Forecast | undefined {
  const data = (json as RawForecast | null)?.data
  const item = data?.items?.[0]
  const validText = item?.valid_period?.text
  if (!Array.isArray(data?.area_metadata) || !Array.isArray(item?.forecasts) || typeof validText !== 'string') {
    return undefined
  }
  const forecastOf = new Map<unknown, unknown>(item.forecasts.map(f => [f.area, f.forecast]))
  const areas: AreaForecast[] = []
  for (const meta of data.area_metadata) {
    const forecast = forecastOf.get(meta.name)
    const lat = meta.label_location?.latitude
    const lng = meta.label_location?.longitude
    if (typeof meta.name !== 'string' || typeof forecast !== 'string') continue
    if (typeof lat !== 'number' || typeof lng !== 'number') continue
    areas.push({ area: meta.name, forecast, lat, lng })
  }
  return areas.length > 0 ? { areas, validText } : undefined
}

export function nearestArea(forecast: Forecast, from: { lat: number; lng: number }): AreaForecast {
  return forecast.areas.reduce((best, a) => (distanceKm(from, a) < distanceKm(from, best) ? a : best))
}

type Sky = 'wet' | 'sunny' | 'neutral'

const SKY_BY_WORD: Array<[RegExp, Sky]> = [
  [/rain|shower|thunder/i, 'wet'],
  [/fair|sunny|warm|hot/i, 'sunny'],
]

const SKY_LINE: Record<Sky, string> = {
  wet: 'Bring umbrella, and sit in the middle, away from the edge.',
  sunny: 'Hot hot day. Drink sugarcane, add lemon.',
  neutral: 'Weather okay lah, just go.',
}

export function weatherLine(a: AreaForecast, validText: string): string {
  const sky = SKY_BY_WORD.find(([word]) => word.test(a.forecast))?.[1] ?? 'neutral'
  return `${a.forecast} over ${a.area}, ${validText}. ${SKY_LINE[sky]}`
}
