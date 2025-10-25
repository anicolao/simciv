/**
 * Screenshot Helper for E2E Tests
 * 
 * This module provides visual regression testing for screenshots.
 * Screenshots are compared against expected versions and tests fail
 * if differences are detected, requiring manual review and approval.
 * 
 * Usage:
 * - Normal test run: Tests fail if screenshots differ from expectations
 * - Update mode: Set UPDATE_SCREENSHOTS=1 to update expected screenshots
 * 
 * Workflow:
 * 1. Run tests normally - they fail if screenshots differ
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
import crypto from 'crypto';

// Check if we're in update mode (for updating screenshot expectations)
const UPDATE_SCREENSHOTS = process.env.UPDATE_SCREENSHOTS === '1' || process.env.UPDATE_SCREENSHOTS === 'true';

/**
 * Calculate SHA-256 hash of a file
 */
function getFileHash(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate SHA-256 hash of a buffer
 */
function getBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Take a screenshot and compare it with the expected version
 * 
 * This function implements visual regression testing:
 * 1. Takes a screenshot to a buffer
 * 2. Compares its hash with the expected file's hash
 * 3. If hashes match: test passes
 * 4. If hashes differ:
 *    - In UPDATE mode: updates the expected screenshot
 *    - In normal mode: throws an error (test fails)
 * 5. If file doesn't exist: creates it (first time setup)
 * 
 * @param page - Playwright Page object
 * @param screenshotPath - Path where screenshot should be saved
 * @param options - Playwright screenshot options
 * @throws Error if screenshot differs from expected (unless in UPDATE mode)
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

  // Calculate hash of new screenshot
  const newHash = getBufferHash(screenshotBuffer as Buffer);
  
  // Get hash of existing file (if it exists)
  const existingHash = getFileHash(screenshotPath);

  // Handle different scenarios
  if (existingHash === null) {
    // First time - create the expected screenshot
    fs.writeFileSync(screenshotPath, screenshotBuffer);
    console.log(`📸 Created expected screenshot: ${path.basename(screenshotPath)}`);
  } else if (existingHash !== newHash) {
    // Screenshot differs from expected
    if (UPDATE_SCREENSHOTS) {
      // Update mode: update the expected screenshot
      fs.writeFileSync(screenshotPath, screenshotBuffer);
      console.log(`📸 Updated expected screenshot: ${path.basename(screenshotPath)}`);
    } else {
      // Normal mode: fail the test with instructions
      const filename = path.basename(screenshotPath);
      throw new Error(
        `Screenshot mismatch: ${filename}\n\n` +
        `The screenshot differs from the expected version.\n\n` +
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
  } else {
    // Screenshot matches expected - test passes
    console.log(`✓ Screenshot matches expected: ${path.basename(screenshotPath)}`);
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
