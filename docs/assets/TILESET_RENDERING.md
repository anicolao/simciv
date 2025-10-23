# Freeciv Tileset Rendering Guide

## Overview

The Freeciv Trident tileset uses a layered rendering system that requires understanding of how tiles are composed. This guide explains how to properly render maps using these assets.

## Tile Layering System

Freeciv uses multiple layers to render terrain:

### Layer 0 (Base Terrain)
- `t.l0.*` - Base terrain sprites
- Examples: `t.l0.grassland1`, `t.l0.desert_n1e1s1w1`
- This is the foundational terrain type

### Layer 1 (Terrain Overlay)
- `t.l1.*` - Overlay sprites for terrain blending
- Examples: `t.l1.arctic_n0e0s0w0`, `t.l1.coast_n1e1s1w1`
- Used for terrain transitions and special features

### Layer 2 (Additional Details)
- `t.l2.*` - Additional overlay details
- Examples: `t.l2.coast_n1e1s1w1`
- Further refinement of terrain appearance

## Directional Variants

Many terrain types have directional variants using the format: `terrain_n<N>e<E>s<S>w<W>`

Where N, E, S, W are either 0 or 1:
- `0` = No matching terrain in that direction
- `1` = Matching terrain in that direction

Example: `t.l0.hills_n1e1s0w0` means:
- Hills to the North (n1)
- Hills to the East (e1)
- No hills to the South (s0)
- No hills to the West (w0)

This system allows Freeciv to blend terrain smoothly at boundaries.

## Ocean/Water Rendering

Ocean tiles in Freeciv use a **special half-height tile system** from the `grid_ocean` section:

### Components:
1. **Ocean Grid**: Separate 15x15 pixel tile grid starting at y=210 (not the main 30x30 grid)
2. **Floor Cell Tiles**: Deep ocean tiles at grid_ocean row 0, columns 0-4 (darker blue)
3. **Coast Cell Tiles**: Shallow water/coast transitions

### Why Half-Height Tiles:
The Freeciv Trident tileset uses 15x15 pixel tiles in the ocean grid, which are half the height and width of regular 30x30 terrain tiles. To render a full 30x30 ocean tile, you stack two 15x15 tiles vertically.

### Tile Locations:
- **Grid Ocean**: x_top_left=0, y_top_left=210, dx=15, dy=15
- **Deep Ocean (floor_cell)**: Columns 0-4 at row 0 (darker blue)
  - Top half: x=0, y=210, w=15, h=15
  - Bottom half: x=0, y=225, w=15, h=15
- **Coast tiles**: Columns 0-7 (for land boundaries)
- **Lake tiles**: Columns 16-23

### Implementation:

**Simple Deep Ocean (Recommended for demos):**
```javascript
// Use half-height tiles from grid_ocean stacked vertically
function drawOcean(ctx, x, y) {
  // Top half (15x15 scaled to 30x15)
  ctx.drawImage(tileImg, 0, 210, 15, 15, x, y, 30, 15);
  
  // Bottom half (15x15 scaled to 30x15)
  ctx.drawImage(tileImg, 0, 225, 15, 15, x, y + 15, 30, 15);
}
```

**Full-Size Rendering:**
```javascript
// Render at native size then scale up
const oceanCanvas = document.createElement('canvas');
oceanCanvas.width = 15;
oceanCanvas.height = 30;
const octx = oceanCanvas.getContext('2d');

// Draw top and bottom 15x15 tiles
octx.drawImage(tileImg, 0, 210, 15, 15, 0, 0, 15, 15);
octx.drawImage(tileImg, 0, 225, 15, 15, 0, 15, 15, 15);

// Then scale to 30x30 when drawing to main canvas
ctx.drawImage(oceanCanvas, 0, 0, 15, 30, x, y, 30, 30);
```

## Simple Single-Tile Sprites

For basic terrain types, use the simple tags:
- `t.l0.grassland1` (row 0, col 2)
- `t.l0.desert1` (row 1, col 0) - Use directional variant
- `t.l0.plains1` (row 4, col 0) - Use directional variant
- `t.l0.jungle1` (row 3, col 0) - Use directional variant
- `t.l0.tundra1` (row 6, col 0) - Use directional variant

Note: Many terrain types only have directional variants, not simple `*1` tags.

## Unit Sprites

Unit sprites follow the pattern: `u.<unit_name>_<activity>`

Common activities:
- `Idle` - Default standing position
- `Moving` - Movement animation
- `Attacking` - Combat animation

### Unit Positions (from units.spec):
- Settlers: row 1, col 4
- Warriors: row 0, col 18
- Phalanx: row 1, col 1
- Archers: row 1, col 8
- Legion: row 0, col 16
- Pikemen: row 1, col 17
- Cavalry: row 1, col 9
- Catapult: row 0, col 7
- Knights: row 0, col 15

## City Sprites

Cities have different styles and sizes:

### Styles:
- European: row 1 (cols 0-4)
- Industrial: row 2 (cols 0-4)
- Modern: row 3 (cols 0-4)
- Postmodern: row 4 (cols 0-4)
- Classical: row 5 (cols 0-4)

### Size Variants:
- `_city_0` - Small city
- `_city_1` - Medium city
- `_city_2` - Large city
- `_wall_0` - City with walls
- `_occupied_0` - Occupied city

## Implementing Map Rendering

### Basic Single-Layer Approach (Simple)

```javascript
// For a simple demo - EXCEPT OCEAN which uses half-height tiles
const terrain = {
  grassland: { x: 60, y: 0 },
  desert: { x: 0, y: 30 },
  plains: { x: 0, y: 120 },
  // Ocean uses half-height tiles from grid_ocean
  ocean: {
    top: { x: 0, y: 210, w: 15, h: 15 },      // floor_cell top
    bottom: { x: 0, y: 225, w: 15, h: 15 }    // floor_cell bottom
  },
  // ... etc
};

function drawTile(ctx, terrainType, x, y) {
  const sprite = terrain[terrainType];
  
  if (terrainType === 'ocean') {
    // Draw top half (scaled to 30x15)
    ctx.drawImage(tileImg, sprite.top.x, sprite.top.y, 15, 15, x, y, 30, 15);
    // Draw bottom half (scaled to 30x15)
    ctx.drawImage(tileImg, sprite.bottom.x, sprite.bottom.y, 15, 15, x, y + 15, 30, 15);
  } else {
    ctx.drawImage(tileImg, sprite.x, sprite.y, 30, 30, x, y, 30, 30);
  }
}
```

### Advanced Multi-Layer Approach (Proper)

```javascript
// For production with terrain blending
function drawTerrainTile(ctx, tileData, x, y) {
  // 1. Draw base terrain (layer 0)
  drawLayer(ctx, tileData.baseSprite, x, y);
  
  // 2. Draw terrain overlay (layer 1) if needed
  if (tileData.overlaySprite) {
    drawLayer(ctx, tileData.overlaySprite, x, y);
  }
  
  // 3. Draw additional details (layer 2) if needed
  if (tileData.detailSprite) {
    drawLayer(ctx, tileData.detailSprite, x, y);
  }
  
  // 4. Draw improvements (roads, irrigation, etc.)
  if (tileData.improvements) {
    tileData.improvements.forEach(imp => drawLayer(ctx, imp, x, y));
  }
}

function getDirectionalVariant(terrainType, neighbors) {
  // Calculate which variant to use based on neighboring tiles
  const n = neighbors.north === terrainType ? 1 : 0;
  const e = neighbors.east === terrainType ? 1 : 0;
  const s = neighbors.south === terrainType ? 1 : 0;
  const w = neighbors.west === terrainType ? 1 : 0;
  
  return `${terrainType}_n${n}e${e}s${s}w${w}`;
}
```

### Ocean Rendering Example

```javascript
function drawOceanTile(ctx, neighbors, x, y) {
  // Ocean uses half-height 15x15 tiles from grid_ocean
  // For deep ocean, use floor_cell tiles (columns 0-4 for darker blue)
  
  const hasLandNeighbor = Object.values(neighbors).some(n => n !== 'ocean');
  
  if (hasLandNeighbor) {
    // Draw coast tiles (half-height) for land boundaries
    const coastVariant = getCoastCellVariant(neighbors);
    ctx.drawImage(tileImg, coastVariant.topX, coastVariant.topY, 15, 15, x, y, 30, 15);
    ctx.drawImage(tileImg, coastVariant.bottomX, coastVariant.bottomY, 15, 15, x, y + 15, 30, 15);
  } else {
    // Deep ocean - floor_cell tiles at y=210
    ctx.drawImage(tileImg, 0, 210, 15, 15, x, y, 30, 15);      // top half
    ctx.drawImage(tileImg, 0, 225, 15, 15, x, y + 15, 30, 15); // bottom half
  }
}
```

## Sprite Sheet Coordinates

All tiles are 30x30 pixels in a grid layout:
- X coordinate = column * 30
- Y coordinate = row * 30

Example: Row 5, Column 3
- X = 3 * 30 = 90
- Y = 5 * 30 = 150

## Common Pitfalls

1. **Ocean rendering with wrong tiles**: Ocean uses a separate 15x15 tile grid (`grid_ocean`) starting at y=210, NOT the main 30x30 grid. You must use half-height tiles stacked vertically. The `inaccessible1` tile has red diagonal lines and should not be used for ocean.

2. **Not stacking ocean tiles**: Each 15x15 ocean tile is half-height. You need to draw two tiles vertically to create a full 30x30 ocean square.

3. **Using coast variants for deep ocean**: Coast cell sprites are for land boundaries. For deep ocean, use floor_cell tiles (columns 0-4 for darker blue).

4. **Ignoring directional variants**: Most terrain types require directional variants for proper blending. Don't use `_n1e1s1w1` for all tiles.

5. **Wrong unit coordinates**: The units.spec file has units scattered across the sprite sheet, not in sequential order.

## Performance Optimization

### Pre-render Common Tiles
```javascript
// Create offscreen canvases for frequently used tile combinations
const tileCache = {};

function getCachedTile(terrainType, variant) {
  const key = `${terrainType}_${variant}`;
  if (!tileCache[key]) {
    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    renderTileToCanvas(ctx, terrainType, variant);
    tileCache[key] = canvas;
  }
  return tileCache[key];
}
```

### Batch Rendering
```javascript
// Render all tiles of the same type together
function renderMap(map) {
  const layers = ['base', 'overlay', 'details', 'improvements'];
  
  layers.forEach(layer => {
    map.forEach(tile => {
      if (tile[layer]) {
        drawSprite(ctx, tile[layer], tile.x, tile.y);
      }
    });
  });
}
```

## References

- Freeciv tilespec format: https://freeciv.org/wiki/Tilesets
- Original tiles.spec file: `public/assets/freeciv/trident/tiles.spec`
- Original units.spec file: `public/assets/freeciv/trident/units.spec`
- Original cities.spec file: `public/assets/freeciv/trident/cities.spec`

## Summary for SimCiv Implementation

For the SimCiv web client, we recommend:

1. **Start Simple**: Use single-layer rendering with `floor_n0e0s0w0` for ocean and base terrain sprites
2. **Add Blending Later**: Implement directional variants when you need smooth terrain transitions
3. **Cache Aggressively**: Pre-render common tile combinations to improve performance
4. **Layer Gradually**: Start with base terrain, then add overlays and improvements as needed

The demo.html file shows the simple approach. For production, implement the layered rendering system described above.
