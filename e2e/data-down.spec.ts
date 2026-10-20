import { expect, shot, test } from './fixtures.ts'

test('a failed data fetch shows the uncle error inline', async ({ page }) => {
  await page.route('**/data/centres.json', route => route.fulfill({ status: 500, body: 'boom' }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toHaveText(
    'Aiyoh, uncle cannot load the closure list right now. Check your connection and refresh the page.',
  )
  await expect(page.getByLabel('Which hawker centre?')).toBeHidden()
  await shot(page, 'data-down')
})
