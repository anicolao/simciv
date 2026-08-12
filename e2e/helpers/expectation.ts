/**
 * Expectation Helper for E2E Tests
 * 
 * This module provides a tight coupling between programmatic verification
 * and documentation generation. Each expectation performs a Playwright
 * assertion and returns a documentation string describing what was verified.
 * 
 * This ensures that:
 * - Checks and documentation are synchronized
 * - Documentation is only generated if the check passes
 * - Changes to checks automatically update documentation expectations
 */

/**
 * Performs a Playwright expectation and returns documentation string
 * 
 * @param assertion - The Playwright expect() promise
 * @param description - Human-readable description of what was verified
 * @returns The description string for inclusion in README
 * 
 * @example
 * const doc = await expectation(
 *   expect(page.locator('h1')).toContainText('SimCiv Authentication'),
 *   '- ✓ Page title contains "SimCiv Authentication"\n'
 * );
 * readmeContent.push(doc);
 */
export async function expectation<T>(
  assertion: Promise<T>,
  description: string
): Promise<string> {
  await assertion;
  return description;
}
