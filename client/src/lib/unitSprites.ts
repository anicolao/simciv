/**
 * FreeCiv Trident Unit and City Sprite Mapping
 * 
 * Maps unit types and city/settlement types to FreeCiv Trident sprite coordinates.
 * - Units: 30x30 pixel tiles from units.png
 * - Cities: 30x30 pixel tiles from cities.png
 * 
 * Reference: 
 * - public/assets/freeciv/trident/units.spec
 * - public/assets/freeciv/trident/cities.spec
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
 * Unit sprites from units.png
 * Reference: public/assets/freeciv/trident/units.spec
 */
export const UNIT_SPRITES: Record<string, SpriteCoord> = {
  'settlers': coord(1, 4),   // u.settlers_Idle:0
  'warriors': coord(0, 18),  // u.warriors_Idle:0
  'workers': coord(2, 14),   // u.worker_Idle:0
  'migrants': coord(2, 16),  // u.migrants_Idle:0 (alternative settlers)
};

/**
 * City/Settlement sprites from cities.png
 * Using european style for consistency
 */
export const CITY_SPRITES: Record<string, SpriteCoord> = {
  // Settlement sizes (european style)
  'nomadic_camp': coord(1, 0),     // city.european_city_0 (smallest)
  'village': coord(1, 0),          // city.european_city_0
  'town': coord(1, 1),             // city.european_city_1
  'city': coord(1, 2),             // city.european_city_2
  
  // Fallback to default
  'default': coord(1, 0),
};

/**
 * Get sprite for a unit type
 */
export function getUnitSprite(unitType: string): SpriteCoord | null {
  return UNIT_SPRITES[unitType] || null;
}

/**
 * Get sprite for a settlement/city
 */
export function getCitySprite(settlementType: string): SpriteCoord {
  return CITY_SPRITES[settlementType] || CITY_SPRITES['default'];
}
