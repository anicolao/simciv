import { test, expect, Browser } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter } from './global-setup';
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

test.describe('Canvas Immediate Repaint on Resize', () => {
  test('should repaint canvas immediately on first requestAnimationFrame after resize', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes for registration and game setup
    
    const alias1 = 'repaintuser1';
    const alias2 = 'repaintuser2';
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
      
      // Verify initial canvas has content
      console.log('[E2E] Verifying initial canvas has content...');
      const initialHasContent = await page1.evaluate(() => {
        const canvas = document.querySelector('canvas.map-canvas') as HTMLCanvasElement;
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        // Check if canvas has any non-black pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
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
      
      expect(initialHasContent).toBe(true);
      console.log('[E2E] Initial canvas has content: verified');
      
      // Get initial dimensions
      const initialBox = await canvas.boundingBox();
      console.log('[E2E] Initial canvas dimensions:', initialBox);
      
      // Resize the window and verify canvas repaints IMMEDIATELY on first requestAnimationFrame
      console.log('[E2E] Testing immediate repaint on resize...');
      
      // Inject code to monitor canvas state during resize
      const resizeAndCheckResult = await page1.evaluate(async () => {
        const canvas = document.querySelector('canvas.map-canvas') as HTMLCanvasElement;
        if (!canvas) return { success: false, error: 'Canvas not found' };
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return { success: false, error: 'Context not found' };
        
        // Helper function to check if canvas has content
        function hasContent(): boolean {
          const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if ((r > 0 || g > 0 || b > 0) && a > 0) {
              return true;
            }
          }
          return false;
        }
        
        // Record the initial dimensions
        const initialWidth = canvas.width;
        const initialHeight = canvas.height;
        
        // Create a promise that resolves on the next requestAnimationFrame
        const waitForRAF = () => new Promise<void>(resolve => {
          requestAnimationFrame(() => resolve());
        });
        
        // Trigger a resize by changing the viewport (this is done by Playwright, 
        // so we'll just wait for the canvas to update)
        // We'll detect the resize by monitoring canvas dimensions
        return new Promise<any>((resolve) => {
          let rafCount = 0;
          const maxRafs = 5; // Check up to 5 requestAnimationFrame callbacks
          
          function checkOnRAF() {
            rafCount++;
            
            // Check if canvas dimensions have changed (resize occurred)
            const currentWidth = canvas.width;
            const currentHeight = canvas.height;
            
            if (currentWidth !== initialWidth || currentHeight !== initialHeight) {
              // Resize detected! Check if canvas has content
              const hasContentNow = hasContent();
              
              resolve({
                success: true,
                rafNumber: rafCount,
                hadContentImmediately: hasContentNow,
                oldDimensions: { width: initialWidth, height: initialHeight },
                newDimensions: { width: currentWidth, height: currentHeight }
              });
              return;
            }
            
            // Continue checking if we haven't hit the limit
            if (rafCount < maxRafs) {
              requestAnimationFrame(checkOnRAF);
            } else {
              resolve({
                success: false,
                error: 'Resize not detected within ' + maxRafs + ' RAFs'
              });
            }
          }
          
          // Start monitoring
          requestAnimationFrame(checkOnRAF);
        });
      });
      
      // Now trigger the actual resize
      console.log('[E2E] Triggering resize to 800x600...');
      await page1.setViewportSize({ width: 800, height: 600 });
      
      // Wait for the evaluation to complete (it's waiting for the resize to be detected)
      console.log('[E2E] Resize detection result:', resizeAndCheckResult);
      
      // Verify the result
      expect(resizeAndCheckResult.success).toBe(true);
      if (resizeAndCheckResult.success) {
        console.log(`[E2E] Canvas repainted on RAF #${resizeAndCheckResult.rafNumber}`);
        console.log(`[E2E] Old dimensions: ${resizeAndCheckResult.oldDimensions.width}x${resizeAndCheckResult.oldDimensions.height}`);
        console.log(`[E2E] New dimensions: ${resizeAndCheckResult.newDimensions.width}x${resizeAndCheckResult.newDimensions.height}`);
        
        // The critical assertion: canvas must have content immediately after resize
        expect(resizeAndCheckResult.hadContentImmediately).toBe(true);
        
        // Verify it happened on the first RAF after resize was detected
        expect(resizeAndCheckResult.rafNumber).toBeLessThanOrEqual(2); // Should be 1 or 2
      }
      
      // Do a second resize test to verify consistency
      console.log('[E2E] Testing second resize to 1400x900...');
      
      const secondResizeResult = await page1.evaluate(async () => {
        const canvas = document.querySelector('canvas.map-canvas') as HTMLCanvasElement;
        if (!canvas) return { success: false, error: 'Canvas not found' };
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return { success: false, error: 'Context not found' };
        
        function hasContent(): boolean {
          const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if ((r > 0 || g > 0 || b > 0) && a > 0) {
              return true;
            }
          }
          return false;
        }
        
        const initialWidth = canvas.width;
        const initialHeight = canvas.height;
        
        return new Promise<any>((resolve) => {
          let rafCount = 0;
          const maxRafs = 5;
          
          function checkOnRAF() {
            rafCount++;
            
            const currentWidth = canvas.width;
            const currentHeight = canvas.height;
            
            if (currentWidth !== initialWidth || currentHeight !== initialHeight) {
              const hasContentNow = hasContent();
              
              resolve({
                success: true,
                rafNumber: rafCount,
                hadContentImmediately: hasContentNow,
                oldDimensions: { width: initialWidth, height: initialHeight },
                newDimensions: { width: currentWidth, height: currentHeight }
              });
              return;
            }
            
            if (rafCount < maxRafs) {
              requestAnimationFrame(checkOnRAF);
            } else {
              resolve({
                success: false,
                error: 'Resize not detected within ' + maxRafs + ' RAFs'
              });
            }
          }
          
          requestAnimationFrame(checkOnRAF);
        });
      });
      
      await page1.setViewportSize({ width: 1400, height: 900 });
      
      console.log('[E2E] Second resize detection result:', secondResizeResult);
      
      expect(secondResizeResult.success).toBe(true);
      if (secondResizeResult.success) {
        console.log(`[E2E] Second resize: Canvas repainted on RAF #${secondResizeResult.rafNumber}`);
        expect(secondResizeResult.hadContentImmediately).toBe(true);
        expect(secondResizeResult.rafNumber).toBeLessThanOrEqual(2);
      }
      
      console.log('[E2E] ✅ Canvas immediate repaint test completed successfully!');
      console.log('[E2E] Canvas repaints immediately (within first 1-2 RAF callbacks) after resize with no delays or hacks needed.');
      
    } finally {
      // Cleanup contexts
      await context1.close();
      await context2.close();
    }
  });
});
