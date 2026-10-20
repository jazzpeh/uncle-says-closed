import { expect, shot, test } from './fixtures.ts'

test.use({ geolocation: { latitude: 1.324131966, longitude: 103.8141632 }, permissions: ['geolocation'] })

test('Near me puts Adam Road Food Centre first', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Near me' }).click()
  const rows = page.locator('#results .row')
  await expect(rows.first().locator('.row__name')).toHaveText('Adam Road Food Centre')
  await expect(rows.first().locator('.row__km')).toHaveText('0.0 km')
  await expect(rows.nth(1).locator('.row__name')).toHaveText('Empress Road Blk 7 (Empress Road Market and Food Centre)')
  await expect(rows).toHaveCount(10)
  await shot(page, 'near-me')
})
