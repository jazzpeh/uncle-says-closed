import { expect, pinUncleLines, shot, test } from './fixtures.ts'

test.use({ now: '2026-12-01T04:00:00Z' })

test('Adam Road Food Centre is closing soon on 2026-12-01', async ({ page }) => {
  await pinUncleLines(page)
  await page.goto('/#/c/adam-road-food-centre')
  await expect(page.locator('.centre__status .chip')).toHaveText('!Closing soon')
  await expect(page.getByText('Closes Mon 7 Dec to Tue 8 Dec for cleaning.')).toBeVisible()
  await expect(page.getByRole('status')).toHaveText(
    'Adam Road Food Centre open now, but closing Mon 7 Dec for cleaning, 6 days from now. Eat first!',
  )
  await shot(page, 'closing-soon')
})
