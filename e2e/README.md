# End-to-End Testing with Playwright

## Overview

This directory contains Playwright E2E tests that validate the complete authentication workflow including UI interactions and visual layout.

## Performance Optimization

**Important:** RSA key generation in the browser can be very slow (10-30 seconds per user). To speed up tests, use the pre-generated key approach documented below instead of generating keys during tests.

### Fast Testing with Pre-Generated Keys

The `e2e/helpers.ts` module provides utilities for creating test users with pre-generated RSA keys. This approach:

- **Generates keys in Node.js** (~300-400ms) instead of browser (~30s)
- **Seeds the database** with user and session data
- **Injects keys into localStorage** before tests run
- **Sets session cookies** to match the pre-generated session

**Example usage:**

```typescript
import { createTestUser, seedTestUser, getLocalStorageInjectionCode } from './helpers';

test('fast authentication test', async ({ page, context }) => {
  // Create user with pre-generated keys (300-400ms)
  const testUser = createTestUser('testuser', 'password123');
  
  // Seed database
  await seedTestUser(testUser);
  
  // Set session cookie
  await context.addCookies([{
    name: 'simciv_session',
    value: testUser.sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  
  // Navigate with the pre-set session
  await page.goto(`/id=${testUser.sessionGuid}`);
  
  // Inject keys into localStorage
  await page.evaluate(getLocalStorageInjectionCode(testUser));
  
  // Now the user can login instantly!
});
```

See `e2e/auth-optimized.spec.ts` for complete examples.

## Test Coverage

### 1. User Registration and Login Flow (`auth.spec.ts`)
- **Initial Load**: Validates authentication page loads correctly
- **Registration**: Tests user registration with cryptographic key generation
- **Authentication State**: Verifies authenticated user display
- **Logout**: Tests logout functionality

### 2. Cross-User Isolation
- **Different Sessions**: Verifies users in different sessions have different GUIDs
- **Credential Isolation**: Confirms one user cannot access another's account
- **Error Messages**: Validates appropriate error messages for unauthorized access

### 3. Login After Logout
- **Persistent Keys**: Tests that keys persist in local storage
- **Re-authentication**: Validates user can login again with same credentials
- **Session Restoration**: Confirms session GUID is maintained

## Screenshot Validation

Tests capture screenshots at key UI states in the `e2e-screenshots/` directory:

1. `01-initial-load.png` - Initial authentication page
2. `02-registration-form-filled.png` - Registration form with data
3. `03-authenticated.png` - Authenticated user state
4. `04-after-logout.png` - Post-logout state
5. `05-login-attempt-different-session.png` - Login form in different session
6. `06-login-error-no-key.png` - Error message for missing credentials
7. `07-login-form-filled.png` - Login form filled with credentials
8. `08-login-success.png` - Successful login state

**These screenshots should be reviewed after each test run to ensure:**
- UI layout is correct
- No visual regressions
- Error messages display properly
- Authentication states are clearly indicated

## Running the Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Build the client:
```bash
npm run build:client
```

4. Start MongoDB:
```bash
docker run -d --name test-mongo -p 27017:27017 mongo:7.0
```

### Run E2E Tests

```bash
# Run all E2E tests (starts dev server automatically)
npm run test:e2e

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode to see the browser
npx playwright test --headed
```

### View Test Results

```bash
# View HTML report
npx playwright show-report

# View trace for a failed test
npx playwright show-trace test-results/<trace-file>.zip
```

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./e2e`
- **Screenshots**: Captured on failure and at key workflow points
- **Auto Server**: Automatically starts/stops dev server
- **Browser**: Chromium (Desktop Chrome)

## Test Requirements

As per `.github/copilot-instructions.md`:

- ✅ All E2E tests must pass before PR completion
- ✅ Screenshots must be captured at key UI states
- ✅ Screenshots must be reviewed for visual correctness
- ✅ No skipped or failing tests are acceptable
- ✅ Tests must validate both functionality and UI layout

## Troubleshooting

### Browser Not Installed
```bash
npx playwright install chromium
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues
```bash
# Restart MongoDB container
docker restart test-mongo
```

### Screenshots Not Generated
- Check `e2e-screenshots/` directory exists
- Verify test is reaching screenshot lines (no early failures)
- Check disk space availability

## Adding New Tests

When adding new E2E tests:

1. Follow existing test structure
2. Add screenshot captures at key states
3. Use descriptive screenshot filenames
4. Document expected behavior
5. Test both success and failure paths
6. Update this README with new test scenarios

**For authentication tests:** Use the pre-generated key approach from `helpers.ts` to avoid slow RSA key generation:

```typescript
// Instead of this (SLOW - 30s):
await page.fill('input[id="alias"]', 'newuser');
await page.fill('input[id="password"]', 'password');
await page.locator('form button[type="submit"]').click();
await expect(page.locator('.message.success')).toContainText('Registration successful', {
  timeout: 60000  // Long timeout needed!
});

// Do this (FAST - 2-4s):
const testUser = createTestUser('newuser', 'password');
await seedTestUser(testUser);
await context.addCookies([{ name: 'simciv_session', value: testUser.sessionGuid, /* ... */ }]);
await page.goto(`/id=${testUser.sessionGuid}`);
await page.evaluate(getLocalStorageInjectionCode(testUser));
// User is ready to login instantly!
```

## Helper Utilities

The `e2e/helpers.ts` module provides the following utilities:

### Key Generation
- `generateRSAKeyPair()` - Fast RSA key generation using Node.js crypto
- `encryptPrivateKeyWithPassword()` - Encrypt private key matching browser format
- `createTestUser()` - Create complete test user with keys

### Database Operations
- `seedTestUser()` - Insert user and session into database
- `cleanupTestUser()` - Remove test user from database
- `authenticateSession()` - Mark session as authenticated

### Browser Integration
- `getLocalStorageInjectionCode()` - Generate code to inject keys into localStorage
- `getSessionCookie()` - Get cookie data for session

### Performance Measurement
- `measureTime()` - Measure synchronous operation time
- `measureTimeAsync()` - Measure async operation time

## Performance Benchmarks

- **Traditional browser RSA key generation:** ~10-30 seconds per user
- **Node.js pre-generated keys:** ~300-400ms per user
- **Complete test with pre-generated keys:** ~2-4 seconds total
- **Pre-authenticated session test:** ~2 seconds total

**Speed improvement: ~10-15x faster!**
