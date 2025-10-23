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

Ocean tiles in Freeciv require **layered rendering** to display correctly:

### Components:
1. **Base Layer (t.l0.inaccessible1)**: Row 0, col 3 - The dark blue ocean base
2. **Floor Layer (t.l1.floor_*)**: Row 10 - The water texture overlay
3. **Coast Layer (t.l1.coast_*)**: Row 10 - Transitions to land (optional)

### Why Layering is Required:
The floor sprites (row 10) are semi-transparent overlays designed to be drawn on top of a base layer. Without the base layer, the middle of the tile appears white/transparent.

### Implementation:

**Simple Deep Ocean (Recommended for demos):**
```javascript
// Draw both layers for proper ocean rendering
function drawOcean(ctx, x, y) {
  // Layer 0: Base (inaccessible1)
  ctx.drawImage(tileImg, 90, 0, 30, 30, x, y, 30, 30);  // row 0, col 3
  
  // Layer 1: Floor overlay (floor_n0e0s0w0)
  ctx.drawImage(tileImg, 450, 300, 30, 30, x, y, 30, 30);  // row 10, col 15
}
```

**Production Ocean with Coastlines:**
```javascript
function drawOceanTile(ctx, neighbors, x, y) {
  // Always draw base layer first
  ctx.drawImage(tileImg, 90, 0, 30, 30, x, y, 30, 30);  // inaccessible1
  
  // Draw floor overlay
  const floorVariant = getFloorVariant(neighbors);
  ctx.drawImage(tileImg, floorVariant.x, floorVariant.y, 30, 30, x, y, 30, 30);
  
  // If adjacent to land, draw coast overlay
  if (hasLandNeighbor(neighbors)) {
    const coastVariant = getCoastVariant(neighbors);
    ctx.drawImage(tileImg, coastVariant.x, coastVariant.y, 30, 30, x, y, 30, 30);
  }
}
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
// For a simple demo - EXCEPT OCEAN which requires layering
const terrain = {
  grassland: { x: 60, y: 0 },
  desert: { x: 0, y: 30 },
  plains: { x: 0, y: 120 },
  // Ocean needs two layers!
  ocean: {
    base: { x: 90, y: 0 },      // inaccessible1
    overlay: { x: 450, y: 300 }  // floor_n0e0s0w0
  },
  // ... etc
};

function drawTile(ctx, terrainType, x, y) {
  const sprite = terrain[terrainType];
  
  if (terrainType === 'ocean') {
    // Draw base layer first
    ctx.drawImage(tileImg, sprite.base.x, sprite.base.y, 30, 30, x, y, 30, 30);
    // Draw overlay
    ctx.drawImage(tileImg, sprite.overlay.x, sprite.overlay.y, 30, 30, x, y, 30, 30);
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
  // CRITICAL: Always draw base layer first!
  // Without this, the floor overlay appears white/transparent in the middle
  ctx.drawImage(tileImg, 90, 0, 30, 30, x, y, 30, 30);  // inaccessible1 base
  
  // Check if any neighbors are land
  const hasLandNeighbor = Object.values(neighbors).some(n => n !== 'ocean');
  
  if (hasLandNeighbor) {
    // Draw appropriate floor variant based on neighbors
    const floorVariant = getFloorVariant(neighbors);
    ctx.drawImage(tileImg, floorVariant.x, floorVariant.y, 30, 30, x, y, 30, 30);
    
    // Draw coast overlay to show land boundary
    const coastVariant = getCoastVariant(neighbors);
    ctx.drawImage(tileImg, coastVariant.x, coastVariant.y, 30, 30, x, y, 30, 30);
  } else {
    // Deep ocean - just base + floor overlay
    ctx.drawImage(tileImg, 450, 300, 30, 30, x, y, 30, 30);  // floor_n0e0s0w0
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

1. **Ocean rendering without base layer**: The floor sprites (`t.l1.floor_*`) are semi-transparent overlays. They MUST be drawn on top of the base layer (`t.l0.inaccessible1` at row 0, col 3) or they will appear white/transparent in the middle with only the edges visible.

2. **Using coast variants for deep ocean**: Coast sprites (`t.l1.coast_*`) are meant to be overlays showing land boundaries, not standalone ocean tiles.

3. **Ignoring directional variants**: Most terrain types require directional variants for proper blending. Don't use `_n1e1s1w1` for all tiles.

4. **Missing layers**: Some terrains need multiple layers to render correctly. Ocean especially needs the base + overlay layers.

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
