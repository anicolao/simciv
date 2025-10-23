# SimCiv Human Attributes System Design Specification
## Individual Human Behavior and Decision-Making

### Document Status
**Version:** 0.0004  
**Status:** Design Review  
**Last Updated:** 2025-10-23  
**Purpose:** Specification for simulated human attribute system, behavioral formulas, and decision-making mechanics for prehistoric civilizations

---

## Executive Summary

This document specifies the design for SimCiv's individual human attribute system, which governs the behavior and decision-making of simulated prehistoric humans. The design introduces five fundamental attributes that drive human behavior and a simple two-choice resource allocation system (food vs. science) that determines civilization development.

**Key Features:**
- Five core attributes: health, shelter, safety, belonging, luxury
- Prehistoric starting conditions (low attribute values)
- Two-choice investment system: food or science advancement
- Food → health relationship
- Science → tech tree progress + luxury contribution
- Reproduction mechanics with realistic constraints
- Behavioral formulas determining action priorities
- 30-year average lifespan with fertility at ages 13-15

This design provides the foundation for emergent human behavior in SimCiv, enabling simulated humans to make rational decisions based on their needs while creating interesting strategic gameplay through resource allocation choices.

---

## Architecture Context

The human attributes system integrates with SimCiv's architecture:
- **Database Layer**: Stores individual human records with attribute values
- **Simulation Engine**: Calculates attribute changes, evaluates decisions, manages lifecycles
- **Server Layer**: Tracks population statistics, aggregates resources
- **Client Layer**: Visualizes population state, displays attribute distributions

This design maintains the database-as-single-source-of-truth principle, with all human state persisted and deterministic updates based on game rules.

---

## Core Human Attributes

### Overview

Each simulated human possesses five fundamental attributes that represent their basic needs and quality of life. These attributes drive all behavioral decisions and determine survival, reproduction, and contribution to civilization.

**The Five Attributes:**

1. **Health** (0-100)
2. **Shelter** (0-100)
3. **Safety** (0-100)
4. **Belonging** (0-100)
5. **Luxury** (0-100)

All attributes are normalized to a 0-100 scale where:
- **0-20**: Critical deficiency (survival threatened)
- **21-40**: Significant deficiency (major problems)
- **41-60**: Adequate but not comfortable
- **61-80**: Good condition
- **81-100**: Excellent condition

### Attribute Definitions

#### 1. Health (0-100)

**Definition:** Represents physical well-being, nutrition, and absence of disease.

**Influenced By:**
- **Food Consumption**: Primary driver (direct relationship)
- **Age**: Declines naturally with age
- **Environmental Factors**: Climate, weather conditions
- **Disease**: Random events reduce health
- **Medical Technology**: Higher tech reduces health decline rate

**Critical Thresholds:**
- **< 20**: Risk of death increases significantly
- **< 30**: Cannot work effectively (50% productivity)
- **< 50**: Cannot reproduce
- **> 60**: Normal functioning
- **> 80**: Peak physical condition

**Mechanics:**
```
Health Change Per Day:
  base_change = -0.5 (natural decline)
  food_bonus = (food_consumed / food_required) * 15
  age_penalty = -(age / 30) * 5
  tech_bonus = medical_tech_level * 2
  
  daily_health_change = base_change + food_bonus + age_penalty + tech_bonus
  health = clamp(health + daily_health_change, 0, 100)
```

**Food Requirements:**
- Prehistoric humans: 2000 calories/day (2 food units)
- Growing children (0-15): 1500 calories/day (1.5 food units)
- Adults (15-60): 2000 calories/day (2 food units)
- Elderly (60+): 1500 calories/day (1.5 food units)

#### 2. Shelter (0-100)

**Definition:** Represents protection from environmental hazards, quality of housing, and personal space.

**Influenced By:**
- **Housing Quality**: Type and condition of dwelling
- **Population Density**: Overcrowding reduces shelter value
- **Construction Technology**: Better tech enables better shelter
- **Climate Severity**: Harsh climates require better shelter
- **Maintenance**: Buildings degrade without upkeep

**Critical Thresholds:**
- **< 20**: Exposed to elements (health penalty -5/day)
- **< 40**: Poor conditions (morale penalty)
- **> 60**: Adequate protection
- **> 80**: Comfortable living conditions

**Mechanics:**
```
Shelter Value Calculation:
  base_shelter = dwelling_type_quality (0-100)
  density_penalty = (population_in_dwelling / optimal_capacity - 1) * 20
  weather_modifier = climate_severity * 0.5
  tech_bonus = construction_tech_level * 3
  
  shelter = clamp(base_shelter - density_penalty + tech_bonus - weather_modifier, 0, 100)
```

**Dwelling Types (Prehistoric):**
- **None (Exposed)**: 0 shelter
- **Simple Lean-to**: 20 shelter, capacity 1-2
- **Cave/Rock Shelter**: 40 shelter, capacity 4-8
- **Hide Tent**: 30 shelter, capacity 2-4
- **Primitive Hut**: 50 shelter, capacity 3-6
- **Improved Hut**: 70 shelter, capacity 4-8 (requires tools/fire)

#### 3. Safety (0-100)

**Definition:** Represents protection from threats (predators, hostile humans, natural disasters).

**Influenced By:**
- **Group Size**: Larger groups provide more safety
- **Weapons/Tools**: Better tools increase safety
- **Defensive Structures**: Walls, barriers, elevated positions
- **Territorial Control**: Familiarity with area
- **Military Technology**: Better weapons and tactics

**Critical Thresholds:**
- **< 20**: Constant danger (high stress, poor sleep)
- **< 40**: Significant threat presence
- **> 60**: Reasonably secure
- **> 80**: Well-protected environment

**Mechanics:**
```
Safety Calculation:
  base_safety = 20 (baseline for individual)
  group_bonus = min(sqrt(group_size) * 10, 40)
  weapon_bonus = weapon_tech_level * 5
  defense_bonus = defensive_structures * 10
  threat_penalty = nearby_threats * -15
  
  safety = clamp(base_safety + group_bonus + weapon_bonus + defense_bonus + threat_penalty, 0, 100)
```

**Threats:**
- **Wild Predators**: -15 safety per active predator in area
- **Hostile Humans**: -20 safety per hostile group nearby
- **Natural Disasters**: -30 safety during event
- **Resource Scarcity**: -10 safety when food/water scarce

#### 4. Belonging (0-100)

**Definition:** Represents social connection, community acceptance, and sense of purpose within the group.

**Influenced By:**
- **Group Size**: Optimal range exists (too small or too large reduces belonging)
- **Social Interactions**: Time spent with others
- **Shared Activities**: Cooperation increases belonging
- **Social Status**: Recognition and respect
- **Cultural Cohesion**: Shared beliefs and practices

**Critical Thresholds:**
- **< 20**: Social isolation (depression, reduced motivation)
- **< 40**: Weak social bonds
- **> 60**: Good social integration
- **> 80**: Strong community ties

**Mechanics:**
```
Belonging Calculation:
  optimal_group_size = 50 (Dunbar's number approximation for small groups)
  size_factor = 1 - abs(group_size - optimal_group_size) / optimal_group_size
  base_belonging = 50 * size_factor
  interaction_bonus = daily_social_interactions * 2
  contribution_bonus = (resources_contributed / group_average) * 10
  status_bonus = social_rank * 5
  
  belonging = clamp(base_belonging + interaction_bonus + contribution_bonus + status_bonus, 0, 100)
```

**Social Activities:**
- **Shared Meals**: +3 belonging per meal
- **Cooperative Work**: +2 belonging per hour
- **Defense/Hunting Together**: +5 belonging per event
- **Ritual/Celebration**: +10 belonging (periodic)
- **Conflict Resolution**: +5 belonging when resolved

#### 5. Luxury (0-100)

**Definition:** Represents access to non-essential goods, experiences, and quality of life improvements beyond basic survival.

**Influenced By:**
- **Scientific Advancement**: Higher tech unlocks luxury possibilities
- **Surplus Resources**: Excess beyond survival needs
- **Artisan Goods**: Crafted items, decorations, art
- **Leisure Time**: Time for non-survival activities
- **Cultural Achievements**: Music, storytelling, games

**Critical Thresholds:**
- **< 20**: Pure survival mode (no extras)
- **< 40**: Minimal comforts
- **> 60**: Some enjoyments available
- **> 80**: Rich cultural life

**Mechanics:**
```
Luxury Calculation:
  base_luxury = science_advancement_level * 5
  surplus_bonus = (resources_available / resources_needed - 1) * 20
  leisure_bonus = (hours_free / 8) * 15
  artisan_bonus = crafted_goods_access * 10
  cultural_bonus = cultural_tech_level * 5
  
  luxury = clamp(base_luxury + surplus_bonus + leisure_bonus + artisan_bonus + cultural_bonus, 0, 100)
```

**Luxury Sources (Prehistoric):**
- **Fire Control**: +10 luxury (warmth, cooking, light)
- **Decorative Items**: +5 luxury (jewelry, art)
- **Music/Dance**: +8 luxury (cultural activities)
- **Improved Food**: +7 luxury (variety, taste)
- **Comfortable Clothing**: +6 luxury (beyond protection)
- **Storytelling/Games**: +5 luxury (entertainment)

---

## Prehistoric Starting Conditions

### Initial Attribute Values

Prehistoric humans begin the simulation with relatively low attribute values, reflecting the harsh conditions of early human existence:

**Starting Ranges (Game Start):**

| Attribute | Starting Range | Average | Rationale |
|-----------|---------------|---------|-----------|
| Health | 30-50 | 40 | Barely adequate nutrition, no medicine |
| Shelter | 10-30 | 20 | Minimal protection from elements |
| Safety | 15-35 | 25 | Constant predator threats, no defenses |
| Belonging | 40-60 | 50 | Strong in small groups naturally |
| Luxury | 0-10 | 5 | Almost no surplus beyond survival |

**Starting Population Parameters:**
- **Initial Population**: 20-50 humans per civilization
- **Age Distribution**: 
  - Children (0-12): 30%
  - Fertile Adults (13-30): 50%
  - Older Adults (30+): 20%
- **Starting Location**: Random but resource-viable starting position
- **Initial Resources**: 100 food units (50 days supply for 20 people)

### Environmental Starting Conditions

**Prehistoric World State:**
- **Technology Level**: 0 (stone age, no tools)
- **Available Food Sources**: Wild gathering, primitive hunting
- **Predator Presence**: High (no protective measures)
- **Climate**: Varies by starting location
- **Social Structure**: Loose bands, no formal hierarchy

---

## Two-Choice Investment System

### Overview

The core strategic mechanic involves a civilization-wide choice of how to allocate human effort. Each day, the population's available labor hours are divided between two activities:

1. **Food Acquisition** (Hunting, Gathering, later Farming)
2. **Science Advancement** (Tool-making, Experimentation, Technology Development)

This simple but profound choice drives all civilization development and determines the trajectory of human attribute improvement.

### Resource Allocation Mechanics

**Available Labor Hours:**
```
Each adult human provides:
  work_hours_per_day = 8 hours (if health > 50)
  work_hours_per_day = 4 hours (if health 30-50)
  work_hours_per_day = 0 hours (if health < 30)

Total daily labor:
  total_work_hours = sum(work_hours for all adults)
```

**Allocation Decision:**

Players (or AI for autonomous groups) set a ratio:
```
food_ratio = percentage of effort toward food (0-100%)
science_ratio = 100% - food_ratio

food_hours = total_work_hours * food_ratio
science_hours = total_work_hours * science_ratio
```

**Player-Set Allocation:**

Players always set the food allocation ratio (default: 80%):
```
food_ratio = 80%  (default, player-adjustable 0-100%)
science_ratio = 100% - food_ratio
```

**Population Feedback System:**

The system provides feedback to help players understand food safety status:

```
Calculate population-wide food status:

  food_per_person = total_food / population
  food_required = 2.0 units/person
  food_ratio_actual = food_per_person / food_required
  
  avg_health = average(all_humans.health)

Feedback to Player:

  If avg_health < 30 OR food_ratio_actual < 0.5:
    Status: CRITICAL FOOD SHORTAGE
    Message: "Population is starving. Increase food allocation immediately."
    UI: Red warning indicator
  
  Else If avg_health < 50 OR food_ratio_actual < 0.8:
    Status: FOOD SAFETY RISK
    Message: "Food supply is inadequate. Consider increasing food allocation."
    UI: Yellow warning indicator
  
  Else If avg_health > 80 AND food_ratio_actual > 1.5:
    Status: FOOD ABUNDANCE
    Message: "Surplus food available. You can reduce food allocation to advance science."
    UI: Green positive indicator
  
  Else:
    Status: ADEQUATE
    Message: "Food supply is stable."
    UI: Neutral indicator
```

### Food Acquisition System

**Food Production Formula:**
```
Food produced per hour:
  base_rate = 0.3 food units/hour (primitive gathering)
  
  Modifiers:
  - Tool technology: * (1 + tool_level * 0.2)
  - Environment richness: * terrain_food_multiplier (0.5 to 2.0)
  - Group size efficiency: * min(1.0, sqrt(workers) / sqrt(optimal_workers))
  - Seasonal variation: * season_multiplier (0.5 to 1.5)
  
  food_production = food_hours * base_rate * all_modifiers
```

**Food → Health Relationship:**
```
Daily food distribution:
  food_per_person = total_food / population
  food_required = 2.0 units/person
  
  health_gain_per_day = (food_per_person / food_required - 0.5) * 15
  
  If food_per_person < food_required:
    health decreases (starvation)
  If food_per_person == food_required:
    health stable (neutral point at 50)
  If food_per_person > food_required:
    health increases (up to 100)
```

**Strategic Implications:**
- **High Food Investment**: Rapid health improvement, but slow tech progress
- **Low Food Investment**: Risk of starvation, but faster advancement if population survives
- **Balanced Approach**: Steady health maintenance with moderate advancement

### Science Advancement System

**Science Progress Formula:**
```
Science points produced per hour:
  base_rate = 1.0 science point/hour
  
  Modifiers:
  - Population size: * log10(population) (collaboration bonus)
  - Intelligence factor: * 1.0 (baseline, may vary by individual in future)
  - Tool availability: * (1 + tool_level * 0.1) (tools help research)
  - Health threshold: * 0.5 if average_health < 50 (can't think when starving)
  
  science_production = science_hours * base_rate * all_modifiers
```

**Technology Unlock System:**
```
Each technology has a science cost:
  Tech unlocks when accumulated_science >= tech_cost

Prehistoric Technologies (Examples):
- Stone Tools: 100 science points
- Fire Control: 250 science points
- Basic Shelter: 200 science points
- Primitive Weapons: 150 science points
- Food Preservation: 300 science points

(Note: Full tech tree designed in separate task)
```

**Science → Luxury Relationship:**
```
Each technology unlock provides luxury bonus:
  luxury_bonus = tech_level * 5
  
Additionally, science advancement enables:
  - Better tools → more efficient food gathering → more leisure time
  - Better weapons → higher safety
  - Better shelter → improved shelter attribute
  - Cultural technologies → direct luxury increases
  
Example progression:
  No tech: luxury = 0-10
  Stone tools: luxury = 5-15 (+5)
  Fire control: luxury = 15-25 (+10 more)
  Basic art: luxury = 20-35 (+15 total)
```

**Strategic Implications:**
- **High Science Investment**: Rapid tech progress, luxury improvements, but risks starvation
- **Low Science Investment**: Survival assured but no advancement (stuck in stone age)
- **Balanced Approach**: Gradual improvement in both areas

---

## Behavioral Decision-Making Formulas

### Group Influence and Urgency Multipliers

Before individual humans make decisions, the group's collective state is evaluated to create urgency multipliers that influence individual behavior. This represents how the overall situation affects everyone's priorities.

**Group State Evaluation:**

```
Calculate population-wide attribute averages:

  avg_health = average(all_humans.health)
  avg_shelter = average(all_humans.shelter)
  avg_safety = average(all_humans.safety)
  avg_belonging = average(all_humans.belonging)
  avg_luxury = average(all_humans.luxury)
```

**Urgency Multipliers:**

These multipliers are applied to individual action urgency scores to amplify or dampen certain behaviors based on group-level needs.

```
Health Urgency Multiplier (affects food gathering):
  If avg_health < 30:
    health_urgency_multiplier = 3.0 (crisis - everyone focuses on food)
  Else If avg_health < 50:
    health_urgency_multiplier = 1.5 (elevated concern)
  Else If avg_health < 70:
    health_urgency_multiplier = 1.0 (normal)
  Else:
    health_urgency_multiplier = 0.7 (abundance - less pressure)

Safety Urgency Multiplier (affects defense actions):
  If avg_safety < 30:
    safety_urgency_multiplier = 2.5 (crisis - all hands to defense)
  Else If avg_safety < 50:
    safety_urgency_multiplier = 1.3 (heightened alert)
  Else:
    safety_urgency_multiplier = 1.0 (normal vigilance)

Shelter Urgency Multiplier (affects shelter building):
  If avg_shelter < 30 AND weather_severe:
    shelter_urgency_multiplier = 2.0 (emergency construction)
  Else If avg_shelter < 50:
    shelter_urgency_multiplier = 1.2 (priority improvement)
  Else:
    shelter_urgency_multiplier = 1.0 (normal maintenance)

Belonging Urgency Multiplier (affects social activities):
  If avg_belonging < 40:
    belonging_urgency_multiplier = 1.3 (morale crisis)
  Else:
    belonging_urgency_multiplier = 1.0 (stable)

Luxury Urgency Multiplier (affects science/crafting):
  If avg_health > 70 AND avg_safety > 60:
    luxury_urgency_multiplier = 1.3 (conditions favor advancement)
  Else If avg_health < 40 OR avg_safety < 40:
    luxury_urgency_multiplier = 0.3 (survival takes priority)
  Else:
    luxury_urgency_multiplier = 1.0 (balanced)
```

**Application:**

These multipliers are calculated once per simulation cycle and applied to all individuals' action urgency calculations, creating emergent group behavior while maintaining individual decision-making.

### Individual Action Priorities

Each human evaluates their needs every simulation cycle and chooses actions based on attribute deficiencies, available options, and group urgency multipliers.

**Action Priority Calculation:**

```
For each possible action (gathering food, seeking shelter, defending, socializing, etc.):

  Calculate base urgency score:
    base_urgency = sum(attribute_deficiency * attribute_weight)
  
  Where:
    attribute_deficiency = max(0, 50 - attribute_value) / 50
    attribute_weight varies by action type
  
  Apply group urgency multiplier:
    final_urgency = base_urgency * action_urgency_multiplier

Action Weights by Type:

Food Gathering Action:
  health_weight = 3.0 (primary)
  shelter_weight = 0.0
  safety_weight = 0.1 (minor consideration)
  belonging_weight = 0.2 (group activity)
  luxury_weight = 0.0
  urgency_multiplier = health_urgency_multiplier

Defense Action:
  health_weight = 0.5
  shelter_weight = 0.0
  safety_weight = 4.0 (primary)
  belonging_weight = 1.0 (group defense)
  luxury_weight = 0.0
  urgency_multiplier = safety_urgency_multiplier

Shelter Building:
  health_weight = 0.3
  shelter_weight = 3.0 (primary)
  safety_weight = 0.5
  belonging_weight = 0.5
  luxury_weight = 0.2
  urgency_multiplier = shelter_urgency_multiplier

Social Activity:
  health_weight = 0.0
  shelter_weight = 0.0
  safety_weight = 0.0
  belonging_weight = 3.0 (primary)
  luxury_weight = 1.0
  urgency_multiplier = belonging_urgency_multiplier

Science/Tool-making:
  health_weight = 0.1
  shelter_weight = 0.0
  safety_weight = 0.2
  belonging_weight = 0.3
  luxury_weight = 2.0 (primary)
  urgency_multiplier = luxury_urgency_multiplier
```

**Decision Algorithm:**

```
Each simulation hour:
  1. Calculate base urgency score for each available action
  2. Apply group urgency multiplier for that action type
  3. Apply situational modifiers:
     - Cannot gather food if no food sources nearby (* 0.0)
     - Cannot build shelter without materials (* 0.5 or 0.0)
     - Defense only if threats present (* 0.0 if no threats)
     - Science only if basic needs met (* 0.0 if health < 30)
  4. Add random variation (±10%) to avoid deterministic behavior
  5. Select action with highest final urgency score
  6. Execute action for 1 hour (or until interrupted)
  7. Update attributes based on action results
```

---

## Reproduction and Population Dynamics

### Fertility and Reproduction

**Fertility Parameters:**
- **Minimum Fertility Age**: 13 years
- **Maximum Fertility Age**: 15 years (onset, not end)
- **Peak Fertility Period**: 15-30 years
- **Fertility Decline**: 30-45 years (reducing gradually)
- **End of Fertility**: 45 years (women), continuous with decline (men)

**Reproduction Requirements:**

```
A human can reproduce if:
  1. Age >= 13 AND age <= 45
  2. health >= 50 (critical threshold)
  3. belonging >= 40 (needs social bonds)
  4. Has potential partner (opposite gender, similar age range)
  5. Not currently pregnant/caring for infant < 1 year

Conception Probability:
  base_chance = 0.03 per month (3% monthly for eligible pairs)
  
  Modifiers:
  - health_modifier = (health - 50) / 50  (range: 0.0 to 1.0)
  - belonging_modifier = (belonging - 40) / 60 (range: 0.0 to 1.0)
  - age_modifier = 1.0 (age 15-25), 0.8 (age 13-15 or 25-30), 0.5 (age 30-40), 0.2 (age 40-45)
  - stress_modifier = (100 - safety) / 100 (lower safety reduces fertility)
  
  monthly_conception_chance = base_chance * health_modifier * belonging_modifier * age_modifier * stress_modifier
```

**Pregnancy and Birth:**
```
Pregnancy duration: 9 months (270 days)

During pregnancy (women only):
  - Work capacity reduced by 30% (months 7-9)
  - Food requirement increased by 20%
  - health decreases by 0.5/day additional (nutrition stress)

Birth outcomes:
  - Infant survival: 70% (prehistoric, no medicine)
  - Mother survival: 95% (maternal mortality risk)
  - Twin chance: 2%

Post-birth:
  - Mother cannot conceive for 12 months (lactation period)
  - Infant requires constant care (parent work capacity -50% for 1 year)
  - Food requirement +1 unit/day for nursing
```

### Lifespan and Mortality

**Lifespan Parameters:**
- **Average Lifespan**: 30 years (prehistoric conditions)
- **Maximum Lifespan**: 60 years (rare, requires good health maintenance)
- **Infant Mortality**: 30% (first year)
- **Child Mortality**: 15% (years 1-5)
- **Adult Mortality**: Variable, based on health and conditions

**Death Probability:**

```
Monthly death probability calculation:

Base mortality rate by age:
  age 0-1: base_rate = 0.025 (2.5% monthly = 30% yearly)
  age 1-5: base_rate = 0.012 (1.2% monthly = 15% yearly)
  age 5-15: base_rate = 0.003 (0.3% monthly = 3.6% yearly)
  age 15-30: base_rate = 0.002 (0.2% monthly = 2.4% yearly)
  age 30-45: base_rate = 0.004 (0.4% monthly = 4.8% yearly)
  age 45-60: base_rate = 0.010 (1.0% monthly = 12% yearly)
  age 60+: base_rate = 0.020 (2.0% monthly = 24% yearly)

Health modifiers:
  health > 80: * 0.5 (excellent health reduces risk)
  health 60-80: * 1.0 (normal)
  health 40-60: * 1.5 (poor health increases risk)
  health 20-40: * 3.0 (very poor health)
  health < 20: * 10.0 (critical condition)

Environmental modifiers:
  safety < 30: * 2.0 (dangerous environment)
  shelter < 30 AND harsh_climate: * 1.5 (exposure)
  starvation (health declining due to food): * 2.5

Final calculation:
  monthly_death_chance = base_rate * health_modifier * environmental_modifiers
  
Death check:
  Roll random(0, 1) each month
  If roll < monthly_death_chance: human dies
  
Upon death:
  - Remove from population
  - Resources are redistributed to group
  - Social bonds affect remaining population belonging (-5 for close relations)
```

**Population Growth Dynamics:**

```
Natural population change per year:

Birth rate:
  fertile_population = count(age 13-45, health >= 50)
  potential_births = fertile_population * 0.35 (35% annual birth rate if conditions good)
  actual_births = potential_births * average_health_modifier * average_belonging_modifier

Death rate:
  expected_deaths = sum(monthly_death_chance for all humans) * 12

Population growth rate:
  growth_rate = (births - deaths) / population

Typical ranges:
  Starvation conditions: -10% to -20% (population decline)
  Survival conditions: -2% to +5% (barely stable)
  Adequate conditions: +5% to +15% (slow growth)
  Prosperous conditions: +15% to +30% (rapid growth)
```

---

## Behavioral Scenarios and Formulas

### Scenario 1: Starvation Crisis

**Initial Conditions:**
- Average health: 30 (critical)
- Food supply: 0.5 units per person per day
- Population: 40 humans
- Player food allocation: 80% (default)

**Behavioral Response:**

```
Group Influences:
  - avg_health = 30 → health_urgency_multiplier = 3.0 (crisis)
  - System feedback: "CRITICAL FOOD SHORTAGE - Population is starving"

Individual Actions (influenced by 3.0x food urgency multiplier):
  - 95% of population attempts food gathering (urgency massively amplified)
  - 5% maintain minimal defense (safety urgency still present)
  - 0% engage in science/tool-making (luxury urgency suppressed to 0.3x)
  - Social activities minimal (belonging sacrificed for survival)

Player Action:
  - Receives red warning indicator
  - Recommended to increase food_ratio to 95%+ if not already
  - May adjust allocation based on feedback

Outcomes after 30 days:
  If player maintains high food allocation and production increases to 1.5 units/person:
    - health increases to 45 (stabilizing)
    - health_urgency_multiplier drops to 1.5
    - mortality rate drops from 20%/month to 10%/month
    - Can begin considering other needs
  
  If player doesn't adjust or production stays at 0.5 units/person:
    - health declines to 20 (critical)
    - 30-40% mortality over 30 days
    - Population collapse likely
```

### Scenario 2: Predator Threat

**Initial Conditions:**
- Average safety: 25 (significant threat)
- Average health: 55 (adequate food)
- Predator presence: 3 large predators nearby
- Weapons: None (stone age)
- Player food allocation: 80%

**Behavioral Response:**

```
Group Influences:
  - avg_safety = 25 → safety_urgency_multiplier = 2.5 (crisis)
  - avg_health = 55 → health_urgency_multiplier = 1.0 (normal)
  - System does not provide food warnings (health adequate)

Individual Actions (influenced by 2.5x safety urgency multiplier):
  - 40% prioritize weapon-making and defense (urgency amplified)
  - 40% continue food gathering (normal urgency)
  - 15% focus on defensive positions (group safety)
  - 5% maintain social cohesion (belonging)

Player Awareness:
  - No automatic food warnings (health stable)
  - May notice population focusing on defense through UI
  - Can adjust food_ratio down if desired to allocate more to science/weapons

Outcomes after 14 days:
  With basic weapons developed:
    - safety increases to 45 (threat manageable)
    - 2-3 predators killed or driven off
    - safety_urgency_multiplier returns to 1.0 (normal)
    - Population can return to normal activities
  
  Without weapons (if science too slow):
    - safety remains at 25
    - 5-10% population lost to predator attacks
    - Continued high safety_urgency_multiplier (2.5x)
```

### Scenario 3: Prosperity and Advancement

**Initial Conditions:**
- Average health: 75 (good nutrition)
- Average safety: 65 (secure territory)
- Average shelter: 70 (good housing)
- Average belonging: 80 (strong community)
- Population: 80 humans
- Technology: Stone tools, fire control
- Player food allocation: 70%

**Behavioral Response:**

```
Group Influences:
  - avg_health = 75 → health_urgency_multiplier = 0.7 (abundance)
  - avg_safety = 65 → safety_urgency_multiplier = 1.0 (normal)
  - avg_health > 70 AND avg_safety > 60 → luxury_urgency_multiplier = 1.3 (favor advancement)
  - System feedback: "FOOD ABUNDANCE - You can reduce food allocation to advance science"

Individual Actions (influenced by 1.3x luxury urgency, 0.7x food urgency):
  - 30% food gathering (reduced urgency, maintenance level)
  - 40% science/tool-making (amplified urgency for advancement)
  - 15% social/cultural activities (belonging abundant)
  - 10% craft luxury items (art, decorations)
  - 5% teaching/knowledge transfer

Player Action:
  - Receives green positive indicator
  - Can reduce food_ratio to 50-60% to maximize science
  - Adjusts to food_ratio = 50%, science_ratio = 50%

Outcomes after 60 days:
  Technology unlocked:
    - Basic weaving (clothing, baskets)
    - Improved shelter construction
    - Food preservation techniques
  
  Attribute changes:
    - luxury increases from 30 to 50 (better quality of life)
    - health stable at 75 (food adequate even at 50% allocation)
    - Population growth +20% (good conditions)
  
  Strategic position:
    - Ahead of rival groups in technology
    - Can support larger population
    - Ready for next era of advancement
```

### Scenario 4: Balanced Development

**Initial Conditions:**
- Average health: 50 (threshold)
- All other attributes: 40-50 (adequate but not comfortable)
- Population: 50 humans
- Resources: Moderate, seasonal variation
- Player food allocation: 80% (default)

**Behavioral Response:**

```
Group Influences:
  - avg_health = 50 → health_urgency_multiplier = 1.0 (normal)
  - All attributes in 40-50 range → all multipliers near 1.0 (balanced)
  - System feedback: "ADEQUATE - Food supply is stable"

Individual Actions (all urgencies near baseline):
  - 50% food gathering (balanced priority with health at threshold)
  - 30% science/crafting (moderate advancement)
  - 10% shelter maintenance
  - 5% defense
  - 5% social activities

Player Strategy:
  - Maintains default 80% food allocation
  - Receives neutral feedback indicator
  - May adjust slightly based on seasonal variations observed

Outcomes after 90 days:
  Resource cycling:
    - Health fluctuates 45-60 with seasons
    - health_urgency_multiplier varies 1.0-1.5 with seasons
    - Science progresses steadily but slowly
    - Population stable (births ≈ deaths)
  
  Technology progress:
    - 1-2 minor technologies every 60 days
    - Gradual improvement trajectory
  
  Strategic position:
    - Sustainable but not thriving
    - Vulnerable to shocks (disaster, attack)
    - Needs breakthrough to advance to next level
    - Player could optimize allocation for faster progress
```

---

## Integration with Game Systems

### Database Schema

**Human Entity:**

```typescript
interface Human {
  humanId: string;              // Unique identifier
  gameId: string;               // Foreign key to game
  civilizationId: string;       // Foreign key to civilization
  
  // Demographics
  age: number;                  // Age in years (0-60)
  gender: string;               // "male" or "female"
  
  // Attributes (0-100 scale)
  health: number;
  shelter: number;
  safety: number;
  belonging: number;
  luxury: number;
  
  // Status
  isAlive: boolean;
  currentActivity: string;      // Current action being performed
  pregnantUntil: Date | null;  // If pregnant, due date
  
  // Relationships
  partnerId: string | null;     // Current reproductive partner
  children: string[];           // Array of child humanIds
  
  // Timestamps
  bornAt: Date;
  diedAt: Date | null;
  lastUpdated: Date;
}

// Indexes:
// - (gameId, civilizationId) - for civilization queries
// - (gameId, isAlive) - for population counts
// - (civilizationId, age, health) - for fertility queries
```

**Civilization Resource State:**

```typescript
interface CivilizationResources {
  civilizationId: string;       // Foreign key
  gameId: string;
  
  // Resources
  foodStockpile: number;        // Food units available
  sciencePoints: number;        // Accumulated science
  
  // Labor Allocation
  foodRatio: number;            // Percentage to food (0-100)
  scienceRatio: number;         // Percentage to science (0-100)
  
  // Population Statistics
  totalPopulation: number;
  averageHealth: number;
  averageShelter: number;
  averageSafety: number;
  averageBelonging: number;
  averageLuxury: number;
  
  // Technology
  unlockedTechnologies: string[]; // Array of tech IDs
  currentTechProgress: number;    // Progress toward next tech
  
  lastUpdated: Date;
}
```

### Simulation Engine Integration

**Update Cycle (Every Simulation Hour):**

```
1. Calculate Available Labor:
   - Count working-age humans (13-60)
   - Sum work hours (adjusted for health)
   - Apply food/science ratio split

2. Process Resource Generation:
   - Food production from food_hours
   - Science points from science_hours
   - Update stockpiles

3. Process Resource Consumption:
   - Distribute food to population
   - Calculate health changes from nutrition

4. Update Individual Attributes:
   - For each human:
     - Update health (food, age, disease)
     - Update shelter (dwelling status)
     - Update safety (threats, defenses)
     - Update belonging (social interactions)
     - Update luxury (tech level, surplus)

5. Calculate Group Influences:
   - Calculate population-wide attribute averages
   - Compute urgency multipliers based on group state:
     * health_urgency_multiplier (food gathering priority)
     * safety_urgency_multiplier (defense priority)
     * shelter_urgency_multiplier (shelter building priority)
     * belonging_urgency_multiplier (social activity priority)
     * luxury_urgency_multiplier (science advancement priority)
   - These multipliers influence all individual decisions this cycle

6. Process Individual Decisions:
   - Each human evaluates action priorities
   - Apply group urgency multipliers to action scores
   - Execute chosen actions
   - Update current activity

7. Process Life Events:
   - Check fertility and conception
   - Progress pregnancies
   - Check mortality (age, health, environment)
   - Process births and deaths

8. Update Group State:
   - Recalculate population statistics
   - Update averages for all attributes
   - Generate feedback for player (food status, warnings)

9. Technology Progression:
   - Check if tech unlocked (science points threshold)
   - Apply tech bonuses to relevant systems
   - Unlock new possibilities

10. Save State:
   - Update database with all changes
   - Record event log for UI
   - Prepare state for next cycle
```

### Client Visualization

**Population Overview Display:**
- Population count and demographics (age pyramid)
- Attribute averages with color coding (red < 40, yellow 40-60, green > 60)
- Current food/science allocation ratios
- Food stockpile and consumption rate
- Science progress bar toward next technology
- Recent births and deaths

**Individual Human Details:**
- Attribute values with visual bars
- Current activity
- Age and health status
- Reproductive status
- Relationships (partner, children)

**Civilization Dashboard:**
- Population trends (graph over time)
- Attribute trends (graph over time)
- Technology tree with unlocked items highlighted
- Resource production rates
- Strategic advice based on attribute states

---

## Balance and Tuning

### Target Balance Points

**Sustainable Civilization:**
- Average health: 55-65 (stable food production)
- Average shelter: 50-60 (adequate housing)
- Average safety: 50-65 (manageable threats)
- Average belonging: 60-75 (good community)
- Average luxury: 20-40 (some advancement)
- Population growth: 5-10% per year
- Science progress: 1 technology every 30-60 days

**Thriving Civilization:**
- Average health: 70-85
- Average shelter: 65-80
- Average safety: 70-85
- Average belonging: 75-90
- Average luxury: 50-75
- Population growth: 15-25% per year
- Science progress: 1 technology every 15-30 days

**Struggling Civilization:**
- Average health: 35-45
- Average shelter: 30-45
- Average safety: 30-50
- Average belonging: 40-60
- Average luxury: 5-15
- Population growth: -5% to +2% per year
- Science progress: 1 technology every 90-120 days

### Tuning Parameters

**If Game Too Easy (Populations Always Thrive):**
- Increase base mortality rates by 20%
- Reduce food production base_rate by 15%
- Increase predator threat frequency
- Add random environmental shocks (weather, disease)
- Increase tech costs by 25%

**If Game Too Hard (Populations Always Die):**
- Decrease base mortality rates by 20%
- Increase food production base_rate by 15%
- Reduce predator threat frequency
- Provide more starting resources
- Decrease tech costs by 25%

**If Science Too Slow:**
- Increase science production base_rate
- Reduce tech costs
- Add science bonuses from population milestones
- Increase science contribution from high-health individuals

**If Food Too Abundant:**
- Reduce food production base_rate
- Increase food consumption requirements
- Add food spoilage (decay over time)
- Increase seasonal variation severity

---

## Testing and Validation

### Simulation Testing

**Unit Tests:**
- Attribute calculation formulas
- Food production calculations
- Science point accumulation
- Fertility probability calculations
- Mortality rate calculations
- Action priority algorithms

**Integration Tests:**
- Full simulation cycle (1000 hours)
- Population stability under various conditions
- Technology progression timeline
- Reproduction and mortality balance
- Resource allocation impact on outcomes

**Balance Tests:**
- Run 100 simulations with various starting conditions
- Measure survival rate, technology progress, population growth
- Identify dominant strategies
- Ensure multiple viable approaches exist
- Validate that player choices matter

**Edge Case Tests:**
- Population collapse scenarios (recovery possible?)
- Population explosion (system handles large populations?)
- Zero food allocation (how quickly does population die?)
- Zero science allocation (can civilization survive indefinitely?)
- Extreme environmental conditions

### Playability Testing

**Metrics to Track:**
- Average game length before civilization collapses or thrives
- Most common cause of failure (starvation, attacks, disease)
- Technology unlock rates
- Player satisfaction with strategy depth
- Clarity of attribute feedback
- Responsiveness to player decisions

**Success Criteria:**
- 60-80% of games reach "sustainable" state
- 20-30% reach "thriving" state
- 10-20% fail (population collapse)
- Clear feedback loop between decisions and outcomes
- Multiple viable strategies for success
- Interesting emergent behaviors observed

---

## Future Enhancements

### Phase 1 (Current Design)
- ✓ Five-attribute system
- ✓ Two-choice resource allocation (food vs. science)
- ✓ Basic reproduction and mortality
- ✓ Prehistoric starting conditions
- ✓ Simple behavioral formulas

### Phase 2 (Near Term)
- **Individual Personalities**: Variation in attribute priorities between humans
- **Skills and Experience**: Humans get better at tasks over time
- **Leadership**: Some humans become leaders, influencing group decisions
- **Trade Between Groups**: Exchange resources for mutual benefit
- **Expanded Action Set**: More choices beyond food/science (diplomacy, war, exploration)

### Phase 3 (Long Term)
- **Complex Social Structures**: Hierarchies, specialization, social classes
- **Cultural Evolution**: Beliefs, traditions, cultural identity
- **Emotional States**: Happiness, stress, motivation as separate from attributes
- **Disease Systems**: Contagious diseases spreading through population
- **Education System**: Knowledge transfer between generations
- **Individual Goals**: Personal ambitions beyond basic needs

### Phase 4 (Advanced)
- **Genetic Variation**: Heritable traits affecting attributes
- **Psychological Effects**: Trauma, PTSD from violence/disasters
- **Complex Relationships**: Friendships, rivalries, family dynamics
- **Moral Systems**: Ethics, taboos, social norms
- **Advanced Decision-Making**: Multi-step planning, strategic thinking by individuals

---

## Implementation Checklist

### Pre-Implementation
- [x] Design document completed and reviewed
- [ ] Database schema approved
- [ ] Formula balance validated through spreadsheet modeling
- [ ] Test plan created

### Core Implementation
- [ ] Human entity database schema
- [ ] Civilization resource tracking
- [ ] Attribute calculation functions
- [ ] Food production and consumption systems
- [ ] Science accumulation system
- [ ] Reproduction mechanics
- [ ] Mortality system
- [ ] Behavioral decision algorithms

### Simulation Integration
- [ ] Hourly update cycle
- [ ] Resource generation pipeline
- [ ] Individual human updates
- [ ] Group decision-making
- [ ] Life event processing
- [ ] Technology unlock system

### Testing
- [ ] Unit tests for all formulas
- [ ] Integration tests for full cycles
- [ ] Balance testing (100+ simulations)
- [ ] Edge case validation
- [ ] Performance benchmarking

### Client Support
- [ ] Population overview API
- [ ] Individual human details API
- [ ] Attribute visualization components
- [ ] Resource allocation controls
- [ ] Technology progress display

---

## References and Inspiration

### Anthropology and Prehistory
- **Paleolithic Era**: Understanding early human survival challenges
- **Hunter-Gatherer Societies**: Resource acquisition strategies
- **Demographic Transition**: Population dynamics through history
- **Dunbar's Number**: Social group size limits (150 individuals)

### Game Design
- **Maslow's Hierarchy of Needs**: Inspiration for attribute system
- **The Sims**: Individual needs and behavior simulation
- **Rimworld**: Colonist needs, priorities, and survival mechanics
- **Civilization Series**: Technology progression and strategic choices
- **Dwarf Fortress**: Complex individual simulation and emergent behavior

### Systems Theory
- **Feedback Loops**: Positive and negative feedback in population dynamics
- **Optimization Problems**: Resource allocation under constraints
- **Multi-Agent Systems**: Individual decisions creating emergent group behavior
- **Game Theory**: Strategic decision-making with competing objectives

---

## Conclusion

This human attribute system provides SimCiv with a foundation for realistic, engaging simulation of prehistoric human behavior. By reducing complex survival decisions to five key attributes and a simple two-choice resource allocation system, the design creates strategic depth while remaining accessible.

The interplay between immediate needs (food for health) and long-term advancement (science for luxury and technology) creates a compelling tension that drives gameplay. Players must balance short-term survival against long-term prosperity, with realistic consequences for poor decisions reflected in population health, reproduction rates, and mortality.

The system is designed for extension—additional attributes, actions, and complexities can be layered on as the game evolves—but the core mechanics provide a solid foundation for the prehistoric era of SimCiv civilization building.

---

**Document Version History:**
- 0.0004 (2025-10-23): Initial design specification for human attributes system

**Related Documents:**
- VISION.md: Overall game vision and design philosophy
- version0.0001.md: Authentication system
- MAP_GENERATION.md: Terrain generation and starting positions
- (Future) TECH_TREE.md: Technology progression system (separate task)
