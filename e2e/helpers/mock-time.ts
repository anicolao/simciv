/**
 * Time mocking for E2E tests
 * 
 * This module provides utilities to stabilize timestamps in E2E tests,
 * ensuring screenshots are reproducible across test runs.
 * 
 * The mock replaces the browser's Date.prototype.toLocaleString() method
 * to return a fixed, predictable string regardless of the actual timestamp.
 */

import { Page } from '@playwright/test';

/**
 * Mock Date formatting methods in the browser to return consistent output
 * 
 * This function must be called before any page navigation that might
 * display dates. It replaces toLocaleString() to always return the same
 * fixed string, ensuring screenshots are stable.
 * 
 * @param page - Playwright Page object
 */
export async function mockDateInBrowser(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Override toLocaleString to return a consistent, fixed string for all dates
    Date.prototype.toLocaleString = function(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string {
      // Return a fixed timestamp string that looks realistic but is always the same
      return '1/1/2024, 12:00:00 PM';
    };
  });
}
