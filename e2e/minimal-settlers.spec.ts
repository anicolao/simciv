import { test, expect, Page } from '@playwright/test';
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
    timeout: 30000
  });

  // Should be authenticated now
  await expect(page.locator('.authenticated')).toBeVisible();
}

// Helper to create and start a game
async function createAndStartGame(page: Page): Promise<void> {
  // Wait for game lobby
  await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();

  // Create game with 2 players
  await page.click('button:has-text("Create New Game")');
  await page.selectOption('select#maxPlayers', '2');
  await page.click('button:has-text("Create Game")');
  
  // Wait for game to appear
  await page.waitForSelector('.game-card', { timeout: 10000 });

  // Join the game to start it (since we're the creator and need 2 players)
  // First, we need a second user
  await page.context().clearCookies();
  const alias2 = 'settler_player2';
  const password = 'TestPassword123!';
  await registerAndLogin(page, alias2, password);
  
  // Join the first game in the list
  const gameCard = page.locator('.game-card').first();
  await gameCard.locator('button:has-text("Join")').click();
  
  // Wait for game to start
  await expect(gameCard.locator('.game-state.started')).toBeVisible({ timeout: 10000 });
  
  // Give game engine a moment to process first tick and generate map data
  await page.waitForTimeout(1000);
  
  // Click "View" button to open game details
  await gameCard.locator('button:has-text("View")').click();
  
  // Wait for map section and canvas to load
  await expect(page.locator('.map-section')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('canvas.map-canvas')).toBeVisible({ timeout: 10000 });
}

test.describe.skip('Minimal Settlers Implementation', () => {
  test('should create initial settlers unit at game start', async ({ page }) => {
    const alias = 'settler_test';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password);
    await createAndStartGame(page);

    // Map canvas should already be visible from createAndStartGame
    // Check if settlers unit is visible on the map by looking for the walking emoji
    // The unit should be rendered as 🚶 with a green circle
    const mapCanvas = page.locator('canvas.map-canvas');
    await expect(mapCanvas).toBeVisible();

    // Take screenshot showing initial state with settlers unit
    await screenshotIfChanged(page, { 
      path: 'e2e-screenshots/36-initial-settlers-unit.png', 
      fullPage: true 
    });

    // Verify via API that unit exists
    const gameState = await page.evaluate(async () => {
      const response = await fetch('/api/games/user/my-games');
      const data = await response.json();
      const gameId = data.games[0].gameId;
      
      const unitsResponse = await fetch(`/api/game/${gameId}/units`);
      const unitsData = await unitsResponse.json();
      
      return {
        gameId,
        units: unitsData.units
      };
    });

    // Verify unit exists and has correct properties
    expect(gameState.units).toHaveLength(1);
    expect(gameState.units[0].unitType).toBe('settlers');
    expect(gameState.units[0].stepsTaken).toBe(0);
    expect(gameState.units[0].populationCost).toBe(100);
  });

  test('should move settlers unit autonomously for 3 steps', async ({ page }) => {
    const alias = 'settler_test_move';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password);
    await createAndStartGame(page);

    // Get initial unit position (map already loaded from createAndStartGame)
    let gameState = await page.evaluate(async () => {
      const response = await fetch('/api/games/user/my-games');
      const data = await response.json();
      const gameId = data.games[0].gameId;
      
      const unitsResponse = await fetch(`/api/game/${gameId}/units`);
      const unitsData = await unitsResponse.json();
      
      return {
        gameId,
        unit: unitsData.units[0]
      };
    });

    const initialX = gameState.unit.location.x;
    const initialY = gameState.unit.location.y;
    console.log(`Initial position: (${initialX}, ${initialY}), steps: ${gameState.unit.stepsTaken}`);

    // Wait for 3 seconds (3 ticks for 3 steps)
    await page.waitForTimeout(3500);

    // Take screenshot after movement
    await screenshotIfChanged(page, { 
      path: 'e2e-screenshots/37-settlers-moved-3-steps.png', 
      fullPage: true 
    });

    // Check unit has moved 3 steps
    gameState = await page.evaluate(async () => {
      const response = await fetch('/api/games/user/my-games');
      const data = await response.json();
      const gameId = data.games[0].gameId;
      
      const unitsResponse = await fetch(`/api/game/${gameId}/units`);
      const unitsData = await unitsResponse.json();
      
      return {
        gameId,
        unit: unitsData.units[0]
      };
    });

    const finalX = gameState.unit.location.x;
    const finalY = gameState.unit.location.y;
    console.log(`Final position: (${finalX}, ${finalY}), steps: ${gameState.unit.stepsTaken}`);

    // Verify unit has taken 3 steps
    expect(gameState.unit.stepsTaken).toBe(3);
    
    // Verify unit has moved (position changed)
    const hasMoved = finalX !== initialX || finalY !== initialY;
    expect(hasMoved).toBeTruthy();
  });

  test('should create settlement automatically after 3 steps', async ({ page }) => {
    const alias = 'settler_test_settle';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password);
    await createAndStartGame(page);

    // Wait for 4 seconds (3 steps + 1 settlement tick) - map already loaded from createAndStartGame
    await page.waitForTimeout(4500);

    // Take screenshot showing settlement
    await screenshotIfChanged(page, { 
      path: 'e2e-screenshots/38-settlement-created.png', 
      fullPage: true 
    });

    // Verify settlement created and unit removed
    const gameState = await page.evaluate(async () => {
      const response = await fetch('/api/games/user/my-games');
      const data = await response.json();
      const gameId = data.games[0].gameId;
      
      const [unitsResponse, settlementsResponse] = await Promise.all([
        fetch(`/api/game/${gameId}/units`),
        fetch(`/api/game/${gameId}/settlements`)
      ]);
      
      const unitsData = await unitsResponse.json();
      const settlementsData = await settlementsResponse.json();
      
      return {
        gameId,
        units: unitsData.units,
        settlements: settlementsData.settlements
      };
    });

    // Verify unit is gone
    expect(gameState.units).toHaveLength(0);
    
    // Verify settlement exists
    expect(gameState.settlements).toHaveLength(1);
    expect(gameState.settlements[0].type).toBe('nomadic_camp');
    expect(gameState.settlements[0].name).toBe('First Settlement');
  });
});
