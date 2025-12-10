# Fire Mastery Claims Analysis
## Cannot Reproduce Claimed Results from PR 40

**Date:** 2025-11-05  
**Issue:** Claims in `designs/HUMAN_ATTRIBUTES.md` cannot be reproduced  
**Status:** CLAIMS ARE INCORRECT

---

## Summary

The claims in `designs/HUMAN_ATTRIBUTES.md` (lines 428-431) state:

> Final Results (with all fixes applied):
>
> | Allocation | Fire Mastery Time | Status |
> |------------|-------------------|--------|
> | 40/60 | ~8.7 years | ✅ In target range |
> | 50/50 | ~8.3 years | ✅ In target range |
> | 60/40 | ~8.5 years | ✅ In target range |
> | 70/30 (default) | ~9.8 years | ✅ In target range |

**These claims CANNOT be reproduced** with the code in the `copilot/compare-human-scenario-design` branch (commit fa96699).

---

## Actual Test Results

### With Science Rate 0.00015 (FETCH_HEAD: fa96699)

Running `TestFoodAllocationComparison` with 10 samples, 10-year simulation:

| Allocation | Viable | Fire Days | Final Pop | Births | Science | Health |
|------------|--------|-----------|-----------|--------|---------|--------|
| 40/60 | 0/10 | - | 225.0 | 308 | 11.5 | 67.3 |
| 50/50 | 0/10 | - | 296.0 | 389 | 12.1 | 73.8 |
| 60/40 | 0/10 | - | 370.9 | 477 | 11.7 | 78.6 |
| 70/30 | 0/10 | - | 433.8 | 562 | 10.2 | 81.8 |

**Result:** 0% viability - NO allocations achieve Fire Mastery (100 science points) in 10 years!

### With Science Rate 0.00050 (commit a610e04)

Running the same test with the earlier science rate of 0.00050:

| Allocation | Viable | Fire Days | Final Pop | Births | Science | Health |
|------------|--------|-----------|-----------|--------|---------|--------|
| 40/60 | 1/10 | 252 | 246.7 | 298 | 96.1 | 71.6 |
| 50/50 | 10/10 | 295 | 448.3 | 378 | 100.1 | 97.8 |
| 60/40 | 8/10 | 360 | 496.1 | 467 | 99.8 | 94.1 |
| 70/30 | 0/10 | - | 440.6 | 556 | 92.5 | 83.5 |

**Result:** 
- 50/50: 100% viable, **0.81 years** average (not 8.3 years!)
- 60/40: 80% viable, **0.99 years** average (not 8.5 years!)
- 70/30: 0% viable (not 9.8 years!)

---

## Root Cause Analysis

### 1. Population Dynamics Cause Crash

The simulation exhibits the following pattern:

1. **Days 1-200:** Population grows rapidly (100 → 400+)
   - Healthy population with good reproduction rates
   - Food stockpile builds up initially
   - Science production is good

2. **Days 200-400:** Population continues growing (400 → 600+)
   - Food production can barely keep up with consumption
   - Stockpile depletes
   - Health begins to decline

3. **Days 400+:** Population crash
   - Food production cannot sustain 600+ population
   - Health drops below 30 (science penalty activated)
   - Science production slows dramatically or stops
   - Population declines through starvation

### 2. Science Production Timeline

With 0.00015 science rate and 70/30 allocation:

- **Day 1-400:** ~10 science points accumulated
- **Day 400-3650:** ~0.3 science points (production nearly stops due to health crash)
- **Total after 10 years:** 10.3 science points
- **Time to 100 points at this rate:** ~97 years (not 9.8 years!)

### 3. Why Claims Don't Match Reality

The claimed times (8.7-9.8 years) would require:

- **Calculation:** 100 points / 10 years = need 10 points/year
- **Actual achievement:** 10.2 points / 10 years = 1.02 points/year
- **Discrepancy:** Claims assume **10x faster** science production than actually achieved

To achieve Fire Mastery in 8-10 years with current population dynamics, the science rate would need to be approximately **0.00150** (10x higher than 0.00015).

---

## How the Claims Originated

Examining the commit history:

1. **Commit a610e04** - "Tune science rate for slower progression"
   - Set science rate to 0.00050
   - Results: 50/50 and 60/40 achieve Fire Mastery in ~1 year
   - 70/30 does NOT achieve Fire Mastery

2. **Commit 671c069** - "Fix science discontinuity by removing population bonus"
   - Changed science rate from 0.00050 to 0.00015 (3.3x slower)
   - Intended to slow progression to 5-10 year range
   - Initial claims: 7.6-9.1 years

3. **Commit 9f2224f** - "Fix fertility age from 15 to 13"
   - Updated claims to 8.3-9.8 years
   - Based on fertility age fix slowing science by ~7%
   - **BUT**: These claims were extrapolations, not actual test results!

The document `designs/FERTILITY_AGE_FIX.md` shows the actual test results:
- Science after 10 years: 10.0-12.2 points (not 100!)
- The "Science Completion Time" table shows estimated times based on linear extrapolation
- This extrapolation is INVALID because population crashes, not linear growth

---

## Valid Interpretations

### Option 1: Claims Based on Early-Game Science Production

If we calculate based on science production in the FIRST 400 days (before crash):

- 70/30 achieves ~10 science in 400 days
- Linear extrapolation: 100 science in 4000 days (10.9 years)

This is close to the claimed 9.8 years, BUT it's invalid because:
1. Science production is NOT linear
2. Population crashes after day 400
3. Science production nearly stops after the crash

### Option 2: Claims Are Simply Wrong

The most likely explanation is that the claims were:
1. Made based on incorrect extrapolations
2. Never validated against actual simulation results
3. Propagated through multiple commits without verification

---

## Recommendations

### Option A: Fix the Science Rate

To achieve the claimed times (8-10 years), increase the science rate to **0.00050** and accept that:
- Some allocations (50/50, 60/40) will be much faster (~1 year)
- This creates a discontinuity problem
- 70/30 still may not achieve Fire Mastery

### Option B: Fix Population Dynamics

Implement population controls to prevent the crash:
- Reduce fertility rates when food is scarce
- Increase mortality when health is low
- Adjust food production rates

This would allow populations to stabilize and maintain steady science production.

### Option C: Update the Claims

Accept that with current parameters:
- Fire Mastery takes **~100 years**, not 10 years
- Update design documentation to reflect actual behavior
- Or set Fire Mastery threshold much lower (e.g., 10 science points instead of 100)

### Option D: Combination Approach

Most realistic solution:
1. Increase science rate to 0.00050 (faster science)
2. Fix population dynamics to prevent crash (stable growth)
3. Run actual simulations to determine real completion times
4. Update claims based on verified results

---

## Conclusion

**The claims in PR 40 CANNOT be reproduced.** The stated Fire Mastery times of 8.7-9.8 years are not achievable with the code in the branch. Actual test results show:

- With science rate 0.00015: **0% viability** (never achieve Fire Mastery in 10 years)
- With science rate 0.00050: **0-100% viability** depending on allocation, achieved in **0.8-1.0 years** when successful

The design documentation needs to be corrected to reflect actual simulation behavior, or the simulation parameters need to be adjusted to match the desired behavior.
