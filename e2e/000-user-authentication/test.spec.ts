import { test, expect } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from '../global-setup';
import { screenshotIfChanged } from '../helpers/screenshot';
import { mockDateInBrowser } from '../helpers/mock-time';
import { expectation } from '../helpers/expectation';
import { createTimer } from '../helpers/timing';
import fs from 'fs';
import path from 'path';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async ({ page }) => {
  const timer = createTimer();
  await timer.measure('beforeEach: enableE2ETestMode', () => enableE2ETestMode());
  await timer.measure('beforeEach: clearDatabase', () => clearDatabase());
  await timer.measure('beforeEach: resetUuidCounter', () => resetUuidCounter());
  // Mock the Date object to ensure stable timestamps in screenshots
  await timer.measure('beforeEach: mockDateInBrowser', () => mockDateInBrowser(page));
  console.log('[beforeEach timing]');
  timer.printReport();
});

test.describe('000-user-authentication', () => {
  test('should complete user registration and authentication flow', async ({ page }) => {
    const timer = createTimer();
    const screenshotDir = 'e2e/000-user-authentication/screenshots';
    const readmeContent: string[] = [];
    
    timer.measureSync('Setup: Initialize README content', () => {
      readmeContent.push('# Test: User Authentication\n\n');
      readmeContent.push('## Overview\n\n');
      readmeContent.push('This test verifies the complete user authentication flow including registration, logout, and login. It represents the primary user journey for account creation and authentication in SimCiv.\n\n');
      readmeContent.push('## Screenshots\n\n');
    });

    // Step 1: Initial load
    await timer.measure('Step 1: Navigate to /', () => page.goto('/'));
    await timer.measure('Step 1: Wait for URL redirect', () => page.waitForURL(/\/id=[a-f0-9-]+/));
    
    // Verify initial state
    timer.measureSync('Step 1: Add README header', () => {
      readmeContent.push('### 000-initial-load.png\n\n');
      readmeContent.push('![000-initial-load.png](screenshots/000-initial-load.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 1: Verify h1 title', () =>
      expectation(
        expect(page.locator('h1')).toContainText('SimCiv Authentication'),
        '- ✓ Page title contains "SimCiv Authentication"\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 1: Verify Register tab active', () =>
      expectation(
        expect(page.locator('.tabs button.active')).toContainText('Register'),
        '- ✓ Register tab is active by default\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 1: Verify alias field visible', () =>
      expectation(
        expect(page.locator('input#alias')).toBeVisible(),
        '- ✓ Registration form is visible\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 1: Verify password field visible', () =>
      expectation(
        expect(page.locator('input#password')).toBeVisible(),
        '- ✓ Password field is visible\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 1: Verify confirm field visible', () =>
      expectation(
        expect(page.locator('input#passwordConfirm')).toBeVisible(),
        '- ✓ Password confirmation field is visible\n'
      )
    ));
    
    timer.measureSync('Step 1: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify page styling and layout\n');
      readmeContent.push('- Check tab styling and active state\n');
      readmeContent.push('- Confirm form field styling\n');
      readmeContent.push('- Check button styling\n\n');
    });
    
    await timer.measure('Step 1: Screenshot - initial load', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/000-initial-load.png`,
        fullPage: true 
      })
    );

    // Step 2: Fill registration form
    const alias = 'testuser';
    const password = 'TestPassword123!';
    
    await timer.measure('Step 2: Fill alias field', () => page.fill('input#alias', alias));
    await timer.measure('Step 2: Fill password field', () => page.fill('input#password', password));
    await timer.measure('Step 2: Fill confirm field', () => page.fill('input#passwordConfirm', password));
    
    // Verify form is filled
    timer.measureSync('Step 2: Add README header', () => {
      readmeContent.push('### 001-registration-form-filled.png\n\n');
      readmeContent.push('![001-registration-form-filled.png](screenshots/001-registration-form-filled.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 2: Verify alias value', () =>
      expectation(
        expect(page.locator('input#alias')).toHaveValue(alias),
        `- ✓ Alias field contains "${alias}"\n`
      )
    ));
    readmeContent.push(await timer.measure('Step 2: Verify password value', () =>
      expectation(
        expect(page.locator('input#password')).toHaveValue(password),
        '- ✓ Password field is filled\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 2: Verify confirm value', () =>
      expectation(
        expect(page.locator('input#passwordConfirm')).toHaveValue(password),
        '- ✓ Password confirmation field matches\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 2: Verify submit enabled', () =>
      expectation(
        expect(page.locator('form button[type="submit"]').first()).toBeEnabled(),
        '- ✓ Submit button is enabled\n'
      )
    ));
    
    timer.measureSync('Step 2: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify input field styling with content\n');
      readmeContent.push('- Check button hover states\n');
      readmeContent.push('- Confirm password masking (dots/asterisks)\n\n');
    });
    
    await timer.measure('Step 2: Screenshot - form filled', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/001-registration-form-filled.png`,
        fullPage: true 
      })
    );

    // Step 3: Submit and verify registration success
    await timer.measure('Step 3: Click submit button', () =>
      page.locator('form button[type="submit"]').first().click()
    );
    
    timer.measureSync('Step 3: Add README header', () => {
      readmeContent.push('### 002-registration-complete.png\n\n');
      readmeContent.push('![002-registration-complete.png](screenshots/002-registration-complete.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 3: Verify authenticated section', () =>
      expectation(
        expect(page.locator('.authenticated')).toBeVisible({
          timeout: 500
        }),
        '- ✓ Authenticated section is visible\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 3: Verify user alias display', () =>
      expectation(
        expect(page.locator('.user-info h2')).toContainText(alias),
        `- ✓ User alias "${alias}" is displayed correctly\n`
      )
    ));
    
    timer.measureSync('Step 3: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify success message styling\n');
      readmeContent.push('- Check authenticated user layout\n');
      readmeContent.push('- Confirm user info display\n');
      readmeContent.push('- Verify game lobby UI elements\n\n');
    });
    
    await timer.measure('Step 3: Screenshot - registration complete', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/002-registration-complete.png`,
        fullPage: true 
      })
    );

    // Step 4: Logout
    await timer.measure('Step 4: Click logout button', () =>
      page.getByRole('button', { name: 'Logout' }).click()
    );
    
    // Should be redirected to root and get new session
    await timer.measure('Step 4: Wait for URL redirect', () =>
      page.waitForURL(/\/id=[a-f0-9-]+/)
    );
    
    timer.measureSync('Step 4: Add README header', () => {
      readmeContent.push('### 003-after-logout.png\n\n');
      readmeContent.push('![003-after-logout.png](screenshots/003-after-logout.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 4: Verify tabs visible', () =>
      expectation(
        expect(page.locator('.tabs')).toBeVisible(),
        '- ✓ Login/register tabs are visible again\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 4: Verify Register tab present', () =>
      expectation(
        expect(page.locator('.tabs button').first()).toContainText('Register'),
        '- ✓ Register tab is present\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 4: Verify authenticated not visible', () =>
      expectation(
        expect(page.locator('.authenticated')).not.toBeVisible(),
        '- ✓ Authenticated section is no longer visible\n'
      )
    ));
    
    timer.measureSync('Step 4: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify logout returns to unauthenticated state\n');
      readmeContent.push('- Check tab styling\n');
      readmeContent.push('- Confirm no authenticated user elements visible\n\n');
    });
    
    await timer.measure('Step 4: Screenshot - after logout', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/003-after-logout.png`,
        fullPage: true 
      })
    );

    // Generate README.md
    timer.measureSync('Cleanup: Write README.md', () => {
      fs.writeFileSync(
        'e2e/000-user-authentication/README.md',
        readmeContent.join('')
      );
    });
    
    // Print comprehensive timing report
    console.log('\n📊 TEST TIMING ANALYSIS - should complete user registration and authentication flow');
    timer.printReport();
  });

  test('should prevent cross-user credential access', async ({ page, browser }) => {
    const timer = createTimer();
    const screenshotDir = 'e2e/000-user-authentication/screenshots';
    
    // Create first user
    await timer.measure('Navigate to /', () => page.goto('/'));
    await timer.measure('Wait for URL redirect', () => page.waitForURL(/\/id=[a-f0-9-]+/));
    
    const alias1 = 'user1';
    const password1 = 'Password123!';
    
    // Register using form submit button
    await timer.measure('Fill alias', () => page.fill('input#alias', alias1));
    await timer.measure('Fill password', () => page.fill('input#password', password1));
    await timer.measure('Fill confirm', () => page.fill('input#passwordConfirm', password1));
    await timer.measure('Click submit', () => page.locator('form button[type="submit"]').first().click());
    
    await timer.measure('Verify authenticated', () => expect(page.locator('.authenticated')).toBeVisible({
      timeout: 500
    }));
    
    // Get the session GUID
    const url1 = timer.measureSync('Get URL 1', () => page.url());
    
    // Create a NEW browser context (completely separate session)
    const context2 = await timer.measure('Create new browser context', () => browser.newContext());
    const page2 = await timer.measure('Create new page', () => context2.newPage());
    // Mock date in the new page to ensure stable timestamps
    await timer.measure('Mock date in page2', () => mockDateInBrowser(page2));
    await timer.measure('Navigate page2 to /', () => page2.goto('/'));
    await timer.measure('Wait for page2 URL redirect', () => page2.waitForURL(/\/id=[a-f0-9-]+/));
    
    const url2 = timer.measureSync('Get URL 2', () => page2.url());
    
    // Verify they have different session GUIDs
    timer.measureSync('Verify different URLs', () => expect(url1).not.toBe(url2));
    
    // Switch to Login tab
    await timer.measure('Click Login tab', () => page2.locator('.tabs button').filter({ hasText: 'Login' }).click());
    
    // Fill login form
    await timer.measure('Fill login alias', () => page2.fill('input#loginAlias', alias1));
    await timer.measure('Fill login password', () => page2.fill('input#loginPassword', 'WrongPassword'));
    
    // Take screenshot before attempting login
    await timer.measure('Screenshot - login attempt', () =>
      screenshotIfChanged(page2, { 
        path: `${screenshotDir}/004-login-attempt-different-session.png`,
        fullPage: true 
      })
    );
    
    // Submit login using form submit button
    await timer.measure('Click login submit', () => page2.locator('form button[type="submit"]').first().click());
    
    // Should see error about no private key found
    await timer.measure('Verify error message', async () => {
      await expect(page2.locator('.message.error')).toContainText('No account found! Register instead.', {
        timeout: 1000
      });
    });
    
    // Take screenshot of error message
    await timer.measure('Screenshot - error message', () =>
      screenshotIfChanged(page2, { 
        path: `${screenshotDir}/005-login-error-no-key.png`,
        fullPage: true 
      })
    );
    
    // Should not be authenticated
    await timer.measure('Verify not authenticated', () => expect(page2.locator('.authenticated')).not.toBeVisible());
    
    // Clean up
    await timer.measure('Close context2', () => context2.close());
    
    console.log('\n📊 TEST TIMING ANALYSIS - should prevent cross-user credential access');
    timer.printReport();
  });

  test('should allow user to login after logout', async ({ page }) => {
    const timer = createTimer();
    const screenshotDir = 'e2e/000-user-authentication/screenshots';
    
    await timer.measure('Navigate to /', () => page.goto('/'));
    await timer.measure('Wait for URL redirect', () => page.waitForURL(/\/id=[a-f0-9-]+/));
    
    const alias = 'logintest';
    const password = 'SecurePass123!';
    
    // Register the user
    await timer.measure('Fill alias', () => page.fill('input#alias', alias));
    await timer.measure('Fill password', () => page.fill('input#password', password));
    await timer.measure('Fill confirm', () => page.fill('input#passwordConfirm', password));
    await timer.measure('Click submit', () => page.locator('form button[type="submit"]').first().click());
    
    // Wait for registration to complete
    await timer.measure('Verify authenticated', () => expect(page.locator('.authenticated')).toBeVisible({
      timeout: 500
    }));
    await timer.measure('Verify user alias', () => expect(page.locator('.user-info h2')).toContainText(alias));
    
    // Logout - this will redirect to a NEW session
    await timer.measure('Click logout', () => page.getByRole('button', { name: 'Logout' }).click());
    
    // Wait for redirect to new session
    await timer.measure('Wait for redirect', () => page.waitForURL(/\/id=[a-f0-9-]+/));
    await timer.measure('Verify tabs visible', () => expect(page.locator('.tabs')).toBeVisible());
    
    // In this new session, we don't have the private key, so we need to go back
    // Go back in browser history to return to the previous session
    await timer.measure('Go back', () => page.goBack());
    
    // We should be back at the original session, but now logged out
    // Switch to Login tab
    await timer.measure('Click Login tab', () => page.locator('.tabs button').filter({ hasText: 'Login' }).click());
    
    // Fill in the login form with the same credentials
    await timer.measure('Fill login alias', () => page.fill('input#loginAlias', alias));
    await timer.measure('Fill login password', () => page.fill('input#loginPassword', password));
    
    // Take screenshot of login form filled
    await timer.measure('Screenshot - login form', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/006-login-form-filled.png`,
        fullPage: true 
      })
    );
    
    // Submit the login form
    await timer.measure('Click login submit', () => page.locator('form button[type="submit"]').first().click());
    
    // Should successfully login since the private key is stored in this session's localStorage
    await timer.measure('Verify authenticated again', () => expect(page.locator('.authenticated')).toBeVisible({
      timeout: 500
    }));
    await timer.measure('Verify user alias again', () => expect(page.locator('.user-info h2')).toContainText(alias));
    
    // Take screenshot of successful login
    await timer.measure('Screenshot - login success', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/007-login-success.png`,
        fullPage: true 
      })
    );
    
    console.log('\n📊 TEST TIMING ANALYSIS - should allow user to login after logout');
    timer.printReport();
  });
});
