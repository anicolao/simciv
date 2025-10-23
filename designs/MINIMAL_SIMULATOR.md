# SimCiv Minimal Simulator Design Specification
## Viability Verification Simulator for Prehistoric Civilizations

### Document Status
**Version:** 0.0005  
**Status:** Design Review  
**Last Updated:** 2025-10-23  
**Purpose:** Specification for the minimal viable simulator to verify that starting positions support population growth and basic research capability

---

## Executive Summary

This document specifies the design for SimCiv's minimal simulator implementation. The goal is to create the **smallest possible system** that can verify a player's start position is viable—meaning their population can grow and conduct at least a little bit of research.

**Key Features:**
- Minimal implementation of the five human attributes (health only fully implemented)
- Basic two-choice resource allocation (food vs. science)
- Simplified reproduction and mortality mechanics
- Single starting technology: Stone Knapping
- Single research goal: Fire Mastery
- Deterministic simulation to verify starting viability
- No UI required (simulation-only verification)

**Success Criteria:**
A starting position is considered viable if:
1. Population survives for 365 simulated days (1 year)
2. Population grows by at least 1 person within the year
3. At least 50 science points are accumulated (halfway to Fire Mastery)
4. Average health remains above 30 (survival threshold)

This minimal design serves as a proof-of-concept for the full simulation system and validates that the game's foundational mechanics can produce viable starting conditions.

---

## Scope and Limitations

### In Scope (Minimal Implementation)

**Human Attributes:**
- ✓ Health (0-100) - FULLY IMPLEMENTED
- ✓ Shelter (0-100) - SIMPLIFIED (fixed value based on starting conditions)
- ✓ Safety (0-100) - SIMPLIFIED (fixed value, no threats)
- ✓ Belonging (0-100) - SIMPLIFIED (fixed value based on population)
- ✓ Luxury (0-100) - SIMPLIFIED (science level × 5)

**Resource Systems:**
- ✓ Food production and consumption
- ✓ Science point accumulation
- ✓ Food/science allocation ratio (player-set or default 80/20)

**Population Dynamics:**
- ✓ Basic reproduction (fertility at ages 15-30, health >= 50 required)
- ✓ Basic mortality (age-based + health-based)
- ✓ Age progression (daily)
- ✓ Starting population: 20 humans

**Technology:**
- ✓ Starting tech: Stone Knapping (already researched)
- ✓ Research goal: Fire Mastery (100 science points)
- ✓ Tech effects on food production only

**Time System:**
- ✓ Daily simulation ticks
- ✓ 365-day simulation period (1 year)
- ✓ Deterministic time progression

### Out of Scope (Future Implementation)

**Human Attributes:**
- ✗ Complex shelter calculations (overcrowding, weather, construction)
- ✗ Dynamic safety calculations (predators, threats, defenses)
- ✗ Social belonging mechanics (interactions, activities, status)
- ✗ Complex luxury calculations (artisan goods, leisure time)

**Resource Systems:**
- ✗ Resource storage and preservation
- ✗ Seasonal variation in food production
- ✗ Resource trading between groups
- ✗ Material resources (wood, stone, etc.)

**Population Dynamics:**
- ✗ Individual personalities and variation
- ✗ Pregnancy mechanics (9-month duration)
- ✗ Infant care and work capacity impacts
- ✗ Disease and epidemic systems
- ✗ Complex social relationships

**Technology:**
- ✗ Full technology tree (35 technologies)
- ✗ Multiple research paths
- ✗ Technology prerequisites and dependencies
- ✗ Complex tech effects on multiple systems

**Gameplay:**
- ✗ Player interaction and decision-making
- ✗ Multiple civilizations
- ✗ Combat and conflict
- ✗ Map and terrain
- ✗ UI and visualization

---

## Architecture Context

The minimal simulator is a **standalone verification tool** that will evolve into the full simulation engine. It integrates with:

- **Database Layer**: Reads starting position data (population, terrain type)
- **Simulation Core**: Runs deterministic simulation ticks
- **Validation Output**: Reports viability metrics (success/failure)

This minimal design maintains the database-as-single-source-of-truth principle while focusing only on essential viability checks.

---

## Data Model

### Human Entity (Minimal)

```typescript
interface MinimalHuman {
  id: string;                    // Unique identifier
  age: number;                   // Age in years (0-60)
  gender: "male" | "female";     // Required for reproduction
  health: number;                // 0-100 (fully implemented)
  isAlive: boolean;              // Alive status
}
```

**Simplified Attributes (Not Stored Per Individual):**
- **Shelter**: Fixed at 20 (minimal natural shelter)
- **Safety**: Fixed at 25 (baseline group safety)
- **Belonging**: Calculated as `min(50, population / 2)` (simple group size formula)
- **Luxury**: Calculated as `scienceLevel * 5` where scienceLevel = number of techs unlocked

### Civilization State (Minimal)

```typescript
interface MinimalCivilizationState {
  // Population
  humans: MinimalHuman[];        // Array of all humans
  
  // Resources
  foodStockpile: number;         // Available food units
  sciencePoints: number;         // Accumulated science
  
  // Configuration
  foodAllocationRatio: number;   // 0.0 to 1.0 (default 0.8 = 80%)
  
  // Technology
  hasStoneKnapping: boolean;     // Always true (starting tech)
  hasFireMastery: boolean;       // Research goal (unlocks at 100 science)
  
  // Simulation State
  currentDay: number;            // Day counter (0-365)
}
```

### Starting Conditions

```typescript
const STARTING_CONDITIONS = {
  population: 20,                // 20 humans
  ageDistribution: {
    children_0_14: 0.30,         // 6 children (ages 0-14)
    adults_15_30: 0.50,          // 10 adults (ages 15-30, fertile)
    elders_31_plus: 0.20,        // 4 elders (ages 31+)
  },
  genderRatio: 0.5,              // 50% male, 50% female
  startingHealth: {
    min: 30,
    max: 50,
    average: 40,                 // Low health (prehistoric conditions)
  },
  foodStockpile: 100,            // 100 food units (50 days for 20 people)
  sciencePoints: 0,              // No initial science
  hasStoneKnapping: true,        // Starting technology
  hasFireMastery: false,         // Research goal
  foodAllocationRatio: 0.8,      // 80% food, 20% science (default)
};
```

---

## Simulation Mechanics

### Daily Simulation Tick

The simulator runs 365 daily ticks, each processing the following steps in order:

```
For each day (1 to 365):
  1. Calculate available labor
  2. Allocate labor to food/science
  3. Produce food and science
  4. Consume food
  5. Update health based on nutrition
  6. Age all humans by 1/365 year
  7. Process mortality checks
  8. Process reproduction checks
  9. Check for Fire Mastery unlock
  10. Record metrics for viability assessment
```

### Step 1: Calculate Available Labor

```typescript
function calculateAvailableLabor(humans: MinimalHuman[]): number {
  let totalWorkHours = 0;
  
  for (const human of humans.filter(h => h.isAlive)) {
    // Only adults (age >= 15) can work
    if (human.age < 15) {
      continue;
    }
    
    // Work capacity based on health
    if (human.health >= 50) {
      totalWorkHours += 8;  // Full day of work
    } else if (human.health >= 30) {
      totalWorkHours += 4;  // Half day (weakened)
    }
    // health < 30: cannot work (0 hours)
  }
  
  return totalWorkHours;
}
```

**Example Calculation:**
- Starting population: 20 humans
- Adults (age >= 15): ~14 humans (6 are children)
- Average health: 40 (all work half capacity)
- Total work hours: 14 × 4 = 56 hours/day

### Step 2: Allocate Labor to Food/Science

```typescript
function allocateLabor(
  totalWorkHours: number,
  foodRatio: number
): { foodHours: number; scienceHours: number } {
  return {
    foodHours: totalWorkHours * foodRatio,
    scienceHours: totalWorkHours * (1 - foodRatio),
  };
}
```

**Example:**
- Total work hours: 56
- Food ratio: 0.8 (80%)
- Food hours: 56 × 0.8 = 44.8
- Science hours: 56 × 0.2 = 11.2

### Step 3: Produce Food and Science

**Food Production:**

```typescript
function produceFood(
  foodHours: number,
  hasStoneKnapping: boolean,
  terrainMultiplier: number = 1.0
): number {
  const BASE_RATE = 0.3;  // Food units per hour (primitive gathering)
  
  let multiplier = 1.0;
  if (hasStoneKnapping) {
    multiplier *= 1.3;  // +30% from stone tools
  }
  
  return foodHours * BASE_RATE * multiplier * terrainMultiplier;
}
```

**Example:**
- Food hours: 44.8
- Base rate: 0.3 food/hour
- Stone knapping: +30% (1.3x)
- Terrain: Normal (1.0x)
- Production: 44.8 × 0.3 × 1.3 × 1.0 = **17.5 food units/day**

**Science Production:**

```typescript
function produceScience(
  scienceHours: number,
  population: number,
  averageHealth: number,
  hasStoneKnapping: boolean
): number {
  const BASE_RATE = 1.0;  // Science points per hour
  
  let multiplier = 1.0;
  
  // Population collaboration bonus
  multiplier *= Math.log10(population);  // log10(20) ≈ 1.3
  
  // Health threshold penalty
  if (averageHealth < 50) {
    multiplier *= 0.5;  // Half effectiveness when malnourished
  }
  
  // Tool availability bonus
  if (hasStoneKnapping) {
    multiplier *= 1.1;  // +10% from tools
  }
  
  return scienceHours * BASE_RATE * multiplier;
}
```

**Example:**
- Science hours: 11.2
- Population: 20 (log10 = 1.3)
- Average health: 40 (< 50, so 0.5x penalty)
- Stone knapping: +10% (1.1x)
- Production: 11.2 × 1.0 × 1.3 × 0.5 × 1.1 = **8.0 science points/day**

### Step 4: Consume Food

```typescript
function consumeFood(
  humans: MinimalHuman[],
  foodStockpile: number
): { remainingFood: number; foodPerPerson: number } {
  const aliveHumans = humans.filter(h => h.isAlive);
  const population = aliveHumans.length;
  
  // Food requirements
  const FOOD_REQUIRED_PER_PERSON = 2.0;  // Units per day
  const totalRequired = population * FOOD_REQUIRED_PER_PERSON;
  
  // Calculate actual consumption (may be less than required if shortage)
  const actualConsumption = Math.min(foodStockpile, totalRequired);
  const foodPerPerson = actualConsumption / population;
  
  return {
    remainingFood: foodStockpile - actualConsumption,
    foodPerPerson: foodPerPerson,
  };
}
```

**Example:**
- Population: 20
- Food required: 20 × 2.0 = 40 units
- Food stockpile: 100 units
- Consumption: 40 units
- Remaining: 60 units
- Per person: 2.0 units (fully fed)

### Step 5: Update Health Based on Nutrition

```typescript
function updateHealth(human: MinimalHuman, foodPerPerson: number): void {
  const FOOD_REQUIRED = 2.0;
  
  // Base health decline (natural)
  let healthChange = -0.5;
  
  // Food bonus/penalty
  const foodRatio = foodPerPerson / FOOD_REQUIRED;
  healthChange += (foodRatio - 0.5) * 15;
  
  // Example calculations:
  // foodRatio = 1.0 (fully fed): healthChange = -0.5 + (1.0 - 0.5) * 15 = +7.0
  // foodRatio = 0.5 (half fed): healthChange = -0.5 + (0.5 - 0.5) * 15 = -0.5
  // foodRatio = 0.0 (starving): healthChange = -0.5 + (0.0 - 0.5) * 15 = -8.0
  
  // Age penalty (simplified - no tech modifiers)
  healthChange -= (human.age / 30) * 5;
  
  // Apply change
  human.health = Math.max(0, Math.min(100, human.health + healthChange));
}
```

**Example (Adult age 20, fully fed):**
- Base decline: -0.5
- Food bonus: (1.0 - 0.5) × 15 = +7.5
- Age penalty: (20/30) × 5 = -3.3
- Net change: +3.7 per day
- Health trajectory: Increasing toward equilibrium

**Example (Elder age 50, half fed):**
- Base decline: -0.5
- Food bonus: (0.5 - 0.5) × 15 = 0
- Age penalty: (50/30) × 5 = -8.3
- Net change: -8.8 per day
- Health trajectory: Rapidly declining

### Step 6: Age All Humans

```typescript
function ageHumans(humans: MinimalHuman[]): void {
  const AGE_INCREMENT = 1 / 365;  // 1 year / 365 days
  
  for (const human of humans.filter(h => h.isAlive)) {
    human.age += AGE_INCREMENT;
  }
}
```

### Step 7: Process Mortality Checks

**Simplified Mortality (Daily Check):**

```typescript
function checkMortality(human: MinimalHuman): boolean {
  if (!human.isAlive) return false;
  
  // Convert monthly rates to daily
  const DAYS_PER_MONTH = 30;
  
  // Base mortality rate by age (monthly rate / 30)
  let dailyDeathChance = 0;
  
  if (human.age < 1) {
    dailyDeathChance = 0.025 / DAYS_PER_MONTH;  // 2.5% monthly = 0.083% daily
  } else if (human.age < 5) {
    dailyDeathChance = 0.012 / DAYS_PER_MONTH;  // 1.2% monthly
  } else if (human.age < 15) {
    dailyDeathChance = 0.003 / DAYS_PER_MONTH;  // 0.3% monthly
  } else if (human.age < 30) {
    dailyDeathChance = 0.002 / DAYS_PER_MONTH;  // 0.2% monthly
  } else if (human.age < 45) {
    dailyDeathChance = 0.004 / DAYS_PER_MONTH;  // 0.4% monthly
  } else if (human.age < 60) {
    dailyDeathChance = 0.010 / DAYS_PER_MONTH;  // 1.0% monthly
  } else {
    dailyDeathChance = 0.020 / DAYS_PER_MONTH;  // 2.0% monthly
  }
  
  // Health modifiers
  if (human.health > 80) {
    dailyDeathChance *= 0.5;
  } else if (human.health < 60 && human.health >= 40) {
    dailyDeathChance *= 1.5;
  } else if (human.health < 40 && human.health >= 20) {
    dailyDeathChance *= 3.0;
  } else if (human.health < 20) {
    dailyDeathChance *= 10.0;
  }
  
  // Roll for death
  const died = Math.random() < dailyDeathChance;
  if (died) {
    human.isAlive = false;
  }
  
  return died;
}
```

**Example Mortality Rates:**
- Healthy adult (age 25, health 80): 0.002/30 × 0.5 = 0.0033% daily ≈ 1.2% yearly
- Unhealthy adult (age 25, health 35): 0.002/30 × 3.0 = 0.020% daily ≈ 7.3% yearly
- Starving elder (age 55, health 15): 0.010/30 × 10.0 = 0.33% daily ≈ 69% yearly (high risk)

### Step 8: Process Reproduction Checks

**Simplified Reproduction (Daily Check):**

```typescript
function checkReproduction(
  male: MinimalHuman,
  female: MinimalHuman
): MinimalHuman | null {
  // Prerequisites
  if (!male.isAlive || !female.isAlive) return null;
  if (male.age < 15 || male.age > 45) return null;
  if (female.age < 15 || female.age > 45) return null;
  if (male.health < 50 || female.health < 50) return null;
  
  // Calculate simplified belonging
  const belonging = Math.min(50, getCurrentPopulation() / 2);
  if (belonging < 40) return null;
  
  // Monthly conception rate converted to daily
  const MONTHLY_BASE_CHANCE = 0.03;
  const DAYS_PER_MONTH = 30;
  const dailyConceptionChance = MONTHLY_BASE_CHANCE / DAYS_PER_MONTH;
  
  // Modifiers (simplified)
  let modifiers = 1.0;
  
  // Health modifier (average of both parents)
  const avgHealth = (male.health + female.health) / 2;
  modifiers *= (avgHealth - 50) / 50;  // 0.0 at health=50, 1.0 at health=100
  
  // Age modifier (simplified - peak at 15-25)
  const avgAge = (male.age + female.age) / 2;
  if (avgAge >= 15 && avgAge <= 25) {
    modifiers *= 1.0;  // Peak fertility
  } else if (avgAge > 25 && avgAge <= 30) {
    modifiers *= 0.8;
  } else if (avgAge > 30 && avgAge <= 40) {
    modifiers *= 0.5;
  } else {
    modifiers *= 0.2;
  }
  
  const finalChance = dailyConceptionChance * Math.max(0, modifiers);
  
  // Roll for conception
  if (Math.random() < finalChance) {
    // Instant birth (no pregnancy mechanics in minimal version)
    const child: MinimalHuman = {
      id: generateId(),
      age: 0,
      gender: Math.random() < 0.5 ? "male" : "female",
      health: avgHealth * 0.8,  // Child starts at 80% of parents' health
      isAlive: true,
    };
    
    // 70% infant survival rate at birth (simplified)
    if (Math.random() > 0.7) {
      child.isAlive = false;  // Stillborn/infant mortality
      return null;
    }
    
    return child;
  }
  
  return null;
}

function attemptReproduction(humans: MinimalHuman[]): MinimalHuman[] {
  const newborns: MinimalHuman[] = [];
  const aliveHumans = humans.filter(h => h.isAlive);
  const males = aliveHumans.filter(h => h.gender === "male");
  const females = aliveHumans.filter(h => h.gender === "female");
  
  // Try to pair each eligible female with an eligible male
  for (const female of females) {
    for (const male of males) {
      const child = checkReproduction(male, female);
      if (child) {
        newborns.push(child);
        break;  // Each female can only have one child per day check
      }
    }
  }
  
  return newborns;
}
```

**Example Reproduction Rate:**
- 10 fertile adults (5 male, 5 female), average health 60
- Daily chance per pair: 0.03/30 × 0.2 × 0.8 = 0.00016 (0.016%)
- Expected births per month for 5 pairs: 5 × 0.00016 × 30 = 0.024 births/month
- With 70% survival: ~0.017 surviving births/month
- Annual births for population of 20: ~0.2 births/year (10% population growth)

### Step 9: Check for Fire Mastery Unlock

```typescript
function checkTechnologyUnlock(
  state: MinimalCivilizationState
): boolean {
  if (!state.hasFireMastery && state.sciencePoints >= 100) {
    state.hasFireMastery = true;
    return true;  // Unlocked!
  }
  return false;
}
```

### Step 10: Record Metrics

```typescript
interface DailyMetrics {
  day: number;
  population: number;
  averageHealth: number;
  foodStockpile: number;
  sciencePoints: number;
  foodProduction: number;
  scienceProduction: number;
  births: number;
  deaths: number;
  hasFireMastery: boolean;
}

function recordMetrics(state: MinimalCivilizationState): DailyMetrics {
  const aliveHumans = state.humans.filter(h => h.isAlive);
  
  return {
    day: state.currentDay,
    population: aliveHumans.length,
    averageHealth: aliveHumans.reduce((sum, h) => sum + h.health, 0) / aliveHumans.length,
    foodStockpile: state.foodStockpile,
    sciencePoints: state.sciencePoints,
    foodProduction: 0,  // Set during production step
    scienceProduction: 0,  // Set during production step
    births: 0,  // Set during reproduction step
    deaths: 0,  // Set during mortality step
    hasFireMastery: state.hasFireMastery,
  };
}
```

---

## Viability Assessment

After running the 365-day simulation, the starting position is evaluated against success criteria:

### Success Criteria

```typescript
interface ViabilityResult {
  isViable: boolean;
  metrics: {
    finalPopulation: number;
    populationGrowth: number;
    finalAverageHealth: number;
    totalSciencePoints: number;
    fireMasteryUnlocked: boolean;
  };
  failureReasons: string[];
}

function assessViability(
  startingPopulation: number,
  finalMetrics: DailyMetrics[]
): ViabilityResult {
  const finalDay = finalMetrics[364];  // Day 365 (0-indexed)
  const failures: string[] = [];
  
  // Criterion 1: Population survived 365 days
  if (finalDay.population === 0) {
    failures.push("Population extinct before day 365");
  }
  
  // Criterion 2: Population grew by at least 1
  const populationGrowth = finalDay.population - startingPopulation;
  if (populationGrowth < 1) {
    failures.push(`Population did not grow (change: ${populationGrowth})`);
  }
  
  // Criterion 3: At least 50 science points accumulated
  if (finalDay.sciencePoints < 50) {
    failures.push(`Insufficient science (${finalDay.sciencePoints}/50 required)`);
  }
  
  // Criterion 4: Average health above 30
  if (finalDay.averageHealth < 30) {
    failures.push(`Population health too low (${finalDay.averageHealth.toFixed(1)}/30 required)`);
  }
  
  return {
    isViable: failures.length === 0,
    metrics: {
      finalPopulation: finalDay.population,
      populationGrowth: populationGrowth,
      finalAverageHealth: finalDay.averageHealth,
      totalSciencePoints: finalDay.sciencePoints,
      fireMasteryUnlocked: finalDay.hasFireMastery,
    },
    failureReasons: failures,
  };
}
```

### Expected Outcomes for Viable Start

**Scenario: Viable Starting Position (Default 80/20 allocation)**

Starting Conditions:
- Population: 20
- Average health: 40
- Food stockpile: 100
- Stone Knapping: Unlocked
- Food allocation: 80%

Expected Daily Production:
- Food: ~17.5 units/day
- Consumption: 40 units/day
- Net food: -22.5 units/day (initially running deficit)

**Week 1-2: Food Crisis**
- Food stockpile depletes rapidly
- Health begins declining due to insufficient food
- Population enters starvation mode
- Player would see red warning: "CRITICAL FOOD SHORTAGE"

**Week 3-4: Stabilization (if food ratio increased)**
- If player increases food allocation to 95%:
  - Food production: ~20.8 units/day
  - Net food: -19.2 units/day (still deficit but slower)
- Health stabilizes around 35-40
- Science accumulation slows to ~2 points/day

**Month 2-6: Recovery**
- As weaker individuals die, food per capita improves
- Remaining population's health recovers to 45-55
- Work capacity increases (more people at full 8 hours)
- Food production increases with better health

**Month 7-12: Growth**
- Population reaches 18-22 (small growth from baseline)
- Average health: 50-60
- Total science: 50-100 points (Fire Mastery unlocked around month 6-8)
- Viable position confirmed

**Final Metrics:**
- Population: 21 (+1 from start)
- Average health: 55
- Science points: 85
- Fire Mastery: Unlocked ✓
- **VIABLE** ✓

### Expected Outcomes for Non-Viable Start

**Scenario: Non-Viable Starting Position (Harsh Terrain, Default 80/20)**

Starting Conditions:
- Population: 20
- Average health: 40
- Food stockpile: 100
- Stone Knapping: Unlocked
- Food allocation: 80%
- **Terrain multiplier: 0.6** (harsh/desert terrain)

Expected Daily Production:
- Food: 17.5 × 0.6 = ~10.5 units/day (VERY LOW)
- Consumption: 40 units/day
- Net food: -29.5 units/day (severe deficit)

**Week 1-4: Rapid Decline**
- Food stockpile depleted in 3-4 days
- Immediate starvation conditions
- Health drops rapidly (8-10 points/day)
- Population begins dying (highest mortality in elders, infants)

**Month 2-3: Collapse**
- Population drops to 12-15
- Average health: 20-25 (critical)
- No reproduction (health too low)
- Science accumulation: 10-20 points total (far from goal)

**Month 4-6: Extinction or Marginal Survival**
- Even with 100% food allocation:
  - Max food: ~13 units/day for 12 people = 1.08 units/person
  - Required: 2.0 units/person
  - Still starvation conditions
- Population continues declining
- Eventual extinction or barely surviving remnant (5-8 people)

**Final Metrics:**
- Population: 8 (-12 from start)
- Average health: 22
- Science points: 15
- Fire Mastery: Not unlocked
- **NOT VIABLE** ✗
- Failure reasons:
  - "Population did not grow (change: -12)"
  - "Insufficient science (15/50 required)"
  - "Population health too low (22/30 required)"

---

## Implementation Considerations

### Deterministic Simulation

For testing and validation, the simulator should be deterministic:

```typescript
class RandomGenerator {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    // Simple LCG (Linear Congruential Generator)
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }
}

// Usage
const rng = new RandomGenerator(12345);
const died = rng.next() < dailyDeathChance;
```

This allows:
- Reproducible test cases
- Consistent viability results for same starting conditions
- Debugging of edge cases
- Validation of formula changes

### Performance Targets

The minimal simulator should be extremely fast:

- **Target**: Simulate 365 days in < 100ms
- **Population**: Up to 50 humans (starting 20, max growth ~30)
- **No I/O**: Pure in-memory computation
- **No UI**: Headless simulation

This allows rapid testing of many starting positions and map generation scenarios.

### Testing Strategy

**Unit Tests:**
- Each simulation step function (labor, production, health, mortality, reproduction)
- Edge cases: zero food, zero population, extreme ages
- Formula validation against design specifications

**Integration Tests:**
- Full 365-day simulation with known seed
- Viable starting position test (default conditions)
- Non-viable starting position test (harsh terrain)
- Population growth scenarios
- Starvation scenarios
- Science accumulation scenarios

**Validation Tests:**
- Run 100 simulations with varying seeds
- Measure viability rate (should be 60-80% for default conditions)
- Ensure variety in outcomes (not all exactly the same)
- Confirm formulas produce expected ranges

---

## Data Flow

```
Input: Starting Conditions
  ↓
Initialize Simulation State
  - Create 20 humans with age/gender/health distribution
  - Set starting food stockpile (100 units)
  - Set starting science (0 points)
  - Set starting tech (Stone Knapping = true)
  - Set food allocation ratio (0.8 default)
  ↓
For Day 1 to 365:
  ↓
  Calculate Labor → Allocate Labor → Produce Resources
  ↓
  Consume Food → Update Health
  ↓
  Age Humans → Check Mortality → Check Reproduction
  ↓
  Check Tech Unlock → Record Metrics
  ↓
Next Day
  ↓
After 365 Days:
  ↓
Assess Viability
  ↓
Output: ViabilityResult
  - isViable: true/false
  - metrics: final statistics
  - failureReasons: array of issues
```

---

## Success Metrics and Thresholds

### Primary Success Criterion: Viability

A starting position is **VIABLE** if all four conditions are met:

1. ✓ Population survives to day 365 (> 0 humans alive)
2. ✓ Population grows (+1 or more from starting 20)
3. ✓ Science reaches 50+ points (halfway to Fire Mastery)
4. ✓ Average health remains above 30 (survival threshold)

### Secondary Metrics (For Analysis)

These metrics help diagnose why a position is viable or not:

**Population Metrics:**
- Peak population (highest during 365 days)
- Minimum population (lowest point)
- Final population
- Total births
- Total deaths
- Net growth rate

**Health Metrics:**
- Starting average health
- Minimum average health (worst point)
- Final average health
- Health trajectory (improving/declining/stable)

**Resource Metrics:**
- Total food produced (365-day sum)
- Total food consumed (365-day sum)
- Minimum food stockpile (lowest point)
- Final food stockpile
- Average food per person over year

**Science Metrics:**
- Total science produced (365-day sum)
- Science production rate (average per day)
- Day of Fire Mastery unlock (if applicable)
- Final science points

**Efficiency Metrics:**
- Work hours per capita (average)
- Food production per work hour
- Science production per work hour

---

## Example Simulation Output

```json
{
  "simulationId": "sim_20251023_001",
  "seed": 12345,
  "startingConditions": {
    "population": 20,
    "averageHealth": 40,
    "foodStockpile": 100,
    "foodAllocationRatio": 0.8,
    "terrainMultiplier": 1.0
  },
  "viabilityResult": {
    "isViable": true,
    "metrics": {
      "finalPopulation": 21,
      "populationGrowth": 1,
      "finalAverageHealth": 55.3,
      "totalSciencePoints": 85,
      "fireMasteryUnlocked": true
    },
    "failureReasons": []
  },
  "statistics": {
    "peakPopulation": 23,
    "minimumPopulation": 17,
    "totalBirths": 5,
    "totalDeaths": 4,
    "totalFoodProduced": 6387,
    "totalFoodConsumed": 6205,
    "fireMasteryUnlockedOnDay": 245
  },
  "timeline": {
    "day1": {
      "population": 20,
      "averageHealth": 40,
      "foodStockpile": 100,
      "sciencePoints": 0
    },
    "day90": {
      "population": 18,
      "averageHealth": 45,
      "foodStockpile": 23,
      "sciencePoints": 22
    },
    "day180": {
      "population": 19,
      "averageHealth": 52,
      "foodStockpile": 67,
      "sciencePoints": 45
    },
    "day270": {
      "population": 21,
      "averageHealth": 54,
      "foodStockpile": 89,
      "sciencePoints": 68
    },
    "day365": {
      "population": 21,
      "averageHealth": 55.3,
      "foodStockpile": 112,
      "sciencePoints": 85
    }
  }
}
```

---

## Future Evolution Path

This minimal simulator is designed to evolve into the full simulation system:

### Phase 1: Minimal Simulator (This Document)
- ✓ Health attribute fully implemented
- ✓ Other attributes simplified/fixed
- ✓ Basic food/science system
- ✓ Simple reproduction and mortality
- ✓ Two technologies (Stone Knapping, Fire Mastery)
- ✓ 365-day viability check

### Phase 2: Core Simulator
- ✓ All five attributes fully implemented
- ✓ Dynamic shelter, safety, belonging calculations
- ✓ Full prehistoric tech tree (35 technologies)
- ✓ Seasonal variation in food production
- ✓ Individual decision-making and action priorities
- ✓ Group influence and urgency multipliers
- ✓ 10-year simulation period

### Phase 3: Full Simulator
- ✓ Multiple civilizations
- ✓ Terrain and map integration
- ✓ Resource trading
- ✓ Combat and conflict
- ✓ Complex social relationships
- ✓ Disease systems
- ✓ Player interaction and policy setting

### Phase 4: Production Simulator
- ✓ Real-time progression (1 year per second)
- ✓ Multiplayer support
- ✓ UI visualization
- ✓ Save/load game state
- ✓ Performance optimization for 100+ concurrent games

---

## Validation Approach

### How to Validate This Design

Before implementing code, validate the design through spreadsheet modeling:

1. **Create Spreadsheet Model:**
   - Columns for each simulation step
   - Rows for each day (1-365)
   - Formulas matching the specifications

2. **Test Scenarios:**
   - Default conditions (80/20 food/science)
   - Harsh terrain (0.6 multiplier)
   - Optimal conditions (1.5 multiplier)
   - Various food allocation ratios (60%, 70%, 80%, 90%, 95%, 100%)

3. **Verify Balance:**
   - Does default scenario produce viable result?
   - Is there interesting tension in resource allocation?
   - Are formulas producing expected value ranges?
   - Do extreme scenarios behave reasonably?

4. **Iterate Design:**
   - Adjust formulas if outcomes are too predictable
   - Tune constants if viability is too high/low
   - Refine thresholds based on observed patterns

5. **Document Expected Results:**
   - Typical viable scenario trajectory
   - Typical non-viable scenario trajectory
   - Critical decision points and player choices

---

## Design Rationale

### Why This Minimal Scope?

**Goal**: Verify starting positions are viable, not build the full game.

**What's Essential:**
- ✓ Food system (survival depends on it)
- ✓ Health attribute (links food to survival)
- ✓ Science system (shows growth capability)
- ✓ Reproduction/mortality (population dynamics)
- ✓ One research goal (proves science works)

**What's Not Essential (Yet):**
- ✗ Complex attribute interactions
- ✗ Full tech tree (just need proof of concept)
- ✗ Shelter/safety calculations (fixed values work for viability check)
- ✗ Individual personalities (population averages sufficient)
- ✗ Terrain and geography (use simple multiplier)
- ✗ Multiple civilizations (single civ proves mechanics)

### Why These Success Criteria?

**Population Survival (day 365):**
- Proves starting position isn't immediately fatal
- Basic viability threshold

**Population Growth (+1):**
- Proves reproduction mechanics work
- Shows position can support expansion
- Indicates sustainable conditions

**Science Progress (50 points):**
- Proves research mechanics work
- Shows civilization can advance
- Halfway to first tech demonstrates progress is possible

**Health Threshold (30):**
- Proves population isn't perpetually starving
- Shows basic needs can be met
- Indicates sustainable living conditions

Together, these criteria ensure a starting position can support a living, growing, advancing civilization—the core promise of the game.

---

## Related Documents

- **HUMAN_ATTRIBUTES.md**: Full specification for the five-attribute system (this minimal version simplifies)
- **PREHISTORIC_TECH_TREE.md**: Full tech tree (this minimal version uses only 2 technologies)
- **MAP_GENERATION.md**: Terrain generation system (this minimal version uses terrain multiplier only)
- **0.0002creategame.md**: Game creation system (starting positions generated here will be validated)

---

## Conclusion

This minimal simulator design provides the smallest possible implementation to verify that starting positions can support viable civilizations. By focusing exclusively on survival, growth, and basic research capability, the design avoids complexity while proving the core mechanics work.

The success criteria ensure that any starting position passing this viability check can support:
1. A surviving population (not immediate extinction)
2. Population growth (reproduction exceeds mortality)
3. Technological progress (research system functions)
4. Sustainable conditions (health remains adequate)

This foundation will be extended in future phases to include the full attribute system, complete tech tree, complex individual behaviors, and all other gameplay elements—but for now, the minimal simulator focuses solely on answering the question: **"Can a civilization survive and grow here?"**

---

**Document Version History:**
- 0.0005 (2025-10-23): Initial design specification for minimal viability simulator

**Implementation Notes:**
- This is a **design document only**
- No code implementation should begin until this design is reviewed and approved
- Spreadsheet validation is recommended before coding
- Design may be refined based on validation results
