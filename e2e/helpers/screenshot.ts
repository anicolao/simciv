/**
 * Screenshot Helper for E2E Tests
 * 
 * This module provides visual regression testing for screenshots.
 * Screenshots are compared against expected versions using pixel-based
 * comparison with tolerance for minor rendering differences.
 * 
 * Usage:
 * - Normal test run: Tests fail if screenshots differ significantly from expectations
 * - Update mode: Set UPDATE_SCREENSHOTS=1 to update expected screenshots
 * 
 * Workflow:
 * 1. Run tests normally - they fail if screenshots differ significantly
 * 2. Inspect changed screenshots to verify they match your expectations
 * 3. If correct: Set UPDATE_SCREENSHOTS=1 and run tests again to update expectations
 * 4. Verify tests pass with new expectations (run without UPDATE_SCREENSHOTS)
 * 5. Commit the new screenshot expectations
 * 
 * If screenshots are incorrect:
 * - Fix the source of the visual differences
 * - Revert the screenshot files
 * - Run tests again
 */

import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Check if we're in update mode (for updating screenshot expectations)
const UPDATE_SCREENSHOTS = process.env.UPDATE_SCREENSHOTS === '1' || process.env.UPDATE_SCREENSHOTS === 'true';

// Threshold for pixel comparison (0.0 to 1.0, lower is stricter)
// This controls the sensitivity for individual pixel comparison in pixelmatch:
// - 0.0 requires exact color match
// - 0.1 allows small color variations (good for anti-aliasing)
// - 1.0 would consider all pixels as matching
const PIXEL_THRESHOLD = 0.1;

// Maximum percentage of pixels that can differ (0.0 to 100.0)
// 0.5% tolerance accounts for minor rendering differences like anti-aliasing
const MAX_DIFF_PERCENTAGE = 0.5;

/**
 * Compare two PNG images and return the number of different pixels
 */
function compareImages(img1Buffer: Buffer, img2Buffer: Buffer): { diffPixels: number; totalPixels: number } {
  const img1 = PNG.sync.read(img1Buffer);
  const img2 = PNG.sync.read(img2Buffer);
  
  // Images must have the same dimensions - treat different dimensions as 100% different
  if (img1.width !== img2.width || img1.height !== img2.height) {
    const maxPixels = Math.max(img1.width * img1.height, img2.width * img2.height);
    return { diffPixels: maxPixels, totalPixels: maxPixels };
  }
  
  const totalPixels = img1.width * img1.height;
  
  // Use pixelmatch to compare images
  const diffPixels = pixelmatch(
    img1.data,
    img2.data,
    null, // Don't output a diff image
    img1.width,
    img1.height,
    { threshold: PIXEL_THRESHOLD }
  );
  
  return { diffPixels, totalPixels };
}

/**
 * Take a screenshot and compare it with the expected version
 * 
 * This function implements visual regression testing:
 * 1. Takes a screenshot to a buffer
 * 2. Compares it pixel-by-pixel with the expected file
 * 3. If similar enough (within tolerance): test passes
 * 4. If significantly different:
 *    - In UPDATE mode: updates the expected screenshot
 *    - In normal mode: throws an error (test fails)
 * 5. If file doesn't exist: creates it (first time setup)
 * 
 * @param page - Playwright Page object
 * @param screenshotPath - Path where screenshot should be saved
 * @param options - Playwright screenshot options
 * @throws Error if screenshot differs significantly from expected (unless in UPDATE mode)
 */
export async function takeScreenshotIfChanged(
  page: Page,
  screenshotPath: string,
  options?: Parameters<Page['screenshot']>[0]
): Promise<void> {
  // Ensure the directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Take screenshot to a buffer first
  const screenshotBuffer = await page.screenshot({
    ...options,
    path: undefined, // Don't write to disk yet
  });

  // Check if expected file exists
  if (!fs.existsSync(screenshotPath)) {
    // First time - create the expected screenshot
    fs.writeFileSync(screenshotPath, screenshotBuffer);
    console.log(`📸 Created expected screenshot: ${path.basename(screenshotPath)}`);
    return;
  }

  // Read existing expected screenshot
  const existingBuffer = fs.readFileSync(screenshotPath);
  
  // Compare images
  const { diffPixels, totalPixels } = compareImages(existingBuffer, screenshotBuffer as Buffer);
  const diffPercentage = (diffPixels / totalPixels) * 100;
  
  // Check if difference is within tolerance
  if (diffPercentage <= MAX_DIFF_PERCENTAGE) {
    // Screenshot matches expected (within tolerance) - test passes
    console.log(`✓ Screenshot matches expected: ${path.basename(screenshotPath)}`);
    return;
  }

  // Screenshot differs significantly from expected
  if (UPDATE_SCREENSHOTS) {
    // Update mode: update the expected screenshot
    fs.writeFileSync(screenshotPath, screenshotBuffer);
    console.log(`📸 Updated expected screenshot: ${path.basename(screenshotPath)}`);
  } else {
    // Normal mode: fail the test with instructions
    const filename = path.basename(screenshotPath);
    throw new Error(
      `Screenshot mismatch: ${filename}\n\n` +
      `${diffPixels} pixels differ (${diffPercentage.toFixed(2)}% of image).\n` +
      `Threshold: ${MAX_DIFF_PERCENTAGE}%\n\n` +
      `Next steps:\n` +
      `1. Inspect the screenshot at: ${screenshotPath}\n` +
      `2. If the visual change is correct and expected:\n` +
      `   - Run: UPDATE_SCREENSHOTS=1 npm run test:e2e\n` +
      `   - Verify tests pass: npm run test:e2e\n` +
      `   - Commit the updated screenshot\n` +
      `3. If the visual change is incorrect:\n` +
      `   - Fix the source of the visual difference\n` +
      `   - Revert the screenshot: git checkout -- ${screenshotPath}\n` +
      `   - Run tests again: npm run test:e2e`
    );
  }
}

/**
 * Convenience wrapper for visual regression testing
 * 
 * Usage:
 *   await screenshotIfChanged(page, { path: 'e2e-screenshots/01-test.png', fullPage: true });
 * 
 * Behavior:
 * - Compares screenshot against expected version
 * - Throws error if different (unless UPDATE_SCREENSHOTS=1 is set)
 * - Creates file if it doesn't exist (first time)
 * 
 * @param page - Playwright Page object  
 * @param options - Playwright screenshot options (must include 'path')
 * @throws Error if screenshot differs from expected (unless in UPDATE mode)
 */
export async function screenshotIfChanged(
  page: Page,
  options: Parameters<Page['screenshot']>[0] & { path: string }
): Promise<void> {
  const { path: screenshotPath, ...screenshotOptions } = options;
  return takeScreenshotIfChanged(page, screenshotPath, screenshotOptions);
}
