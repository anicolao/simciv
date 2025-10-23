# Freeciv Assets for SimCiv

This directory contains 2D map assets from the Freeciv project for use in SimCiv's web-based game client.

## Quick Start

### Basic Usage

The Trident tileset provides simple 30x30 pixel overhead-view tiles for rendering game maps.

**Key Files**:
- `trident/tiles.png` - Main terrain sprites (grassland, forest, mountains, ocean, etc.)
- `trident/units.png` - Unit sprites (warriors, settlers, etc.)
- `trident/cities.png` - City graphics for different population sizes
- `trident/roads.png` - Road and infrastructure sprites

### Sprite Specification Files

Each `.png` file has a corresponding `.spec` file that defines:
- Sprite grid layout (position and size)
- Sprite tags/names for reference
- Artist attributions

**Example** from `tiles.spec`:
```
[grid_main]
x_top_left = 0
y_top_left = 0
dx = 30          # Tile width
dy = 30          # Tile height

tiles = { "row", "column", "tag"
  0,  2, "t.l0.grassland1"     # Grassland tile at row 0, column 2
  0,  4, "t.l0.hills_n0e0s0w0" # Hills tile (no adjacent hills)
  ...
}
```

## Sprite Naming Convention

Freeciv uses a systematic naming scheme:

### Terrain Sprites
- Format: `t.l<layer>.<terrain><variant>`
- Examples:
  - `t.l0.grassland1` - Layer 0 grassland
  - `t.l0.ocean1` - Layer 0 ocean
  - `t.l1.forest1` - Layer 1 forest (overlay)

### Directional Terrain (Hills, Mountains, Forests)
- Format: `t.l0.<terrain>_n<N>e<E>s<S>w<W>`
- N/E/S/W values: 0 (no matching terrain) or 1 (matching terrain)
- Example: `t.l0.hills_n1e1s0w0` - Hills with hills to north and east

### Unit Sprites
- Format: `u.<unit>_<activity>`
- Examples:
  - `u.warriors_Idle` - Warrior unit
  - `u.settlers_Idle` - Settler unit

### City Sprites
- Format: `city.size_<N>` or `cd.<city>_<size>`
- Examples:
  - `city.size_0` - Small city
  - `city.size_4` - Larger city

## Tile Organization

### tiles.png Layout
The main terrain sprite sheet contains:
- **Row 0**: Grassland, hills, forest, mountains (with directional variants)
- **Row 1**: Desert (with directional variants)
- **Row 2**: Plains, jungle (with directional variants)
- **Row 3**: Tundra, arctic (with directional variants)
- **Row 4**: Swamp, ocean layers
- **Row 5-8**: Ocean cells and coastal variants
- **Row 9+**: Special terrains, rivers, resources

Refer to `tiles.spec` for exact coordinates.

### units.png Layout
Contains sprites for:
- Military units (warriors, phalanx, archers, cavalry, etc.)
- Naval units (triremes, frigates, etc.)
- Air units (fighters, bombers)
- Civilian units (settlers, workers, diplomats, caravans)

### cities.png Layout
City sprites by population size:
- Sizes 0-16+ represented
- Different styles for different city states
- Walls and improvements indicated

## Using Assets in Web Client

### Loading Sprites

```javascript
// Load the main terrain tileset
const terrainImg = new Image();
terrainImg.src = '/assets/freeciv/trident/tiles.png';

// Define sprite coordinates (from tiles.spec)
const sprites = {
  grassland: { x: 60, y: 0, w: 30, h: 30 },    // column 2, row 0
  hills: { x: 120, y: 0, w: 30, h: 30 },       // column 4, row 0
  forest: { x: 240, y: 0, w: 30, h: 30 },      // column 8, row 0
  ocean: { x: 0, y: 120, w: 30, h: 30 },       // column 0, row 4
  // ... add more as needed
};
```

### Rendering a Tile

```javascript
// Draw a grassland tile at canvas position (x, y)
function drawTile(ctx, tileType, x, y) {
  const sprite = sprites[tileType];
  ctx.drawImage(
    terrainImg,
    sprite.x, sprite.y, sprite.w, sprite.h,  // Source sprite
    x, y, 30, 30                              // Destination canvas
  );
}

// Example: Draw a 3x3 map section
drawTile(ctx, 'ocean', 0, 0);
drawTile(ctx, 'grassland', 30, 0);
drawTile(ctx, 'forest', 60, 0);
```

### Creating a Sprite Atlas

For better performance, consider creating a JSON sprite atlas:

```json
{
  "trident_terrain": {
    "image": "/assets/freeciv/trident/tiles.png",
    "tileWidth": 30,
    "tileHeight": 30,
    "sprites": {
      "grassland": { "row": 0, "col": 2 },
      "hills": { "row": 0, "col": 4 },
      "forest": { "row": 0, "col": 8 },
      "mountains": { "row": 0, "col": 12 },
      "ocean": { "row": 4, "col": 0 }
    }
  }
}
```

## Optimization Tips

1. **Preload Images**: Load all sprite sheets during game initialization
2. **Use Canvas Caching**: Draw frequently-used tiles to offscreen canvases
3. **Sprite Batching**: Group draw calls by sprite sheet
4. **WebP Conversion**: Consider converting PNG to WebP for smaller sizes
5. **Lazy Loading**: Only load needed sprite sheets (defer units/cities until needed)

## Integration with SimCiv

### Map Rendering
Use terrain sprites from `tiles.png` to render the game world based on the simulation state stored in MongoDB.

### Unit Display
Use unit sprites from `units.png` to show player units on the map.

### City Visualization
Use city sprites from `cities.png` to display cities with appropriate size/state.

### UI Elements
Use small icons from `misc/small.png` for buttons, indicators, and HUD elements.

## Converting .spec Files to JSON

For easier JavaScript/TypeScript integration, you may want to parse `.spec` files into JSON:

```typescript
// Example structure
interface SpriteDefinition {
  tag: string;
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TileSpec {
  grid: {
    x_top_left: number;
    y_top_left: number;
    dx: number;
    dy: number;
  };
  sprites: SpriteDefinition[];
}
```

## License and Attribution

All assets are licensed under GPL-2.0 from the Freeciv project.

See [ATTRIBUTION.md](./ATTRIBUTION.md) for complete credits and license information.

## Further Reading

- [Complete Asset Analysis](../../../docs/assets/FREECIV_ASSETS.md)
- [Freeciv Tilesets Documentation](https://freeciv.org/wiki/Tilesets)
- [Original Freeciv Repository](https://github.com/freeciv/freeciv)

## Future Enhancements

Potential improvements for asset usage:

1. **Sprite Atlas Generator**: Tool to convert .spec files to JSON
2. **WebP Optimization**: Reduce file sizes for web delivery
3. **Retina Support**: Create 2x versions for high-DPI displays
4. **Additional Tilesets**: Add isometric (amplio2) for optional visual style
5. **Animation Support**: Extract unit animation frames
6. **Color Variations**: Support for player colors and team identification
