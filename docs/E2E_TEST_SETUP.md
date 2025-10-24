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

**Solution**: The project is configured to use Playwright's built-in `channel: 'chrome'` feature, which automatically uses the system-installed Chrome or Chromium browser instead of downloading Playwright's bundled browser.

### How It Works

1. **Playwright Configuration**: The `playwright.config.ts` file specifies `channel: 'chrome'`, which tells Playwright to use the system-installed Chrome/Chromium browser.

2. **Automatic Browser Detection**: Playwright automatically finds Chrome/Chromium at standard system locations:
   - Linux: `/usr/bin/google-chrome`, `/usr/bin/chromium-browser`, `/usr/bin/chromium`
   - macOS: `/Applications/Google Chrome.app`
   - Windows: Standard Chrome installation paths

3. **Skip Downloads**: The `.envrc` and `.env.example` files set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to prevent automatic browser downloads during `npm install`.

4. **Simple Configuration**: No environment variables or manual configuration needed - it just works!

## Manual Setup

If you don't have Chrome or Chromium installed:

### Ubuntu/Debian
```bash
sudo apt-get install chromium-browser
# or
sudo apt-get install google-chrome-stable
```

### macOS
```bash
brew install --cask google-chrome
```

### Windows
Download and install from: https://www.google.com/chrome/

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

This means Chrome/Chromium is not installed. Install it using the instructions in the Manual Setup section above.

### System Chrome/Chromium version incompatibility

The system Chrome/Chromium should be reasonably recent (version 90+). Check version:
```bash
google-chrome --version
# or
chromium-browser --version
```

If your system browser is too old:
1. Update your system packages
2. Install a newer version manually

## Alternative: Using Playwright's Bundled Browsers

If the Playwright download issue gets fixed upstream, you can switch back to bundled browsers by:

1. Remove `channel: 'chrome'` from `playwright.config.ts`
2. Remove `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` from `.envrc` and `.env.example`
3. Run `npx playwright install chromium`

However, using system browsers is actually a best practice for E2E testing as it tests against real-world browser installations.

## System Requirements

- **MongoDB**: Must be running on localhost:27017 (managed by `bin/mongo` script)
- **Node.js**: Version specified in project requirements
- **Chrome/Chromium**: Any recent version (90+)
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
