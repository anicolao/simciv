# Human Scenario Implementation Bugs

**Date:** 2025-10-25  
**Analysis:** Comparison of Go implementation vs design doc HUMAN_ATTRIBUTES.md  
**Full Report:** See `designs/HUMAN_SCENARIO_COMPARISON.md`

## Summary of Bugs Found

### Logic Bugs Requiring Fixes

1. **CRITICAL - Health Formula Wrong Breakeven Point**
   - **Location:** `simulation/pkg/simulator/mechanics.go:162`
   - **Issue:** Formula uses `(foodRatio - 0.5) * 15` instead of `foodRatio * 15`
   - **Impact:** Requires 3x more food to maintain neutral health than designed
   - **Fix:** Remove the `- HealthFoodBreakeven` subtraction

2. **HIGH - Science Health Threshold Too Low**
   - **Location:** `simulation/pkg/simulator/mechanics.go:28`
   - **Issue:** Threshold is 30 instead of 50 per design
   - **Impact:** Science production continues at low health levels, reducing strategic pressure
   - **Fix:** Change `ScienceHealthThreshold = 30.0` to `50.0`

3. **MEDIUM - Fertility Age Starts Too Late**
   - **Location:** `simulation/pkg/simulator/mechanics.go:13`
   - **Issue:** Minimum fertility age is 15 instead of 13 per design
   - **Impact:** Slightly reduced reproduction rates
   - **Fix:** Change `AgeFertileMin = 15.0` to `13.0`

4. **MEDIUM - Age Distribution Mismatch**
   - **Location:** `simulation/pkg/simulator/simulator.go:29-31`
   - **Issue:** Ages and percentages don't match design (0-14 25%, 15-30 60%, 31+ 15%)
   - **Design:** Should be (0-12 30%, 13-30 50%, 30+ 20%)
   - **Impact:** Different starting population structure
   - **Fix:** Update age ranges and percentages to match design

### Parameter Changes (Acceptable - Tuned for Viability)

The following parameter changes are **acceptable** as they were tuned for game balance:

- Food base rate: 0.3 → 1.0
- Science base rate: 1.0 → 0.0025  
- Conception rate: 3% → 6% monthly
- Default food allocation: 80% → 70%

These have been **documented in the design doc** as tuned parameters.

## Code Comments Added

All bugs have been marked with `// BUG:` comments in the source code referencing:
- The specific design doc line they violate
- The comparison analysis document
- The correct value per design

## Next Steps

1. Review bugs with team to confirm they should be fixed
2. Fix bugs 1-4 in the Go implementation
3. Re-run viability tests to ensure fixes maintain game balance
4. Adjust tuned parameters if needed to compensate for fixes
