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

**Workaround**: The project is configured to use the system-installed Chromium browser instead of downloading Playwright's bundled version.

### How It Works

1. **Automatic Detection**: The `bin/e2e-setup` script automatically detects if Chromium is installed at common locations:
   - `/usr/bin/chromium-browser`
   - `/usr/bin/chromium`
   - `/usr/bin/google-chrome`

2. **Environment Variable**: If a system browser is found, the `CHROMIUM_PATH` environment variable is set to its path.

3. **Playwright Configuration**: The `playwright.config.ts` file checks for the `CHROMIUM_PATH` environment variable:
   - If set: Uses the system browser with `launchOptions.executablePath` and `--headless=new` flag
   - If not set: Falls back to attempting to use Playwright's bundled Chromium (which may fail with the download issue)

4. **npm Script**: The `test:e2e` script in `package.json` automatically detects and sets `CHROMIUM_PATH` if a system browser is available.

## Manual Setup

If you prefer to manually configure the environment:

1. Find your Chromium installation:
   ```bash
   which chromium-browser
   # or
   which chromium
   # or
   which google-chrome
   ```

2. Set the environment variable:
   ```bash
   export CHROMIUM_PATH=/path/to/your/chromium
   ```

3. Run tests:
   ```bash
   npm run test:e2e
   ```

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

### Tests fail with "Executable doesn't exist"

Make sure `CHROMIUM_PATH` is set correctly:
```bash
echo $CHROMIUM_PATH
# Should print the path to chromium

# Test it works:
$CHROMIUM_PATH --version
```

### System Chromium version incompatibility

The system Chromium should be reasonably recent (version 90+). Check version:
```bash
chromium-browser --version
```

If your system Chromium is too old, you may need to:
1. Update your system packages
2. Install a newer version manually
3. Try to fix the Playwright download issue (see below)

## Attempting to Fix the Playwright Download Issue

If you want to try to use Playwright's bundled browsers instead of system Chromium:

1. The issue appears to be related to how Playwright handles HTTP redirects in its download code
2. The CDN redirect (307) has `Content-Length: 0` but the final response has the correct size
3. Potential fixes (would require changes to `node_modules/playwright-core/lib/server/registry/oopDownloadBrowserMain.js`):
   - Follow redirects and read content-length from final response
   - Use a different HTTP client that handles redirects properly
   - Skip content-length validation if it's 0

For now, using system Chromium is the recommended approach.

## System Requirements

- **MongoDB**: Must be running on localhost:27017 (managed by `bin/mongo` script)
- **Node.js**: Version specified in project requirements
- **Chromium/Chrome**: Version 90+ recommended
- **Server**: Must be running on localhost:3000

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
