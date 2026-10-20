import { expect, shot, test } from './fixtures.ts'

test('denied location shows an inline note and search still works', async ({ page }) => {
  page.on('dialog', dialog => {
    throw new Error(`unexpected ${dialog.type()} dialog: ${dialog.message()}`)
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Near me' }).click()
  await expect(page.getByRole('status')).toHaveText(
    'Uncle cannot see where you are. Location is off for this page, so type a centre name above.',
  )
  await page.getByLabel('Which hawker centre?').fill('  ADAM   road ')
  await expect(page.locator('#results .row__name')).toHaveText(['Adam Road Food Centre'])
  await shot(page, 'geo-denied')
})
