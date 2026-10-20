import { readFileSync } from 'node:fs'
import { expect, FORECAST_URL, pinUncleLines, shot, test } from './fixtures.ts'

const BUKIT_TIMAH_VERDICT = 'Aiyoh, Bukit Timah Market closed for works lah. Open back Tue 1 Jan 2030.'

test('weather-rain: thundery showers over the nearest area brings out the umbrella line', async ({ page }) => {
  const forecast = JSON.parse(readFileSync('e2e/fixtures/two-hr-forecast.json', 'utf8'))
  const item = forecast.data.items[0]
  item.valid_period.text = '12 to 2 pm'
  for (const f of item.forecasts) f.forecast = f.area === 'Bukit Timah' ? 'Thundery Showers' : 'Fair (Day)'
  await page.route(FORECAST_URL, route => route.fulfill({ json: forecast }))
  await pinUncleLines(page)

  await page.goto('/#/c/bukit-timah-market')
  await expect(page.getByRole('status')).toHaveText(BUKIT_TIMAH_VERDICT)
  await expect(page.locator('#weather')).toHaveText(
    'Thundery Showers over Bukit Timah, 12 to 2 pm. Bring umbrella, and sit in the middle, away from the edge.',
  )
  await shot(page, 'weather-rain')
})

test('weather-down: a failed forecast leaves the verdict and no weather line', async ({ page }) => {
  await page.route(FORECAST_URL, route => route.abort())
  await pinUncleLines(page)

  const forecastFailed = page.waitForEvent('requestfailed', r => r.url() === FORECAST_URL)
  await page.goto('/#/c/bukit-timah-market')
  await forecastFailed
  await expect(page.getByRole('status')).toHaveText(BUKIT_TIMAH_VERDICT)
  await expect(page.locator('#weather')).toBeHidden()
  await expect(page.getByText(/umbrella|sugarcane|Weather okay/)).toHaveCount(0)
  await shot(page, 'weather-down')
})
