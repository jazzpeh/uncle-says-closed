import '@fontsource/bungee/latin-400.css'
import './style.css'
import { byDistance, searchCentres } from './domain/find.ts'
import { nearestOpen } from './domain/status.ts'
import { todayInSingapore } from './domain/today.ts'
import type { Centre, Snapshot } from './domain/types.ts'
import { nearestArea, parseForecast, weatherLine } from './domain/weather.ts'
import { board, centreHref, centreList, centreView, footer, noMatches, uncleBubble } from './ui/view.ts'

const NEAR_ME_COUNT = 10
const SEARCH_LIMIT = 30
const FORECAST_URL = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast'
const FORECAST_TIMEOUT_MS = 3000

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const el = {
  loading: $('loading'),
  error: $('error'),
  home: $('home'),
  centre: $('centre'),
  footer: $('footer'),
  finder: $<HTMLFormElement>('finder'),
  q: $<HTMLInputElement>('q'),
  nearMe: $<HTMLButtonElement>('near-me'),
  geoNote: $('geo-note'),
  count: $('result-count'),
  results: $('results'),
  board: $('board'),
}

function showList(items: Array<{ centre: Centre; note?: string }>, countText: string) {
  el.results.innerHTML = centreList(items, todayInSingapore())
  el.count.textContent = countText
}

function wireHome(centres: Centre[]) {
  el.finder.addEventListener('submit', e => e.preventDefault())

  el.q.addEventListener('input', () => {
    const query = el.q.value
    if (!query.trim()) return showList([], '')
    const found = searchCentres(centres, query)
    if (found.length === 0) {
      el.results.innerHTML = noMatches(query)
      el.count.textContent = 'No centres match.'
      return
    }
    showList(found.slice(0, SEARCH_LIMIT).map(centre => ({ centre })), `${found.length} ${found.length === 1 ? 'centre matches' : 'centres match'}.`)
  })

  el.nearMe.addEventListener('click', () => {
    const geoFailed = (message: string) => {
      el.nearMe.disabled = false
      el.geoNote.textContent = message
    }
    if (!('geolocation' in navigator)) return geoFailed('This browser cannot share location. Type a centre name instead.')
    el.nearMe.disabled = true
    el.geoNote.textContent = 'Uncle looking around…'
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        el.nearMe.disabled = false
        el.geoNote.textContent = 'Nearest centres to you, closest first.'
        el.q.value = ''
        const near = byDistance(centres, { lat: coords.latitude, lng: coords.longitude }).slice(0, NEAR_ME_COUNT)
        showList(near.map(({ centre, km }) => ({ centre, note: `${km.toFixed(1)} km` })), `${near.length} centres near you.`)
      },
      () => geoFailed('Uncle cannot see where you are. Location is off for this page, so type a centre name above.'),
      { timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

async function showWeather(centre: Centre) {
  const forecast = await fetch(FORECAST_URL, { signal: AbortSignal.timeout(FORECAST_TIMEOUT_MS) })
    .then(res => (res.ok ? res.json() : undefined))
    .then(parseForecast)
    .catch(() => undefined)
  const slot = document.getElementById('weather')
  if (!forecast || !slot || location.hash !== centreHref(centre)) return
  slot.textContent = weatherLine(nearestArea(forecast, centre), forecast.validText)
  slot.hidden = false
}

function route(centres: Centre[]) {
  const today = todayInSingapore()
  const id = decodeURIComponent(location.hash.match(/^#\/c\/(.+)$/)?.[1] ?? '')
  if (!id) {
    el.centre.hidden = true
    el.home.hidden = false
    el.board.innerHTML = board(centres, today)
    return
  }

  const centre = centres.find(c => c.id === id)
  el.home.hidden = true
  el.centre.hidden = false
  el.centre.innerHTML = centre
    ? centreView(centre, today, nearestOpen(centres, centre, today, centre.id))
    : `<a class="back" href="#/">Back to all centres</a>
       <h1 class="centre__name" tabindex="-1">Centre not found</h1>
       ${uncleBubble('Uncle never heard of this one. Go back and search again.')}`
  window.scrollTo(0, 0)
  el.centre.querySelector<HTMLElement>('h1')?.focus()
  if (centre) void showWeather(centre)
}

async function loadSnapshot(): Promise<Snapshot> {
  const res = await fetch('./data/centres.json')
  if (!res.ok) throw new Error(`centres.json: HTTP ${res.status}`)
  return (await res.json()) as Snapshot
}

try {
  const snapshot = await loadSnapshot()
  el.footer.innerHTML = footer(snapshot)
  wireHome(snapshot.centres)
  window.addEventListener('hashchange', () => route(snapshot.centres))
  route(snapshot.centres)
} catch (err) {
  console.error(err)
  el.error.hidden = false
  el.error.innerHTML = uncleBubble(
    'Aiyoh, uncle cannot load the closure list right now. Check your connection and refresh the page.',
    'role="alert"',
  )
} finally {
  el.loading.remove()
}
