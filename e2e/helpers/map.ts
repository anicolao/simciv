import { expect, Page } from '@playwright/test';

/**
 * Wait for map section to be visible in game details
 */
export async function waitForMap(page: Page, timeout: number = 10000): Promise<void> {
  await expect(page.locator('h3:has-text("Map")')).toBeVisible({ timeout });
}

/**
 * Verify map legend is displayed
 */
export async function verifyMapLegend(page: Page): Promise<void> {
  await expect(page.locator('.map-legend')).toBeVisible();
}

/**
 * Verify map tiles are rendered
 */
export async function verifyMapTiles(page: Page): Promise<void> {
  await expect(page.locator('.map-tile').first()).toBeVisible();
}

/**
 * Verify starting city marker is visible on map
 */
export async function verifyStartingCityMarker(page: Page): Promise<void> {
  const cityMarker = page.locator('.map-tile .city-marker');
  await expect(cityMarker).toBeVisible({ timeout: 5000 });
}

/**
 * Verify resource markers are visible on map tiles
 */
export async function verifyResourceMarkers(page: Page): Promise<void> {
  const resourceMarkers = page.locator('.map-tile .resource-marker');
  await expect(resourceMarkers.first()).toBeVisible({ timeout: 5000 });
}

/**
 * Verify map is NOT visible (for waiting games)
 */
export async function verifyNoMap(page: Page): Promise<void> {
  await expect(page.locator('h3:has-text("Map")')).not.toBeVisible();
}

/**
 * Wait for map to be generated after game starts
 * Map generation happens on first tick after game state changes to "started"
 */
export async function waitForMapGeneration(page: Page, delayMs: number = 2000): Promise<void> {
  await page.waitForTimeout(delayMs);
}
