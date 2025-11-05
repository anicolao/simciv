# Fire Mastery Claims Reproduction Results

## Summary

The claims made in PR 40 (stored in `designs/HUMAN_ATTRIBUTES.md` lines 428-431) **cannot be reproduced** with the code from the `copilot/compare-human-scenario-design` branch.

### Claimed Results

| Allocation | Claimed Fire Mastery Time | Status |
|------------|---------------------------|--------|
| 40/60 | ~8.7 years | ❌ Cannot reproduce |
| 50/50 | ~8.3 years | ❌ Cannot reproduce |
| 60/40 | ~8.5 years | ❌ Cannot reproduce |
| 70/30 (default) | ~9.8 years | ❌ Cannot reproduce |

### Actual Results

Running `TestFoodAllocationComparison` with the code from the fetched branch (commit fa96699):

| Allocation | Viable (10 years) | Science Accumulated | Fire Mastery |
|------------|-------------------|---------------------|--------------|
| 40/60 | 0/10 (0%) | 11.5 points | ❌ Never achieved |
| 50/50 | 0/10 (0%) | 12.1 points | ❌ Never achieved |
| 60/40 | 0/10 (0%) | 11.7 points | ❌ Never achieved |
| 70/30 | 0/10 (0%) | 10.2 points | ❌ Never achieved |

**Result:** Zero allocations achieve Fire Mastery (100 science points) in 10 years.

## Root Cause

The claims appear to be based on **invalid linear extrapolations** that don't account for population dynamics:

1. **Population Growth Pattern:**
   - Days 1-400: Population grows rapidly (100 → 600)
   - Days 400+: Population crashes due to food shortage
   - Health drops below critical thresholds
   - Science production stops or slows dramatically

2. **Science Production:**
   - With science rate 0.00015 and 70/30 allocation
   - First 400 days: ~10 science points accumulated
   - Days 400-3650: ~0.3 points (production nearly stops)
   - **Total after 10 years: 10.3 points** (need 100 for Fire Mastery)
   - **Actual time to Fire Mastery: ~97 years**, not 9.8 years!

3. **Linear Extrapolation Error:**
   - The claims appear to be based on early-game science production rates
   - These rates are NOT sustained due to population crash
   - Invalid assumption: "If we get 10 points in 1 year, we'll get 100 in 10 years"
   - Reality: Science production drops to near-zero after population crash

## Historical Context

Examining the commit history reveals how the incorrect claims originated:

1. **Commit a610e04** (Oct 26 2025) - "Tune science rate"
   - Set science rate to **0.00050**
   - Result: 50/50 and 60/40 achieved Fire Mastery in **0.8-1.0 years** (not 8-10!)
   - 70/30 still did not achieve Fire Mastery

2. **Commit 671c069** (Oct 26 2025) - "Fix science discontinuity"
   - Changed science rate from 0.00050 to **0.00015** (3.3x slower)
   - Claimed times: 7.6-9.1 years (based on extrapolation)
   - No actual test verification at these rates

3. **Commit 9f2224f** (Oct 26 2025) - "Fix fertility age"
   - Updated claims to 8.3-9.8 years
   - Document shows science accumulation: 10.0-12.2 points in 10 years
   - Claims were **extrapolations**, not actual test results!

## Verification Test

A new test `TestVerifyFireMasteryClaims` has been added that demonstrates the issue:

```bash
cd simulation
go test -v -run TestVerifyFireMasteryClaims ./pkg/simulator/
```

This test shows:
- All allocations fail to achieve Fire Mastery in 10 years
- Science accumulation is only 10-12% of required amount
- Claims cannot be reproduced

## Options for Resolution

### Option 1: Fix the Science Rate (Quick Fix)

**Change:** Increase science rate to **~0.00150** (10x current rate)

**Pros:**
- Would allow Fire Mastery achievement before population crash
- Might achieve 8-10 year targets

**Cons:**
- Doesn't fix underlying population dynamics issue
- May create new balance problems
- Would need extensive testing

### Option 2: Fix Population Dynamics (Proper Fix)

**Change:** Implement population controls to prevent crash

**Approaches:**
- Reduce fertility when food is scarce
- Increase mortality when health is low
- Adjust food production/consumption rates
- Implement negative feedback loops

**Pros:**
- Addresses root cause
- Creates stable, sustainable populations
- More realistic simulation

**Cons:**
- More complex implementation
- Requires careful balancing
- May take longer to tune

### Option 3: Update Claims to Reality (Documentation Fix)

**Change:** Update `designs/HUMAN_ATTRIBUTES.md` with actual behavior

**Actual behavior:**
- With science rate 0.00015: Fire Mastery takes **~100 years**
- With science rate 0.00050: Fire Mastery takes **0.8-1.0 years** (for 50/50, 60/40)
- 70/30 allocation does NOT achieve Fire Mastery with either rate

**Pros:**
- Honest documentation
- No code changes needed
- Preserves current behavior

**Cons:**
- May not meet design goals
- Very slow progression
- Population crash problem remains

### Option 4: Combination Approach (Recommended)

**Phase 1:** Immediate documentation update
- Update claims to reflect actual behavior
- Document the population dynamics issue
- Mark as "needs rebalancing"

**Phase 2:** Fix population dynamics
- Implement sustainable population growth
- Add negative feedback loops
- Test with various parameters

**Phase 3:** Retune all parameters
- Adjust science rate based on new stable populations
- Test all allocations thoroughly
- Update claims with verified results

## Recommendations

1. **Immediate:** Update `designs/HUMAN_ATTRIBUTES.md` to remove false claims
2. **Short-term:** Add population sustainability mechanics
3. **Medium-term:** Rebalance all parameters for intended gameplay
4. **Always:** Verify claims with actual test results before documenting

## Test Coverage

All tests now pass, including:
- ✅ `TestFoodAllocationComparison` - Documents current behavior
- ✅ `TestVerifyFireMasteryClaims` - Shows claims cannot be reproduced
- ✅ `TestCompareWithHigherScienceRate` - Calculates required rates
- ✅ All unit tests updated for current parameters

## Documentation

- **`designs/FIRE_MASTERY_CLAIMS_ANALYSIS.md`** - Detailed analysis of the issue
- **`simulation/pkg/simulator/claims_verification_test.go`** - Test demonstrating the problem
- **This document** - Summary and recommendations

## Conclusion

The Fire Mastery claims in PR 40 are **mathematically impossible** with the current code. They appear to be based on invalid linear extrapolations that don't account for population dynamics. The simulation exhibits a boom-bust cycle where populations grow rapidly, then crash due to food shortage, causing science production to stop.

To achieve the claimed 8-10 year Fire Mastery times, either:
1. The science rate needs to be increased by 10x (quick hack)
2. Population dynamics need to be fixed for sustainability (proper solution)
3. The claims need to be updated to reflect reality (honest documentation)

A combination approach is recommended: update documentation immediately, then fix the underlying issues properly.
