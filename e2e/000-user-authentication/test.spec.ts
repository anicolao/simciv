import { test, expect } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from '../global-setup';
import { screenshotIfChanged } from '../helpers/screenshot';
import { mockDateInBrowser } from '../helpers/mock-time';
import { expectation } from '../helpers/expectation';
import fs from 'fs';
import path from 'path';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async ({ page }) => {
  await enableE2ETestMode();
  await clearDatabase();
  await resetUuidCounter();
  // Mock the Date object to ensure stable timestamps in screenshots
  await mockDateInBrowser(page);
});

test.describe('000-user-authentication', () => {
  test('should complete user registration and authentication flow', async ({ page }) => {
    const screenshotDir = 'e2e/000-user-authentication/screenshots';
    const readmeContent: string[] = [];
    
    readmeContent.push('# Test: User Authentication\n\n');
    readmeContent.push('## Overview\n\n');
    readmeContent.push('This test verifies the complete user authentication flow including registration, logout, and login. It represents the primary user journey for account creation and authentication in SimCiv.\n\n');
    readmeContent.push('## Screenshots\n\n');

    // Step 1: Initial load
    await page.goto('/');
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    // Verify initial state
    readmeContent.push('### 000-initial-load.png\n\n');
    readmeContent.push('![000-initial-load.png](screenshots/000-initial-load.png)\n\n');
    readmeContent.push('**Programmatic Verification:**\n\n');
    readmeContent.push(await expectation(
      expect(page.locator('h1')).toContainText('SimCiv Authentication'),
      '- ✓ Page title contains "SimCiv Authentication"\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('.tabs button.active')).toContainText('Register'),
      '- ✓ Register tab is active by default\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('input#alias')).toBeVisible(),
      '- ✓ Registration form is visible\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('input#password')).toBeVisible(),
      '- ✓ Password field is visible\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('input#passwordConfirm')).toBeVisible(),
      '- ✓ Password confirmation field is visible\n'
    ));
    readmeContent.push('\n**Manual Visual Verification:**\n\n');
    readmeContent.push('- Verify page styling and layout\n');
    readmeContent.push('- Check tab styling and active state\n');
    readmeContent.push('- Confirm form field styling\n');
    readmeContent.push('- Check button styling\n\n');
    
    await screenshotIfChanged(page, { 
      path: `${screenshotDir}/000-initial-load.png`,
      fullPage: true 
    });

    // Step 2: Fill registration form
    const alias = 'testuser';
    const password = 'TestPassword123!';
    
    await page.fill('input#alias', alias);
    await page.fill('input#password', password);
    await page.fill('input#passwordConfirm', password);
    
    // Verify form is filled
    readmeContent.push('### 001-registration-form-filled.png\n\n');
    readmeContent.push('![001-registration-form-filled.png](screenshots/001-registration-form-filled.png)\n\n');
    readmeContent.push('**Programmatic Verification:**\n\n');
    readmeContent.push(await expectation(
      expect(page.locator('input#alias')).toHaveValue(alias),
      `- ✓ Alias field contains "${alias}"\n`
    ));
    readmeContent.push(await expectation(
      expect(page.locator('input#password')).toHaveValue(password),
      '- ✓ Password field is filled\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('input#passwordConfirm')).toHaveValue(password),
      '- ✓ Password confirmation field matches\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('form button[type="submit"]').first()).toBeEnabled(),
      '- ✓ Submit button is enabled\n'
    ));
    readmeContent.push('\n**Manual Visual Verification:**\n\n');
    readmeContent.push('- Verify input field styling with content\n');
    readmeContent.push('- Check button hover states\n');
    readmeContent.push('- Confirm password masking (dots/asterisks)\n\n');
    
    await screenshotIfChanged(page, { 
      path: `${screenshotDir}/001-registration-form-filled.png`,
      fullPage: true 
    });

    // Step 3: Submit and verify registration success
    await page.locator('form button[type="submit"]').first().click();
    
    readmeContent.push('### 002-registration-complete.png\n\n');
    readmeContent.push('![002-registration-complete.png](screenshots/002-registration-complete.png)\n\n');
    readmeContent.push('**Programmatic Verification:**\n\n');
    readmeContent.push(await expectation(
      expect(page.locator('.message.success')).toContainText('Registration successful', {
        timeout: 5000
      }),
      '- ✓ Success message is displayed\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('.authenticated')).toBeVisible(),
      '- ✓ Authenticated section is visible\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('.user-info h2')).toContainText(alias),
      `- ✓ User alias "${alias}" is displayed correctly\n`
    ));
    readmeContent.push('\n**Manual Visual Verification:**\n\n');
    readmeContent.push('- Verify success message styling\n');
    readmeContent.push('- Check authenticated user layout\n');
    readmeContent.push('- Confirm user info display\n');
    readmeContent.push('- Verify game lobby UI elements\n\n');
    
    await screenshotIfChanged(page, { 
      path: `${screenshotDir}/002-registration-complete.png`,
      fullPage: true 
    });

    // Step 4: Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    
    // Should be redirected to root and get new session
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    // Wait for page to fully stabilize
    await page.waitForLoadState('networkidle');
    
    readmeContent.push('### 003-after-logout.png\n\n');
    readmeContent.push('![003-after-logout.png](screenshots/003-after-logout.png)\n\n');
    readmeContent.push('**Programmatic Verification:**\n\n');
    readmeContent.push(await expectation(
      expect(page.locator('.tabs')).toBeVisible(),
      '- ✓ Login/register tabs are visible again\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('.tabs button').first()).toContainText('Register'),
      '- ✓ Register tab is present\n'
    ));
    readmeContent.push(await expectation(
      expect(page.locator('.authenticated')).not.toBeVisible(),
      '- ✓ Authenticated section is no longer visible\n'
    ));
    readmeContent.push('\n**Manual Visual Verification:**\n\n');
    readmeContent.push('- Verify logout returns to unauthenticated state\n');
    readmeContent.push('- Check tab styling\n');
    readmeContent.push('- Confirm no authenticated user elements visible\n\n');
    
    await screenshotIfChanged(page, { 
      path: `${screenshotDir}/003-after-logout.png`,
      fullPage: true 
    });

    // Generate README.md
    fs.writeFileSync(
      'e2e/000-user-authentication/README.md',
      readmeContent.join('')
    );
  });

  test('should prevent cross-user credential access', async ({ page, browser }) => {
    const screenshotDir = 'e2e/000-user-authentication/screenshots';
    
    // Create first user
    await page.goto('/');
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    const alias1 = 'user1';
    const password1 = 'Password123!';
    
    // Register using form submit button
    await page.fill('input#alias', alias1);
    await page.fill('input#password', password1);
    await page.fill('input#passwordConfirm', password1);
    await page.locator('form button[type="submit"]').first().click();
    
    await expect(page.locator('.message.success')).toContainText('Registration successful', {
      timeout: 5000
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
    await page2.fill('input#loginAlias', alias1);
    await page2.fill('input#loginPassword', 'WrongPassword');
    
    // Wait for page to fully stabilize before screenshot
    await page2.waitForLoadState('networkidle');
    
    // Take screenshot before attempting login
    await screenshotIfChanged(page2, { 
      path: `${screenshotDir}/004-login-attempt-different-session.png`,
      fullPage: true 
    });
    
    // Submit login using form submit button
    await page2.locator('form button[type="submit"]').first().click();
    
    // Should see error about no private key found
    await expect(page2.locator('.message.error')).toContainText('No account found! Register instead.', {
      timeout: 2000
    });
    
    // Wait for page to fully stabilize before screenshot
    await page2.waitForLoadState('networkidle');
    
    // Take screenshot of error message
    await screenshotIfChanged(page2, { 
      path: `${screenshotDir}/005-login-error-no-key.png`,
      fullPage: true 
    });
    
    // Should not be authenticated
    await expect(page2.locator('.authenticated')).not.toBeVisible();
    
    // Clean up
    await context2.close();
  });

  test('should allow user to login after logout', async ({ page }) => {
    const screenshotDir = 'e2e/000-user-authentication/screenshots';
    
    await page.goto('/');
    await page.waitForURL(/\/id=[a-f0-9-]+/);
    
    const alias = 'logintest';
    const password = 'SecurePass123!';
    
    // Register the user
    await page.fill('input#alias', alias);
    await page.fill('input#password', password);
    await page.fill('input#passwordConfirm', password);
    await page.locator('form button[type="submit"]').first().click();
    
    // Wait for registration to complete
    await expect(page.locator('.message.success')).toContainText('Registration successful', {
      timeout: 5000
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
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // We should be back at the original session, but now logged out
    // Switch to Login tab
    await page.locator('.tabs button').filter({ hasText: 'Login' }).click();
    
    // Fill in the login form with the same credentials
    await page.fill('input#loginAlias', alias);
    await page.fill('input#loginPassword', password);
    
    // Take screenshot of login form filled
    await screenshotIfChanged(page, { 
      path: `${screenshotDir}/006-login-form-filled.png`,
      fullPage: true 
    });
    
    // Submit the login form
    await page.locator('form button[type="submit"]').first().click();
    
    // Should successfully login since the private key is stored in this session's localStorage
    await expect(page.locator('.message.success')).toContainText('Login successful', {
      timeout: 2000
    });
    
    // Should be authenticated again
    await expect(page.locator('.authenticated')).toBeVisible();
    await expect(page.locator('.user-info h2')).toContainText(alias);
    
    // Take screenshot of successful login
    await screenshotIfChanged(page, { 
      path: `${screenshotDir}/007-login-success.png`,
      fullPage: true 
    });
  });
});
