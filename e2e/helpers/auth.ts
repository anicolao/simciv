import { expect, Page } from '@playwright/test';

/**
 * Register and login a new user through the UI
 * This follows the actual user flow and properly sets up authentication
 */
export async function registerAndLogin(page: Page, alias: string, password: string): Promise<void> {
  // Navigate to page
  await page.goto('/');
  
  // Wait for redirect to session GUID URL
  await page.waitForURL(/\/id=[a-f0-9-]+/);

  // Fill registration form
  await page.fill('input[id="alias"]', alias);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="passwordConfirm"]', password);
  
  // Submit registration
  await page.locator('form button[type="submit"]').first().click();

  // Wait for registration to complete (key generation takes time)
  await expect(page.locator('.message.success')).toContainText('Registration successful', {
    timeout: 30000
  });

  // Should be authenticated now
  await expect(page.locator('.authenticated')).toBeVisible();
}

/**
 * Login an existing user through the UI
 */
export async function login(page: Page, alias: string, password: string): Promise<void> {
  // Navigate to page
  await page.goto('/');
  
  // Wait for redirect to session GUID URL
  await page.waitForURL(/\/id=[a-f0-9-]+/);

  // Switch to Login tab
  await page.locator('.tabs button').filter({ hasText: 'Login' }).click();

  // Fill login form
  await page.fill('input[id="loginAlias"]', alias);
  await page.fill('input[id="loginPassword"]', password);
  
  // Submit login
  await page.locator('form button[type="submit"]').last().click();

  // Wait for login to complete
  await expect(page.locator('.authenticated')).toBeVisible({ timeout: 30000 });
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Logout' }).click();
  
  // Should be redirected to root and get new session
  await page.waitForURL(/\/id=[a-f0-9-]+/);
  
  // Should see login/register tabs again
  await expect(page.locator('.tabs')).toBeVisible();
}

/**
 * Switch to a different user by clearing cookies and logging in
 */
export async function switchUser(page: Page, alias: string, password: string): Promise<void> {
  await page.context().clearCookies();
  await registerAndLogin(page, alias, password);
}
