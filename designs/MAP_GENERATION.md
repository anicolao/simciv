# SimCiv Map Generation Design Specification
## Terrain Generation and Player Placement

### Document Status
**Version:** 0.0003  
**Status:** Design Review  
**Last Updated:** 2025-10-23  
**Purpose:** Specification for procedural terrain generation and fair player placement using great circle-inspired algorithms

---

## Executive Summary

This document specifies the design for SimCiv's procedural map generation system. The design leverages a great circle-based approach adapted for rectangular maps, creating realistic terrain with varied elevation, climate zones, and resource distribution. The system ensures fair starting positions for all players with minimum territory guarantees.

**Key Features:**
- Great circle-based terrain generation for realistic planetary geography
- Rectangular map projection suitable for strategy gameplay
- Minimum footprint guarantee per player (prevents overcrowding)
- Balanced starting positions with equitable resource access
- Deterministic generation from seed values (reproducible maps)
- Scalable map sizes based on player count
- Rich terrain variety: mountains, plains, forests, deserts, oceans, rivers

This design builds upon the game creation system from version 0.0002, providing the geographic foundation for civilization development and strategic gameplay.

---

## Architecture Context

The map generation system integrates with SimCiv's architecture:
- **Database Layer**: Stores map tiles, terrain types, resources, and starting positions
- **Server Layer**: Generates maps during game creation, seeds random generation
- **Client Layer**: Renders map visualization, displays terrain information
- **Simulation Engine**: Uses terrain data for pathfinding, resource gathering, and city placement

The design maintains the database-as-single-source-of-truth principle, with all geographic data persisted for the game's lifetime.

---

## Map Requirements

### Player Density and Minimum Footprint

Each player requires sufficient territory for meaningful civilization development without immediate conflict over resources.

**Minimum Footprint Per Player:**
- **Base Territory**: 40 x 40 tiles (1,600 tiles minimum per player)
- **Starting Region**: 15 x 15 tiles guaranteed viable land (225 tiles)
- **Buffer Zone**: Minimum 10 tiles distance between player starting positions
- **Resource Guarantee**: Each starting region contains minimum viable resources

**Map Sizing Formula:**
```
Recommended Map Dimensions:
- Width = ceiling(sqrt(players * 1600 * 2)) tiles
- Height = ceiling(sqrt(players * 1600 * 2)) tiles

This provides approximately 3,200 tiles per player (2x minimum footprint)
allowing room for expansion, contested territory, and geographic features.

Examples:
- 2 players: 80 x 80 = 6,400 tiles (3,200 per player)
- 4 players: 113 x 113 = 12,769 tiles (3,192 per player)
- 6 players: 139 x 139 = 19,321 tiles (3,220 per player)
- 8 players: 160 x 160 = 25,600 tiles (3,200 per player)
```

**Tile Scale:**
- Each tile represents approximately 5 km x 5 km of territory
- Starting region (15x15) = 75 km x 75 km = 5,625 sq km
- Minimum footprint (40x40) = 200 km x 200 km = 40,000 sq km
- Similar scale to a small-to-medium sized nation

---

## Terrain Generation Algorithm

### Great Circle-Based Approach

The terrain generation uses principles from spherical geometry adapted for rectangular maps. This creates realistic continent formations, mountain ranges, and climate zones that feel organic rather than random noise.

**Core Concept:**

Great circles on a sphere (lines of intersection between the sphere and planes through its center) create natural-looking boundaries. By modeling the rectangular map as a projection of a spherical surface and using great circles to define terrain features, we achieve realistic geographic patterns.

**Key Advantages:**
- **Natural Boundaries**: Mountain ranges and coastlines follow curved, organic paths
- **Continent Formation**: Great circles intersect to create realistic landmasses
- **Climate Zones**: Latitude-based variation emerges naturally from projection
- **Tectonic Simulation**: Great circle intersections model plate boundaries
- **Reproducibility**: Deterministic from seed value

### Algorithm Steps

#### Step 1: Initialize World Sphere Model

```
1. Define virtual sphere parameters:
   - Sphere radius R = map_width / (2 * π)
   - Map projection: Equirectangular (plate carrée)
   - Coordinate mapping: (x, y) -> (longitude, latitude)
     longitude = (x / width - 0.5) * 2π
     latitude = (y / height - 0.5) * π

2. Create seed-based random number generator:
   - Game seed (provided during game creation or randomly generated)
   - Ensures identical map reproduction from same seed
```

#### Step 2: Generate Great Circles for Terrain Features

```
Generate N great circles (where N = 8 + player_count * 2):

For each great circle:
  1. Select random point P on sphere (random longitude, latitude)
  2. Select random vector V through sphere center
  3. Define circle: all points on sphere at fixed distance from axis through P, V
  4. Assign circle properties:
     - Type: continental_boundary, mountain_range, or ocean_trench
     - Influence radius: 2-8 tiles
     - Height modifier: -500m to +2000m
     - Weight: 0.3 to 1.0 (influence strength)

Distribution of circle types:
- 30% Continental boundaries (land/sea divisions)
- 40% Mountain ranges (elevation peaks)
- 30% Ocean trenches (elevation valleys)
```

#### Step 3: Calculate Base Elevation

```
For each tile (x, y) on map:
  1. Convert to spherical coordinates (longitude, latitude)
  2. Calculate point P on sphere surface
  3. For each great circle C:
     a. Calculate distance D from P to circle
     b. Apply influence function:
        influence = circle.weight * exp(-(D / circle.radius)²)
     c. Apply height modifier:
        elevation += influence * circle.height_modifier
  4. Base elevation = sum of all circle influences
  5. Normalize to range [-100m, +3000m]
```

#### Step 4: Apply Noise and Detail

```
Add multiple octaves of Perlin/Simplex noise for natural variation:

For each octave O (4 octaves typical):
  1. Frequency F = 2^O / 64
  2. Amplitude A = 200m / 2^O
  3. Sample noise at (x * F, y * F) with game seed
  4. elevation += noise_value * A

This adds realistic small-scale features:
- Hills and valleys
- Local terrain variation
- Breaks up unrealistic uniformity
```

#### Step 5: Define Water and Land

```
Sea level threshold = median elevation across all tiles

For each tile:
  1. If elevation < sea_level:
     - Tile type = OCEAN (deep) or SHALLOW_WATER (near coast)
  2. If elevation >= sea_level:
     - Tile type = LAND (specific terrain determined by climate)
  3. Mark coastal tiles (land adjacent to water)
```

#### Step 6: Climate Zone Assignment

```
Climate determined by latitude and local conditions:

For each land tile at latitude L:
  1. Calculate latitude band:
     - Polar: |L| > 60°
     - Temperate: 30° < |L| <= 60°
     - Subtropical: 15° < |L| <= 30°
     - Tropical: |L| <= 15°
  
  2. Modify by elevation:
     - High elevation (>1500m): reduce temperature 1 band
     - Very high elevation (>2500m): reduce 2 bands
  
  3. Calculate rainfall:
     - Base rainfall from latitude (tropical high, subtropical low)
     - Increase near coasts (maritime influence)
     - Decrease in rain shadow of mountains
     - Add noise variation
  
  4. Assign terrain type from climate matrix:

     Rainfall  /  Temperature
              Cold    Temperate    Hot
     -------|--------|------------|--------
     High   | Tundra | Forest     | Jungle
     Medium | Tundra | Grassland  | Savanna
     Low    | Ice    | Plains     | Desert
```

#### Step 7: Generate Rivers

```
Rivers flow from high elevation to sea:

1. Identify potential river sources:
   - Mountain tiles (elevation > 1200m)
   - High rainfall areas
   - Place N_rivers = map_width / 20 sources

2. For each source:
   a. Trace path to lowest neighboring tile
   b. Continue until reaching ocean or existing river
   c. Mark tiles as RIVER
   d. Widen river based on accumulated flow:
      - Source: 1 tile wide
      - Tributary joins: +1 width
      - Near coast: up to 3 tiles wide
   
3. Rivers create fertile terrain:
   - Adjacent tiles gain +20% resources
   - Desert adjacent to river becomes grassland
```

#### Step 8: Resource Distribution

```
Resources placed based on terrain and geology:

Strategic Resources (rare):
- Iron: Hills and mountains, temperate zones
- Copper: Hills near water
- Coal: Forest and grassland, temperate zones
- Oil: Desert, coastal, continental shelf
- Uranium: Mountains, sparse distribution
- Gold: Mountains and hills
- Gems: Mountains, rare

Basic Resources (common):
- Wheat: Grassland, plains near rivers
- Cattle: Grassland and plains
- Fish: Coastal ocean tiles
- Stone: Hills and mountains
- Wood: Forest tiles
- Game: Forest and savanna

Distribution algorithm:
1. For each resource type:
   a. Calculate suitable tiles (terrain match)
   b. Place clusters: 3-7 tiles per cluster
   c. Clusters placed with minimum separation
   d. Density: 1 cluster per 100-200 tiles
   e. Ensure minimum 2 clusters per player territory
```

---

## Player Placement Algorithm

### Objectives

1. **Fair Distribution**: Each player starts with comparable resources and terrain
2. **Balanced Spacing**: No player has significant advantage from position
3. **Strategic Variety**: Different starting positions offer different opportunities
4. **Minimum Guarantees**: Each start meets minimum viability requirements

### Placement Process

#### Step 1: Identify Candidate Starting Regions

```
Scan map for suitable starting locations:

For each potential 15x15 region:
  1. Calculate viability score:
     - Land tiles: minimum 180 of 225 tiles (80%)
     - Coastal access: at least 3 coastal tiles
     - Terrain diversity: 2-4 different terrain types
     - Resources: 2+ basic resources, 1+ strategic
     - Elevation: average 0-800m (buildable)
     - Freshwater: river or lake within region
  
  2. Regions scoring above threshold added to candidate list
  3. Sort candidates by score (highest first)
```

#### Step 2: Select Starting Positions

```
Algorithm: Maximally Spaced Placement

1. Initialize:
   - Selected positions = empty list
   - Remaining candidates = all high-scoring regions

2. Select first player position:
   - Choose highest-scoring candidate
   - Add to selected positions
   - Remove from candidates

3. For each remaining player (2 to N):
   a. For each candidate C:
      - Calculate minimum distance to any selected position
      - Score = candidate_score * (min_distance / map_diagonal)
   b. Select candidate with highest combined score
   c. Add to selected positions
   d. Remove from candidates
   e. Remove nearby candidates (within buffer distance)

4. This ensures:
   - Maximum spacing between players
   - Still prioritizes quality starting positions
   - No player stuck in poor starting location
```

#### Step 3: Validate and Balance

```
Check balance between selected starting positions:

For each selected position:
  1. Count tiles by type in 40x40 footprint
  2. Count resources in footprint
  3. Calculate expansion potential (viable neighboring regions)

Compare statistics between positions:
- If variance too high (coefficient of variation > 0.3):
  - Swap lowest-scoring position for better alternative
  - Revalidate spacing constraints
  - Repeat until balanced or no improvements possible

Final validation:
- All positions meet minimum requirements
- Spacing constraints satisfied
- Resource variance within acceptable range
```

#### Step 4: Initialize Starting Territory

```
For each player starting position:

1. Mark 15x15 central tiles as starting region
2. Place starting city at optimal tile:
   - Highest combined score within region
   - Near freshwater (river or coast)
   - Buildable terrain (not mountain)
   - Good local resources
   
3. Initialize starting units (per game rules):
   - Settler unit (if separate from city)
   - Scout unit for exploration
   - Worker unit for improvements
   
4. Reveal fog of war in starting region:
   - 15x15 region fully visible
   - Adjacent tiles partially visible
   - Rest of map hidden (fog of war)

5. Store starting position in database:
   - Player ID
   - Center coordinates
   - Starting city location
   - Initial visible area
   - Assigned civilization ID
```

---

## Database Schema

### Map Tiles Collection

```typescript
interface MapTile {
  gameId: string;              // Foreign key to game
  x: number;                   // X coordinate (0 to width-1)
  y: number;                   // Y coordinate (0 to height-1)
  elevation: number;           // Meters above sea level (-100 to 3000)
  terrainType: string;         // OCEAN, GRASSLAND, FOREST, MOUNTAIN, etc.
  climateZone: string;         // POLAR, TEMPERATE, TROPICAL, etc.
  hasRiver: boolean;           // True if river flows through tile
  isCoastal: boolean;          // True if land adjacent to water
  resources: string[];         // Array of resource types on this tile
  improvements: string[];      // Player-built improvements (farms, mines, etc.)
  ownerId: string | null;      // Player ID if claimed, null if unclaimed
  visibleTo: string[];         // Player IDs who can see this tile
  createdAt: Date;             // Timestamp
}

// Indexes:
// - (gameId, x, y) - unique compound index for tile lookup
// - (gameId, terrainType) - for terrain queries
// - (gameId, ownerId) - for player territory queries
// - (gameId, resources) - for resource location queries
```

### Starting Positions Collection

```typescript
interface StartingPosition {
  gameId: string;              // Foreign key to game
  playerId: string;            // Foreign key to player
  centerX: number;             // Center of starting region
  centerY: number;             // Center of starting region
  startingCityX: number;       // Location of first city
  startingCityY: number;       // Location of first city
  regionScore: number;         // Quality score for balance tracking
  revealedTiles: number;       // Count of initially visible tiles
  guaranteedFootprint: {       // 40x40 tile footprint boundaries
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  createdAt: Date;
}

// Indexes:
// - (gameId, playerId) - unique compound index
// - (gameId) - for querying all starting positions in a game
```

### Map Generation Metadata Collection

```typescript
interface MapMetadata {
  gameId: string;              // Foreign key to game (unique)
  seed: string;                // Generation seed for reproducibility
  width: number;               // Map width in tiles
  height: number;              // Map height in tiles
  playerCount: number;         // Number of players (affects map size)
  seaLevel: number;            // Elevation threshold for water
  greatCircles: Array<{        // Parameters for terrain generation
    centerLon: number;
    centerLat: number;
    vectorX: number;
    vectorY: number;
    vectorZ: number;
    type: string;              // continental_boundary, mountain_range, ocean_trench
    radius: number;
    heightModifier: number;
    weight: number;
  }>;
  generatedAt: Date;
  generationTimeMs: number;    // Performance tracking
}

// Indexes:
// - (gameId) - unique index
```

---

## Generation Performance

### Computational Complexity

**Time Complexity:**
- Great circle calculation: O(N * T) where N = circles, T = tiles
- Noise generation: O(T * O) where O = octaves (typically 4)
- River tracing: O(R * T) where R = river count (typically width/20)
- Resource placement: O(R * C) where R = resource types, C = clusters
- Overall: O(T * (N + O)) ≈ O(T) for fixed N, O

**Space Complexity:**
- Primary: O(T) for storing all tile data
- Temporary: O(T) for generation buffers
- Total: O(T) ≈ O(map_width²)

**Performance Targets:**

| Player Count | Map Size   | Tiles   | Target Time |
|--------------|------------|---------|-------------|
| 2 players    | 80 x 80    | 6,400   | < 2 seconds |
| 4 players    | 113 x 113  | 12,769  | < 4 seconds |
| 6 players    | 139 x 139  | 19,321  | < 6 seconds |
| 8 players    | 160 x 160  | 25,600  | < 8 seconds |

**Optimization Strategies:**
1. Generate tiles in parallel batches (multi-threading)
2. Cache great circle distance calculations
3. Use efficient noise library (FastNoise, simplex)
4. Store only non-default tile properties (sparse storage)
5. Generate asynchronously during game creation (non-blocking)

---

## Integration with Game Systems

### Game Creation Integration

**Modified Game Creation Flow:**

```
1. User creates game with player count parameter
2. System calculates map dimensions from player count
3. Generate random seed (or accept user-provided seed)
4. Trigger asynchronous map generation:
   a. Create map metadata record
   b. Generate terrain using great circle algorithm
   c. Place resources
   d. Generate rivers
   e. Identify and validate starting positions
   f. Store all tiles in database
   g. Create starting position records
5. Mark game as "waiting for players" when map ready
6. Players can join once map generation complete
```

**User Experience:**
- Map generation happens in background
- Game shows "Generating world..." status
- Players can join lobby while map generates
- Game becomes joinable when map complete (typically 2-8 seconds)

### Simulation Engine Integration

**Simulation Reads Map Data:**
- Query tiles by location for pathfinding
- Check terrain type for movement costs
- Identify resources for gathering
- Evaluate expansion locations
- Calculate trade route paths

**Simulation Updates Map State:**
- Mark tiles as claimed by players
- Add improvements (farms, mines, roads)
- Update visible tiles (fog of war)
- Modify resources (depletion, discovery)

### Client Rendering Integration

**Client Displays Map:**
- Request visible tiles from server (fog of war filter)
- Render terrain sprites based on type
- Show elevation through shading or contour lines
- Display resources, improvements, units
- Update as player explores (fog of war reveals)

**Performance Considerations:**
- Client requests only visible viewport tiles (not entire map)
- Server filters by player visibility
- Tile updates pushed incrementally
- Cache rendered terrain sprites

---

## Testing and Validation

### Generation Testing

**Unit Tests:**
- Great circle distance calculations accurate
- Noise functions produce expected distributions
- Terrain type assignments follow climate rules
- Resource placement meets density requirements
- Starting position selection respects spacing

**Integration Tests:**
- Full map generation completes successfully
- All player counts generate valid maps
- Seed reproducibility (same seed = same map)
- Database storage and retrieval
- Performance within target times

**Quality Validation:**
- Visual inspection of generated maps (sample images)
- Statistical analysis of terrain distribution
- Starting position balance verification
- Resource accessibility checks
- Playability assessment (manual testing)

### Balance Testing

**Metrics to Track:**
1. **Terrain Distribution**: Each player's footprint should have similar terrain diversity
2. **Resource Equity**: Variance in strategic resources < 30%
3. **Expansion Potential**: Comparable viable tiles near starting positions
4. **Defensive Advantage**: No position has overwhelming natural defenses
5. **Distance to Others**: Standard deviation of inter-player distances < 20%

**Balancing Iterations:**
- Generate 100 maps for each player count
- Calculate metrics across all maps
- Identify outliers (maps with poor balance)
- Adjust algorithm parameters to reduce variance
- Re-test until metrics within acceptable ranges

---

## Future Enhancements

### Phase 1 (Current Design)
- ✓ Great circle terrain generation
- ✓ Climate-based terrain types
- ✓ Resource distribution
- ✓ Fair player placement
- ✓ River generation

### Phase 2 (Near Term)
- **Custom Map Seeds**: Players can share favorite seeds
- **Map Size Options**: Small, standard, large presets
- **Terrain Preferences**: More land, more water, more mountains
- **Archipelago Mode**: Island-based maps
- **Pangaea Mode**: Single large continent
- **Mirror Maps**: Perfectly balanced competitive maps

### Phase 3 (Long Term)
- **Historical Maps**: Earth, historical regions as starting templates
- **Scenario Maps**: Pre-designed maps for specific gameplay
- **Terrain Features**: Volcanoes, oases, natural wonders
- **Climate Change**: Dynamic terrain over game time
- **Terrain Editor**: Visual map creation tool
- **Procedural Biomes**: More complex ecosystems

### Phase 4 (Advanced)
- **Tectonic Simulation**: Realistic plate boundaries
- **Weather Systems**: Dynamic climate affecting gameplay
- **Seasonal Variation**: Terrain changes with seasons
- **3D Elevation**: True 3D terrain rendering
- **Terrain Deformation**: Terraform, erosion, construction impacts

---

## Implementation Checklist

### Pre-Implementation
- [x] Design document completed and reviewed
- [ ] Database schema approved
- [ ] Performance targets agreed
- [ ] Test plan created

### Core Implementation
- [ ] Great circle math functions (spherical geometry)
- [ ] Noise generation utilities (Perlin/Simplex)
- [ ] Terrain generation pipeline
- [ ] Climate zone calculation
- [ ] Resource placement algorithm
- [ ] River generation system
- [ ] Starting position finder

### Database Integration
- [ ] MapTile schema and indexes
- [ ] StartingPosition schema
- [ ] MapMetadata schema
- [ ] Database migration scripts
- [ ] Query functions for tile access

### Game Integration
- [ ] Modify game creation API to trigger map generation
- [ ] Asynchronous generation worker
- [ ] Status tracking for "generating" games
- [ ] Starting position assignment to players

### Testing
- [ ] Unit tests for math functions
- [ ] Integration tests for full generation
- [ ] Performance benchmarking
- [ ] Balance analysis scripts
- [ ] Visual map export for inspection

### Client Support
- [ ] API endpoint for tile queries
- [ ] Fog of war filtering
- [ ] Tile update notifications
- [ ] Map rendering sprites/assets

---

## References and Further Reading

### Algorithms and Mathematics
- **Great Circle Distance**: Haversine formula, spherical trigonometry
- **Map Projections**: Equirectangular projection for game maps
- **Perlin Noise**: Ken Perlin's improved noise algorithm
- **Simplex Noise**: Faster alternative to Perlin for 2D
- **Poisson Disk Sampling**: Even spacing for resource distribution

### Related Game Design
- **Civilization Series**: Hex-based maps, terrain variety, starting balance
- **Dwarf Fortress**: Detailed terrain generation, erosion simulation
- **Minecraft**: Infinite terrain, biome generation, noise-based
- **Europa Universalis**: Historical maps, province systems, grand strategy

### Inspiration Sources
- **Plate Tectonics**: Understanding how real terrain forms
- **Climate Science**: Köppen climate classification
- **Geography**: River formation, mountain ranges, continental shapes
- **Cartography**: Map projection trade-offs, visual representation

---

## Conclusion

This map generation design provides SimCiv with a robust foundation for creating fair, interesting, and strategically varied game worlds. The great circle-based approach produces maps that feel organic and realistic while maintaining the balance necessary for competitive multiplayer gameplay.

By guaranteeing minimum territory per player and ensuring equitable resource distribution, the system prevents early game frustration from poor starting positions. The deterministic seed-based generation enables players to share favorite maps and ensures tournament-grade reproducibility.

The modular design allows for future enhancements—from custom map options to advanced terrain features—without requiring fundamental architectural changes. As SimCiv evolves, the map generation system can grow with it, supporting ever more sophisticated and engaging gameplay experiences.

---

**Document Version History:**
- 0.0003 (2025-10-23): Initial design specification

**Related Documents:**
- INITIAL_DESIGN.md: Overall architecture principles
- version0.0001.md: Authentication system
- 0.0002creategame.md: Game creation and joining
- VISION.md: Long-term game design goals
