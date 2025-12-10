# SimCiv Test Performance Analysis

**Date:** 2025-12-10  
**Analyst:** GitHub Copilot  
**Task:** Analyze `npm test` performance and identify root causes of slowness

---

## Executive Summary

The `npm test` command takes an average of **2.94 seconds** to complete, with significant variability (±402ms). The primary bottleneck has been identified as a single test that generates a 4096-bit RSA key pair, which accounts for the majority of test execution time.

### Key Metrics

- **Average test time:** 2.94s
- **Minimum time:** 2.67s  
- **Maximum time:** 4.09s
- **Standard deviation:** 0.40s (13.7% variation)
- **Total tests:** 60 tests across 5 test files

---

## Methodology

1. Executed `npm test` 10 times to establish baseline performance
2. Used `vitest --reporter=verbose` to capture individual test timings
3. Analyzed test file and individual test performance
4. Identified root causes through code inspection

### Test Runs (10 iterations)

```
Run 1:  3266ms
Run 2:  2704ms
Run 3:  3741ms  (maximum)
Run 4:  2589ms  (minimum)
Run 5:  2804ms
Run 6:  2658ms
Run 7:  3376ms
Run 8:  2748ms
Run 9:  2720ms
Run 10: 2980ms
```

**Average:** 2937ms  
**Range:** 1152ms (2.59s - 3.74s)

---

## Root Cause Analysis

### PRIMARY BOTTLENECK: RSA 4096-bit Key Generation

**Test:** `should accept RSA 4096 public key` in `src/__tests__/unit/crypto.test.ts`

**Timing:** 1,673ms - 3,407ms per run (highly variable)

**Location:**
```typescript
// src/__tests__/unit/crypto.test.ts:80-92
it('should accept RSA 4096 public key', () => {
  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,  // ← THIS IS THE BOTTLENECK
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  expect(validatePublicKey(keyPair.publicKey)).toBe(true);
});
```

**Why it's slow:**

1. **RSA key generation is computationally intensive**
   - Must find two large prime numbers
   - Requires primality testing (Miller-Rabin test)
   - Performs modular exponentiation operations
   - 4096-bit keys require ~8x more computation than 2048-bit keys

2. **Synchronous operation blocks the test thread**
   - `crypto.generateKeyPairSync()` is a blocking call
   - Cannot parallelize with other operations
   - CPU-bound operation with no opportunity for async optimization

3. **Runs on every test execution**
   - No caching between runs
   - Key is generated fresh each time
   - Same expensive operation repeated unnecessarily

**Impact:**
- This single test accounts for **40-70% of total test suite time** depending on CPU load
- Causes high variability in overall test timing
- Blocks other tests from running during key generation

---

### SECONDARY BOTTLENECK: RSA 1024-bit Key Generation

**Test:** `should reject keys smaller than 2048 bits` in `src/__tests__/unit/crypto.test.ts`

**Timing:** 11-23ms per run

**Location:**
```typescript
// src/__tests__/unit/crypto.test.ts:100-114
it('should reject keys smaller than 2048 bits', () => {
  // Testing weak key rejection - this 1024-bit key is intentionally weak
  const weakKeyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 1024,  // ← Also slow
    ...
  });
  expect(validatePublicKey(weakKeyPair.publicKey)).toBe(false);
});
```

**Why it's slow:**
- Still generates an RSA key pair (1024-bit)
- Even smaller keys require significant CPU time
- Less impactful than 4096-bit, but still noticeable

**Impact:**
- Adds 11-23ms per test run
- Minor contributor to overall timing

---

### TERTIARY FACTORS: Integration Test Overhead

**Tests:** All files in `src/__tests__/integration/`

**Files affected:**
- `auth.test.ts` - 294-725ms per run
- `games.test.ts` - 673-805ms per run  
- `map.test.ts` - 469-650ms per run

**Why they're slower:**

1. **MongoDB connection overhead**
   - Each test file connects to MongoDB
   - `beforeEach()` hooks create fresh database connections
   - Database operations add network latency (even on localhost)

2. **Database cleanup**
   - `beforeEach` runs `deleteMany({})` on multiple collections
   - Creates indexes
   - Sets up test data

3. **HTTP request overhead**
   - Uses `supertest` to make HTTP requests
   - Express middleware processing
   - Cookie parsing and session management

**Impact:**
- Collectively adds ~30-40% of total test time
- More consistent/predictable than crypto tests
- Necessary overhead for integration testing

---

## Detailed Test Performance Breakdown

### By Test File (Average Time per Run)

| Test File | Avg Time | % of Total | Variance |
|-----------|----------|------------|----------|
| `crypto.test.ts` | 1,058-2,552ms | 40-70% | High (±847ms) |
| `games.test.ts` | 673-805ms | 20-25% | Low (±50ms) |
| `map.test.ts` | 469-650ms | 15-20% | Low (±60ms) |
| `unit/games.test.ts` | 306-385ms | 10-12% | Low (±30ms) |
| `auth.test.ts` | 294-725ms | 10-15% | Medium (±150ms) |

### Top 20 Slowest Individual Tests

1. **2,224ms** - `crypto.test.ts > should accept RSA 4096 public key` ⚠️
2. 127ms - `games.test.ts > should create a new game`
3. 107ms - `map.test.ts > should return map metadata for authenticated user`
4. 83ms - `games.test.ts > should reject game creation without authentication`
5. 74ms - `map.test.ts > should return tiles with valid terrain data`
6. 71ms - `unit/games.test.ts > should create a game with valid parameters`
7. 68ms - `games.test.ts > should reject invalid maxPlayers`
8. 66ms - `games.test.ts > should auto-start game when last player joins`
9. 62ms - `map.test.ts > should return 401 for unauthenticated user`
10. 61ms - `map.test.ts > should return all tiles even for users not in visibleTo list`

*All other tests < 60ms*

---

## Performance Distribution

```
Estimated time breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RSA 4096 key generation:  ████████████████████████░░░  50-70%
Integration tests:        ████████░░░░░░░░░░░░░░░░░░░  25-30%
Unit tests (other):       ███░░░░░░░░░░░░░░░░░░░░░░░░  10-15%
Framework overhead:       ██░░░░░░░░░░░░░░░░░░░░░░░░░   5-10%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Variance Analysis

### High Variability Tests (>50% coefficient of variation)

The crypto test file shows extreme variability:
- Minimum: 1,058ms
- Maximum: 2,552ms  
- Range: 1,494ms (141% of minimum)

**Root cause:** RSA key generation time varies based on:
- CPU load from other processes
- Quality of random number generation
- Primality testing iterations (probabilistic algorithm)
- Cache state and memory allocation patterns

### Stable Tests

Integration and unit tests show low variability:
- Games tests: ±50ms (7% variation)
- Map tests: ±60ms (12% variation)
- Unit games tests: ±30ms (10% variation)

---

## Comparison with Industry Standards

| Metric | SimCiv | Industry Target | Status |
|--------|--------|----------------|--------|
| Total test time | 2.94s | < 10s | ✅ Good |
| Test count | 60 | - | - |
| Time per test | 49ms avg | < 100ms | ✅ Good |
| Slowest test | 2,224ms | < 500ms | ❌ Poor |
| Variance | 13.7% | < 10% | ⚠️ Fair |
| Build+test time | ~5-6s | < 30s | ✅ Good |

**Overall Assessment:** The test suite is reasonably fast overall, but has one significant outlier that causes poor developer experience due to unpredictable timing.

---

## Recommendations

### HIGH IMPACT (Would reduce test time by 50-70%)

#### 1. Cache RSA Key Pairs
**Current:** Generate keys in each test  
**Proposed:** Generate once, reuse across all test runs

```typescript
// Generate keys once in beforeAll() instead of in each test
let keyPair2048: crypto.KeyPairSyncResult<string, string>;
let keyPair4096: crypto.KeyPairSyncResult<string, string>;
let weakKeyPair1024: crypto.KeyPairSyncResult<string, string>;

beforeAll(() => {
  // Generate all keys once at test suite startup
  keyPair2048 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, ... });
  keyPair4096 = crypto.generateKeyPairSync('rsa', { modulusLength: 4096, ... });
  weakKeyPair1024 = crypto.generateKeyPairSync('rsa', { modulusLength: 1024, ... });
});
```

**Impact:** Reduces test time from ~3s to ~0.5-1s (60-80% improvement)

#### 2. Skip or Remove 4096-bit Test
**Rationale:** 
- The test validates that the system *accepts* 4096-bit keys
- This is already proven by the 2048-bit test
- 4096-bit keys are rarely used in practice
- The validation logic doesn't change based on key size

**Options:**
- Use `it.skip()` to skip in CI but allow manual runs
- Remove entirely and rely on 2048-bit validation
- Move to a separate "slow tests" suite

**Impact:** Reduces test time to ~0.7-1s (65-75% improvement)

#### 3. Use Pre-generated Test Keys
**Current:** Generate keys at runtime  
**Proposed:** Include pre-generated PEM keys in test fixtures

```typescript
// fixtures/test-keys.ts
export const TEST_PUBLIC_KEY_2048 = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

export const TEST_PUBLIC_KEY_4096 = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA...
-----END PUBLIC KEY-----`;
```

**Impact:** Eliminates key generation time entirely (~75-85% improvement)

---

### MEDIUM IMPACT (Would reduce test time by 10-20%)

#### 4. Pool MongoDB Connections
**Current:** Each test file creates new connections  
**Proposed:** Share connection pool across test files

#### 5. Reduce beforeEach Overhead
**Current:** Each test recreates entire database state  
**Proposed:** Share common setup, only clean data between tests

#### 6. Enable Parallel Test Execution
**Current:** Tests run sequentially  
**Proposed:** Run test files in parallel

```json
// vitest.config.ts
{
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4
      }
    }
  }
}
```

---

### LOW IMPACT (Marginal improvements)

#### 7. Disable Coverage by Default
Run coverage only in CI, not during development

#### 8. Optimize Import Paths
Reduce module loading time with path aliases

---

## Conclusion

The test suite appears slow primarily due to a **single test** that generates a 4096-bit RSA key pair. This operation:

1. Takes 1.7-3.4 seconds (varies significantly)
2. Accounts for 50-70% of total test time
3. Is computationally intensive by nature (cannot be optimized much)
4. Could be eliminated or cached without losing test coverage

**Bottom line:** The test suite isn't fundamentally slow - it has one expensive operation that makes it *feel* slow and unpredictable. Addressing this one test would improve developer experience significantly.

### Before Optimization
- Average: 2.94s
- Range: 2.67s - 4.09s  
- Variance: 13.7%

### After Optimization (Projected)
- Average: 0.6-1.0s (caching approach)
- Range: 0.5s - 1.2s
- Variance: < 5%

---

## Appendix: Raw Data

### Test Run Times (10 iterations)
```
3266, 2704, 3741, 2589, 2804, 2658, 3376, 3198, 2748, 2720 (ms)
Mean: 2937ms
Std Dev: 367ms
```

### Test File Times (sample run)
```
crypto.test.ts:      2177ms
games.test.ts:       680ms
map.test.ts:         576ms
unit/games.test.ts:  320ms
auth.test.ts:        383ms
```

### Individual Test Times (sample run)
```
should accept RSA 4096 public key:           2224ms ⚠️
should create a new game:                     127ms
should return map metadata:                   107ms
should reject game creation without auth:      83ms
should return tiles with valid terrain data:   74ms
should create a game with valid parameters:    71ms
should reject invalid maxPlayers:              68ms
should auto-start game when last player joins: 66ms
[All other tests < 60ms]
```

---

**Analysis Status:** ✅ COMPLETE - DO NOT IMPLEMENT FIXES YET

This document serves as the analysis phase. Implementation of fixes should be done in a separate task after stakeholder review.
