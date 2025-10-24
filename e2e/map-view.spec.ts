import { test, expect, Page, Browser } from '@playwright/test';
import { clearDatabase } from './global-setup';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async () => {
  await clearDatabase();
});

// Helper to register and login a user
async function registerAndLogin(page: Page, alias: string, password: string): Promise<void> {
  console.log(`[E2E] Registering user: ${alias}`);
  // Navigate to page
  await page.goto('/');
  
  // Wait for redirect to session GUID URL
  await page.waitForURL(/\/id=[a-f0-9-]+/);

  // Fill registration form
  await page.fill('input[id="alias"]', alias);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="passwordConfirm"]', password);
  
  // Submit registration
  console.log(`[E2E] Submitting registration for ${alias}...`);
  await page.locator('form button[type="submit"]').first().click();

  // Wait for registration to complete
  console.log(`[E2E] Waiting for key generation for ${alias}...`);
  await expect(page.locator('.message.success')).toContainText('Registration successful', {
    timeout: 90000 // 90 seconds for key generation (can be slow in CI)
  });
  console.log(`[E2E] Registration successful for ${alias}`);

  // Should be authenticated now
  await expect(page.locator('.authenticated')).toBeVisible();
  console.log(`[E2E] ${alias} is authenticated`);
}

// Register two users in parallel to save time
async function registerTwoUsersParallel(browser: Browser, alias1: string, alias2: string, password: string) {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Start both registrations in parallel
  await Promise.all([
    registerAndLogin(page1, alias1, password),
    registerAndLogin(page2, alias2, password)
  ]);
  
  return { context1, context2, page1, page2 };
}

test.describe('Map View E2E Tests', () => {
  test('should display map and verify all components when game is started', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes - parallel registration + game setup takes time
    
    const timestamp = Date.now();
    const alias1 = `mapuser1_${timestamp}`;
    const alias2 = `mapuser2_${timestamp}`;
    const password = 'TestPassword123!';
    
    console.log('[E2E] Starting parallel user registration...');
    // Register both users in parallel
    const { context1, context2, page1, page2 } = await registerTwoUsersParallel(browser, alias1, alias2, password);
    console.log('[E2E] User registration complete');
    
    try {
      // Player 1: Create game
      console.log('[E2E] Player 1: Creating game...');
      await expect(page1.locator('h2:has-text("Game Lobby")')).toBeVisible();
      await page1.click('button:has-text("Create New Game")');
      await expect(page1.locator('h3:has-text("Create New Game")')).toBeVisible();
      await page1.selectOption('select#maxPlayers', '2');
      await page1.click('button:has-text("Create Game")');
      await page1.waitForSelector('.game-card', { timeout: 10000 });

      // Get the game ID from the game card created by player 1
      const gameIdText = await page1.locator('.game-card').first().locator('.game-id').textContent();
      const gameId = gameIdText?.replace('Game #', '').trim();
      console.log(`[E2E] Game created with ID: ${gameId}`);
      
      // Player 2: Join the specific game created by player 1
      console.log('[E2E] Player 2: Joining game...');
      await expect(page2.locator('h2:has-text("Game Lobby")')).toBeVisible();
      
      // Find the game card that matches the game ID
      const gameCard = page2.locator('.game-card').filter({ hasText: `Game #${gameId}` });
      await expect(gameCard).toBeVisible({ timeout: 10000 });
      await gameCard.locator('button:has-text("Join")').click();
      console.log('[E2E] Player 2: Join button clicked');
      
      // Wait longer for game to transition to started state
      console.log('[E2E] Waiting for game to start...');
      await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 30000 });
      console.log('[E2E] Game started');
      
      // Wait for map to be generated (game engine processes first tick)
      console.log('[E2E] Waiting 3 seconds for map generation...');
      await page2.waitForTimeout(3000);
      
      // Click the View button to open details modal
      console.log('[E2E] Opening game details modal...');
      await gameCard.locator('button:has-text("View")').click();
      
      // Wait for map section in modal
      console.log('[E2E] Waiting for map section to appear...');
      await expect(page2.locator('h3:has-text("Game Map")')).toBeVisible({ timeout: 10000 });
      console.log('[E2E] Map section visible');
      
      // Screenshot 19: Map section visible
      console.log('[E2E] Taking screenshot 19...');
      await page2.screenshot({ path: 'e2e-screenshots/19-map-section-visible.png', fullPage: true });
      
      // Verify map components
      console.log('[E2E] Verifying map legend...');
      await expect(page2.locator('.legend')).toBeVisible();
      console.log('[E2E] Verifying map canvas...');
      await expect(page2.locator('.map-canvas')).toBeVisible();
      
      // Screenshot 20: Complete map view with legend and canvas
      console.log('[E2E] Taking screenshot 20...');
      await page2.screenshot({ path: 'e2e-screenshots/20-map-view-complete.png', fullPage: true });
      
      // Verify that canvas has correct dimensions (20x15 tiles at 32px each)
      console.log('[E2E] Verifying canvas dimensions...');
      const canvas = page2.locator('.map-canvas');
      const width = await canvas.getAttribute('width');
      const height = await canvas.getAttribute('height');
      const expectedWidth = 20 * 32; // viewportTilesX * DISPLAY_TILE_SIZE
      const expectedHeight = 15 * 32; // viewportTilesY * DISPLAY_TILE_SIZE
      console.log(`[E2E] Canvas dimensions: ${width}x${height}, expected ${expectedWidth}x${expectedHeight}`);
      expect(width).toBe(expectedWidth.toString());
      expect(height).toBe(expectedHeight.toString());
      
      // Screenshot 21: Map rendered with FreeCiv tiles
      console.log('[E2E] Taking screenshot 21 (map with FreeCiv tiles)...');
      await page2.screenshot({ path: 'e2e-screenshots/21-map-starting-city-marker.png', fullPage: true });
      
      // Screenshot 22: Complete map view
      console.log('[E2E] Taking screenshot 22 (complete map view)...');
      await page2.screenshot({ path: 'e2e-screenshots/22-map-with-resources.png', fullPage: true });
      
      console.log('[E2E] Test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test('should not show map for waiting games', async ({ page }) => {
    const timestamp = Date.now();
    const alias = `mapuser_waiting_${timestamp}`;
    const password = 'TestPassword123!';
    
    // Register and login user
    await registerAndLogin(page, alias, password);
    
    // Create game but don't start it
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
      await page.click('button:has-text("Create New Game")');
      await expect(page.locator('h3:has-text("Create New Game")')).toBeVisible();
      await page.selectOption('select#maxPlayers', '2');
      await page.click('button:has-text("Create Game")');
      await page.waitForSelector('.game-card', { timeout: 10000 });
      
      // Click the View button to open details
      await page.locator('.game-card').first().locator('button:has-text("View")').click();
      
      // Map section should NOT be visible for waiting games (should show "Game Map" if it were)
      await expect(page.locator('h3:has-text("Game Map")')).not.toBeVisible();
      
      // Screenshot 23: No map for waiting game
      await page.screenshot({ path: 'e2e-screenshots/23-game-waiting-no-map.png', fullPage: true });
  });
});
