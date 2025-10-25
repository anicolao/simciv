# Human Scenario Implementation Comparison
## Design Document vs Go Server Implementation

**Date:** 2025-10-25  
**Status:** Analysis Complete  
**Purpose:** Identify bugs and discrepancies between HUMAN_ATTRIBUTES.md design and Go implementation

---

## Executive Summary

This document compares the minimal human scenario implementation in the Go server (`simulation/pkg/simulator/`) against the design specification in `designs/HUMAN_ATTRIBUTES.md`. 

**Key Findings:**
- **4 Logic Bugs Identified** requiring fixes
- **Several Parameter Differences** that are acceptable (tuning for viability)
- **Missing Features** that are acceptable for minimal implementation

---

## Logic Bugs (MUST FIX)

### Bug #1: Health Change Formula - Wrong Breakeven Point

**Location:** `simulation/pkg/simulator/mechanics.go`, lines 152-169

**Design Specification (HUMAN_ATTRIBUTES.md, lines 85-93):**
```
Health Change Per Day:
  base_change = -0.5 (natural decline)
  food_bonus = (food_consumed / food_required) * 15
  age_penalty = -(age / 30) * 5
  
  daily_health_change = base_change + food_bonus + age_penalty
```

**Implementation:**
```go
healthChange := HealthBaseDecline  // -0.5
foodRatio := foodPerPerson / FoodRequiredPerPerson
healthChange += (foodRatio - HealthFoodBreakeven) * HealthFoodMultiplier  // (ratio - 0.5) * 15
healthChange -= (human.Age / HealthAgeDivisor) * HealthAgeMultiplier
```

**Problem:**
The implementation subtracts 0.5 from the food ratio before multiplying by 15, creating an incorrect breakeven point.

**Impact Analysis:**
- **Design**: At food ratio 1.0 (exactly meeting requirements):
  - food_bonus = 1.0 * 15 = 15
  - daily_health_change = -0.5 + 15 - age_penalty = +14.5 - age_penalty
  - For a 20-year-old: +14.5 - (20/30)*5 = +14.5 - 3.33 = **+11.17 per day**

- **Implementation**: At food ratio 1.0:
  - food_bonus = (1.0 - 0.5) * 15 = 7.5
  - daily_health_change = -0.5 + 7.5 - age_penalty = +7.0 - age_penalty
  - For a 20-year-old: +7.0 - 3.33 = **+3.67 per day**

- **Design**: Health neutral point (0 change) for 20-year-old:
  - 0 = -0.5 + (ratio * 15) - 3.33
  - ratio * 15 = 3.83
  - ratio = 0.255 (25.5% of food requirement)

- **Implementation**: Health neutral point for 20-year-old:
  - 0 = -0.5 + ((ratio - 0.5) * 15) - 3.33
  - (ratio - 0.5) * 15 = 3.83
  - ratio = 0.755 (75.5% of food requirement)

**Conclusion:**
The implementation requires **3x more food** to maintain neutral health compared to the design. This is a fundamental logic error that changes game balance dramatically.

**Fix Required:**
Remove the `- HealthFoodBreakeven` subtraction:
```go
// WRONG:
healthChange += (foodRatio - HealthFoodBreakeven) * HealthFoodMultiplier

// CORRECT:
healthChange += foodRatio * HealthFoodMultiplier
```

---

### Bug #2: Science Health Threshold Mismatch

**Location:** `simulation/pkg/simulator/mechanics.go`, lines 26-29, 124-126

**Design Specification (HUMAN_ATTRIBUTES.md, lines 412-413):**
```
- Health threshold: * 0.5 if average_health < 50 (can't think when starving)
```

**Implementation:**
```go
const (
	ScienceHealthThreshold = 30.0 // Only penalize science when health is critically low
	ScienceHealthPenalty = 0.5
)

// In produceScience():
if averageHealth < ScienceHealthThreshold {
	multiplier *= ScienceHealthPenalty
}
```

**Problem:**
The health threshold for science penalty is 30 in the implementation but should be 50 per the design.

**Impact:**
- Populations can maintain full science production down to health 30 instead of 50
- This makes science advancement easier and changes strategic decisions
- Players don't get the intended pressure to maintain health above 50

**Fix Required:**
```go
const (
	ScienceHealthThreshold = 50.0 // Design spec: penalty if average_health < 50
	ScienceHealthPenalty = 0.5
)
```

---

### Bug #3: Minimum Fertility Age Discrepancy

**Location:** `simulation/pkg/simulator/mechanics.go`, lines 13-14

**Design Specification (HUMAN_ATTRIBUTES.md, line 611):**
```
- Minimum Fertility Age: 13 years
- Maximum Fertility Age: 15 years (onset, not end)
```

**Implementation:**
```go
const (
	AgeFertileMin = 15.0
	AgeFertileMax = 45.0
)
```

**Problem:**
Fertility minimum is 15 in implementation but should be 13 per design.

**Impact:**
- Humans aged 13-14 cannot reproduce in implementation but should be able to per design
- This reduces potential reproduction rate
- Design explicitly states "Minimum Fertility Age: 13 years"

**Fix Required:**
```go
const (
	AgeFertileMin = 13.0  // Design spec: fertility starts at age 13
	AgeFertileMax = 45.0
)
```

---

### Bug #4: Age Distribution Mismatch

**Location:** `simulation/pkg/simulator/simulator.go`, lines 24-31

**Design Specification (HUMAN_ATTRIBUTES.md, lines 267-269):**
```
- Children (0-12): 30%
- Fertile Adults (13-30): 50%
- Older Adults (30+): 20%
```

**Implementation:**
```go
// Age distribution adjusted per feedback:
// children_0_14: 25% (reduced by 5%)
// adults_15_30: 60% (increased by 10%)
// elders_31_plus: 15% (reduced by 5%)

childrenCount := int(float64(conditions.Population) * 0.25)
adultsCount := int(float64(conditions.Population) * 0.60)
```

**Problem:**
The age ranges and percentages don't match the design:
- Children: Should be 0-12 (30%), implemented as 0-14 (25%)
- Adults: Should be 13-30 (50%), implemented as 15-30 (60%)
- Elders: Should be 30+ (20%), implemented as 31+ (15%)

**Impact:**
- Different starting population structure
- More working-age adults than designed (60% vs 50%)
- Fewer children than designed (25% vs 30%)
- Comment says "adjusted per feedback" but this contradicts published design doc

**Fix Required:**
Match the design document exactly:
```go
// Age distribution from design spec:
// children_0_12: 30%
// adults_13_30: 50%
// elders_31_plus: 20%

childrenCount := int(float64(conditions.Population) * 0.30)
adultsCount := int(float64(conditions.Population) * 0.50)
eldersCount := conditions.Population - childrenCount - adultsCount

// Create children (0-12 years)
for i := 0; i < childrenCount; i++ {
	// ...
	Age: rng.NextInRange(0, 13),  // 0 to <13 (0-12)
	// ...
}

// Create adults (13-30 years)
for i := 0; i < adultsCount; i++ {
	// ...
	Age: rng.NextInRange(13, 31),  // 13 to <31 (13-30)
	// ...
}

// Create elders (31+ years)
for i := 0; i < eldersCount; i++ {
	// ...
	Age: rng.NextInRange(31, 50),  // 31-49
	// ...
}
```

---

## Acceptable Parameter Differences

These are parameter tuning changes that don't alter the logic/formula structure:

### 1. Food Base Rate
- **Design:** 0.3 food units/hour
- **Implementation:** 1.0 food units/hour
- **Reason:** "viability threshold found via testing" (comment in code)
- **Status:** ✅ ACCEPTABLE - parameter tuning for game balance

### 2. Science Base Rate
- **Design:** 1.0 science point/hour
- **Implementation:** 0.0025 science points/hour
- **Reason:** "balanced for high viability" (comment in code)
- **Status:** ✅ ACCEPTABLE - parameter tuning for game balance

### 3. Monthly Conception Base Rate
- **Design:** 0.03 (3% monthly)
- **Implementation:** 0.06 / DaysPerMonth (6% monthly)
- **Reason:** "2x increase per testing" (comment in code)
- **Status:** ✅ ACCEPTABLE - parameter tuning for game balance

### 4. Food Allocation Ratio Default
- **Design:** 80% (line 323)
- **Implementation:** 70% (simulator.go line 15)
- **Reason:** "70/30 allocation for balanced progression" (comment in code)
- **Status:** ✅ ACCEPTABLE - parameter tuning for game balance

---

## Acceptable Omissions (Minimal Implementation)

These features from the design are intentionally not implemented in the "minimal" version:

### 1. Additional Food Production Modifiers
- **Design includes:** Tool technology, group size efficiency, seasonal variation
- **Implementation:** Only Fire Mastery and terrain multiplier
- **Status:** ✅ ACCEPTABLE for minimal implementation

### 2. Additional Science Production Modifiers
- **Design includes:** Tool availability modifier
- **Implementation:** Only population and health modifiers
- **Status:** ✅ ACCEPTABLE for minimal implementation

### 3. Shelter, Safety, Belonging, Luxury Attributes
- **Design:** Full five-attribute system
- **Implementation:** Only Health attribute implemented
- **Status:** ✅ ACCEPTABLE for minimal implementation (by design)

### 4. Reproduction Modifiers
- **Design includes:** Belonging modifier formula, stress/safety modifier
- **Implementation:** Simplified belonging threshold, no stress modifier
- **Status:** ✅ ACCEPTABLE for minimal implementation

### 5. Environmental Modifiers for Mortality
- **Design includes:** Safety penalty, shelter penalty, starvation multiplier
- **Implementation:** Only age and health modifiers
- **Status:** ✅ ACCEPTABLE for minimal implementation

---

## Recommendations

### Immediate Actions (Fix Logic Bugs)

1. **Fix Health Formula** (Bug #1 - CRITICAL)
   - Remove the breakeven subtraction from food bonus calculation
   - This is the most impactful bug affecting core game balance

2. **Fix Science Health Threshold** (Bug #2 - HIGH)
   - Change from 30 to 50 to match design intent
   - Affects strategic decision-making

3. **Fix Minimum Fertility Age** (Bug #3 - MEDIUM)
   - Change from 15 to 13 to match design spec
   - Affects reproduction rates

4. **Fix Age Distribution** (Bug #4 - MEDIUM)
   - Update to match design doc ranges and percentages
   - Or document why the deviation is intentional

### Design Document Updates

Update `HUMAN_ATTRIBUTES.md` to document the acceptable parameter changes:

1. **Line 368:** Update FoodBaseRate from 0.3 to 1.0
   ```
   base_rate = 1.0 food units/hour (tuned for viability)
   ```

2. **Line 405:** Update ScienceBaseRate from 1.0 to 0.0025
   ```
   base_rate = 0.0025 science point/hour (tuned for viability)
   ```

3. **Line 627:** Update MonthlyConceptionBase from 0.03 to 0.06
   ```
   base_chance = 0.06 per month (6% monthly, doubled for viability)
   ```

4. **Line 323:** Update default food allocation from 80% to 70%
   ```
   food_ratio = 70%  (default, player-adjustable 0-100%)
   ```

---

## Testing Impact

After fixing the logic bugs, the following test behaviors will change:

### Health Formula Fix Impact
- Health will increase faster with adequate food
- Populations will be more resilient
- May need to rebalance food production rates downward

### Science Threshold Fix Impact
- Science production will be penalized at health 50 instead of 30
- This will create more pressure to maintain high health
- May slow down technology progression

### Fertility Age Fix Impact
- Slightly higher reproduction rates
- More births from 13-14 year olds
- Minimal impact on overall population dynamics

### Age Distribution Fix Impact
- Starting population will have more children, fewer working adults
- This matches the intended "difficult start" scenario
- May reduce initial viability slightly

---

## Conclusion

The minimal human scenario implementation is generally well-structured and follows the design document. However, **4 logic bugs** were identified that change the fundamental behavior of the simulation:

1. ❌ **Health formula has wrong breakeven point** (CRITICAL)
2. ❌ **Science health threshold is too low** (HIGH)
3. ❌ **Fertility starts at wrong age** (MEDIUM)
4. ❌ **Age distribution doesn't match design** (MEDIUM)

All parameter tuning changes are acceptable and should be documented in the design document.

The omitted features (full attribute system, additional modifiers) are appropriate for a minimal implementation.

**Next Steps:**
1. Fix the 4 logic bugs in the Go implementation
2. Update HUMAN_ATTRIBUTES.md to reflect tuned parameter values
3. Re-run viability tests to ensure fixes don't break game balance
4. Adjust parameter values if needed to maintain target viability rates
