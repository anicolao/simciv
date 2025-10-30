# SimCiv Unit Creation and Behavior Design Specification
## Population-Based Unit System with Settlers Mechanic

### Document Status
**Version:** 0.0007  
**Status:** Design Review  
**Last Updated:** 2025-10-30  
**Purpose:** Specification for population-based unit creation, behavior, and settlement mechanics

---

## Executive Summary

This document specifies the design for SimCiv's unit creation and behavior system. Unlike traditional strategy games where units are built directly, SimCiv's units emerge organically from population growth at specific thresholds. The first and most fundamental unit is the **Settlers Unit**, which enables civilizations to establish new settlements and expand their territory.

**Key Features:**
- Population-threshold-based unit creation (not traditional production)
- Settlers units require 100 population per unit
- Initial game state: 100 population = 1 settlers unit, no settled location
- Units can only be produced from existing settlements
- Settlers establish the first settlement, enabling future unit production
- AI-driven settlers behavior: wander towards optimal settlement locations
- Technology integration: settlement types adapt to unlocked technologies
- Progressive expansion: each 100 additional population enables a new settlers unit

**Design Philosophy:**
This system transforms population from a simple resource counter into a strategic asset. Players must balance population growth against the opportunity to create specialized units, creating meaningful trade-offs between expansion (settlers) and other future unit types (warriors, workers, etc.).

---

## Related Documents

- **MINIMAL_SIMULATOR.md**: Population simulation and growth mechanics
- **PREHISTORIC_TECH_TREE.md**: Technology unlocks and building types
- **MAP_GENERATION.md**: Terrain types and resource distribution
- **0.0002creategame.md**: Game initialization and player setup
- **HUMAN_ATTRIBUTES.md**: Population health and survival mechanics

---

## Architecture Context

The unit creation system integrates with SimCiv's core architecture:
- **Database Layer**: Stores unit instances, positions, states, and assignments
- **Simulation Engine**: Processes unit behavior, movement, and settlement decisions
- **Client Layer**: Renders units on map, displays unit information and actions
- **Game State**: Tracks population allocation to units and settlements
- **Technology System**: Determines available settlement types and unit capabilities

The design maintains the database-as-single-source-of-truth principle while enabling emergent strategic gameplay through population management.

---

## Core Concepts

### 1. Population as Unit Source

**Traditional Model (What We're NOT Doing):**
- City produces 10 shields per turn
- Settlers unit costs 40 shields
- City queues production, completes in 4 turns
- City size unchanged after unit creation

**SimCiv Model (What We ARE Doing):**
- Population grows naturally based on health, food, and conditions
- When population reaches threshold (100), unit becomes available
- Unit creation consumes the population threshold permanently
- Remaining population continues growing toward next threshold

**Example Progression:**
- **Pop 0-99**: No units, no settlement possible
- **Pop 100**: 1 settlers unit available
- **Pop 100-199**: 1 settlers unit, settlement possible
- **Pop 200**: After first settlers settles (consuming 100 pop), 100 remain → another settlers available at 200
- **Pop 300**: 1 settlement (100 pop) + 2 settlers units (200 pop)

### 2. Unit Types and Thresholds

**Initial Implementation (Version 0.0007):**

| Unit Type | Population Cost | Purpose | Special Abilities |
|-----------|----------------|---------|-------------------|
| Settlers  | 100            | Establish settlements | Can found new location |

**Future Implementation (Post-MVP):**

| Unit Type | Population Cost | Purpose | Special Abilities |
|-----------|----------------|---------|-------------------|
| Warriors  | 100            | Defense and conquest | Combat, territory control |
| Scouts    | 50             | Exploration | Increased vision range |
| Workers   | 100            | Improvements | Build roads, farms, mines |

**Population Allocation Example:**
- Total population: 450
- 1 settlement: 100 pop (produces food/science)
- 2 settlers: 200 pop (ready to found new settlements)
- 1 warrior: 100 pop (defends territory)
- Unallocated: 50 pop (growing toward next unit threshold)

### 3. The Initial Paradox: No Settlement, Need Settlers

**The Problem:**
- Player starts with 100 population
- This grants 1 settlers unit automatically
- But units can only be produced from settlements
- Player has no settlement yet

**The Solution:**
- The first settlers unit is **special** - it exists in a "pre-settlement" state
- This initial settlers is not tied to any settlement (because none exist)
- Its sole purpose is to establish the civilization's first settlement
- Once the first settlement exists, all future units must be produced from settlements

**Game Start State:**
```
Population: 100
Settlements: 0
Units: 1 Settlers (special initial unit, not settlement-based)
Player Action Required: Move settlers to suitable location and settle
```

**After First Settlement:**
```
Population: 100 (all at Settlement A)
Settlements: 1 (Settlement A at location X,Y)
Units: 0 (initial settlers consumed to create Settlement A)
Next Unit: Requires population to reach 200
```

---

## Unit Creation Mechanics

### Population Threshold System

**Threshold Calculation:**
```
AvailableSettlers = floor(TotalPopulation / 100) - ExistingSettlers - ExistingSettlements
```

**Explanation:**
- `TotalPopulation`: Sum of all population (settled + unit-allocated)
- `/ 100`: Each settlers requires 100 population
- `- ExistingSettlers`: Already-created settlers units consume their allocation
- `- ExistingSettlements`: Settlements permanently consume 100 population each

**Example Calculations:**

| Total Pop | Settlements | Existing Settlers | Available Settlers | Explanation |
|-----------|-------------|-------------------|--------------------|-------------|
| 100       | 0           | 0                 | 1                  | Initial state: first settlers available |
| 100       | 1           | 0                 | 0                  | Settlers settled, consumed to create settlement |
| 200       | 1           | 0                 | 1                  | Growth to 200: new settlers available |
| 200       | 1           | 1                 | 0                  | Settlers created but not yet settled |
| 300       | 1           | 1                 | 1                  | Growth to 300: another settlers available |
| 300       | 1           | 2                 | 0                  | Both settlers created, waiting to settle |
| 300       | 2           | 1                 | 0                  | One settlers settled, one still active |

### Unit Creation Process

**Step 1: Threshold Check (Automatic)**
- Simulation engine checks population after each tick
- When `floor(Population / 100)` exceeds current allocations, new unit becomes available
- No player action required for threshold detection

**Step 2: Unit Creation (Player Decision)**
- Game notifies player: "New Settlers Unit Available"
- Player chooses whether to create unit immediately or wait
- **Cost**: 100 population permanently allocated to unit
- **Result**: New settlers unit appears at settlement location

**Special Case: Initial Settlers**
- At game start, if population >= 100, first settlers is automatically created
- This unit is not tied to any settlement (none exist yet)
- Appears at the player's starting position coordinates
- Cannot be disbanded - must settle to establish first settlement

**Settlement Production:**
- After first settlement exists, new units appear at a specific settlement
- Player may choose which settlement produces the unit (if multiple exist)
- Default: Unit appears at settlement with highest population growth

### Population Allocation Tracking

**Database Schema:**
```typescript
interface PopulationAllocation {
  gameId: string;
  playerId: string;
  totalPopulation: number;
  allocations: {
    settlements: Array<{
      settlementId: string;
      population: 100;
      location: { x: number, y: number };
    }>;
    units: Array<{
      unitId: string;
      unitType: "settlers" | "warrior" | "scout" | "worker";
      population: number; // 50, 100, etc.
      location: { x: number, y: number };
    }>;
    unallocated: number; // Growing toward next threshold
  };
  lastUpdated: Date;
}
```

**Invariant:**
```
totalPopulation = 
  sum(settlements.population) + 
  sum(units.population) + 
  unallocated
```

---

## Settlers Unit Behavior

### Behavior States

Settlers units operate in distinct behavioral states:

**1. Idle State**
- Unit exists but has no destination
- Awaits player command or enters autonomous mode
- Location: Current tile
- Action: None

**2. Moving State**
- Unit is traveling to a destination
- Follows pathfinding to target location
- Location: Changes each tick
- Action: Movement along path

**3. Searching State (Autonomous)**
- Unit is searching for optimal settlement location
- Uses evaluation algorithm to score nearby tiles
- Location: Wanders toward high-scoring regions
- Action: Exploration and evaluation

**4. Settling State**
- Unit has found acceptable location and is settling
- Takes 1 game tick to establish settlement
- Location: Final settlement location
- Action: Creating new settlement

### Autonomous Settlement Search

**Algorithm Overview:**
When settlers enters autonomous search mode:
1. Evaluate all tiles within movement range
2. Score each tile based on civilization priorities and technology
3. Move toward highest-scoring tile cluster
4. Upon arrival, re-evaluate: settle if score threshold met
5. If threshold not met, continue searching

**Tile Scoring Criteria:**

**Base Factors (Always Applied):**
- Terrain type: GRASSLAND (+10), PLAINS (+8), FOREST (+6), TUNDRA (+2), MOUNTAIN (+1)
- Resources: Each resource within 2-tile radius (+5 per resource)
- Fresh water: River or lake adjacent (+8)
- Coastal access: Ocean/lake within 1 tile (+3)
- Elevation: Moderate elevation 200-600m (+2), extreme elevation (+0)

**Technology-Modified Factors:**

| Technology | Terrain Bonus | Special Requirements |
|------------|---------------|---------------------|
| None (Start) | Standard scoring | Any land tile acceptable |
| Cave Dwelling | MOUNTAIN (+15) | Must have cave-suitable mountain within 2 tiles |
| Stone Working | HILLS (+10) | Stone resources preferred |
| Agriculture | GRASSLAND (+12), PLAINS (+10) | Fertile land prioritized |
| Fishing | COASTAL (+10) | Ocean access within 1 tile required |

**Distance Penalty:**
- Subtract distance from nearest existing settlement / 5
- Encourages spreading but not too thinly
- Example: 20 tiles away = -4 penalty

**Settlement Threshold:**
- Minimum score to settle: 40 points
- "Good" score (settle immediately): 60+ points
- "Excellent" score (prioritize): 80+ points

**Example Scoring:**
```
Tile: GRASSLAND with WHEAT resource, adjacent to river, 15 tiles from nearest settlement
Base terrain: +10
Resource nearby: +5
River: +8
Distance penalty: -3
Total: 20 points → Continue searching

Tile: GRASSLAND with WHEAT and DEER, adjacent to river and lake, 18 tiles from settlement
Player has Agriculture tech
Base terrain: +10 (GRASSLAND)
Tech bonus: +12 (Agriculture + GRASSLAND)
Resources: +10 (wheat +5, deer +5)
River: +8
Lake: +3
Distance penalty: -3.6
Total: 39.4 → Still searching

Tile: PLAINS with DEER and STONE, adjacent to river, coastal, 20 tiles from settlement
Base terrain: +8
Resources: +10
River: +8
Coastal: +3
Distance penalty: -4
Total: 25 → Continue searching

Tile: GRASSLAND with WHEAT, DEER, FISH, adjacent to river and ocean, 22 tiles from settlement
Player has Agriculture tech
Base terrain: +10
Tech bonus: +12 (Agriculture)
Resources: +15 (three resources)
River: +8
Coastal: +3
Distance penalty: -4.4
Total: 43.6 → SETTLE (exceeds threshold)
```

### Movement Mechanics

**Movement Points:**
- Settlers: 2 movement points per turn
- Terrain costs:
  - GRASSLAND, PLAINS: 1 point
  - FOREST, HILLS: 2 points
  - MOUNTAIN: 3 points
  - RIVER crossing: +1 point
  - Road (future): 0.5 points

**Pathfinding:**
- A* algorithm with terrain cost weighting
- Cannot move through OCEAN tiles (water units required)
- Cannot move through other civilization's territory without Open Borders
- Can move through neutral territory freely

**Vision:**
- Settlers can see 2 tiles in all directions
- Reveals fog of war as they move
- Helps identify resources and terrain

### Player Commands

**Available Commands:**

**1. Move To Location**
- Player clicks destination tile on map
- Settlers moves toward destination
- Uses pathfinding to determine route
- Settles upon arrival if location is valid

**2. Settle Here**
- Player commands immediate settlement at current location
- Validates location is acceptable (land tile, not in rival territory)
- Creates new settlement if valid
- Consumes settlers unit (100 pop allocated to new settlement)

**3. Automate Settlement**
- Settlers enters autonomous search mode
- Uses scoring algorithm to find optimal location
- Automatically settles when suitable location found
- Player can cancel automation at any time

**4. Fortify**
- Settlers stops moving and fortifies position
- Increases defensive strength (for future combat system)
- Remains fortified until given new orders

**5. Disband (Future)**
- Returns 50 population to nearest settlement
- 50% efficiency penalty for disbanding
- Useful for recovering population if unit not needed

---

## Settlement Creation

### Settlement Types by Technology

The type of settlement created depends on the civilization's current technology:

**No Technology (Game Start):**
- **Type**: Nomadic Camp (represented by star icon ⭐)
- **Bonuses**: None (baseline survival)
- **Population Cap**: 200 per settlement
- **Description**: Temporary encampments providing minimal shelter

**Cave Dwelling Technology:**
- **Type**: Cave Settlement (represented by cave icon 🕳️)
- **Bonuses**: +2 Health (protection from elements)
- **Population Cap**: 300 per settlement
- **Requirements**: Must settle on/near MOUNTAIN terrain
- **Description**: Natural caves provide superior shelter and defense

**Hut Construction Technology:**
- **Type**: Village (represented by hut icon 🏘️)
- **Bonuses**: +1 Food, +1 Health (better living conditions)
- **Population Cap**: 400 per settlement
- **Requirements**: Any land terrain
- **Description**: Constructed shelters enabling larger communities

**Stone Working Technology:**
- **Type**: Stone Village (represented by stone building icon 🏛️)
- **Bonuses**: +1 Food, +2 Health, +1 Defense
- **Population Cap**: 600 per settlement
- **Requirements**: Prefer HILLS or stone resources nearby
- **Description**: Durable stone structures supporting permanent settlement

**Future Technologies:**
- Pottery: +1 Food (food storage reduces waste)
- Agriculture: +2 Food (farming enables food surplus)
- Animal Husbandry: +1 Food (domesticated animals)
- Metallurgy: +2 Defense (weapons and tools)

### Settlement Location Rules

**Valid Settlement Locations:**
- Must be land terrain (not OCEAN, SHALLOW_WATER)
- Must not be occupied by another settlement
- Must not be within 3 tiles of another settlement (same or rival)
- Must not be in rival civilization's cultural borders

**Cultural Borders:**
- New settlement immediately claims surrounding 1-tile radius
- Expands to 2-tile radius after 50 game years
- Expands to 3-tile radius after 100 game years
- Borders cannot overlap with rival civilizations

**Special Location Considerations:**
- **Cave Dwelling**: Must have MOUNTAIN within 2 tiles
- **Coastal Settlement**: Ocean within 1 tile enables fishing
- **River Settlement**: River provides +2 Food bonus
- **Resource Access**: Settlements work resources within 2-tile radius

### Settlement Creation Process

**Step 1: Command Issued**
- Player commands "Settle Here" on settlers unit
- Or settlers in autonomous mode chooses to settle

**Step 2: Validation**
- Check location is valid settlement tile
- Check not too close to other settlements (3 tile minimum)
- Check not in rival territory
- Check technology requirements met (if tech-specific settlement)

**Step 3: Settlement Creation**
- Create settlement instance in database
- Assign 100 population from settlers to settlement
- Remove settlers unit from game
- Establish cultural borders (1 tile radius initially)
- Reveal tiles within settlement vision (2 tile radius)

**Step 4: Game State Update**
- Update player's settlement count
- Update population allocation tracking
- Notify player of new settlement
- Enable production of future units at this settlement

**Database Record:**
```typescript
interface Settlement {
  settlementId: string;
  gameId: string;
  playerId: string;
  name: string; // Auto-generated or player-named
  type: "nomadic_camp" | "cave_settlement" | "village" | "stone_village";
  location: { x: number, y: number };
  population: number; // Initially 100
  culturalBorders: number; // Tiles of cultural radius
  
  // Bonuses from type and technology
  bonuses: {
    food: number;
    science: number;
    health: number;
    defense: number;
  };
  
  // Resources within working radius
  workingResources: string[];
  
  // Production (future)
  productionQueue: [];
  
  founded: Date;
  lastUpdated: Date;
}
```

---

## Integration with Technology Tree

### Technology Unlocks

**Technology affects:**
1. **Settlement types**: What kind of settlement is created
2. **Tile scoring**: How settlers evaluate potential locations
3. **Population bonuses**: Health, food, science modifiers
4. **Unit capabilities**: Future technologies unlock new unit types

**Example Technology Path:**
```
Start (No Tech)
  ↓ Research Fire Mastery (100 science)
  → Can survive, +1 health
  ↓ Research Stone Knapping (150 science)
  → Better tools, +1 food production
  ↓ Research Cave Dwelling (200 science)
  → Cave settlements available, +2 health
  → Settlers prefer MOUNTAIN terrain
  ↓ Research Hut Construction (300 science)
  → Village settlements available
  → +1 food, +1 health
```

### Settlement Type Priority

If multiple settlement types are available, settlers chooses based on:
1. **Best terrain match**: Cave Dwelling if MOUNTAIN nearby
2. **Highest bonuses**: Stone Village > Village > Cave Settlement > Nomadic Camp
3. **Technology recency**: Prefer most recently unlocked

**Example:**
- Player has Cave Dwelling and Hut Construction
- Settlers finds GRASSLAND with river (no mountains nearby)
- Cannot use Cave Dwelling (requires mountains)
- Uses Village from Hut Construction
- Settlement gains +1 Food, +1 Health

**Example 2:**
- Player has Cave Dwelling and Hut Construction
- Settlers finds MOUNTAIN with stone resource
- Can use Cave Dwelling (mountains present)
- Cave provides +2 Health vs Village's +1 Food, +1 Health
- Settlers chooses Cave Settlement (better terrain match)

---

## User Interface Requirements

### Map Display

**Unit Icons:**
- Settlers: 🚶 (walking figure)
- Position: Rendered at unit's current tile
- Size: 50% of tile size, centered
- Color: Player civilization color
- Selection: Highlight on click, shows unit panel

**Settlement Icons:**
- Nomadic Camp: ⭐ (star)
- Cave Settlement: 🕳️ (cave entrance)
- Village: 🏘️ (huts)
- Stone Village: 🏛️ (stone building)
- Position: Rendered at settlement tile
- Size: 75% of tile size, centered
- Cultural borders: Shaded overlay on controlled tiles

**Movement Display:**
- Path preview: Dotted line from unit to destination
- Movement points: Number showing remaining moves
- Action icons: Buttons for Settle, Automate, etc.

### Unit Panel (Selected Settlers)

**Information Display:**
```
┌─────────────────────────────────┐
│ Settlers Unit                   │
│ Population: 100                 │
│ Movement: 2/2 remaining         │
│ Location: (45, 67)              │
│                                 │
│ Actions:                        │
│ [ Settle Here ]                 │
│ [ Automate Settlement ]         │
│ [ Move To... ]                  │
│ [ Fortify ]                     │
│                                 │
│ Current Location Score: 35      │
│ Status: Searching...            │
└─────────────────────────────────┘
```

**Location Score Display:**
- When settlers is selected, show score of current tile
- Color-code: Red (<40), Yellow (40-59), Green (60+)
- Help players understand settlers' decision-making

### Notifications

**New Unit Available:**
```
🎉 Settlers Unit Available!
Your population has reached 200.
Create a new Settlers unit to expand your civilization?
[Create Settlers] [Dismiss]
```

**Settlers Ready to Settle:**
```
📍 Settlers Ready to Settle
Your Settlers has found an excellent location (Score: 67)
Settle at (52, 73)?
[Settle] [Continue Searching] [Take Control]
```

**Settlement Founded:**
```
🏛️ New Settlement Founded!
Your Settlers has established [Settlement Name] at (52, 73)
Type: Village
Bonuses: +1 Food, +1 Health
[View Settlement] [Dismiss]
```

---

## Gameplay Examples

### Example 1: Game Start to First Settlement

**Turn 0 (Game Start):**
```
Population: 100
Settlements: 0
Units: 1 Settlers (initial, at starting position)
Player sees: Settlers at (50, 50), can move or settle
```

**Turn 1-5: Exploration**
```
Player commands: "Automate Settlement"
Settlers moves: (50,50) → (52,51) → (54,52) → (56,53) → (58,54)
Each turn, settlers evaluates tiles within range, moves toward best cluster
```

**Turn 6: Settlement**
```
Settlers reaches tile (60, 55): GRASSLAND with WHEAT and river
Score: 48 (exceeds threshold of 40)
Settlers settles, creating "First Settlement"
Result:
  Population: 100 (all in First Settlement)
  Settlements: 1
  Units: 0 (settlers consumed)
```

### Example 2: Growing to Second Settlement

**Turn 50:**
```
Population: 150 (growing at First Settlement)
Settlements: 1
Units: 0
Action: None yet, need 200 pop for next settlers
```

**Turn 75:**
```
Population: 200
Settlements: 1
Units: 0 (threshold reached but not created yet)
Notification: "Settlers Unit Available!"
```

**Turn 76:**
```
Player creates settlers at First Settlement
Population: 200 (100 at settlement, 100 in settlers)
Settlements: 1
Units: 1 Settlers (at First Settlement location)
```

**Turn 76-90:**
```
Settlers explores, finds location 25 tiles away
Settles at (85, 60): PLAINS with DEER and stone
Result:
  Population: 200 (100 at each settlement)
  Settlements: 2
  Units: 0
```

### Example 3: Multiple Settlers Management

**Turn 150:**
```
Population: 450
Settlements: 2 (First Settlement, Second Settlement)
Units: 0
Allocation: 100 per settlement = 200, remaining 250 unallocated
Available: 2 settlers could be created (250 / 100 = 2.5, floor = 2)
```

**Turn 151:**
```
Player creates 2 settlers units
Settlers 1: From First Settlement
Settlers 2: From Second Settlement
Population: 450 (100+100 settlements, 100+100 units, 50 unallocated)
```

**Turn 152-160:**
```
Both settlers explore simultaneously in different directions
Settlers 1 → Northeast (autonomous)
Settlers 2 → Southwest (player-controlled toward specific target)
```

**Turn 165:**
```
Settlers 1 settles at (95, 75)
Result: Settlement 3 created
Population: 450 (100+100+100 settlements, 100 unit, 50 unallocated)
Settlements: 3
Units: 1 (Settlers 2 still active)
```

**Turn 170:**
```
Settlers 2 settles at (35, 45)
Result: Settlement 4 created
Population: 450 (all allocated to 4 settlements + 50 unallocated)
Settlements: 4
Units: 0
Next unit: At population 500 (50 more growth needed)
```

---

## Technical Implementation

### Database Collections

**Units Collection:**
```typescript
interface Unit {
  unitId: string;
  gameId: string;
  playerId: string;
  unitType: "settlers" | "warrior" | "scout" | "worker";
  
  location: {
    x: number;
    y: number;
  };
  
  state: "idle" | "moving" | "searching" | "settling" | "fortified";
  
  movement: {
    pointsRemaining: number;
    pointsMax: number;
    path: Array<{x: number, y: number}>; // Current path being followed
    destination: {x: number, y: number} | null;
  };
  
  autonomous: boolean; // True if in automate mode
  
  populationCost: number; // 100 for settlers
  
  createdAt: Date;
  lastMoved: Date;
}
```

**Settlements Collection:**
```typescript
interface Settlement {
  settlementId: string;
  gameId: string;
  playerId: string;
  name: string;
  type: "nomadic_camp" | "cave_settlement" | "village" | "stone_village";
  
  location: {
    x: number;
    y: number;
  };
  
  population: number;
  
  culturalBorders: {
    radius: number; // 1, 2, or 3
    tiles: Array<{x: number, y: number}>;
  };
  
  bonuses: {
    food: number;
    science: number;
    health: number;
    defense: number;
  };
  
  workingTiles: Array<{
    x: number;
    y: number;
    resource: string | null;
  }>;
  
  founded: Date;
  lastUpdated: Date;
}
```

**Population Allocation Tracking:**
```typescript
interface PlayerPopulation {
  gameId: string;
  playerId: string;
  
  totalPopulation: number; // Total living population
  
  settlements: Array<{
    settlementId: string;
    population: number;
  }>;
  
  units: Array<{
    unitId: string;
    unitType: string;
    population: number;
  }>;
  
  unallocatedPopulation: number; // Growing toward next threshold
  
  lastUpdated: Date;
}
```

### Simulation Engine Processing

**Each Game Tick (1 per second):**

1. **Population Growth**
   - Calculate births and deaths at each settlement
   - Update totalPopulation
   - Update unallocatedPopulation

2. **Unit Threshold Check**
   - Calculate: `floor(totalPopulation / 100)`
   - Compare to: `settlements.length + units.length`
   - If greater: Notify player of available unit

3. **Unit Movement**
   - For each unit with state "moving" or "searching":
     - Deduct terrain cost from movement points
     - Update location along path
     - If destination reached and state "settling", create settlement

4. **Autonomous Settlers**
   - For each settlers with autonomous=true:
     - Evaluate tiles within movement range
     - Score each tile based on criteria
     - Move toward highest-scoring tile cluster
     - If score >= threshold, enter "settling" state

5. **Settlement Creation**
   - When settlers settles:
     - Validate location
     - Create settlement record
     - Allocate 100 population to settlement
     - Remove settlers unit
     - Establish cultural borders

### API Endpoints

**Unit Management:**
- `POST /api/game/{gameId}/units/create`: Create unit from population
- `GET /api/game/{gameId}/units`: List all units for player
- `POST /api/game/{gameId}/units/{unitId}/move`: Issue move command
- `POST /api/game/{gameId}/units/{unitId}/settle`: Command settlement
- `POST /api/game/{gameId}/units/{unitId}/automate`: Toggle autonomous mode
- `DELETE /api/game/{gameId}/units/{unitId}`: Disband unit

**Settlement Management:**
- `GET /api/game/{gameId}/settlements`: List all settlements for player
- `GET /api/game/{gameId}/settlements/{settlementId}`: Get settlement details
- `PUT /api/game/{gameId}/settlements/{settlementId}/name`: Rename settlement

**Population Tracking:**
- `GET /api/game/{gameId}/population`: Get population allocation breakdown

---

## Testing Strategy

### Unit Tests

**Population Threshold Calculation:**
- Test with various population levels
- Test with multiple settlements and units
- Test edge cases (exactly at threshold)

**Tile Scoring Algorithm:**
- Test base scoring factors
- Test technology-modified scoring
- Test distance penalties
- Test score comparison and selection

**Settlement Type Selection:**
- Test technology prerequisites
- Test terrain requirements
- Test priority when multiple types available

### Integration Tests

**Full Settlement Flow:**
1. Start game with 100 population
2. Verify initial settlers created
3. Command settlers to move
4. Verify movement and pathfinding
5. Command settle at valid location
6. Verify settlement created and settlers removed
7. Verify population allocated correctly

**Population Growth to Second Unit:**
1. Establish first settlement
2. Simulate population growth to 200
3. Verify notification of available unit
4. Create second settlers
5. Verify population allocation (100+100)
6. Move and settle second settlers
7. Verify two settlements exist

**Autonomous Settlement:**
1. Create settlers with automate command
2. Verify settlers enters "searching" state
3. Simulate movement toward high-score tiles
4. Verify settlers settles when threshold met
5. Verify settlement created at appropriate location

### E2E Tests (Playwright)

**E2E Test Suite: unit-creation.spec.ts**

1. **Initial Settlers Creation**
   - Start new game
   - Verify settlers appears at starting position
   - Screenshot: 32-initial-settlers.png

2. **Manual Settlement**
   - Click settlers unit
   - Click destination tile
   - Wait for arrival
   - Click "Settle Here"
   - Verify settlement created
   - Screenshot: 33-manual-settlement.png

3. **Autonomous Settlement**
   - Create settlers
   - Click "Automate Settlement"
   - Wait for autonomous settlement
   - Verify settlement created at good location
   - Screenshot: 34-autonomous-settlement.png

4. **Multiple Settlers**
   - Grow population to 400
   - Create 2 settlers units
   - Move in different directions
   - Verify both can settle independently
   - Screenshot: 35-multiple-settlers.png

5. **Technology Integration**
   - Start with Cave Dwelling tech
   - Create settlers
   - Verify settlers prefers MOUNTAIN terrain
   - Settle near mountain
   - Verify Cave Settlement created
   - Screenshot: 36-tech-settlement.png

---

## Performance Considerations

### Pathfinding Optimization

- Use A* with terrain cost heuristics
- Cache paths for multiple turns
- Limit pathfinding search depth (50 tiles max)
- Re-calculate only when blocked or destination changes

### Tile Scoring Optimization

- Pre-calculate base terrain scores (static)
- Cache technology bonuses per player
- Limit evaluation to visible tiles (fog of war)
- Batch evaluate multiple tiles in parallel

### Database Queries

- Index on `gameId` and `playerId` for unit queries
- Index on `location.x` and `location.y` for spatial queries
- Use projection to limit fields returned
- Cache population allocation in memory during tick processing

---

## Future Enhancements

**Phase 2 (Post-Initial Implementation):**
- Additional unit types (Warriors, Scouts, Workers)
- Unit stacking (multiple units per tile)
- Unit experience and promotions
- Convoy system (multiple settlers moving together)

**Phase 3 (Advanced Features):**
- Custom unit designs (future tech)
- Amphibious units (water transport)
- Aerial units (flying)
- Unit automation presets (player-defined algorithms)
- AI learning from player settlement patterns

**Phase 4 (Multiplayer):**
- Unit combat between players
- Espionage and sabotage units
- Trade units (caravans)
- Diplomatic units (envoys)

---

## Security and Privacy

**Security Considerations:**
- Validate all unit commands (player owns unit)
- Validate settlement locations (not in rival territory)
- Rate limit unit creation (prevent spam)
- Prevent cheating (unit teleportation, duplicate units)

**Privacy Considerations:**
- Fog of war: Players cannot see rival settlers in unexplored tiles
- Hidden settlement: New settlements not visible until within vision range
- Unit information: Only visible to owning player

---

## Balance Considerations

### Growth Rate Tuning

**Target:** First settlement at ~2-3 game years (Turn 730-1095)
- Starting population: 100
- Growth rate: ~0.2-0.3 pop/day (design specified in MINIMAL_SIMULATOR.md)
- Time to 200 pop: ~300-500 days (~1-1.5 years after first settlement)

**Rationale:**
- Players need time to explore map with first settlers
- Shouldn't feel rushed to settle immediately
- Should have second settlers within reasonable timeframe
- Growth rate matches historical population growth in small communities

### Settlement Spacing

**Minimum distance: 3 tiles**
- Prevents immediate overlap of cultural borders
- Ensures each settlement has exclusive resource access
- Creates natural buffer zones between civilizations
- Encourages strategic placement

**Optimal distance: 6-8 tiles**
- Each settlement controls 3-tile radius (eventually)
- 6 tiles ensures non-overlapping 3-tile radii
- Creates connected but distinct regions
- Allows for internal expansion without conflict

### Population Pressure

**Strategic tension:**
- Do I create settlers to expand?
- Or wait for higher population to support better technology?
- Or create warriors for defense?

**Balance goal:**
- Expansion should feel meaningful but not mandatory
- Late expansion should still be viable (catch-up mechanics)
- Over-expansion should strain resources (food/science penalties)

---

## Success Metrics

**Implementation Success:**
- Players can start game with initial settlers
- Settlers can move across map
- Settlers can settle at valid locations
- Settlements are created with correct type and bonuses
- Population allocation is tracked correctly
- Second settlers can be created and settled

**Gameplay Success:**
- Players understand population threshold mechanic
- Autonomous settlement finds reasonable locations
- Manual settlement feels strategic and rewarding
- Technology integration affects settlement decisions
- Balance feels fair (not too fast or too slow)

**Technical Success:**
- Unit creation and movement performant (< 100ms per tick)
- Tile scoring algorithm completes quickly (< 50ms)
- Database queries efficient (indexed lookups)
- No duplication or loss of population in allocation
- State remains consistent across server restarts

---

## Open Questions

**For Design Review:**
1. Should settlers be able to disband and return 100% population? Or 50% penalty?
2. Should there be a maximum settlement limit per player?
3. Should settlements have minimum viability population (e.g., can't go below 50)?
4. Should settlers be able to merge (combine two 100-pop settlers into 200-pop settlement)?
5. Should there be a "recall to city" command to bring settlers back?
6. Should autonomous settlers avoid dangerous terrain (mountains, tundra)?
7. Should there be a settlement name generator or always player-named?
8. Should cultural borders expand automatically or require player action/technology?

**For Implementation:**
1. Should unit state be stored in separate collection or embedded in game state?
2. Should pathfinding be synchronous (blocking) or asynchronous (queued)?
3. Should tile scoring be cached per-player or calculated on-demand?
4. Should we use spatial indexes (2d indexes) for tile queries?

---

## Conclusion

This design establishes a unique unit creation system that transforms population from a simple counter into a strategic resource. The settlers mechanic provides the foundation for civilization expansion while maintaining the database-centric architecture and simulation-driven gameplay that defines SimCiv.

The system is intentionally simple in its initial form (only settlers units), creating a solid foundation for future unit types while keeping the implementation scope manageable. The population threshold mechanic creates natural pacing and meaningful decisions, and the autonomous settlement system reduces micromanagement while maintaining strategic depth.

By tying unit creation to organic population growth rather than traditional production queues, SimCiv creates a more realistic and engaging model of civilization development that will differentiate it from conventional strategy games.
