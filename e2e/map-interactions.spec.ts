import { test, expect, Page, Browser } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from './global-setup';
import {
  dragMapMouse,
  scrollZoom,
  getZoomLevel,
  getCanvasSize,
} from './helpers/map-interactions';
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

// Helper to create and start a game
async function createAndStartGame(browser: Browser): Promise<{ context1: any, context2: any, page1: Page, page2: Page, gameId: string }> {
  const timestamp = Date.now();
  const alias1 = `mapint_user1_${timestamp}`;
  const alias2 = `mapint_user2_${timestamp}`;
  const password = 'TestPassword123!';
  
  console.log('[E2E] Starting parallel user registration...');
  const { context1, context2, page1, page2 } = await registerTwoUsersParallel(browser, alias1, alias2, password);
  console.log('[E2E] User registration complete');
  
  // Player 1: Create game
  console.log('[E2E] Player 1: Creating game...');
  await expect(page1.locator('h2:has-text("Game Lobby")')).toBeVisible();
  await page1.click('button:has-text("Create New Game")');
  await expect(page1.locator('h3:has-text("Create New Game")')).toBeVisible();
  await page1.selectOption('select#maxPlayers', '2');
  await page1.click('button:has-text("Create Game")');
  await page1.waitForSelector('.game-card', { timeout: 10000 });

  // Get the game ID
  const gameIdText = await page1.locator('.game-card').first().locator('.game-id').textContent();
  const gameId = gameIdText?.replace('Game #', '').trim() || '';
  console.log(`[E2E] Game created with ID: ${gameId}`);
  
  // Player 2: Join the game
  console.log('[E2E] Player 2: Joining game...');
  await expect(page2.locator('h2:has-text("Game Lobby")')).toBeVisible();
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
  
  // Open game details modal
  console.log('[E2E] Opening game details modal...');
  await gameCard.locator('button:has-text("View")').click();
  
  // Wait for map data to load
  console.log('[E2E] Waiting for map data to load...');
  await expect(page2.locator('text=Loading map...')).toBeVisible({ timeout: 5000 }).catch(() => {});
  await expect(page2.locator('text=Loading map...')).not.toBeVisible({ timeout: 20000 }).catch(() => {});
  await expect(page2.locator('.map-section')).toBeVisible({ timeout: 5000 });
  console.log('[E2E] Map section visible');
  
  return { context1, context2, page1, page2, gameId };
}

test.describe('Map Interaction E2E Tests', () => {
  test('should allow dragging to pan the map with mouse', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes
    
    const { context1, context2, page2 } = await createAndStartGame(browser);
    
    try {
      // Verify initial canvas state
      const canvas = page2.locator('.map-canvas');
      await expect(canvas).toBeVisible();
      
      // Get initial zoom level
      const initialZoom = await getZoomLevel(page2);
      expect(initialZoom).toBe(100); // Should start at 100%
      
      // Screenshot 24: Initial map view before pan
      console.log('[E2E] Taking screenshot 24...');
      await page2.screenshot({ path: 'e2e-screenshots/24-map-before-pan.png', fullPage: true });
      
      // Drag the map to the right (should show tiles to the left)
      console.log('[E2E] Dragging map...');
      await dragMapMouse(page2, 320, 240, 420, 240); // Drag 100px to the right
      
      // Wait for render
      await page2.waitForTimeout(500);
      
      // Screenshot 25: Map after panning with mouse
      console.log('[E2E] Taking screenshot 25...');
      await page2.screenshot({ path: 'e2e-screenshots/25-map-after-pan-mouse.png', fullPage: true });
      
      // Verify zoom level hasn't changed
      const zoomAfterPan = await getZoomLevel(page2);
      expect(zoomAfterPan).toBe(100);
      
      console.log('[E2E] Pan test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test('should allow scrolling to zoom in and out', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes
    
    const { context1, context2, page2 } = await createAndStartGame(browser);
    
    try {
      const canvas = page2.locator('.map-canvas');
      await expect(canvas).toBeVisible();
      
      // Get initial zoom level
      const initialZoom = await getZoomLevel(page2);
      expect(initialZoom).toBe(100);
      
      // Screenshot 26: Initial map before zoom
      console.log('[E2E] Taking screenshot 26...');
      await page2.screenshot({ path: 'e2e-screenshots/26-map-before-zoom.png', fullPage: true });
      
      // Zoom in (scroll up = negative deltaY)
      console.log('[E2E] Zooming in...');
      await scrollZoom(page2, -500);
      
      const zoomAfterIn = await getZoomLevel(page2);
      console.log(`[E2E] Zoom level after zoom in: ${zoomAfterIn}%`);
      expect(zoomAfterIn).toBeGreaterThan(100); // Should be > 100%
      
      // Screenshot 27: Map after zooming in
      console.log('[E2E] Taking screenshot 27...');
      await page2.screenshot({ path: 'e2e-screenshots/27-map-zoom-in.png', fullPage: true });
      
      // Zoom out (scroll down = positive deltaY)
      console.log('[E2E] Zooming out...');
      await scrollZoom(page2, 500);
      
      const zoomAfterOut = await getZoomLevel(page2);
      console.log(`[E2E] Zoom level after zoom out: ${zoomAfterOut}%`);
      expect(zoomAfterOut).toBe(100); // Should be back to 100%
      
      // Screenshot 28: Map after zooming back out
      console.log('[E2E] Taking screenshot 28...');
      await page2.screenshot({ path: 'e2e-screenshots/28-map-zoom-out.png', fullPage: true });
      
      // Zoom out to minimum (with granular levels, need more scrolls)
      console.log('[E2E] Zooming out to minimum...');
      for (let i = 0; i < 10; i++) {
        await scrollZoom(page2, 500);
      }
      
      const minZoom = await getZoomLevel(page2);
      console.log(`[E2E] Minimum zoom level: ${minZoom}%`);
      expect(minZoom).toBe(50); // Should be at minimum 50%
      
      // Screenshot 29: Map at minimum zoom
      console.log('[E2E] Taking screenshot 29...');
      await page2.screenshot({ path: 'e2e-screenshots/29-map-zoom-min.png', fullPage: true });
      
      // Try to zoom out further (should stay at minimum)
      await scrollZoom(page2, 500);
      const stillMinZoom = await getZoomLevel(page2);
      expect(stillMinZoom).toBe(50); // Should still be 50%
      
      // Zoom in to maximum (with granular levels, need more scrolls)
      console.log('[E2E] Zooming in to maximum...');
      for (let i = 0; i < 20; i++) {
        await scrollZoom(page2, -500);
      }
      
      const maxZoom = await getZoomLevel(page2);
      console.log(`[E2E] Maximum zoom level: ${maxZoom}%`);
      expect(maxZoom).toBe(200); // Should be at maximum 200%
      
      // Screenshot 30: Map at maximum zoom
      console.log('[E2E] Taking screenshot 30...');
      await page2.screenshot({ path: 'e2e-screenshots/30-map-zoom-max.png', fullPage: true });
      
      // Try to zoom in further (should stay at maximum)
      await scrollZoom(page2, -500);
      const stillMaxZoom = await getZoomLevel(page2);
      expect(stillMaxZoom).toBe(200); // Should still be 200%
      
      console.log('[E2E] Zoom test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test('should allow combined pan and zoom operations', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes
    
    const { context1, context2, page2 } = await createAndStartGame(browser);
    
    try {
      const canvas = page2.locator('.map-canvas');
      await expect(canvas).toBeVisible();
      
      // Zoom in
      console.log('[E2E] Zooming in...');
      await scrollZoom(page2, -500);
      const zoomLevel = await getZoomLevel(page2);
      expect(zoomLevel).toBeGreaterThan(100); // Should be > 100%
      
      // Pan the map
      console.log('[E2E] Panning zoomed map...');
      await dragMapMouse(page2, 320, 240, 220, 140); // Drag diagonally
      
      await page2.waitForTimeout(500);
      
      // Verify zoom level is maintained
      const zoomAfterPan = await getZoomLevel(page2);
      expect(zoomAfterPan).toBe(zoomLevel); // Zoom should be unchanged
      
      // Screenshot 31: Combined pan and zoom
      console.log('[E2E] Taking screenshot 31...');
      await page2.screenshot({ path: 'e2e-screenshots/31-map-pan-zoom-combined.png', fullPage: true });
      
      console.log('[E2E] Combined pan/zoom test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test('should maintain canvas dimensions at fixed size', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes
    
    const { context1, context2, page2 } = await createAndStartGame(browser);
    
    try {
      const canvas = page2.locator('.map-canvas');
      await expect(canvas).toBeVisible();
      
      // Check initial canvas size
      const initialSize = await getCanvasSize(page2);
      expect(initialSize.width).toBe(640);
      expect(initialSize.height).toBe(480);
      
      // Zoom in and verify canvas size hasn't changed
      await scrollZoom(page2, -500);
      const sizeAfterZoom = await getCanvasSize(page2);
      expect(sizeAfterZoom.width).toBe(640);
      expect(sizeAfterZoom.height).toBe(480);
      
      console.log('[E2E] Canvas size test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });

  test('should show proper cursor feedback during drag', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes
    
    const { context1, context2, page2 } = await createAndStartGame(browser);
    
    try {
      const canvas = page2.locator('.map-canvas');
      await expect(canvas).toBeVisible();
      
      // Verify canvas has grab cursor style
      const cursorStyle = await canvas.evaluate((el) => {
        return window.getComputedStyle(el).cursor;
      });
      expect(cursorStyle).toBe('grab');
      
      // Screenshot 32: Map with grab cursor
      console.log('[E2E] Taking screenshot 32...');
      await page2.screenshot({ path: 'e2e-screenshots/32-map-cursor-feedback.png', fullPage: true });
      
      console.log('[E2E] Cursor feedback test completed successfully!');
      
      await context1.close();
      await context2.close();
    } catch (error) {
      await context1.close();
      await context2.close();
      throw error;
    }
  });
});
