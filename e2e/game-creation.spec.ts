import { test, expect, Page } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter, triggerManualTick } from './global-setup';
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

test.describe('Game Creation and Management', () => {
  test('should show game lobby after authentication', async ({ page }) => {
    const alias = 'gameuser';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password);

    // Wait for game lobby to appear
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    
    // Take screenshot of authenticated state
    await screenshotIfChanged(page, { path: 'e2e-screenshots/09-game-lobby-authenticated.png', fullPage: true });
  });

  test('should create a new game', async ({ page }) => {
    const alias = 'gameuser';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password);

    // Wait for game lobby
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();

    // Click create game button
    await page.click('button:has-text("Create New Game")');
    await expect(page.locator('h3:has-text("Create New Game")')).toBeVisible();

    // Take screenshot of create game form
    await screenshotIfChanged(page, { path: 'e2e-screenshots/10-game-create-form.png', fullPage: true });

    // Select 2 players
    await page.selectOption('select#maxPlayers', '2');

    // Click create button
    await page.click('button:has-text("Create Game")');

    // Wait for game to appear in list
    await page.waitForSelector('.game-card', { timeout: 10000 });

    // Verify game is created
    const gameCard = page.locator('.game-card').first();
    await expect(gameCard).toBeVisible();
    await expect(gameCard.locator('.game-state.waiting')).toContainText('Waiting');

    // Take screenshot of game created
    await screenshotIfChanged(page, { path: 'e2e-screenshots/11-game-created.png', fullPage: true });
  });

  test('should allow second player to join game', async ({ page }) => {
    // Create first user and game
    const alias1 = 'gameuser1';
    const password = 'TestPassword123!';
    await registerAndLogin(page, alias1, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    
    // Create game
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Take screenshot before second player joins
    await screenshotIfChanged(page, { path: 'e2e-screenshots/12-game-waiting-for-players.png', fullPage: true });

    // Clear cookies and navigate to new session for second player
    await page.context().clearCookies();
    const alias2 = 'gameuser2';
    await registerAndLogin(page, alias2, password);
    
    // Wait for game lobby
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();

    // Find the game and join
    const gameCard = page.locator('.game-card').first();
    await expect(gameCard).toBeVisible();
    
    // Take screenshot showing join button
    await screenshotIfChanged(page, { path: 'e2e-screenshots/13-game-second-player-view.png', fullPage: true });
    
    // Click join button
    await gameCard.locator('button:has-text("Join")').click();

    // Verify game state changed to "Started"
    await expect(page.locator('.game-state.started').first()).toBeVisible({ timeout: 5000 });

    // Take screenshot of game started
    await screenshotIfChanged(page, { path: 'e2e-screenshots/14-game-started.png', fullPage: true });
  });

  test('should show time progression in started game', async ({ page }) => {
    const password = 'TestPassword123!';
    
    // Create first user and game
    const alias1 = 'gameuser1';
    await registerAndLogin(page, alias1, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    
    // Create game
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');
    
    // Get the game ID from the game card
    const gameIdText = await page.locator('.game-card').first().locator('.game-id').textContent();
    const gameId = gameIdText?.replace('Game #', '').trim() || '';

    // Clear cookies and login as second player
    await page.context().clearCookies();
    const alias2 = 'gameuser2';
    await registerAndLogin(page, alias2, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();

    // Join the game
    const gameCard = page.locator('.game-card').first();
    await gameCard.locator('button:has-text("Join")').click();

    // Wait for game to start
    await expect(page.locator('.game-state.started').first()).toBeVisible({ timeout: 5000 });

    // Check that year is displayed
    const yearValue = page.locator('.value.year').first();
    await expect(yearValue).toBeVisible();
    
    // In E2E mode, time doesn't progress automatically
    // Initial year should be 5000 BC and stay stable
    await expect(yearValue).toContainText('5000 BC');

    // Take screenshot showing initial year
    await screenshotIfChanged(page, { path: 'e2e-screenshots/15-game-time-initial.png', fullPage: true });

    // Manually trigger a tick to progress time
    await triggerManualTick(gameId);
    
    // Wait for the UI to update (give it a moment to refresh)
    await page.waitForTimeout(500); // Keep this as it's under 1s threshold

    // Year should now have progressed
    await expect(yearValue).toContainText('4999 BC');

    // Take screenshot showing time progression
    await screenshotIfChanged(page, { path: 'e2e-screenshots/16-game-time-progressed.png', fullPage: true });
  });

  test('should prevent joining a full game', async ({ page }) => {
    const password = 'TestPassword123!';
    
    // Create first user and game
    const alias1 = 'gameuser1';
    await registerAndLogin(page, alias1, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    
    // Create game with 2 players
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Second player joins
    await page.context().clearCookies();
    const alias2 = 'gameuser2';
    await registerAndLogin(page, alias2, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    await page.locator('.game-card').first().locator('button:has-text("Join")').click();
    
    // Wait for game to start
    await expect(page.locator('.game-state.started').first()).toBeVisible({ timeout: 5000 });

    // Third player tries to join
    await page.context().clearCookies();
    const alias3 = 'gameuser3';
    await registerAndLogin(page, alias3, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();

    // Game should show as "Started" without join button
    const gameCard = page.locator('.game-card').first();
    await expect(gameCard.locator('.game-state.started')).toContainText('Started', { timeout: 5000 });

    // Take screenshot showing full game
    await screenshotIfChanged(page, { path: 'e2e-screenshots/17-game-full-no-join.png', fullPage: true });
  });

  test('should navigate to full-page game view when viewing', async ({ page }) => {
    const alias = 'gameuser';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password);
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();

    // Create game
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '4');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Click view button
    await page.locator('.game-card').first().locator('button:has-text("View")').click();

    // Verify we're in the full-page game view
    await expect(page.locator('.game-view')).toBeVisible({ timeout: 5000 });

    // Navigate back to lobby
    await page.click('button:has-text("Back to Lobby")');
    
    // Verify we're back in the lobby
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.game-view')).not.toBeVisible();
  });
});
