import { expect, test } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from './global-setup';

test.beforeEach(async () => {
  await enableE2ETestMode();
  await clearDatabase();
  await resetUuidCounter();
});

test('registers a user and reaches the game lobby', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL(/\/id=[a-f0-9-]+/);
  await page.locator('#alias').fill('smoke-user');
  await page.locator('#password').fill('TestPassword123!');
  await page.locator('#passwordConfirm').fill('TestPassword123!');
  await page.locator('form button[type="submit"]').first().click();

  await expect(page.locator('.authenticated')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole('heading', { name: 'Game Lobby' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});
