# Science Production Discontinuity Analysis

**Date:** 2025-10-26  
**Issue:** Huge gap between allocations (1 year vs 20+ years) creating cliff effect  
**Root Cause:** Population collaboration bonus using log10 creates compounding feedback

---

## The Problem

Current test results show a massive discontinuity:
- **50/50 allocation:** 295 days (0.81 years) - final pop 448
- **60/40 allocation:** 360 days (0.99 years) - final pop 496  
- **70/30 allocation:** ~22 years - final pop 441

Despite similar final populations, completion times differ by **20x**. This creates a "cliff effect" where small allocation changes cause dramatic outcome differences.

---

## Root Cause: Log10 Population Bonus

### Current Formula
```go
func produceScience(scienceHours float64, population int, averageHealth float64) float64 {
    multiplier := 1.0
    multiplier *= math.Log10(float64(population))  // ← THE PROBLEM
    return scienceHours * ScienceBaseRate * multiplier
}
```

### Why This Creates a Cliff

The log10 bonus creates a **positive feedback loop**:

1. **More food → Faster population growth**
   - 50/50: More food → population grows from 100 to 448 quickly
   - 70/30: Less food → population grows from 100 to 441 slowly

2. **Larger population → Higher science multiplier**
   - Pop 100: log10(100) = 2.0
   - Pop 200: log10(200) = 2.301 (+15% science)
   - Pop 300: log10(300) = 2.477 (+24% science)
   - Pop 400: log10(400) = 2.602 (+30% science)
   - Pop 500: log10(500) = 2.699 (+35% science)

3. **Early population advantage compounds**
   - 50/50 reaches pop 200 in ~100 days → gets +15% science boost early
   - 70/30 reaches pop 200 in ~200 days → loses the early boost
   - This early advantage cascades through the entire simulation

### Mathematical Impact

At population 100 (starting):
- 70/30: 240 sci hours/day * 0.00050 * 2.0 = 0.24 science/day
- 50/50: 400 sci hours/day * 0.00050 * 2.0 = 0.40 science/day
- **Ratio: 1.67x** (expected based on hour allocation)

At population 400 (after growth):
- 70/30: 720 sci hours/day * 0.00050 * 2.602 = 0.94 science/day
- 50/50: 1200 sci hours/day * 0.00050 * 2.602 = 1.56 science/day
- **Ratio: 1.66x** (still proportional)

**BUT** 50/50 reaches pop 400 much faster, getting the 2.602 multiplier earlier, creating the cliff.

---

## Why This Violates Design Intent

From the design doc (HUMAN_ATTRIBUTES.md):
```
- Population size: * log10(population) (collaboration bonus)
```

The intention was that **larger populations are better at science**, which makes sense. However, the implementation creates an unintended side effect:

- **Food allocation indirectly controls science speed via population growth**
- This wasn't the intended mechanic - food allocation should directly trade off food vs science
- The log10 bonus was meant to reward **absolute population size**, not **early population growth**

---

## Solutions

### Option 1: Remove or Cap Log10 Bonus (RECOMMENDED)

**Change:**
```go
// BEFORE (problematic):
multiplier *= math.Log10(float64(population))

// AFTER (fixed):
multiplier *= math.Min(2.5, math.Log10(float64(population)))
```

**Effect:** Caps the bonus at population 316 (log10(316) ≈ 2.5)
- Eliminates most of the compounding effect
- Still rewards larger populations, but with diminishing returns
- Makes allocation choice more linear and predictable

**Test prediction with cap at 2.5:**
- 50/50: ~350-400 days (~1 year) - minor slowdown
- 60/40: ~400-450 days (~1.2 years) - minor slowdown
- 70/30: ~800-1200 days (~2.5-3.5 years) - MAJOR speedup

### Option 2: Use Square Root Instead of Log10

**Change:**
```go
// BEFORE:
multiplier *= math.Log10(float64(population))

// AFTER:
multiplier *= math.Sqrt(float64(population)) / 10.0
```

**Effect:** Less steep scaling
- Pop 100: √100 / 10 = 1.0
- Pop 200: √200 / 10 = 1.41 (+41%)
- Pop 400: √400 / 10 = 2.0 (+100%)
- Pop 500: √500 / 10 = 2.24 (+124%)

**Problem:** Still creates compounding, just less severe

### Option 3: Remove Population Bonus Entirely

**Change:**
```go
// Remove the line entirely
// multiplier *= math.Log10(float64(population))
```

**Effect:** Science production purely based on hours worked
- Makes allocations perfectly linear
- 70/30 uses 30% for science = 30% of max science speed
- 50/50 uses 50% for science = 50% of max science speed

**Test prediction:**
- 50/50: ~500 days (~1.4 years)
- 60/40: ~625 days (~1.7 years)
- 70/30: ~833 days (~2.3 years)

This creates a smooth, predictable gradient.

### Option 4: Linear Population Bonus with Cap

**Change:**
```go
// Population bonus: +0.5% per 10 population, capped at +50%
popBonus := math.Min(1.5, 1.0 + float64(population-100)*0.005)
multiplier *= popBonus
```

**Effect:**
- Pop 100: 1.0 (no bonus)
- Pop 200: 1.5 (+50%, capped)
- Pop 300+: 1.5 (capped)

**Result:** Small bonus for growth, but capped to prevent compounding

---

## Recommendation: Remove Population Bonus Entirely (Option 3)

**Rationale:**
1. **Simplicity:** Makes science production directly proportional to allocation
2. **Predictability:** Players can calculate exactly how long tech will take
3. **Balance:** Eliminates the cliff effect completely
4. **Strategic depth:** Choice between food/science becomes clear trade-off

**With ScienceBaseRate = 0.00015 and no pop bonus:**

Estimated results (need to test):
- 30/70: ~3.5 years
- 40/60: ~4.5 years
- 50/50: ~6 years ✨
- 60/40: ~7.5 years ✨
- 70/30: ~9 years ✨

This achieves the **5-10 year target** across multiple allocations while maintaining smooth progression.

---

## Alternative: Adjust Base Rate to Compensate

If we keep the log10 bonus but want 5-10 years:

**Problem:** The cliff will still exist, just shifted
- We'd need a rate where 50/50 takes ~5 years
- But 70/30 would still take ~25-30 years
- The discontinuity remains

**Conclusion:** Must fix the log10 compounding to achieve smooth progression

---

## Next Steps

1. **Test Option 3** (remove pop bonus entirely) with rate ~0.00015
2. Run `TestFoodAllocationComparison` to verify smooth gradient
3. If successful, adjust rate to hit 5-10 year sweet spot
4. Update design doc to reflect the change

**Expected outcome:** Smooth progression from 3-10 years across allocations 40/60 to 70/30
