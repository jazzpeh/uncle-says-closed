import { test as base, type Page } from '@playwright/test'

export { expect } from '@playwright/test'

export const NOON_SGT_2026_10_20 = '2026-10-20T04:00:00Z'
export const FORECAST_URL = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast'

export const test = base.extend<{ now: string }>({
  now: [NOON_SGT_2026_10_20, { option: true }],
  page: async ({ page, now }, use) => {
    await page.route(url => url.hostname !== 'localhost', route => route.abort())
    await page.clock.setFixedTime(new Date(now))
    await use(page)
  },
})

export const shot = (page: Page, name: string) => page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true, animations: 'disabled' })

export async function pinUncleLines(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
}
