import { test, expect, Page } from '@playwright/test';
import crypto from 'crypto';

// Helper to generate a unique test user
function generateTestUser() {
  const random = Math.random().toString(36).substring(7);
  return `testuser_${random}`;
}

// Helper to generate RSA key pair
function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
}

// Helper to register and login a user
async function registerAndLogin(page: Page, alias: string): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = generateKeyPair();

  // Generate password
  const password = 'test-password-123';

  // Navigate to page
  await page.goto('/');

  // Fill registration form
  await page.fill('input[type="text"]', alias);
  await page.fill('input[type="password"]', password);
  
  // Click register button
  await page.click('button:has-text("Register")');

  // Wait for authentication to complete
  await page.waitForSelector('h2:has-text("Welcome")');

  return keyPair;
}

test.describe('Game Creation and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
  });

  test('should show game lobby after authentication', async ({ page }) => {
    const alias = generateTestUser();
    await registerAndLogin(page, alias);

    // Wait for game lobby to appear
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    
    // Take screenshot of authenticated state
    await page.screenshot({ path: 'e2e-screenshots/game-lobby-authenticated.png', fullPage: true });
  });

  test('should create a new game', async ({ page }) => {
    const alias = generateTestUser();
    await registerAndLogin(page, alias);

    // Wait for game lobby
    await page.waitForSelector('h2:has-text("Game Lobby")');

    // Click create game button
    await page.click('button:has-text("Create New Game")');
    await expect(page.locator('h3:has-text("Create New Game")')).toBeVisible();

    // Take screenshot of create game form
    await page.screenshot({ path: 'e2e-screenshots/game-create-form.png', fullPage: true });

    // Select 2 players
    await page.selectOption('select#maxPlayers', '2');

    // Click create button
    await page.click('button:has-text("Create Game")');

    // Wait for game to appear in list
    await page.waitForSelector('.game-card');

    // Verify game is created
    const gameCard = page.locator('.game-card').first();
    await expect(gameCard).toBeVisible();
    await expect(gameCard.locator('.game-state.waiting')).toContainText('Waiting');
    await expect(gameCard.locator('.value:has-text("/2")')).toBeVisible();

    // Take screenshot of game created
    await page.screenshot({ path: 'e2e-screenshots/game-created.png', fullPage: true });
  });

  test('should allow second player to join game', async ({ page, context }) => {
    // Create first user and game
    const alias1 = generateTestUser();
    await registerAndLogin(page, alias1);
    await page.waitForSelector('h2:has-text("Game Lobby")');
    
    // Create game
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Get the game ID
    const gameCard = await page.locator('.game-card').first();
    await expect(gameCard).toBeVisible();

    // Take screenshot before second player joins
    await page.screenshot({ path: 'e2e-screenshots/game-waiting-for-players.png', fullPage: true });

    // Open second browser tab for second player
    const page2 = await context.newPage();
    const alias2 = generateTestUser();
    await registerAndLogin(page2, alias2);
    
    // Wait for game lobby
    await page2.waitForSelector('h2:has-text("Game Lobby")');

    // Find the game and join
    const gameCard2 = page2.locator('.game-card').first();
    await expect(gameCard2).toBeVisible();
    
    // Take screenshot showing join button
    await page2.screenshot({ path: 'e2e-screenshots/game-second-player-view.png', fullPage: true });
    
    // Click join button
    await gameCard2.locator('button:has-text("Join")').click();

    // Wait a bit for the game to update
    await page2.waitForTimeout(1000);

    // Verify game state changed to "Started"
    await page2.waitForSelector('.game-state.started');
    const startedState = page2.locator('.game-state.started').first();
    await expect(startedState).toContainText('Started');

    // Take screenshot of game started
    await page2.screenshot({ path: 'e2e-screenshots/game-started.png', fullPage: true });

    // Verify first player also sees game started
    await page.waitForTimeout(3000); // Wait for polling to update
    const startedState1 = page.locator('.game-state.started').first();
    await expect(startedState1).toContainText('Started');
  });

  test('should show time progression in started game', async ({ page, context }) => {
    // Create first user and game
    const alias1 = generateTestUser();
    await registerAndLogin(page, alias1);
    await page.waitForSelector('h2:has-text("Game Lobby")');
    
    // Create game
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Open second browser tab for second player
    const page2 = await context.newPage();
    const alias2 = generateTestUser();
    await registerAndLogin(page2, alias2);
    await page2.waitForSelector('h2:has-text("Game Lobby")');

    // Join the game
    const gameCard2 = page2.locator('.game-card').first();
    await gameCard2.locator('button:has-text("Join")').click();
    await page2.waitForTimeout(1000);

    // Wait for game to start
    await page2.waitForSelector('.game-state.started');

    // Check that year is displayed
    const yearValue = page2.locator('.value.year').first();
    await expect(yearValue).toBeVisible();
    
    // Initial year should be 5000 BC
    await expect(yearValue).toContainText('5000 BC');

    // Take screenshot showing initial year
    await page2.screenshot({ path: 'e2e-screenshots/game-time-initial.png', fullPage: true });

    // Wait for time to progress (at least 5 seconds)
    await page2.waitForTimeout(7000);

    // Year should have changed
    const newYearText = await yearValue.textContent();
    expect(newYearText).not.toContain('5000 BC');
    
    // Should be progressing (e.g., 4993 BC or similar)
    expect(newYearText).toMatch(/\d{4} BC/);

    // Take screenshot showing time progression
    await page2.screenshot({ path: 'e2e-screenshots/game-time-progressed.png', fullPage: true });
  });

  test('should prevent joining a full game', async ({ page, context }) => {
    // Create first user and game
    const alias1 = generateTestUser();
    await registerAndLogin(page, alias1);
    await page.waitForSelector('h2:has-text("Game Lobby")');
    
    // Create game with 2 players
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Second player joins
    const page2 = await context.newPage();
    const alias2 = generateTestUser();
    await registerAndLogin(page2, alias2);
    await page2.waitForSelector('h2:has-text("Game Lobby")');
    await page2.locator('.game-card').first().locator('button:has-text("Join")').click();
    await page2.waitForTimeout(1000);

    // Third player tries to join
    const page3 = await context.newPage();
    const alias3 = generateTestUser();
    await registerAndLogin(page3, alias3);
    await page3.waitForSelector('h2:has-text("Game Lobby")');

    // Game should show as "Started" without join button
    const gameCard3 = page3.locator('.game-card').first();
    await expect(gameCard3.locator('.game-state.started')).toContainText('Started');
    await expect(gameCard3.locator('button:has-text("Join")')).not.toBeVisible();

    // Take screenshot showing full game
    await page3.screenshot({ path: 'e2e-screenshots/game-full-no-join.png', fullPage: true });
  });

  test('should show game details when viewing', async ({ page }) => {
    const alias = generateTestUser();
    await registerAndLogin(page, alias);
    await page.waitForSelector('h2:has-text("Game Lobby")');

    // Create game
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '4');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card');

    // Click view button
    await page.locator('.game-card').first().locator('button:has-text("View")').click();

    // Wait for details modal
    await page.waitForSelector('.game-details');

    // Verify details are shown
    await expect(page.locator('.game-details h3:has-text("Game Details")')).toBeVisible();
    await expect(page.locator('.detail-row .label:has-text("Game ID")')).toBeVisible();
    await expect(page.locator('.detail-row .label:has-text("State")')).toBeVisible();
    await expect(page.locator('.detail-row .label:has-text("Current Year")')).toBeVisible();

    // Take screenshot of game details
    await page.screenshot({ path: 'e2e-screenshots/game-details-modal.png', fullPage: true });

    // Close modal
    await page.locator('.close-btn').click();
    await expect(page.locator('.game-details')).not.toBeVisible();
  });
});
