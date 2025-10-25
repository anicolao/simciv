import { Page } from '@playwright/test';

/**
 * Drag the map using mouse events
 */
export async function dragMapMouse(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Promise<void> {
  const canvas = page.locator('.map-canvas');
  
  // Get canvas bounding box to calculate relative coordinates
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  // Mouse down at start position
  await canvas.hover();
  await page.mouse.move(box.x + startX, box.y + startY);
  await page.mouse.down();
  
  // Move to end position
  await page.mouse.move(box.x + endX, box.y + endY, { steps: 10 });
  
  // Mouse up
  await page.mouse.up();
  
  // Wait a bit for rendering
  await page.waitForTimeout(100);
}

/**
 * Drag the map using touch events (simulated)
 */
export async function dragMapTouch(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Promise<void> {
  const canvas = page.locator('.map-canvas');
  
  // Get canvas bounding box
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  // Simulate touch drag
  await page.touchscreen.tap(box.x + startX, box.y + startY);
  await page.waitForTimeout(50);
  
  // Touch and drag
  await canvas.dispatchEvent('touchstart', {
    touches: [{ clientX: box.x + startX, clientY: box.y + startY }],
    targetTouches: [{ clientX: box.x + startX, clientY: box.y + startY }],
  });
  
  // Simulate movement
  for (let i = 0; i <= 10; i++) {
    const x = startX + ((endX - startX) * i) / 10;
    const y = startY + ((endY - startY) * i) / 10;
    await canvas.dispatchEvent('touchmove', {
      touches: [{ clientX: box.x + x, clientY: box.y + y }],
      targetTouches: [{ clientX: box.x + x, clientY: box.y + y }],
    });
    await page.waitForTimeout(10);
  }
  
  await canvas.dispatchEvent('touchend', {
    touches: [],
    targetTouches: [],
  });
  
  await page.waitForTimeout(100);
}

/**
 * Scroll to zoom on the map
 */
export async function scrollZoom(page: Page, deltaY: number): Promise<void> {
  const canvas = page.locator('.map-canvas');
  
  // Dispatch wheel event directly to canvas
  await canvas.dispatchEvent('wheel', {
    deltaY: deltaY,
    deltaX: 0,
    deltaZ: 0,
    clientX: 320,
    clientY: 240,
    bubbles: true,
    cancelable: true,
  });
  
  // Wait for rendering
  await page.waitForTimeout(200);
}

/**
 * Get the current zoom level from the UI
 */
export async function getZoomLevel(page: Page): Promise<number> {
  const mapInfo = page.locator('.map-info');
  const text = await mapInfo.textContent();
  
  // Extract zoom percentage (e.g., "Zoom: 100%")
  const match = text?.match(/Zoom:\s*(\d+)%/);
  if (!match) throw new Error('Zoom level not found in UI');
  
  return parseInt(match[1], 10);
}

/**
 * Simulate pinch zoom (two-finger gesture)
 */
export async function pinchZoom(
  page: Page,
  startDistance: number,
  endDistance: number
): Promise<void> {
  const canvas = page.locator('.map-canvas');
  
  // Get canvas bounding box
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  
  // Calculate initial touch positions (two fingers)
  const startT1 = { x: centerX - startDistance / 2, y: centerY };
  const startT2 = { x: centerX + startDistance / 2, y: centerY };
  
  // Start pinch
  await canvas.dispatchEvent('touchstart', {
    touches: [
      { clientX: startT1.x, clientY: startT1.y },
      { clientX: startT2.x, clientY: startT2.y }
    ],
    targetTouches: [
      { clientX: startT1.x, clientY: startT1.y },
      { clientX: startT2.x, clientY: startT2.y }
    ],
  });
  
  await page.waitForTimeout(50);
  
  // Animate pinch movement
  for (let i = 1; i <= 10; i++) {
    const distance = startDistance + ((endDistance - startDistance) * i) / 10;
    const t1 = { x: centerX - distance / 2, y: centerY };
    const t2 = { x: centerX + distance / 2, y: centerY };
    
    await canvas.dispatchEvent('touchmove', {
      touches: [
        { clientX: t1.x, clientY: t1.y },
        { clientX: t2.x, clientY: t2.y }
      ],
      targetTouches: [
        { clientX: t1.x, clientY: t1.y },
        { clientX: t2.x, clientY: t2.y }
      ],
    });
    
    await page.waitForTimeout(20);
  }
  
  // End pinch
  await canvas.dispatchEvent('touchend', {
    touches: [],
    targetTouches: [],
  });
  
  await page.waitForTimeout(200);
}

/**
 * Get canvas size
 */
export async function getCanvasSize(page: Page): Promise<{ width: number; height: number }> {
  const canvas = page.locator('.map-canvas');
  const width = await canvas.getAttribute('width');
  const height = await canvas.getAttribute('height');
  
  if (!width || !height) throw new Error('Canvas dimensions not found');
  
  return {
    width: parseInt(width, 10),
    height: parseInt(height, 10),
  };
}
