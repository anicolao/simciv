# Human Scenario Implementation Bugs

**Date:** 2025-10-25  
**Last Updated:** 2025-10-26  
**Analysis:** Comparison of Go implementation vs design doc HUMAN_ATTRIBUTES.md  
**Full Report:** See `designs/HUMAN_SCENARIO_COMPARISON.md`  
**Impact Analysis:** See `designs/HEALTH_FIX_IMPACT.md`

## Summary of Bugs

### Fixed Bugs ✅

1. **CRITICAL - Health Formula Wrong Breakeven Point** ✅ **FIXED**
   - **Location:** `simulation/pkg/simulator/mechanics.go:172`
   - **Issue:** Formula used `(foodRatio - 0.5) * 15` instead of `foodRatio * 15`
   - **Impact:** Required 3x more food to maintain neutral health than designed
   - **Fix Applied:** Removed the `- HealthFoodBreakeven` subtraction
   - **Results:** 
     - Days to Fire Mastery: 113.5 → 101.7 (10.4% faster)
     - Average Health: 91.2 → 98.4 (+8%)
     - Final Population: 231.8 → 239.3 (+3.2%)
   - **See:** `designs/HEALTH_FIX_IMPACT.md` for complete before/after analysis

### Remaining Logic Bugs

2. **HIGH - Science Health Threshold Too Low**
   - **Location:** `simulation/pkg/simulator/mechanics.go:28`
   - **Issue:** Threshold is 30 instead of 50 per design
   - **Impact:** Science production continues at low health levels, reducing strategic pressure
   - **Status:** Not yet fixed
   - **Suggested Fix:** Change `ScienceHealthThreshold = 30.0` to `50.0`

3. **MEDIUM - Fertility Age Starts Too Late** ✅ **FIXED**
   - **Location:** `simulation/pkg/simulator/mechanics.go:13`
   - **Issue:** Minimum fertility age was 15 instead of 13 per design
   - **Impact:** Slightly reduced reproduction rates
   - **Status:** ✅ FIXED - Changed to 13.0
   - **Result:** Science completion ~6-9% slower (still in 5-10 year range)

4. **MEDIUM - Age Distribution Mismatch**
   - **Location:** `simulation/pkg/simulator/simulator.go:29-31`
   - **Issue:** Ages and percentages don't match design (0-14 25%, 15-30 60%, 31+ 15%)
   - **Design:** Should be (0-12 30%, 13-30 50%, 30+ 20%)
   - **Impact:** Different starting population structure
   - **Status:** Not yet fixed
   - **Suggested Fix:** Update age ranges and percentages to match design

### Parameter Changes (Acceptable - Tuned for Viability)

The following parameter changes are **acceptable** as they were tuned for game balance:

- Food base rate: 0.3 → 1.0
- Science base rate: 1.0 → 0.0025  
- Conception rate: 3% → 6% monthly
- Default food allocation: 80% → 70%

These have been **documented in the design doc** as tuned parameters.

## Status Summary

- ✅ **2 Bugs Fixed:** Health formula corrected (Bug #1), Fertility age corrected (Bug #3)
- ⚠️ **2 Bugs Remaining:** Science threshold, age distribution
- 📊 **Impact Measured:** See `designs/HEALTH_FIX_IMPACT.md`

## Code Comments

Bugs #1 and #3 have been fixed. Remaining bugs still have `// BUG:` comments in source code referencing:
- The specific design doc line they violate
- The comparison analysis document
- The correct value per design

## Next Steps

1. ✅ **Bug #1 fixed** - Health formula now matches design specification
2. ✅ **Bug #3 fixed** - Fertility age now 13 (matches design, science ~7% slower but still in range)
3. Review remaining bugs (2, 4) with team to determine priority
4. Consider balancing adjustments if needed
