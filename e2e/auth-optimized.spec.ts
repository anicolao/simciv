import { test, expect } from '@playwright/test';
import {
  createTestUser,
  seedTestUser,
  cleanupTestUser,
  getLocalStorageInjectionCode,
  authenticateSession,
  measureTimeAsync,
} from './helpers';

test.describe('SimCiv Authentication - Optimized with Pre-generated Keys', () => {
  test('user can login with pre-generated keys (FAST)', async ({ page, context }) => {
    // Create a test user with pre-generated RSA keys
    const testUser = await measureTimeAsync(
      'Pre-generate RSA keys and test user',
      async () => createTestUser(`fastuser_${Date.now()}`, 'FastPassword123!')
    );

    try {
      // Seed the user in the database
      await measureTimeAsync('Seed test user in database', async () =>
        seedTestUser(testUser)
      );

      // Set the session cookie BEFORE navigating
      await context.addCookies([
        {
          name: 'simciv_session',
          value: testUser.sessionGuid,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Navigate to the specific session URL
      await measureTimeAsync('Navigate to session URL', async () => {
        await page.goto(`/id=${testUser.sessionGuid}`);
      });

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Inject the pre-generated keys into localStorage
      await measureTimeAsync('Inject keys into localStorage', async () => {
        await page.evaluate(getLocalStorageInjectionCode(testUser));
      });

      // Take screenshot of initial state
      await page.screenshot({
        path: 'e2e-screenshots/opt-01-initial-with-keys.png',
        fullPage: true,
      });

      // Switch to Login tab
      await page.locator('.tabs button').filter({ hasText: 'Login' }).click();

      // Fill in login credentials
      await page.fill('input[id="loginAlias"]', testUser.alias);
      await page.fill('input[id="loginPassword"]', testUser.password);

      // Take screenshot before login
      await page.screenshot({
        path: 'e2e-screenshots/opt-02-login-form-filled.png',
        fullPage: true,
      });

      // Submit login - this should be FAST since keys are already in localStorage
      await measureTimeAsync('Login with pre-generated keys', async () => {
        await page.locator('form button[type="submit"]').first().click();

        // Wait for success message
        await expect(page.locator('.message.success')).toContainText('Login successful', {
          timeout: 10000,
        });
      });

      // Verify authenticated state
      await expect(page.locator('.authenticated')).toBeVisible();
      await expect(page.locator('.user-info h2')).toContainText(testUser.alias);

      // Take screenshot of authenticated state
      await page.screenshot({
        path: 'e2e-screenshots/opt-03-authenticated.png',
        fullPage: true,
      });

      console.log('✅ Test completed successfully with pre-generated keys!');
    } finally {
      // Cleanup
      await cleanupTestUser(testUser.alias);
    }
  });

  test('compare: traditional registration (SLOW for reference)', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/id=[a-f0-9-]+/);

    const alias = `slowuser_${Date.now()}`;
    const password = 'SlowPassword123!';

    // Fill in registration form
    await page.fill('input[id="alias"]', alias);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="passwordConfirm"]', password);

    // Submit registration - THIS WILL BE SLOW due to RSA key generation in browser
    const startTime = Date.now();
    await page.locator('form button[type="submit"]').first().click();

    // Wait for registration to complete
    await expect(page.locator('.message.success')).toContainText('Registration successful', {
      timeout: 60000, // Increased timeout due to slow key generation
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Traditional registration took: ${duration}ms (~${Math.round(duration / 1000)}s)`);

    // Verify authenticated
    await expect(page.locator('.authenticated')).toBeVisible();

    // Cleanup
    await cleanupTestUser(alias);

    console.log(
      `📊 Performance comparison: Pre-generated keys vs Traditional registration = ~${Math.round(duration / 1000)}s saved`
    );
  });

  test('pre-authenticated user session (FASTEST)', async ({ page, context }) => {
    // Create test user
    const testUser = await measureTimeAsync(
      'Create test user with pre-generated keys',
      async () => createTestUser(`preauthuser_${Date.now()}`, 'PreAuthPass123!')
    );

    try {
      // Seed user in database
      await seedTestUser(testUser);

      // Authenticate the session in the database (simulate completed login)
      await authenticateSession(testUser.sessionGuid, testUser.alias);

      // Set the session cookie BEFORE navigating
      await context.addCookies([
        {
          name: 'simciv_session',
          value: testUser.sessionGuid,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Navigate to the authenticated session
      await measureTimeAsync('Navigate to pre-authenticated session', async () => {
        await page.goto(`/id=${testUser.sessionGuid}`);
      });

      // Inject keys into localStorage (needed for future operations)
      await page.evaluate(getLocalStorageInjectionCode(testUser));

      await page.waitForLoadState('networkidle');

      // Should already be authenticated!
      await expect(page.locator('.authenticated')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.user-info h2')).toContainText(testUser.alias);

      // Take screenshot
      await page.screenshot({
        path: 'e2e-screenshots/opt-04-pre-authenticated.png',
        fullPage: true,
      });

      console.log('✅ User was pre-authenticated - instant access!');
    } finally {
      await cleanupTestUser(testUser.alias);
    }
  });
});
