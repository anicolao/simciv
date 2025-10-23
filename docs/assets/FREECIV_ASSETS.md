# Freeciv Asset Analysis for SimCiv

## Overview
This document analyzes Freeciv assets for potential reuse in the SimCiv project. Freeciv is an open-source turn-based strategy game with extensive 2D map assets that could be valuable for SimCiv's web-based client.

## Freeciv License
Freeciv is licensed under GNU GPL v2, which is compatible with SimCiv's GPL v3 license. Assets can be reused with proper attribution.

## Available Tilesets

Freeciv includes multiple tilesets with different styles:

### 1. Trident (Overhead View) - **RECOMMENDED**
- **Type**: Overhead (non-isometric)
- **Tile Size**: 30x30 pixels
- **Best For**: Simple web client, easy rendering
- **Files**: 12 PNG files + spec files
- **Location**: `data/trident/`
- **Contains**:
  - `tiles.png` - Main terrain tiles (141KB)
  - `units.png` - Military and civilian units (16KB)
  - `cities.png` - City graphics (6KB)
  - `roads.png` - Road infrastructure (6KB)
  - `highways.png` - Advanced roads (5KB)
  - `fog.png` - Fog of war sprites (7KB)
  - `grid.png` - Tile grid overlay (534 bytes)
  - `explosions.png` - Combat effects (796 bytes)
  - `extra_units.png` - Additional unit sprites (74KB)
  - `earth.png` - Special earth tileset (1.5KB)
  - `select.png` - Selection indicators (227 bytes)
  - Various `.spec` files defining sprite positions

### 2. Amplio2 (Isometric View)
- **Type**: Isometric
- **Tile Size**: 96x48 pixels (wide isometric)
- **Files**: 22 PNG files + spec files
- **Location**: `data/amplio2/`
- **Best For**: Visually appealing, but more complex rendering
- **Note**: Larger file sizes, more complex for web rendering

### 3. Other Tilesets
- **hex2t**: Hexagonal overhead view (30x30 base)
- **hexemplio**: Hexagonal isometric
- **isotrident**: Isometric version of trident
- **isophex**: Isometric hexagonal
- **cimpletoon**: Cartoon style
- **toonhex**: Cartoon hexagonal

## Common Assets (data/misc/)

Shared assets used across all tilesets:

- `buildings.png` (108KB) - Wonder and building graphics
- `techs.png` (318KB) - Technology tree icons
- `flags.spec` - Nation flags definitions
- `cursors.png` (133KB) - Mouse cursors
- `events.png` (8KB) - Event notification icons
- `specialists.png` (4KB) - Specialist citizen types
- `governments.png` (5KB) - Government type icons
- `small.png` (10KB) - Small icons
- `citybar.png` (2KB) - City information bar graphics
- `intro.png` (168KB) - Intro/splash screen

## Terrain Types in Tilesets

All tilesets include sprites for:
- Ocean/Sea
- Deep Ocean
- Coast
- Lake
- Plains
- Grassland
- Desert
- Tundra
- Arctic
- Hills
- Mountains
- Forest
- Jungle
- Swamp
- Rivers (directional)
- Roads (directional)
- Railroads (directional)
- Irrigation/Farmland
- Mines
- Pollution
- Fallout
- Cities (sizes 1-16+)
- Fortresses
- Airbases
- Borders

## Sprite Organization

Freeciv uses a `.spec` file system:
- PNG files contain multiple sprites in a grid
- `.spec` files define the position and name of each sprite
- Sprites are referenced by tags like "t.grassland", "u.warrior", "c.city_size_4"

Example from `tiles.spec`:
```
{
  tag = "t.l1.grassland1"
  file = "trident/tiles.png"
  x = 0
  y = 0
  width = 30
  height = 30
}
```

## Recommended Assets for SimCiv

### Minimal Set (Trident Tileset)
For a basic 2D map view, copy:

1. **Core Terrain** (`trident/tiles.png` + `tiles.spec`)
   - All basic terrain types
   - Rivers, roads
   - Resources

2. **Cities** (`trident/cities.png` + `cities.spec`)
   - City sprites for different sizes
   - City improvements

3. **Units** (`trident/units.png` + `units.spec`)
   - Basic military units
   - Civilian units (settlers, workers)

4. **Infrastructure** (`trident/roads.png` + `roads.spec`)
   - Road network sprites
   - Directional road connections

5. **Fog of War** (`trident/fog.png` + `fog.spec`)
   - Darkness/unexplored areas
   - Partially visible areas

6. **Grid** (`trident/grid.png` + `grid.spec`)
   - Tile borders/grid overlay

### Extended Set (Optional)
Additional assets for richer gameplay:

- `misc/buildings.png` - Building/wonder graphics
- `misc/techs.png` - Technology icons
- `misc/small.png` - UI icons
- National flags from `flags/` directory

## File Size Summary

Trident tileset total: ~260KB (uncompressed PNG)
- Suitable for web delivery
- Can be optimized further with modern compression
- Could use sprite atlases for efficient loading

## Integration Strategy for SimCiv

1. **Create asset directory**: `public/assets/freeciv/`
2. **Subdirectories**:
   - `public/assets/freeciv/terrain/` - Terrain tiles
   - `public/assets/freeciv/units/` - Unit sprites
   - `public/assets/freeciv/cities/` - City graphics
   - `public/assets/freeciv/ui/` - UI elements

3. **Documentation**:
   - Create ATTRIBUTION.md with Freeciv credits
   - Document sprite sheet layouts
   - Create JSON mapping files for sprite positions

4. **Web Optimization**:
   - Consider converting to WebP for smaller sizes
   - Create sprite atlases
   - Implement lazy loading

## License Compliance

All assets must include:
- Attribution to Freeciv project
- Link to https://freeciv.org
- GNU GPL v2 license notice
- List of original artists (from Freeciv documentation)

## Next Steps

1. Copy selected Trident tileset assets to SimCiv
2. Create documentation/mapping files
3. Add attribution file
4. Test asset loading in web client
5. Optimize for web delivery if needed
