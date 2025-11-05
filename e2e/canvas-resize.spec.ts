import { test, expect, Browser } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from './global-setup';
import { screenshotIfChanged } from './helpers/screenshot';
import { mockDateInBrowser } from './helpers/mock-time';
import { registerAndLogin } from './helpers/auth';
import { createGame, waitForGameStarted } from './helpers/game';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async ({ page }) => {
  await enableE2ETestMode();
  await clearDatabase();
  await resetUuidCounter();
  // Mock the Date object to ensure stable timestamps in screenshots
  await mockDateInBrowser(page);
});

test.describe('Canvas Resize Tests', () => {
  test('should repaint canvas when window is resized', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes for registration and game setup
    
    const alias1 = 'resizeuser1';
    const alias2 = 'resizeuser2';
    const password = 'TestPassword123!';
    
    // Create two separate browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Mock date in both pages
    await Promise.all([
      mockDateInBrowser(page1),
      mockDateInBrowser(page2)
    ]);
    
    // Register both users in parallel
    console.log('[E2E] Registering users...');
    await Promise.all([
      registerAndLogin(page1, alias1, password),
      registerAndLogin(page2, alias2, password)
    ]);
    
    try {
      // Player 1: Create game
      console.log('[E2E] Player 1: Creating game...');
      await createGame(page1, 2);
      
      // Player 2: Join game
      console.log('[E2E] Player 2: Joining game...');
      const gameCard2 = page2.locator('.game-card').first();
      await gameCard2.locator('button:has-text("Join")').click();
      
      // Wait for game to start
      console.log('[E2E] Waiting for game to start...');
      await waitForGameStarted(page1);
      
      // Wait for map generation
      console.log('[E2E] Waiting for map generation...');
      await page1.waitForTimeout(10000);
      
      // Player 1: Click View button to open full-page game view
      console.log('[E2E] Opening game view...');
      const gameCard1 = page1.locator('.game-card').first();
      await gameCard1.locator('button:has-text("View")').click();
      
      // Wait for game view to load
      await page1.waitForTimeout(3000);
      await expect(page1.locator('.game-view')).toBeVisible({ timeout: 10000 });
      
      // Wait for canvas to be rendered
      const canvas = page1.locator('canvas.map-canvas');
      await expect(canvas).toBeVisible();
      
      // Wait for map to finish loading
      const loadingMap = await page1.locator('text=Loading map...').isVisible().catch(() => false);
      if (loadingMap) {
        await expect(page1.locator('text=Loading map...')).not.toBeVisible({ timeout: 20000 });
      }
      await page1.waitForTimeout(2000);
      
      // Get initial canvas dimensions
      const initialBox = await canvas.boundingBox();
      console.log('[E2E] Initial canvas size:', initialBox);
      
      // Take screenshot at initial size
      await screenshotIfChanged(page1, { path: 'e2e-screenshots/40-canvas-initial-size.png' });
      
      // Resize the window to a smaller size
      console.log('[E2E] Resizing window to smaller size...');
      await page1.setViewportSize({ width: 800, height: 600 });
      
      // Wait a moment for resize to take effect
      await page1.waitForTimeout(500);
      
      // Get new canvas dimensions
      const smallBox = await canvas.boundingBox();
      console.log('[E2E] Small canvas size:', smallBox);
      
      // Verify canvas resized
      expect(smallBox?.width).toBeLessThan(initialBox?.width || 0);
      expect(smallBox?.height).toBeLessThan(initialBox?.height || 0);
      
      // Take screenshot at smaller size
      await screenshotIfChanged(page1, { path: 'e2e-screenshots/41-canvas-resized-small.png' });
      
      // Resize to a larger size
      console.log('[E2E] Resizing window to larger size...');
      await page1.setViewportSize({ width: 1600, height: 1200 });
      
      // Wait a moment for resize to take effect
      await page1.waitForTimeout(500);
      
      // Get new canvas dimensions
      const largeBox = await canvas.boundingBox();
      console.log('[E2E] Large canvas size:', largeBox);
      
      // Verify canvas resized again
      expect(largeBox?.width).toBeGreaterThan(smallBox?.width || 0);
      expect(largeBox?.height).toBeGreaterThan(smallBox?.height || 0);
      
      // Take screenshot at larger size
      await screenshotIfChanged(page1, { path: 'e2e-screenshots/42-canvas-resized-large.png' });
      
      console.log('[E2E] Canvas resize test completed successfully!');
    } finally {
      // Cleanup contexts
      await context1.close();
      await context2.close();
    }
  });
});
