# Test Performance Analysis - Quick Summary

## Problem Statement
`npm test` appears slow and has unpredictable execution time.

## Key Findings

### Overall Performance
- **Average time:** 2.94 seconds
- **Range:** 2.67s - 4.09s  
- **Variability:** ±402ms (13.7% standard deviation)
- **Total tests:** 60 tests across 5 files

### The Bottleneck

**ONE test is responsible for 50-70% of test time:**

```typescript
// src/__tests__/unit/crypto.test.ts:80-92
it('should accept RSA 4096 public key', () => {
  const keyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,  // ← THIS LINE IS THE PROBLEM
    ...
  });
  expect(validatePublicKey(keyPair.publicKey)).toBe(true);
});
```

**Timing:** 1,673ms - 3,407ms (varies significantly based on CPU load)

## Root Cause

RSA 4096-bit key generation using `crypto.generateKeyPairSync()` is extremely CPU-intensive:

1. **Prime number generation** - Must find two large primes using probabilistic tests
2. **Modular exponentiation** - Complex mathematical operations
3. **Key size impact** - 4096-bit keys require ~8x more computation than 2048-bit
4. **Synchronous blocking** - Blocks the entire test thread during generation
5. **No caching** - Regenerates the same key on every test run

## Impact

```
Test Time Distribution:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RSA 4096 key test:    ████████████████████████████░░░░  50-70% (1.7-3.4s)
Integration tests:    ████████░░░░░░░░░░░░░░░░░░░░░░░░  20-30% (0.7-1.0s)
Other unit tests:     ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10-15% (0.3-0.5s)
Framework overhead:   ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5-10% (0.2-0.3s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Secondary Factors

### 2. Weak key generation test
- **Test:** `should reject keys smaller than 2048 bits`
- **Time:** 11-23ms
- **Impact:** Minor, but still generates a 1024-bit RSA key unnecessarily

### 3. Integration test overhead
- **Files:** auth.test.ts, games.test.ts, map.test.ts
- **Time:** 300-800ms per file
- **Cause:** MongoDB connections, HTTP requests, database cleanup in beforeEach()
- **Impact:** Consistent ~1 second overhead across all integration tests

## Recommendations (NOT IMPLEMENTED YET)

### Quick Wins (High Impact)

**Option 1: Cache keys in beforeAll() - BEST APPROACH**
```typescript
let keyPair4096: crypto.KeyPairSyncResult<string, string>;
let weakKeyPair: crypto.KeyPairSyncResult<string, string>;

beforeAll(() => {
  // Generate once, reuse in all tests
  keyPair4096 = crypto.generateKeyPairSync('rsa', { modulusLength: 4096, ... });
  weakKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 1024, ... });
});

it('should accept RSA 4096 public key', () => {
  expect(validatePublicKey(keyPair4096.publicKey)).toBe(true);
});
```
**Expected result:** Reduce test time from ~3s to ~0.6-0.8s (70-80% improvement)

**Option 2: Use pre-generated test fixtures**
```typescript
const TEST_KEY_4096 = fs.readFileSync('fixtures/test-rsa-4096.pem', 'utf8');
```
**Expected result:** Reduce test time to ~0.5s (85% improvement)

**Option 3: Skip the test**
```typescript
it.skip('should accept RSA 4096 public key', () => { ... });
```
**Expected result:** Reduce test time to ~0.7s (75% improvement)

### Medium Impact

- Pool MongoDB connections across integration tests
- Run tests in parallel with `--pool=threads`
- Share database setup in integration tests

## Projected Performance

| Scenario | Time | Improvement |
|----------|------|-------------|
| **Current** | 2.94s | - |
| With cached keys | 0.6-0.8s | 70-75% faster |
| With fixtures | ~0.5s | 85% faster |
| Skip 4096 test | ~0.7s | 75% faster |

## Developer Experience Impact

**Before:** Tests take 2-4 seconds with high variability - feels slow and unpredictable

**After:** Tests take <1 second consistently - feels instant

## Next Steps

1. Review this analysis
2. Choose optimization approach
3. Implement changes
4. Verify performance improvement
5. Update documentation

---

**See TEST_PERFORMANCE_ANALYSIS.md for complete details with raw data, timing charts, and methodology.**
