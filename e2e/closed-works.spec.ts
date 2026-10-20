import { expect, pinUncleLines, shot, test } from './fixtures.ts'

test('Bukit Timah Market is closed for works with an open alternative', async ({ page }) => {
  await pinUncleLines(page)
  await page.goto('/')
  await page.getByLabel('Which hawker centre?').fill('bukit timah')
  await page.getByRole('list', { name: 'Centres found' }).getByRole('link', { name: /Bukit Timah Market/ }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bukit Timah Market')
  await expect(page.getByRole('status')).toHaveText(
    'Aiyoh, Bukit Timah Market closed for works lah. Open back Tue 1 Jan 2030.',
  )
  await expect(page.getByText('Reopens Tue 1 Jan 2030.')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'NEA remarks' })).toContainText(
    'Closed for redevelopment till 2029 (tentative)',
  )
  const instead = page.getByRole('region', { name: 'Go here instead' })
  await expect(instead.getByRole('link')).toHaveText('Clementi Ave 2 Blk 353 (Clementi Ave 2 Market/Cooked Food Centre)')
  await expect(instead).toContainText('2.9 km away')
  await expect(instead).toContainText('Open')
  await shot(page, 'closed-works')
})
