/**
 * Time mocking for E2E tests
 * 
 * This module provides utilities to stabilize timestamps in E2E tests,
 * ensuring screenshots are reproducible across test runs.
 * 
 * The mock replaces the browser's Date object with a fixed timestamp,
 * so all date operations return consistent values.
 */

import { Page } from '@playwright/test';

// Fixed timestamp for all tests: January 1, 2024 12:00:00 UTC
// This is used to ensure consistent timestamps in screenshots
export const FIXED_TIMESTAMP = new Date('2024-01-01T12:00:00.000Z').getTime();

/**
 * Mock the Date object in the browser to return a fixed timestamp
 * 
 * This function must be called before any page navigation that might
 * create timestamps. It replaces the global Date constructor with a
 * version that always returns the fixed timestamp.
 * 
 * @param page - Playwright Page object
 */
export async function mockDateInBrowser(page: Page): Promise<void> {
  await page.addInitScript((fixedTimestamp: number) => {
    // Save the original Date for when we need real dates
    const OriginalDate = Date;
    
    // Create a mock Date class
    class MockDate extends OriginalDate {
      constructor(...args: any[]) {
        // If called with no arguments, use fixed timestamp
        if (args.length === 0) {
          super(fixedTimestamp);
        } else {
          // If called with arguments, use them (for parsing dates from server)
          super(...args);
        }
      }
      
      // Override static now() method
      static now(): number {
        return fixedTimestamp;
      }
    }
    
    // Copy all static methods from original Date
    Object.setPrototypeOf(MockDate, OriginalDate);
    MockDate.prototype = OriginalDate.prototype;
    
    // Replace global Date with our mock
    (window as any).Date = MockDate;
  }, FIXED_TIMESTAMP);
}
