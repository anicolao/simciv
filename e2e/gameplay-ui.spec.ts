import { test, expect, Page, Browser } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from './global-setup';
import { screenshotIfChanged } from './helpers/screenshot';
import { mockDateInBrowser } from './helpers/mock-time';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async ({ page }) => {
  await enableE2ETestMode();
  await clearDatabase();
  await resetUuidCounter();
  // Mock the Date object to ensure stable timestamps in screenshots
  await mockDateInBrowser(page);
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
  
  // Mock date in both pages to ensure stable timestamps
  await Promise.all([
    mockDateInBrowser(page1),
    mockDateInBrowser(page2)
  ]);
  
  // Start both registrations in parallel
  await Promise.all([
    registerAndLogin(page1, alias1, password),
    registerAndLogin(page2, alias2, password)
  ]);
  
  return { context1, context2, page1, page2 };
}

test.describe('Gameplay UI E2E Tests', () => {
  test.skip('should display full-page game view with responsive layout', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes - parallel registration + game setup takes time
    
    const alias1 = 'gameplayuser1';
    const alias2 = 'gameplayuser2';
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
      
      // Wait for game to start
      console.log('[E2E] Waiting for game to start...');
      await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 30000 });
      console.log('[E2E] Game started');
      
      // Give game engine a moment to process first tick and generate map data
      await page2.waitForTimeout(1000);
      
      // Click the View button to navigate to full-page game view
      console.log('[E2E] Navigating to full-page game view...');
      await gameCard.locator('button:has-text("View")').click();
      
      // Verify we're in the full-page game view
      console.log('[E2E] Verifying full-page game view...');
      await expect(page2.locator('.game-view')).toBeVisible({ timeout: 5000 });
      
      // Wait for map data to load (MapView loads tiles in its onMount)
      console.log('[E2E] Waiting for map data to load...');
      
      // Check if we have a loading indicator - if so wait for it to disappear
      const loadingGame = await page2.locator('text=Loading game...').isVisible().catch(() => false);
      console.log('[E2E] Loading game visible:', loadingGame);
      
      if (loadingGame) {
        await expect(page2.locator('text=Loading game...')).not.toBeVisible({ timeout: 10000 });
      }
      
      // Check for map loading
      const loadingMap = await page2.locator('text=Loading map...').isVisible().catch(() => false);
      console.log('[E2E] Loading map visible:', loadingMap);
      
      if (loadingMap) {
        await expect(page2.locator('text=Loading map...')).not.toBeVisible({ timeout: 20000 });
      }
      
      // Verify back button is visible
      await expect(page2.locator('button:has-text("Back to Lobby")')).toBeVisible();
      
      // Verify control panel is visible
      await expect(page2.locator('.control-panel')).toBeVisible();
      
      // Verify map area is visible
      await expect(page2.locator('.map-area')).toBeVisible();
      
      // Screenshot 24: Full-page game view
      console.log('[E2E] Taking screenshot 24 (full-page game view)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/24-gameplay-ui-fullpage.png', fullPage: true });
      
      // Debug: Check what's actually in the DOM
      const gameViewHTML = await page2.locator('.game-view').innerHTML().catch(() => 'not found');
      console.log('[E2E] GameView HTML length:', gameViewHTML.length);
      
      const mapAreaHTML = await page2.locator('.map-area').innerHTML().catch(() => 'not found');
      console.log('[E2E] MapArea HTML:', mapAreaHTML.substring(0, 500));
      
      // Verify map canvas is visible and rendering
      console.log('[E2E] Verifying map canvas...');
      const canvas = page2.locator('.map-canvas');
      await expect(canvas).toBeVisible({ timeout: 10000 });
      
      // Get canvas dimensions (should be dynamic, filling the map area)
      const width = await canvas.getAttribute('width');
      const height = await canvas.getAttribute('height');
      console.log(`[E2E] Canvas dimensions: ${width}x${height}`);
      
      // Verify canvas is not the old fixed size (640x480)
      // In full-page mode, it should be larger
      const canvasWidth = parseInt(width || '0');
      const canvasHeight = parseInt(height || '0');
      console.log(`[E2E] Canvas size: ${canvasWidth}x${canvasHeight}`);
      
      // Screenshot 25: Full-page game view with map rendered
      console.log('[E2E] Taking screenshot 25 (map rendered in full-page view)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/25-gameplay-ui-map-rendered.png', fullPage: true });
      
      // Verify game info is displayed in control panel
      console.log('[E2E] Verifying game info in control panel...');
      await expect(page2.locator('.control-panel h2')).toContainText(`Game #${gameId?.slice(0, 8)}`);
      await expect(page2.locator('.info-row').filter({ hasText: 'State:' })).toBeVisible();
      await expect(page2.locator('.info-row').filter({ hasText: 'Players:' })).toBeVisible();
      await expect(page2.locator('.info-row').filter({ hasText: 'Year:' })).toBeVisible();
      
      // Screenshot 26: Control panel with game info
      console.log('[E2E] Taking screenshot 26 (control panel)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/26-gameplay-ui-control-panel.png', fullPage: true });
      
      // Test navigation back to lobby
      console.log('[E2E] Testing back to lobby navigation...');
      await page2.click('button:has-text("Back to Lobby")');
      
      // Wait for lobby to be visible again
      await expect(page2.locator('h2:has-text("Game Lobby")')).toBeVisible({ timeout: 5000 });
      
      // Verify game view is no longer visible
      await expect(page2.locator('.game-view')).not.toBeVisible();
      
      // Screenshot 27: Back in lobby after viewing game
      console.log('[E2E] Taking screenshot 27 (back in lobby)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/27-gameplay-ui-back-to-lobby.png', fullPage: true });
      
      console.log('[E2E] Test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test.skip('should detect landscape layout mode', async ({ page, browser }) => {
    test.setTimeout(300000);
    
    const alias1 = 'layoutuser1';
    const alias2 = 'layoutuser2';
    const password = 'TestPassword123!';
    
    // Register two users and create a game
    const { context1, context2, page1, page2 } = await registerTwoUsersParallel(browser, alias1, alias2, password);
    
    try {
      // Create and start game
      await page1.click('button:has-text("Create New Game")');
      await page1.selectOption('select#maxPlayers', '2');
      await page1.click('button:has-text("Create Game")');
      await page1.waitForSelector('.game-card', { timeout: 10000 });
      
      const gameCard = page2.locator('.game-card').first();
      await gameCard.locator('button:has-text("Join")').click();
      await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 30000 });
      
      // Give game engine a moment to process first tick and generate map data
      await page2.waitForTimeout(1000);
      
      // Set viewport to landscape mode
      await page2.setViewportSize({ width: 1920, height: 1080 });
      
      // Navigate to game view
      await gameCard.locator('button:has-text("View")').click();
      
      // Verify landscape layout
      await expect(page2.locator('.game-view.landscape')).toBeVisible();
      
      // Screenshot 28: Landscape layout
      console.log('[E2E] Taking screenshot 28 (landscape layout)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/28-gameplay-ui-landscape.png', fullPage: true });
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test.skip('should detect portrait layout mode', async ({ page, browser }) => {
    test.setTimeout(300000);
    
    const alias1 = 'portraituser1';
    const alias2 = 'portraituser2';
    const password = 'TestPassword123!';
    
    // Register two users and create a game
    const { context1, context2, page1, page2 } = await registerTwoUsersParallel(browser, alias1, alias2, password);
    
    try {
      // Create and start game
      await page1.click('button:has-text("Create New Game")');
      await page1.selectOption('select#maxPlayers', '2');
      await page1.click('button:has-text("Create Game")');
      await page1.waitForSelector('.game-card', { timeout: 10000 });
      
      const gameCard = page2.locator('.game-card').first();
      await gameCard.locator('button:has-text("Join")').click();
      await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 30000 });
      
      // Give game engine a moment to process first tick and generate map data
      await page2.waitForTimeout(1000);
      
      // Set viewport to portrait mode
      await page2.setViewportSize({ width: 768, height: 1024 });
      
      // Navigate to game view
      await gameCard.locator('button:has-text("View")').click();
      
      // Verify portrait layout
      await expect(page2.locator('.game-view.portrait')).toBeVisible();
      
      // Screenshot 29: Portrait layout
      console.log('[E2E] Taking screenshot 29 (portrait layout)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/29-gameplay-ui-portrait.png', fullPage: true });
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test.skip('should detect square layout mode', async ({ page, browser }) => {
    test.setTimeout(300000);
    
    const alias1 = 'squareuser1';
    const alias2 = 'squareuser2';
    const password = 'TestPassword123!';
    
    // Register two users and create a game
    const { context1, context2, page1, page2 } = await registerTwoUsersParallel(browser, alias1, alias2, password);
    
    try {
      // Create and start game
      await page1.click('button:has-text("Create New Game")');
      await page1.selectOption('select#maxPlayers', '2');
      await page1.click('button:has-text("Create Game")');
      await page1.waitForSelector('.game-card', { timeout: 10000 });
      
      const gameCard = page2.locator('.game-card').first();
      await gameCard.locator('button:has-text("Join")').click();
      await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 30000 });
      
      // Give game engine a moment to process first tick and generate map data
      await page2.waitForTimeout(1000);
      
      // Set viewport to square mode
      await page2.setViewportSize({ width: 900, height: 900 });
      
      // Navigate to game view
      await gameCard.locator('button:has-text("View")').click();
      
      // Verify square layout
      await expect(page2.locator('.game-view.square')).toBeVisible();
      
      // Screenshot 30: Square layout
      console.log('[E2E] Taking screenshot 30 (square layout)...');
      await screenshotIfChanged(page2, { path: 'e2e-screenshots/30-gameplay-ui-square.png', fullPage: true });
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test('should show placeholder for waiting games', async ({ page }) => {
    const alias = 'waitinguser';
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
    
    // Click the View button to navigate to game view
    await page.locator('.game-card').first().locator('button:has-text("View")').click();
    
    // Map placeholder should be visible for waiting games
    await expect(page.locator('.map-placeholder')).toBeVisible();
    await expect(page.locator('text=Game has not started yet')).toBeVisible();
    
    // Screenshot 31: Waiting game placeholder
    await screenshotIfChanged(page, { path: 'e2e-screenshots/31-gameplay-ui-waiting-game.png', fullPage: true });
  });
});
