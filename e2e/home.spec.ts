import { expect, shot, test } from './fixtures.ts'

test('home lists the 3 centres closed on 2026-10-20', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: "Uncle's bad news board" })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Closed today' }).locator('.row__name')).toHaveText([
    'Bukit Timah Market',
    'Clementi West Street 2 Blk 726',
    'Toa Payoh Lorong 7 Blk 22 (Kim Keat Palm Market and Food Centre)',
  ])
  await expect(page.getByRole('list', { name: 'Closing in the next 7 days' }).locator('.row__name')).toHaveText([
    'Golden Mile Food Centre',
    'Redhill Lane Blk 79 (Redhill Market)',
    'Redhill Lane Blk 85 (Redhill Food Centre)',
  ])
  await expect(page.getByRole('link', { name: /Bukit Timah Market/ }).locator('.row__km')).toHaveText('reopens Tue 1 Jan 2030')
  await expect(page.getByRole('link', { name: /Golden Mile Food Centre/ }).locator('.row__km')).toHaveText('closes Mon 26 Oct')
  await expect(page.locator('footer')).toContainText('Data as of')
  await expect(page.locator('footer')).toContainText(
    'from data.gov.sg, which is made available under the terms of the Singapore Open Data Licence version 1.0.',
  )
  await expect(page.getByRole('link', { name: 'Singapore Open Data Licence version 1.0' })).toHaveAttribute(
    'href',
    'https://data.gov.sg/open-data-licence',
  )
  await shot(page, 'home')
})
