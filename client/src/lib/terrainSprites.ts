/**
 * FreeCiv Trident Tileset Sprite Mapping
 * 
 * Maps SimCiv terrain types to FreeCiv Trident tileset sprite coordinates.
 * The Trident tileset uses 30x30 pixel tiles arranged in a grid.
 * 
 * Coordinates are (row, column) in the sprite sheet:
 * - X = column * 30
 * - Y = row * 30
 * 
 * Reference: public/assets/freeciv/trident/tiles.spec
 */

export interface SpriteCoord {
  row: number;
  col: number;
  x: number;  // Calculated X pixel position
  y: number;  // Calculated Y pixel position
}

const TILE_SIZE = 30;

function coord(row: number, col: number): SpriteCoord {
  return {
    row,
    col,
    x: col * TILE_SIZE,
    y: row * TILE_SIZE
  };
}

/**
 * Basic terrain sprites (layer 0)
 * Using simple variants where available, or n0e0s0w0 (no neighbors) variants
 */
export const TERRAIN_SPRITES: Record<string, SpriteCoord> = {
  // Grassland - simple sprite
  'GRASSLAND': coord(0, 2),  // t.l0.grassland1
  
  // Plains - use n0e0s0w0 variant (no plains neighbors)
  'PLAINS': coord(4, 15),  // t.l0.plains_n0e0s0w0
  
  // Desert - use n0e0s0w0 variant
  'DESERT': coord(1, 15),  // t.l0.desert_n0e0s0w0
  
  // Tundra - use n0e0s0w0 variant
  'TUNDRA': coord(3, 15),  // t.l0.tundra_n0e0s0w0
  
  // Arctic/Ice - use n0e0s0w0 variant
  'ICE': coord(6, 15),  // t.l0.arctic_n0e0s0w0
  
  // Swamp - use n0e0s0w0 variant
  'SWAMP': coord(5, 15),  // t.l0.swamp_n0e0s0w0
  
  // Forest - use n0e0s0w0 variant
  'FOREST': coord(0, 8),  // t.l0.forest_n0e0s0w0
  
  // Jungle - use n0e0s0w0 variant
  'JUNGLE': coord(2, 15),  // t.l0.jungle_n0e0s0w0
  
  // Hills - use n0e0s0w0 variant
  'HILLS': coord(0, 4),  // t.l0.hills_n0e0s0w0
  
  // Mountains - use n0e0s0w0 variant
  'MOUNTAIN': coord(0, 12),  // t.l0.mountains_n0e0s0w0
  
  // Ocean/Water - use floor (deep ocean) layer 1 variant
  // Note: Ocean uses different rendering - see OCEAN_SPRITES below
  'OCEAN': coord(10, 15),  // t.l1.floor_n0e0s0w0 (deep ocean)
  'SHALLOW_WATER': coord(10, 15),  // Same as ocean for now
};

/**
 * Ocean tiles use a special rendering approach
 * The floor sprites are in layer 1 (t.l1.floor_*)
 * Row 10 contains the floor (deep ocean) variants
 */
export const OCEAN_SPRITES = {
  // Deep ocean - all water neighbors (n1e1s1w1)
  DEEP: coord(10, 0),  // t.l1.floor_n1e1s1w1
  
  // Default ocean - no water neighbors (coastline)
  DEFAULT: coord(10, 15),  // t.l1.floor_n0e0s0w0
};

/**
 * Resource markers (shown as small overlays on terrain)
 * These are placeholders - actual resource sprites would come from tiles.spec
 */
export const RESOURCE_SPRITES: Record<string, SpriteCoord | null> = {
  'FISH': null,
  'WHALE': null,
  'GOLD': null,
  'IRON': null,
  'COAL': null,
  'OIL': null,
  'HORSE': null,
  'WHEAT': null,
  // Add more as needed
};

/**
 * Get sprite coordinates for a terrain type
 */
export function getTerrainSprite(terrainType: string): SpriteCoord | null {
  return TERRAIN_SPRITES[terrainType] || null;
}

/**
 * Get ocean sprite based on neighbors (future enhancement)
 * For now, just return the default ocean sprite
 */
export function getOceanSprite(hasWaterNeighbors: boolean = true): SpriteCoord {
  return hasWaterNeighbors ? OCEAN_SPRITES.DEEP : OCEAN_SPRITES.DEFAULT;
}
