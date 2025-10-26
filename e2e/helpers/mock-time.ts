/**
 * Time mocking for E2E tests
 * 
 * This module provides utilities to stabilize timestamps in E2E tests,
 * ensuring screenshots are reproducible across test runs.
 * 
 * The mock replaces the browser's Date.prototype.toLocaleString() method
 * to return a fixed, predictable string regardless of the actual timestamp.
 * 
 * ## Why This Is Needed
 * 
 * E2E tests create game data with real timestamps (e.g., game creation time).
 * When these timestamps are displayed in the UI and captured in screenshots,
 * they would change with each test run, causing screenshot mismatches.
 * 
 * ## How It Works
 * 
 * 1. The mock is applied via page.addInitScript() before page navigation
 * 2. Date.prototype.toLocaleString() is overridden to return "1/1/2024, 12:00:00 PM"
 * 3. All date formatting in the browser produces this fixed string
 * 4. Screenshots remain identical across test runs
 * 
 * ## Usage
 * 
 * ```typescript
 * import { mockDateInBrowser } from './helpers/mock-time';
 * 
 * test.beforeEach(async ({ page }) => {
 *   await mockDateInBrowser(page);
 * });
 * ```
 * 
 * For tests that create additional browser contexts:
 * 
 * ```typescript
 * const context2 = await browser.newContext();
 * const page2 = await context2.newPage();
 * await mockDateInBrowser(page2);
 * ```
 */

import { Page } from '@playwright/test';

/**
 * Mock Date formatting methods in the browser to return consistent output
 * 
 * This function must be called before any page navigation that might
 * display dates. It replaces toLocaleString() to always return the same
 * fixed string, ensuring screenshots are stable.
 * 
 * Note: We only override toLocaleString() because that's the only date
 * formatting method used in the SimCiv UI (see GameLobby.svelte). If the
 * application starts using other formatting methods (toString, toDateString,
 * toTimeString, toISOString), those should be overridden as well.
 * 
 * The locales and options parameters are intentionally ignored to ensure
 * complete stability - we want the exact same string regardless of browser
 * locale settings.
 * 
 * @param page - Playwright Page object
 */
export async function mockDateInBrowser(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Override toLocaleString to return a consistent, fixed string for all dates
    // We intentionally ignore the locales and options parameters to ensure
    // complete stability across different browser locales and settings
    Date.prototype.toLocaleString = function(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string {
      // Return a fixed timestamp string that looks realistic but is always the same
      return '1/1/2024, 12:00:00 PM';
    };
  });
}
