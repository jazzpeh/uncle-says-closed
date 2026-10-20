import { expect, pinUncleLines, shot, test } from './fixtures.ts'

test('a centre link opens directly and back returns home', async ({ page }) => {
  await pinUncleLines(page)
  await page.goto('/#/c/adam-road-food-centre')
  await expect(page.getByRole('status')).toHaveText('Adam Road Food Centre open today! Go go go, chope a seat.')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Adam Road Food Centre')
  await expect(page.getByText('2, Adam Road, Singapore 289876')).toBeVisible()
  await shot(page, 'deep-link')

  await page.goto('/')
  await page.getByRole('list', { name: 'Closed today' }).getByRole('link', { name: /Bukit Timah Market/ }).click()
  await expect(page).toHaveURL(/#\/c\/bukit-timah-market$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bukit Timah Market')
  await page.goBack()
  await expect(page.getByRole('heading', { name: "Uncle's bad news board" })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
})
