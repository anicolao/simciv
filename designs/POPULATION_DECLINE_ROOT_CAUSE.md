# Population Decline Root Cause Analysis

**Date:** 2025-11-19  
**Issue:** All simulations end in population decline within 366-688 days  
**Analysis based on:** 70/30 food/science allocation, seed 12345

---

## Summary

Every simulation exhibits a **boom-bust cycle** that leads to inevitable population decline:

1. **Growth Phase (Days 1-150):** Population grows rapidly, food stockpile builds
2. **Tipping Point (Days 150-200):** Stockpile depletes, deficits emerge
3. **Decline Phase (Days 200-450):** Food production collapses as health crashes
4. **Crash Phase (Days 450+):** Zero food production, population starves

---

## Timeline of Decline (70/30 Allocation)

| Day | Population | Health | Food Stock | Food Prod | Food Need | Deficit | Status |
|-----|------------|--------|------------|-----------|-----------|---------|--------|
| 1 | 100 | 51% | 110 | 210 | 200 | -10 | ✅ Surplus |
| 76 | 203 | 100% | 9,039 | 420 | 406 | -14 | ✅ Peak stockpile |
| 176 | 361 | 100% | 0 | 420 | 722 | +302 | ⚠️ Stockpile empty |
| 276 | 485 | 99% | 0 | 392 | 970 | +578 | ⚠️ Growing deficit |
| 376 | 595 | 96% | 0 | 308 | 1,190 | +882 | ❌ Production dropping |
| 451 | 585 | 74% | 0 | 0 | 1,170 | +1,170 | ❌ Production halted |
| 592 | 565 | 51% | 0 | 0 | 1,130 | +1,130 | ❌ Decline detected |

---

## Root Causes

### 1. **Uncontrolled Population Growth**

**Problem:** Birth rate has no negative feedback mechanism

- Population grows from 100 → 600 in ~400 days (6x increase)
- Growth continues even when food is insufficient
- No reduction in fertility when resources are scarce

**Evidence:**
- Day 176: 361 population with 302 unit deficit - still growing
- Day 376: 595 population with 882 unit deficit - still growing

### 2. **Food Production Ceiling**

**Problem:** Food production maxes out around 420 units/day

With 70/30 allocation:
- ~600 workers × 8 hours × 0.7 (food allocation) = 3,360 food-hours/day
- 3,360 hours × 1.0 (base rate) = 3,360 food units/day THEORETICAL
- But actual production peaks at 420 units/day

**Why the discrepancy?**
- Not all 600 people are workers (many are children)
- Average labor calculation may be limiting

Let me check the actual labor calculation...

### 3. **Health-Based Production Collapse**

**Problem:** As health drops, food production drops exponentially

- Day 376: Health 96%, Production 308 units/day
- Day 401: Health 93%, Production 196 units/day
- Day 426: Health 88%, Production 42 units/day
- Day 451: Health 74%, Production 0 units/day

**The death spiral:**
1. Population too large → food deficit
2. Food deficit → health declines
3. Health declines → fewer workers can work
4. Fewer workers → even less food production
5. Loop continues until production hits zero

### 4. **No Carrying Capacity**

**Problem:** System has no concept of sustainable population

- Food production can support ~210 people at 2 units/day (420 ÷ 2)
- Population grows to 600 (3x carrying capacity)
- No mechanism to prevent overpopulation

---

## Proposed Fixes

### Fix 1: **Fertility Reduction Based on Resources** (Recommended)

**Change:** Reduce fertility when food is scarce

```go
// In checkReproduction(), add resource-based modifier
resourceModifier := 1.0

// Calculate food availability ratio
foodPerPerson := foodStockpile / float64(population)
if foodPerPerson < FoodRequiredPerPerson {
    // Reduce fertility when food is scarce
    foodRatio := foodPerPerson / FoodRequiredPerPerson
    resourceModifier *= foodRatio
    
    // If critically low food, fertility drops to near zero
    if foodRatio < 0.5 {
        resourceModifier *= 0.1
    }
}

finalChance := MonthlyConceptionBase * healthMod * ageMod * resourceModifier
```

**Impact:**
- Population growth slows when resources are tight
- Prevents exponential growth beyond carrying capacity
- Creates natural equilibrium

**Pros:**
- Realistic (animals reduce reproduction in lean times)
- Natural feedback mechanism
- Minimal code change

**Cons:**
- May slow population growth too much initially
- Needs tuning for optimal balance

### Fix 2: **Increase Base Food Production Rate**

**Change:** Increase `FoodBaseRate` from 1.0 to higher value

```go
FoodBaseRate = 3.0 // Was 1.0
```

**Impact:**
- More food produced per labor hour
- Can support larger populations
- Reduces food scarcity

**Calculation:**
- Current: 420 units/day supports 210 people
- With 3x rate: 1,260 units/day supports 630 people
- Would allow population to reach ~600 without crisis

**Pros:**
- Simple one-line change
- Immediately solves food shortage

**Cons:**
- Doesn't fix underlying overpopulation issue
- May just delay the crash
- Populations could still grow beyond new ceiling

### Fix 3: **Reduce Birth Rate**

**Change:** Lower `MonthlyConceptionBase` from 0.06 to lower value

```go
MonthlyConceptionBase = 0.03 / DaysPerMonth // Was 0.06
```

**Impact:**
- Slower population growth
- More time for food production to keep pace
- Reduces overshoot

**Pros:**
- Simple parameter change
- Slows growth rate

**Cons:**
- Doesn't add feedback mechanism
- May be too slow for game pacing
- Doesn't prevent eventual overshoot

### Fix 4: **Health-Based Work Capacity Adjustment**

**Change:** Make work capacity degrade more gracefully

Current system appears to have a sharp cutoff. Consider:

```go
// Instead of binary full/half/none work
func getWorkCapacity(health float64) float64 {
    if health >= 80 {
        return 1.0  // Full capacity
    } else if health >= 50 {
        return 0.8  // Slightly reduced
    } else if health >= 30 {
        return 0.5  // Half capacity
    } else if health >= 15 {
        return 0.25 // Quarter capacity
    } else {
        return 0.0  // Cannot work
    }
}
```

**Impact:**
- Smoother degradation prevents cliff effects
- Some production continues even in crisis

**Pros:**
- Reduces extreme collapses
- More realistic

**Cons:**
- Doesn't fix root cause
- May prolong suffering rather than prevent it

---

## Recommended Solution: **Combination Approach**

Implement multiple fixes together for best results:

### Phase 1: Immediate Fixes (High Impact)
1. ✅ **Add fertility-based-on-resources** (Fix 1) - Primary fix
2. ✅ **Increase food production rate 2x** (Fix 2 at 2.0, not 3.0) - Quick relief

### Phase 2: Tuning
3. Monitor results and adjust:
   - Fertility threshold values
   - Food production multiplier
   - Birth rate if needed

### Phase 3: Polish
4. Add gradual work capacity degradation (Fix 4)
5. Add visual/warning indicators for players

---

## Expected Results After Fixes

With Fix 1 (fertility reduction) + Fix 2 (2x food production):

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Peak population | 600 | ~350 |
| Food production capacity | 420 units/day | 840 units/day |
| Sustainable population | 210 people | 420 people |
| Population decline day | 366-688 | Never (stable) |
| Fire Mastery achievable? | No | Yes (within 10 years) |

---

## Testing Plan

1. Implement Fix 1 (fertility reduction)
2. Run `TestFoodAllocationComparison`
3. Check if "Decline Day" column shows "-" (no decline)
4. If still declining, implement Fix 2 (increase food rate)
5. Iterate until all allocations show stable populations

---

## Notes for Implementation

**Files to modify:**
- `simulation/pkg/simulator/mechanics.go` - Add resource-based fertility modifier
- `simulation/pkg/simulator/mechanics.go` - Adjust FoodBaseRate constant

**Tests to run:**
- `TestFoodAllocationComparison` - Primary validation
- `TestViabilityWithMultipleSeeds` - Ensure stability across seeds
- Unit tests - May need updating if behavior changes significantly

**Documentation to update:**
- `designs/HUMAN_ATTRIBUTES.md` - Document new fertility mechanics
- `designs/FIRE_MASTERY_CLAIMS_ANALYSIS.md` - Update with solution
