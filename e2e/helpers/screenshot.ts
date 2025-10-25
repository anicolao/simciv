/**
 * Screenshot Helper for E2E Tests
 * 
 * This module provides utilities to avoid unnecessary screenshot writes
 * when the visual content hasn't changed. This prevents git from detecting
 * screenshots as modified when they are actually identical.
 */

import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
 * Take a screenshot only if it differs from the existing file
 * 
 * This function:
 * 1. Takes a screenshot to a temporary location
 * 2. Compares its hash with the existing file's hash
 * 3. Only overwrites if the hashes differ
 * 4. Returns true if the file was updated, false if it was identical
 * 
 * @param page - Playwright Page object
 * @param screenshotPath - Path where screenshot should be saved
 * @param options - Playwright screenshot options
 * @returns Promise<boolean> - true if file was written, false if skipped (identical)
 */
export async function takeScreenshotIfChanged(
  page: Page,
  screenshotPath: string,
  options?: Parameters<Page['screenshot']>[0]
): Promise<boolean> {
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

  // Only write if the file doesn't exist or hashes differ
  if (existingHash === null || existingHash !== newHash) {
    fs.writeFileSync(screenshotPath, screenshotBuffer);
    if (existingHash === null) {
      console.log(`📸 Created new screenshot: ${path.basename(screenshotPath)}`);
    } else {
      console.log(`📸 Updated screenshot: ${path.basename(screenshotPath)} (content changed)`);
    }
    return true;
  } else {
    console.log(`✓ Skipped screenshot: ${path.basename(screenshotPath)} (identical to existing)`);
    return false;
  }
}

/**
 * Convenience wrapper for page.screenshot that avoids unnecessary writes
 * 
 * Usage (drop-in replacement):
 *   await screenshotIfChanged(page, { path: 'e2e-screenshots/01-test.png', fullPage: true });
 * 
 * @param page - Playwright Page object  
 * @param options - Playwright screenshot options (must include 'path')
 * @returns Promise<boolean> - true if file was written, false if skipped
 */
export async function screenshotIfChanged(
  page: Page,
  options: Parameters<Page['screenshot']>[0] & { path: string }
): Promise<boolean> {
  const { path: screenshotPath, ...screenshotOptions } = options;
  return takeScreenshotIfChanged(page, screenshotPath, screenshotOptions);
}
