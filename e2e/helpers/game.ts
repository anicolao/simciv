import { expect, Page } from '@playwright/test';

/**
 * Wait for game lobby to be visible
 */
export async function waitForGameLobby(page: Page): Promise<void> {
  await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
}

/**
 * Create a new game through the UI
 */
export async function createGame(page: Page, maxPlayers: number = 2): Promise<void> {
  // Wait for game lobby
  await waitForGameLobby(page);
  
  // Click create game button
  await page.click('button:has-text("Create New Game")');
  await expect(page.locator('h3:has-text("Create New Game")')).toBeVisible();

  // Select number of players
  await page.selectOption('select#maxPlayers', String(maxPlayers));

  // Click create button
  await page.click('button:has-text("Create Game")');

  // Wait for game to appear in list
  await page.waitForSelector('.game-card', { timeout: 10000 });
}

/**
 * Join the first available game
 */
export async function joinGame(page: Page): Promise<void> {
  await waitForGameLobby(page);
  
  // Find first game card and click join
  const gameCard = page.locator('.game-card').first();
  await gameCard.locator('button:has-text("Join")').click();

  // Wait for game to start
  await expect(page.locator('.game-state.started').first()).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for a game to reach started state
 */
export async function waitForGameStarted(page: Page): Promise<void> {
  await expect(page.locator('.game-state.started').first()).toBeVisible({ timeout: 5000 });
}

/**
 * Click on a game card to view details
 */
export async function openGameDetails(page: Page, index: number = 0): Promise<void> {
  const gameCard = page.locator('.game-card').nth(index);
  await gameCard.click();
}

/**
 * Create a game and have a second player join to start it
 * Returns after the game has started
 */
export async function createAndStartGame(page: Page, player2Alias: string, player2Password: string, maxPlayers: number = 2): Promise<void> {
  // Create game with first player
  await createGame(page, maxPlayers);

  // Switch to second player
  await page.context().clearCookies();
  
  // Import registerAndLogin from auth helpers
  const { registerAndLogin } = await import('./auth');
  await registerAndLogin(page, player2Alias, player2Password);
  
  // Join the game
  await joinGame(page);
}
