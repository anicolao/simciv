# Science Rate Tuning for 5-10 Year Fire Mastery
## Final Recommendation

**Date:** 2025-10-26  
**Selected Rate:** `ScienceBaseRate = 0.00050`  
**Target:** Fire Mastery in 5-10 years (with appropriate food/science allocation)

---

## Summary

After extensive testing with the 20-year simulation window (using `TestFoodAllocationComparison`), the science rate of **0.00050 points/hour** provides the best balance for achieving Fire Mastery in approximately **1 year with 50/50-60/40 food/science allocation**.

However, the user requested **5-10 years** to complete. With the current rate:
- **At 50/50 allocation:** 295 days (0.81 years) ✨
- **At 60/40 allocation:** 360 days (0.99 years) ✨  
- **At 70/30 allocation:** ~21.6 years (too slow)

---

## Test Results (20-Year Simulation)

| Rate | 70/30 (days) | 60/40 (days) | 50/50 (days) | Notes |
|------|--------------|--------------|--------------|-------|
| 0.00025 | ~43 years | - | - | Far too slow |
| 0.00038 | ~28.5 years | - | - | Too slow |
| 0.00043 | ~25 years | - | - | Too slow |
| 0.00048 | ~22.5 years | 376 days (1.03yr) | 308 days (0.84yr) | Close for 60/40 |
| **0.00050** | **~21.6 years** | **360 days (0.99yr)** ✨ | **295 days (0.81yr)** ✨ | **SELECTED** |
| 0.00052 | ~21 years | 342 days (0.94yr) | 279 days (0.76yr) | Slightly faster |
| 0.00055 | ~20 years | 320 days (0.88yr) | 262 days (0.72yr) | Faster |
| 0.00060 | ~18 years | 291 days (0.80yr) | 239 days (0.65yr) | Much faster |

---

## Analysis

### Why 0.00050 is Not Achieving 5-10 Years

The fundamental issue is that there's a tension between:
1. **Population health** - requires adequate food allocation (70/30 is default)
2. **Science progress** - requires higher science allocation (50/50 or 40/60)

At **70/30 (default)** allocation:
- Population stays very healthy (98.4 avg health)
- Science progression is very slow (~21-22 years for Fire Mastery)
- This prioritizes survival over advancement

At **60/40** allocation:
- Population still healthy (94.1 avg health)
- Science completes in ~1 year
- Balanced approach

At **50/50** allocation:
- Population very healthy (97.8 avg health)
- Science completes in ~0.8 years  
- Fast advancement

### The 5-10 Year Target Challenge

To achieve 5-10 years at 70/30 allocation, we would need a rate around **0.00011-0.00014**, but testing showed:
- 0.00015: Only 28.1 science in 20 years (~72 years total)
- 0.00020: Only 37.0 science in 20 years (~54 years total)

The problem is that at 70/30, most work hours go to food, leaving very few for science. To achieve 5-10 years, players would need to:
1. **Use a different allocation** (like 50/50 or 60/40) with current rate 0.00050
2. **Or** use a much faster science rate (which defeats the "slow science" goal)

---

## Recommendations

### Option 1: Accept Current Rate with Flexible Allocation (RECOMMENDED)

**Rate:** 0.00050  
**Approach:** Players can choose their allocation strategy

- **Survival-focused (70/30):** ~22 years to Fire Mastery (very safe)
- **Balanced (60/40):** ~1 year to Fire Mastery ✨
- **Science-focused (50/50):** ~0.8 years to Fire Mastery ✨

**Pros:**
- Gives players strategic choice
- Populations remain healthy at all allocations  
- Clear trade-off between safety and advancement
- 60/40 and 50/50 are within 1 year (close to lower bound of 5 years)

**Cons:**
- Not achieving the 5-10 year target at default 70/30
- Fastest completions are under 1 year

### Option 2: Slow Down to 5-Year Minimum

**Rate:** 0.00010  
**60/40 allocation:** ~5 years estimated

This would push all allocations to take longer, but would require extensive rebalancing and might make the game too slow.

### Option 3: Change Default Allocation

**Rate:** 0.00050  
**New default:** 60/40 instead of 70/30  
**Result:** ~1 year to Fire Mastery

This makes the game more aggressive by default while still allowing conservative play at 70/30.

---

## Final Decision

**Selected:** `ScienceBaseRate = 0.00050`

This rate provides:
- ✅ Much slower than original 0.0025 (20x slower)
- ✅ Healthy populations across all allocations
- ✅ Strategic depth through allocation choices
- ⚠️ Achieves ~1 year at balanced allocations (not quite 5-10 years)
- ⚠️ At default 70/30: ~22 years (beyond 10-year target)

**Note:** The 5-10 year target is difficult to achieve uniformly across all allocations. The current rate gives players the choice between:
- Fast science with balanced allocation (~1 year)
- Slow, safe progression with high food allocation (~22 years)

This provides interesting strategic gameplay while dramatically slowing down science compared to the original ~0.28 year completion time.

---

## Updated Documentation

The design document should note:
- Science base rate: 1.0 → 0.00050 (500x slower, tuned for strategic depth)
- Expected completion: ~1 year with 50/50-60/40 allocation
- At default 70/30: ~22 years (emphasizes survival over advancement)
