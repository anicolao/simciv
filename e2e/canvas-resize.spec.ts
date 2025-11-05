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

test.describe('Canvas Resize Tests', () => {
  test('should repaint canvas when window is resized', async ({ page, browser }) => {
    test.setTimeout(300000); // 5 minutes for registration and game setup
    
    const alias = 'resizeuser';
    const password = 'TestPassword123!';
    
    console.log('[E2E] Registering user...');
    await registerAndLogin(page, alias, password);
    
    // Create a game
    console.log('[E2E] Creating game...');
    await expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible();
    await page.click('button:has-text("Create New Game")');
    await expect(page.locator('h3:has-text("Create New Game")')).toBeVisible();
    await page.selectOption('select#maxPlayers', '1');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card', { timeout: 10000 });
    
    // Join and start the game
    console.log('[E2E] Joining and starting game...');
    const gameCard = page.locator('.game-card').first();
    await gameCard.locator('button:has-text("Join Game")').click();
    
    // Wait for game to be visible
    await expect(page.locator('.game-view')).toBeVisible({ timeout: 10000 });
    
    // Wait for canvas to be rendered
    const canvas = page.locator('canvas.map-canvas');
    await expect(canvas).toBeVisible();
    
    // Get initial canvas dimensions
    const initialBox = await canvas.boundingBox();
    console.log('[E2E] Initial canvas size:', initialBox);
    
    // Take screenshot at initial size
    await screenshotIfChanged(page, 'e2e-screenshots', '40-canvas-initial-size.png');
    
    // Resize the window to a smaller size
    console.log('[E2E] Resizing window to smaller size...');
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Wait a moment for resize to take effect
    await page.waitForTimeout(500);
    
    // Get new canvas dimensions
    const smallBox = await canvas.boundingBox();
    console.log('[E2E] Small canvas size:', smallBox);
    
    // Verify canvas resized
    expect(smallBox?.width).toBeLessThan(initialBox?.width || 0);
    expect(smallBox?.height).toBeLessThan(initialBox?.height || 0);
    
    // Take screenshot at smaller size
    await screenshotIfChanged(page, 'e2e-screenshots', '41-canvas-resized-small.png');
    
    // Verify the canvas is still rendering (check for pixel data)
    const hasPixelData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.map-canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      // Check if canvas has any non-black pixels (map should have colored terrain)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Look for any non-black pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // If we find any pixel that's not pure black, canvas has content
        if ((r > 0 || g > 0 || b > 0) && a > 0) {
          return true;
        }
      }
      
      return false;
    });
    
    console.log('[E2E] Canvas has pixel data after resize:', hasPixelData);
    expect(hasPixelData).toBe(true);
    
    // Resize to a larger size
    console.log('[E2E] Resizing window to larger size...');
    await page.setViewportSize({ width: 1600, height: 1200 });
    
    // Wait a moment for resize to take effect
    await page.waitForTimeout(500);
    
    // Get new canvas dimensions
    const largeBox = await canvas.boundingBox();
    console.log('[E2E] Large canvas size:', largeBox);
    
    // Verify canvas resized again
    expect(largeBox?.width).toBeGreaterThan(smallBox?.width || 0);
    expect(largeBox?.height).toBeGreaterThan(smallBox?.height || 0);
    
    // Take screenshot at larger size
    await screenshotIfChanged(page, 'e2e-screenshots', '42-canvas-resized-large.png');
    
    // Verify the canvas is still rendering after second resize
    const hasPixelDataAfterLarge = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.map-canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      // Check if canvas has any non-black pixels (map should have colored terrain)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Look for any non-black pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // If we find any pixel that's not pure black, canvas has content
        if ((r > 0 || g > 0 || b > 0) && a > 0) {
          return true;
        }
      }
      
      return false;
    });
    
    console.log('[E2E] Canvas has pixel data after large resize:', hasPixelDataAfterLarge);
    expect(hasPixelDataAfterLarge).toBe(true);
    
    console.log('[E2E] Canvas resize test completed successfully!');
  });
});
