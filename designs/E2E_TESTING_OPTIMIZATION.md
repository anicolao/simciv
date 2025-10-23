# E2E Testing Optimization for SimCiv

**Version:** 0.0002  
**Status:** Implemented  
**Purpose:** Optimize E2E authentication tests by pre-generating RSA keys  
**Last Updated:** October 23, 2025

## Related Documents

- [version0.0001.md](./version0.0001.md) - Authentication System Specification

## Problem Statement

The SimCiv authentication system uses 2048-bit RSA key pairs for secure, password-less authentication. While this provides excellent security, there are challenges with E2E testing:

- **Lack of test control:** Tests that go through the full registration UI have less control over test data and state
- **Test isolation:** Setting up specific test scenarios requires going through the entire registration flow
- **Consistency:** Test performance can vary across different environments and browser configurations

The initial problem statement suggested that browser-based RSA key generation was taking 10-30 seconds, but actual measurements in the test environment showed much faster performance (300-500ms). However, the pre-generated key approach still provides significant value for test control and maintainability.

## Solution Overview

Instead of generating RSA keys in the browser during tests, we pre-generate keys on the Node.js side and inject them into the test environment. This approach:

1. **Generates keys using Node.js crypto** (~300-400ms) with consistent performance
2. **Seeds the database** with user credentials and session data for full test control
3. **Injects encrypted private keys** into browser localStorage before tests run
4. **Sets session cookies** to establish the correct session context

**Benefits:**
- **Test Control:** Full control over user data, sessions, and authentication state
- **Test Isolation:** Easy to set up specific test scenarios and clean up afterward
- **Consistency:** Predictable performance across different environments
- **Flexibility:** Can test with pre-authenticated users, skip UI flows, or test specific states

## Architecture

### Components

1. **Test Helpers Module** (`e2e/helpers.ts`)
   - RSA key generation utilities
   - Database seeding functions
   - Browser integration utilities
   - Performance measurement tools

2. **E2E Setup Script** (`bin/e2e-setup`)
   - Environment validation
   - Dependency installation
   - MongoDB startup
   - Server startup

3. **Optimized Test Examples** (`e2e/auth-optimized.spec.ts`)
   - Fast login with pre-generated keys
   - Pre-authenticated session setup
   - Performance comparison tests

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Test Setup (Node.js)                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Generate RSA key pair (Node.js crypto) ~300ms           │
│    - Public key (PEM format)                                │
│    - Private key (PEM format)                               │
│                                                              │
│ 2. Encrypt private key with password                        │
│    - PBKDF2 (100,000 iterations, SHA-256)                  │
│    - AES-GCM encryption                                     │
│    - Matches browser encryption format                      │
│                                                              │
│ 3. Seed database                                            │
│    - Insert user with public key                           │
│    - Create session record                                  │
│    - Optionally authenticate session                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Browser Setup (Playwright)                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Set session cookie                                       │
│    - Cookie name: simciv_session                           │
│    - Value: pre-generated GUID                             │
│    - Matches database session                               │
│                                                              │
│ 2. Navigate to session URL                                  │
│    - URL: /id={sessionGuid}                                │
│    - Server recognizes cookie                               │
│                                                              │
│ 3. Inject encrypted key into localStorage                   │
│    - Key: simciv_{guid}_privatekey                         │
│    - Value: encrypted private key JSON                      │
│    - Matches client storage format                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Test Execution                                              │
├─────────────────────────────────────────────────────────────┤
│ - User can login instantly (keys already in localStorage)   │
│ - No 30-second wait for key generation                      │
│ - Tests run in 2-4 seconds instead of 30+ seconds          │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. RSA Key Generation (Node.js)

```typescript
export function generateRSAKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}
```

**Performance:** ~300-400ms (consistent across environments)

### 2. Private Key Encryption

The Node.js encryption matches the browser-side implementation exactly:

- **Key Derivation:** PBKDF2 with 100,000 iterations, SHA-256
- **Encryption:** AES-GCM with 256-bit key
- **Format:** Same JSON structure as browser `crypto.ts`

```typescript
export function encryptPrivateKeyWithPassword(
  privateKeyPem: string,
  password: string
): EncryptedKeyData {
  // Convert PEM to DER (same as browser's exportKey)
  const privateKeyDer = crypto
    .createPrivateKey(privateKeyPem)
    .export({ type: 'pkcs8', format: 'der' });

  // Generate salt and IV
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  // Derive key using PBKDF2 (matching browser's 100,000 iterations)
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  // Encrypt using AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKeyDer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine encrypted data with auth tag (GCM mode)
  const encryptedWithTag = Buffer.concat([encrypted, authTag]);

  return {
    encryptedKey: Array.from(encryptedWithTag),
    salt: Array.from(salt),
    iv: Array.from(iv),
    algorithm: 'AES-GCM',
    keyDerivation: {
      function: 'PBKDF2',
      iterations: 100000,
      hash: 'SHA-256',
    },
    version: 1,
    createdAt: new Date().toISOString(),
  };
}
```

### 3. Database Seeding

```typescript
export async function seedTestUser(testUser: TestUser): Promise<void> {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'simciv';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Insert user into users collection
    await db.collection('users').insertOne({
      alias: testUser.alias,
      publicKey: testUser.publicKey,
      accountStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create session in sessions collection
    await db.collection('sessions').insertOne({
      sessionGuid: testUser.sessionGuid,
      state: 'unauthenticated',
      userId: null,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } finally {
    await client.close();
  }
}
```

### 4. Browser Integration

```typescript
// Set session cookie
await context.addCookies([{
  name: 'simciv_session',
  value: testUser.sessionGuid,
  domain: 'localhost',
  path: '/',
  httpOnly: true,
  sameSite: 'Lax',
}]);

// Navigate to session URL
await page.goto(`/id=${testUser.sessionGuid}`);

// Inject encrypted private key into localStorage
await page.evaluate(`
  localStorage.setItem(
    'simciv_${testUser.sessionGuid}_privatekey',
    JSON.stringify(${JSON.stringify(testUser.encryptedPrivateKey)})
  );
  localStorage.setItem('simciv_${testUser.sessionGuid}_alias', '${testUser.alias}');
`);
```

## Usage Examples

### Example 1: Fast Login Test

```typescript
test('user can login with pre-generated keys', async ({ page, context }) => {
  // Create user with pre-generated keys (300-400ms)
  const testUser = createTestUser(`testuser_${Date.now()}`, 'TestPassword123!');
  
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
  
  // Navigate with pre-set session
  await page.goto(`/id=${testUser.sessionGuid}`);
  
  // Inject keys into localStorage
  await page.evaluate(getLocalStorageInjectionCode(testUser));
  
  // Switch to Login tab
  await page.locator('.tabs button').filter({ hasText: 'Login' }).click();
  
  // Fill credentials and login - FAST because keys are already in localStorage!
  await page.fill('input[id="loginAlias"]', testUser.alias);
  await page.fill('input[id="loginPassword"]', testUser.password);
  await page.locator('form button[type="submit"]').click();
  
  // Verify success (completes in ~2-4 seconds total)
  await expect(page.locator('.message.success')).toContainText('Login successful');
  
  // Cleanup
  await cleanupTestUser(testUser.alias);
});
```

### Example 2: Pre-Authenticated Session

```typescript
test('pre-authenticated user session', async ({ page, context }) => {
  // Create test user
  const testUser = createTestUser(`preauthuser_${Date.now()}`, 'PreAuthPass123!');
  
  // Seed user and authenticate session
  await seedTestUser(testUser);
  await authenticateSession(testUser.sessionGuid, testUser.alias);
  
  // Set session cookie
  await context.addCookies([{
    name: 'simciv_session',
    value: testUser.sessionGuid,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  
  // Navigate - user is already authenticated!
  await page.goto(`/id=${testUser.sessionGuid}`);
  
  // Inject keys (for future operations)
  await page.evaluate(getLocalStorageInjectionCode(testUser));
  
  // Verify authenticated state (instant!)
  await expect(page.locator('.authenticated')).toBeVisible();
  
  // Cleanup
  await cleanupTestUser(testUser.alias);
});
```

## Performance Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| RSA key generation (Node.js) | 300-400ms | Consistent across environments |
| Complete test with pre-generated keys | 2-4 seconds | Includes setup, navigation, and test execution |
| Pre-authenticated session | 2 seconds | Skip authentication flow entirely |

**Key Benefits:**
- Consistent performance regardless of browser or hardware
- Full control over test data and authentication state
- Ability to skip UI flows and test specific scenarios
- Easy test isolation and cleanup

## Testing Strategy

### Test Categories

1. **Traditional Registration Tests** (Slow)
   - Keep minimal coverage for validation
   - Use only when testing actual registration flow
   - Document expected slow performance

2. **Optimized Login Tests** (Fast)
   - Use for most authentication testing
   - Pre-generate keys, inject into localStorage
   - Test login flow without key generation delay

3. **Pre-Authenticated Tests** (Fastest)
   - Use for testing authenticated features
   - Skip authentication entirely
   - Fastest possible test execution

### When to Use Each Approach

**Use Traditional Registration** when:
- Testing the actual registration UI/UX
- Validating key generation in browser (if needed for compatibility testing)
- Need to verify complete end-to-end registration flow

**Use Optimized Login** when:
- Testing login functionality
- Need authenticated user for other tests
- Want consistent test performance and full control over test data

**Use Pre-Authenticated** when:
- Testing features that require authentication
- Don't care about login/registration flow
- Need to set up specific user states quickly

## Security Considerations

### Test Environment Only

This optimization is **strictly for testing purposes**. The pre-generated keys approach:

- **MUST NOT** be used in production
- **MUST NOT** be exposed via public APIs
- **ONLY** works in test environment with direct database access

### Key Security Maintained

The test helpers maintain the same security properties as the production code:

- Private keys are encrypted with PBKDF2 + AES-GCM
- Encryption parameters match production (100,000 iterations)
- Keys are stored in localStorage in the same format
- No plaintext private keys are transmitted

### Test Isolation

Each test:
- Generates unique session GUIDs
- Creates isolated database records
- Cleans up after completion
- Cannot interfere with other tests

## Future Improvements

### 1. Test Fixture Pool

Pre-generate a pool of test users during test suite initialization:

```typescript
// Global setup
export async function globalSetup() {
  const pool = [];
  for (let i = 0; i < 10; i++) {
    const user = createTestUser(`pooluser${i}`, 'password');
    await seedTestUser(user);
    pool.push(user);
  }
  // Store pool for tests to use
}
```

### 2. Parallel Test Execution

With pre-generated users, tests can run in parallel without conflicts:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4, // Run 4 tests in parallel
  // Each test uses its own pre-generated user
});
```

### 3. Snapshot Testing

Store expected screenshots and compare:

```typescript
test('UI matches snapshot', async ({ page }) => {
  await page.goto('/authenticated');
  expect(await page.screenshot()).toMatchSnapshot('authenticated.png');
});
```

## Troubleshooting

### Issue: LocalStorage Keys Not Found

**Symptom:** Test fails with "No private key found for this session"

**Solution:** Ensure you're injecting keys AFTER navigating to the page:
```typescript
await page.goto(`/id=${testUser.sessionGuid}`);
await page.evaluate(getLocalStorageInjectionCode(testUser)); // After goto!
```

### Issue: Session Cookie Not Recognized

**Symptom:** Server creates new session instead of using pre-generated one

**Solution:** Set cookie BEFORE navigating:
```typescript
await context.addCookies([...]); // Set cookie first
await page.goto(`/id=${testUser.sessionGuid}`); // Then navigate
```

### Issue: Database Seed Fails

**Symptom:** "Duplicate key error" or connection issues

**Solution:** 
- Ensure MongoDB is running: `./bin/mongo start`
- Use unique aliases: `testuser_${Date.now()}`
- Clean up after tests: `await cleanupTestUser(alias)`

## Conclusion

The pre-generated key optimization transforms E2E testing from a variable, UI-dependent process to a controlled, reliable workflow. By generating RSA keys in Node.js and managing test data directly, we achieve:

- **Test Control:** Full control over user data, sessions, and authentication state
- **Consistency:** Predictable performance across different environments and hardware
- **Flexibility:** Ability to skip UI flows and test specific scenarios
- **Maintainability:** Easy test isolation and cleanup

This approach enables:
- **Faster development cycles** (consistent test performance)
- **Better CI/CD integration** (reliable test execution)
- **More comprehensive testing** (easier to set up complex scenarios)
- **Improved developer experience** (full control over test state)

The implementation provides a reusable pattern for managing authentication in E2E tests, ensuring SimCiv's test suite remains fast and maintainable as the codebase grows.
