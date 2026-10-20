import { expect, pinUncleLines, shot, test } from './fixtures.ts'

test.use({ viewport: { width: 375, height: 812 } })

test('Bukit Timah view fits 375px with no horizontal scroll', async ({ page }) => {
  await pinUncleLines(page)
  await page.goto('/#/c/bukit-timah-market')
  await expect(page.getByRole('status')).toHaveText(
    'Aiyoh, Bukit Timah Market closed for works lah. Open back Tue 1 Jan 2030.',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await shot(page, 'mobile')
})
