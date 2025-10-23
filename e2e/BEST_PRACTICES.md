# E2E Testing Best Practices for SimCiv

This document provides a quick reference for writing fast, reliable E2E tests in SimCiv.

## Quick Start

### 1. Set Up Your Environment

```bash
# One-time setup
./bin/e2e-setup

# Or manually:
npm install
./bin/mongo start
npm run build
npm start
```

### 2. Write a Fast Authentication Test

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, seedTestUser, getLocalStorageInjectionCode } from './helpers';

test('my fast test', async ({ page, context }) => {
  // Create user with pre-generated keys (300-400ms)
  const testUser = createTestUser(`testuser_${Date.now()}`, 'password123');
  
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
  
  // Navigate and inject keys
  await page.goto(`/id=${testUser.sessionGuid}`);
  await page.evaluate(getLocalStorageInjectionCode(testUser));
  
  // Your test logic here...
});
```

## Performance Tips

### ❌ DON'T: Generate keys through registration UI when testing other features

```typescript
// This tests the registration UI but is slower for other test scenarios
await page.fill('input[id="alias"]', 'newuser');
await page.fill('input[id="password"]', 'password');
await page.locator('form button[type="submit"]').click();
await expect(page.locator('.message.success')).toContainText('Registration successful', {
  timeout: 10000
});
```

### ✅ DO: Use pre-generated keys for better control and speed

```typescript
// This gives you full control over test data and state
const testUser = createTestUser('newuser', 'password');
await seedTestUser(testUser);
await context.addCookies([{ name: 'simciv_session', value: testUser.sessionGuid, /* ... */ }]);
await page.goto(`/id=${testUser.sessionGuid}`);
await page.evaluate(getLocalStorageInjectionCode(testUser));
```

## Common Patterns

### Pattern 1: Test Authentication Flow

```typescript
test('user can login', async ({ page, context }) => {
  const testUser = createTestUser(`user_${Date.now()}`, 'password');
  await seedTestUser(testUser);
  
  await context.addCookies([{
    name: 'simciv_session',
    value: testUser.sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  
  await page.goto(`/id=${testUser.sessionGuid}`);
  await page.evaluate(getLocalStorageInjectionCode(testUser));
  
  // Switch to Login tab
  await page.locator('.tabs button').filter({ hasText: 'Login' }).click();
  
  // Login
  await page.fill('input[id="loginAlias"]', testUser.alias);
  await page.fill('input[id="loginPassword"]', testUser.password);
  await page.locator('form button[type="submit"]').click();
  
  // Verify
  await expect(page.locator('.message.success')).toContainText('Login successful');
});
```

### Pattern 2: Test Authenticated Features

```typescript
test('authenticated user can create game', async ({ page, context }) => {
  // Pre-authenticate the user
  const testUser = createTestUser(`user_${Date.now()}`, 'password');
  await seedTestUser(testUser);
  await authenticateSession(testUser.sessionGuid, testUser.alias);
  
  await context.addCookies([{
    name: 'simciv_session',
    value: testUser.sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  
  await page.goto(`/id=${testUser.sessionGuid}`);
  await page.evaluate(getLocalStorageInjectionCode(testUser));
  
  // User is already authenticated - test the feature directly!
  await page.getByRole('button', { name: 'Create New Game' }).click();
  // ... test game creation
});
```

### Pattern 3: Multiple Users

```typescript
test('two users can interact', async ({ browser }) => {
  // Create two users
  const user1 = createTestUser(`user1_${Date.now()}`, 'password1');
  const user2 = createTestUser(`user2_${Date.now()}`, 'password2');
  
  await seedTestUser(user1);
  await seedTestUser(user2);
  await authenticateSession(user1.sessionGuid, user1.alias);
  await authenticateSession(user2.sessionGuid, user2.alias);
  
  // Create two browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Set up user 1
  await context1.addCookies([{
    name: 'simciv_session',
    value: user1.sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await page1.goto(`/id=${user1.sessionGuid}`);
  await page1.evaluate(getLocalStorageInjectionCode(user1));
  
  // Set up user 2
  await context2.addCookies([{
    name: 'simciv_session',
    value: user2.sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await page2.goto(`/id=${user2.sessionGuid}`);
  await page2.evaluate(getLocalStorageInjectionCode(user2));
  
  // Test interaction between users
  // ...
  
  // Cleanup
  await context1.close();
  await context2.close();
});
```

## Debugging

### View Test Report

```bash
npx playwright show-report
```

### Run Tests in UI Mode

```bash
npx playwright test --ui
```

### Run Single Test

```bash
npx playwright test e2e/auth-optimized.spec.ts --grep "user can login"
```

### View Test Trace

```bash
npx playwright show-trace test-results/<trace-file>.zip
```

## Screenshots

Always capture screenshots at key states:

```typescript
await page.screenshot({ 
  path: 'e2e-screenshots/01-my-feature.png', 
  fullPage: true 
});
```

Review screenshots after tests to verify UI:
- Layout is correct
- No visual regressions
- Error messages display properly
- States are clearly indicated

## Helper Functions

### From `e2e/helpers.ts`

```typescript
// Key generation
generateRSAKeyPair(): { publicKey: string; privateKey: string }
encryptPrivateKeyWithPassword(privateKeyPem: string, password: string): EncryptedKeyData
createTestUser(alias: string, password: string): TestUser

// Database operations
seedTestUser(testUser: TestUser): Promise<void>
cleanupTestUser(alias: string): Promise<void>
authenticateSession(sessionGuid: string, userId: string): Promise<void>

// Browser integration
getLocalStorageInjectionCode(testUser: TestUser): string
getSessionCookie(sessionGuid: string): Cookie

// Performance measurement
measureTime<T>(label: string, fn: () => T): T
measureTimeAsync<T>(label: string, fn: () => Promise<T>): Promise<T>
```

## Cleanup

Always clean up test data:

```typescript
test('my test', async ({ page, context }) => {
  const testUser = createTestUser('testuser', 'password');
  
  try {
    await seedTestUser(testUser);
    // ... test logic
  } finally {
    await cleanupTestUser(testUser.alias);
  }
});
```

## Environment Variables

```bash
# Use external MongoDB for integration tests
TEST_MONGO_URI=mongodb://localhost:27017

# MongoDB connection for helpers
MONGO_URI=mongodb://localhost:27017
DB_NAME=simciv
```

## Performance Benchmarks

| Operation | Time |
|-----------|------|
| Pre-generate RSA keys (Node.js) | 300-400ms |
| Complete test with pre-generated keys | 2-4s |
| Pre-authenticated session setup | 2s |

**Benefits of pre-generated keys:**
- Consistent performance across environments
- Full control over test data and state
- Skip UI flows to focus on specific functionality
- Easier test isolation and cleanup

## Remember

1. **Use pre-generated keys** for all tests except those specifically testing registration UI
2. **Set session cookie BEFORE navigating** to the page
3. **Inject localStorage keys AFTER navigating** to the page
4. **Always clean up** test users
5. **Take screenshots** at key states
6. **Use unique aliases** (e.g., with timestamps) to avoid conflicts

## Examples

See complete working examples in:
- `e2e/auth-optimized.spec.ts` - Optimized authentication tests
- `e2e/auth.spec.ts` - Fixed traditional tests
- `e2e/game-creation.spec.ts` - Game creation with auth
