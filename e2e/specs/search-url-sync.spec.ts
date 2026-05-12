import { expect, test } from '@playwright/test';

test.describe('URL behavior', () => {
  test('preserves query parameters on the login page', async ({ page }) => {
    await page.goto('/login?ref=epic2-e2e');
    await expect(page).toHaveURL(/ref=epic2-e2e/);
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
  });
});
