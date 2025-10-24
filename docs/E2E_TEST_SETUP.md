# E2E Test Setup Guide

## Overview

This document describes how to set up and run end-to-end (e2e) tests for SimCiv using Playwright.

## Quick Start

1. Run the e2e-setup script:
   ```bash
   bash bin/e2e-setup
   ```

2. Run the tests:
   ```bash
   npm run test:e2e
   ```

## Known Issues and Workarounds

### Playwright Browser Download Issue

**Problem**: When running `npx playwright install chromium`, the download fails with a size mismatch error:
```
Error: Download failed: size mismatch, file size: 182333649, expected size: 0
```

**Root Cause**: The Playwright CDN (cdn.playwright.dev) returns a 307 redirect with `Content-Length: 0` in the redirect response. Playwright's download code reads this header value instead of the final response's content-length (182333649 bytes), causing the validation to fail even though the download completed successfully.

**Solution**: The project applies automatic patches to Playwright's download code to fix the issues. These patches are applied during `npm install` via a postinstall script.

### How It Works

The fix involves two patches applied automatically after `npm install`:

1. **Progress Bar Fix** (`browserFetcher.js`): 
   - Handles the case where `totalBytes` is 0 (from redirect with Content-Length: 0)
   - Prevents the "Invalid count value: Infinity" crash
   - Shows simple "Downloading..." message instead of percentage

2. **Size Validation Fix** (`oopDownloadBrowserMain.js`):
   - Skips size validation when `totalBytes` is 0
   - Allows the download to complete successfully
   - The file downloads correctly despite the incorrect Content-Length header

3. **Automatic Application**:
   - Patches are applied via `scripts/patch-playwright.js`
   - Runs automatically during `npm install` (postinstall script)
   - Idempotent - safe to run multiple times

For full technical details, see `docs/PLAYWRIGHT_DOWNLOAD_FIX.md`.

## Manual Patch Application

If you need to reapply the patches manually (e.g., after reinstalling node_modules):

```bash
node scripts/patch-playwright.js
```

This will apply both patches to Playwright's download code.

## Running Specific Tests

Run a single test file:
```bash
npx playwright test e2e/auth.spec.ts
```

Run tests in UI mode (for debugging):
```bash
npx playwright test --ui
```

Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

## Troubleshooting

### Tests fail with "browserType.launch: Executable doesn't exist"

This means Playwright browsers are not installed. Run:
```bash
npx playwright install chromium
```

### Download still fails after patches

If browser downloads still fail:
1. Check that patches were applied: `node scripts/patch-playwright.js`
2. Verify node_modules exists and is complete
3. Try removing node_modules and reinstalling: `rm -rf node_modules && npm install`

## Understanding the Fix

The patches make two simple changes to Playwright's code:

1. **When displaying download progress**, check if `totalBytes` is 0 and show a simple message instead of calculating percentages
2. **When validating download size**, skip validation if `totalBytes` is 0 since the download actually completed

These are defensive patches that don't change Playwright's normal behavior - they only handle the edge case of CDN redirects with incorrect Content-Length headers.

For complete technical details, see `docs/PLAYWRIGHT_DOWNLOAD_FIX.md`.

## System Requirements

- **MongoDB**: Must be running on localhost:27017 (managed by `bin/mongo` script)
- **Node.js**: Version specified in project requirements
- **Server**: Must be running on localhost:3000
- **No system browser required**: Playwright downloads and uses its own bundled Chromium

## E2E Test Architecture

The e2e tests verify the complete user workflow:

1. **Authentication Tests** (`e2e/auth.spec.ts`):
   - User registration with keypair generation
   - Login/logout flows
   - Security isolation between users

2. **Game Creation Tests** (`e2e/game-creation.spec.ts`):
   - Creating new games
   - Joining games
   - Game state management

3. **Map View Tests** (`e2e/map-view.spec.ts`):
   - Map generation and display
   - Interactive map features

All tests use the actual UI and API, ensuring end-to-end functionality works as expected.
