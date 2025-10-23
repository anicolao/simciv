import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';
import { createGame, joinGame, waitForGameStarted, openGameDetails } from './helpers/game';
import { waitForMap, waitForMapGeneration, verifyMapLegend, verifyMapTiles, verifyStartingCityMarker, verifyResourceMarkers, verifyNoMap } from './helpers/map';

test.describe('Map View E2E Tests', () => {
  test('should display map when game is started', async ({ page }) => {
    const timestamp = Date.now();
    const password = 'TestPassword123!';
    
    // Create first user and game
    const alias1 = `mapuser1_${timestamp}`;
    await registerAndLogin(page, alias1, password);
    await createGame(page, 2);

    // Second player joins to start the game
    await page.context().clearCookies();
    const alias2 = `mapuser2_${timestamp}`;
    await registerAndLogin(page, alias2, password);
    await joinGame(page);
    
    // Wait for map to be generated (first tick after game starts)
    await waitForMapGeneration(page);
    
    // Click on the started game to view details
    await openGameDetails(page);
    
    // Wait for map section to appear
    await waitForMap(page);
    
    // Take screenshot of map section visible
    await page.screenshot({ path: 'e2e-screenshots/19-map-section-visible.png', fullPage: true });
    
    // Verify map components
    await verifyMapLegend(page);
    await verifyMapTiles(page);
    
    // Take screenshot of complete map view
    await page.screenshot({ path: 'e2e-screenshots/20-map-view-complete.png', fullPage: true });
  });

  test('should show starting city marker on map', async ({ page }) => {
    const timestamp = Date.now();
    const password = 'TestPassword123!';
    
    // Create and start game
    const alias1 = `mapuser1_${timestamp}`;
    await registerAndLogin(page, alias1, password);
    await createGame(page, 2);

    await page.context().clearCookies();
    const alias2 = `mapuser2_${timestamp}`;
    await registerAndLogin(page, alias2, password);
    await joinGame(page);
    
    // Wait for map generation
    await waitForMapGeneration(page);
    
    // Open game details
    await openGameDetails(page);
    await waitForMap(page);
    
    // Verify city marker is visible
    await verifyStartingCityMarker(page);
    
    // Take screenshot showing city marker
    await page.screenshot({ path: 'e2e-screenshots/21-map-starting-city-marker.png', fullPage: true });
  });

  test('should show resource markers on tiles with resources', async ({ page }) => {
    const timestamp = Date.now();
    const password = 'TestPassword123!';
    
    // Create and start game
    const alias1 = `mapuser1_${timestamp}`;
    await registerAndLogin(page, alias1, password);
    await createGame(page, 2);

    await page.context().clearCookies();
    const alias2 = `mapuser2_${timestamp}`;
    await registerAndLogin(page, alias2, password);
    await joinGame(page);
    
    // Wait for map generation
    await waitForMapGeneration(page);
    
    // Open game details
    await openGameDetails(page);
    await waitForMap(page);
    
    // Verify resource markers are visible
    await verifyResourceMarkers(page);
    
    // Take screenshot showing resource markers
    await page.screenshot({ path: 'e2e-screenshots/22-map-resource-markers.png', fullPage: true });
  });

  test('should not show map for waiting games', async ({ page }) => {
    const timestamp = Date.now();
    const password = 'TestPassword123!';
    
    // Create user and game but don't start it
    const alias1 = `mapuser1_${timestamp}`;
    await registerAndLogin(page, alias1, password);
    await createGame(page, 2);

    // Click on the waiting game
    await openGameDetails(page);
    
    // Map section should NOT be visible
    await verifyNoMap(page);
    
    // Take screenshot showing no map for waiting game
    await page.screenshot({ path: 'e2e-screenshots/23-game-waiting-no-map.png', fullPage: true });
  });
});
