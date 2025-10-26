import { test, expect } from '@playwright/test';
import { clearDatabase } from './global-setup';
import { screenshotIfChanged } from './helpers/screenshot';
import { mockDateInBrowser } from './helpers/mock-time';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async ({ page }) => {
  await clearDatabase();
  // Mock the Date object to ensure stable timestamps in screenshots
  await mockDateInBrowser(page);
});

test.describe('SimCiv Authentication', () => {
  test('user can register an account and login', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for redirect to session GUID URL
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    // Should see the authentication form
    await expect(page.locator('h1')).toContainText('SimCiv Authentication');
    
    // Take screenshot of initial state
    await screenshotIfChanged(page, { path: 'e2e-screenshots/01-initial-load.png', fullPage: true });
    
    // Ensure we're on the Register tab (should be default)
    await expect(page.locator('.tabs button.active')).toContainText('Register');
    
    const alias = 'testuser';
    const password = 'TestPassword123!';
    
    // Fill in registration form
    await page.fill('input[id="alias"]', alias);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="passwordConfirm"]', password);
    
    // Take screenshot of filled registration form
    await screenshotIfChanged(page, { path: 'e2e-screenshots/02-registration-form-filled.png', fullPage: true });
    
    // Submit registration using the form's submit button
    await page.locator('form button[type="submit"]').first().click();
    
    // Wait for registration to complete (key generation takes time)
    await expect(page.locator('.message.success')).toContainText('Registration successful', {
      timeout: 30000
    });
    
    // Should be authenticated now
    await expect(page.locator('.authenticated')).toBeVisible();
    await expect(page.locator('.user-info h2')).toContainText(alias);
    
    // Take screenshot of authenticated state
    await screenshotIfChanged(page, { path: 'e2e-screenshots/03-authenticated.png', fullPage: true });
    
    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    
    // Should be redirected to root and get new session
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    // Should see login/register tabs again
    await expect(page.locator('.tabs')).toBeVisible();
    await expect(page.locator('.tabs button').first()).toContainText('Register');
    
    // Take screenshot of logout state
    await screenshotIfChanged(page, { path: 'e2e-screenshots/04-after-logout.png', fullPage: true });
  });

  test('another user cannot login to an existing account without credentials', async ({ page, browser }) => {
    // Create first user
    await page.goto('/');
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    const alias1 = 'user1';
    const password1 = 'Password123!';
    
    // Register using form submit button
    await page.fill('input[id="alias"]', alias1);
    await page.fill('input[id="password"]', password1);
    await page.fill('input[id="passwordConfirm"]', password1);
    await page.locator('form button[type="submit"]').first().click();
    
    await expect(page.locator('.message.success')).toContainText('Registration successful', {
      timeout: 30000
    });
    await expect(page.locator('.authenticated')).toBeVisible();
    
    // Get the session GUID
    const url1 = page.url();
    
    // Create a NEW browser context (completely separate session)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    // Mock date in the new page to ensure stable timestamps
    await mockDateInBrowser(page2);
    await page2.goto('/');
    await page2.waitForURL(/\/id=[a-f0-9-]+/);
    
    const url2 = page2.url();
    
    // Verify they have different session GUIDs
    expect(url1).not.toBe(url2);
    
    // Switch to Login tab
    await page2.locator('.tabs button').filter({ hasText: 'Login' }).click();
    
    // Fill login form
    await page2.fill('input[id="loginAlias"]', alias1);
    await page2.fill('input[id="loginPassword"]', 'WrongPassword');
    
    // Take screenshot before attempting login
    await screenshotIfChanged(page2, { path: 'e2e-screenshots/05-login-attempt-different-session.png', fullPage: true });
    
    // Submit login using form submit button
    await page2.locator('form button[type="submit"]').first().click();
    
    // Should see error about no private key found
    await expect(page2.locator('.message.error')).toContainText('No account found! Register instead.', {
      timeout: 10000
    });
    
    // Take screenshot of error message
    await screenshotIfChanged(page2, { path: 'e2e-screenshots/06-login-error-no-key.png', fullPage: true });
    
    // Should not be authenticated
    await expect(page2.locator('.authenticated')).not.toBeVisible();
    
    // Clean up
    await context2.close();
  });

  test('user can register, logout, and login again', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    const alias = 'logintest';
    const password = 'SecurePass123!';
    
    // Register the user
    await page.fill('input[id="alias"]', alias);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="passwordConfirm"]', password);
    await page.locator('form button[type="submit"]').first().click();
    
    // Wait for registration to complete
    await expect(page.locator('.message.success')).toContainText('Registration successful', {
      timeout: 30000
    });
    
    // Verify authenticated
    await expect(page.locator('.authenticated')).toBeVisible();
    await expect(page.locator('.user-info h2')).toContainText(alias);
    
    // Logout - this will redirect to a NEW session
    await page.getByRole('button', { name: 'Logout' }).click();
    
    // Wait for redirect to new session
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    await expect(page.locator('.tabs')).toBeVisible();
    
    // In this new session, we don't have the private key, so we need to go back
    // Go back in browser history to return to the previous session
    await page.goBack();
    
    // Wait a moment for the page to load
    await page.waitForLoadState('networkidle');
    
    // We should be back at the original session, but now logged out
    // Switch to Login tab
    await page.locator('.tabs button').filter({ hasText: 'Login' }).click();
    
    // Fill in the login form with the same credentials
    await page.fill('input[id="loginAlias"]', alias);
    await page.fill('input[id="loginPassword"]', password);
    
    // Take screenshot of login form filled
    await screenshotIfChanged(page, { path: 'e2e-screenshots/07-login-form-filled.png', fullPage: true });
    
    // Submit the login form
    await page.locator('form button[type="submit"]').first().click();
    
    // Should successfully login since the private key is stored in this session's localStorage
    await expect(page.locator('.message.success')).toContainText('Login successful', {
      timeout: 10000
    });
    
    // Should be authenticated again
    await expect(page.locator('.authenticated')).toBeVisible();
    await expect(page.locator('.user-info h2')).toContainText(alias);
    
    // Take screenshot of successful login
    await screenshotIfChanged(page, { path: 'e2e-screenshots/08-login-success.png', fullPage: true });
  });
});
