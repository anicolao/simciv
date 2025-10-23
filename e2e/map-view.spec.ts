import { test, expect, Page, Browser } from '@playwright/test';

// Helper to register and login a user
async function registerAndLogin(page: Page, alias: string, password: string): Promise<void> {
  // Navigate to page
  await page.goto('/');
  
  // Wait for redirect to session GUID URL
  await page.waitForURL(/\/id=[a-f0-9-]+/);

  // Fill registration form
  await page.fill('input[id="alias"]', alias);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="passwordConfirm"]', password);
  
  // Submit registration
  await page.locator('form button[type="submit"]').first().click();

  // Wait for registration to complete
  await expect(page.locator('.message.success')).toContainText('Registration successful', {
    timeout: 90000 // 90 seconds for key generation (can be slow in CI)
  });

  // Should be authenticated now
  await expect(page.locator('.authenticated')).toBeVisible();
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
    
    // Register both users in parallel
    const { context1, context2, page1, page2 } = await registerTwoUsersParallel(browser, alias1, alias2, password);
    
    try {
      // Player 1: Create game
      await expect(page1.locator('h2:has-text("Game Lobby")')).toBeVisible();
      await page1.click('button:has-text("Create New Game")');
      await expect(page1.locator('h3:has-text("Create New Game")')).toBeVisible();
      await page1.selectOption('select#maxPlayers', '2');
      await page1.click('button:has-text("Create Game")');
      await page1.waitForSelector('.game-card', { timeout: 10000 });

      // Get the game ID from the game card created by player 1
      const gameIdText = await page1.locator('.game-card').first().locator('.game-id').textContent();
      const gameId = gameIdText?.replace('Game #', '').trim();
      
      // Player 2: Join the specific game created by player 1
      await expect(page2.locator('h2:has-text("Game Lobby")')).toBeVisible();
      
      // Find the game card that matches the game ID
      const gameCard = page2.locator('.game-card').filter({ hasText: `Game #${gameId}` });
      await expect(gameCard).toBeVisible({ timeout: 10000 });
      await gameCard.locator('button:has-text("Join")').click();
      
      // Wait longer for game to transition to started state
      await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 30000 });
      
      // Wait for map to be generated (game engine processes first tick)
      await page2.waitForTimeout(3000);
      
      // Click on started game to open details modal
      await page2.locator('.game-card.started').first().click();
      
      // Wait for map section in modal
      await expect(page2.locator('h3:has-text("Map")')).toBeVisible({ timeout: 10000 });
      
      // Screenshot 19: Map section visible
      await page2.screenshot({ path: 'e2e-screenshots/19-map-section-visible.png', fullPage: true });
      
      // Verify map components
      await expect(page2.locator('.map-legend')).toBeVisible();
      await expect(page2.locator('.map-tile').first()).toBeVisible();
      
      // Screenshot 20: Complete map view with legend and tiles
      await page2.screenshot({ path: 'e2e-screenshots/20-map-view-complete.png', fullPage: true });
      
      // Screenshot 21: Starting city marker
      const cityMarker = page2.locator('.map-tile .city-marker');
      await expect(cityMarker).toBeVisible({ timeout: 5000 });
      await page2.screenshot({ path: 'e2e-screenshots/21-map-starting-city-marker.png', fullPage: true });
      
      // Screenshot 22: Resource markers
      const resourceMarkers = page2.locator('.map-tile .resource-marker');
      await expect(resourceMarkers.first()).toBeVisible({ timeout: 5000 });
      await page2.screenshot({ path: 'e2e-screenshots/22-map-resource-markers.png', fullPage: true });
      
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
      
      // Click on the waiting game to open details
      await page.locator('.game-card').first().click();
      
      // Map section should NOT be visible for waiting games
      await expect(page.locator('h3:has-text("Map")')).not.toBeVisible();
      
      // Screenshot 23: No map for waiting game
      await page.screenshot({ path: 'e2e-screenshots/23-game-waiting-no-map.png', fullPage: true });
  });
});
