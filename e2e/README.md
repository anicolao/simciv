# End-to-End Testing with Playwright

## Overview

This directory contains Playwright E2E tests that validate the complete authentication workflow including UI interactions and visual layout.

## Test Coverage

### 1. User Registration and Login Flow (`auth.spec.ts`)
- **Initial Load**: Validates authentication page loads correctly
- **Registration**: Tests user registration with cryptographic key generation
- **Authentication State**: Verifies authenticated user display
- **Logout**: Tests logout functionality

### 2. Cross-User Isolation
- **Different Sessions**: Verifies users in different sessions have different GUIDs
- **Credential Isolation**: Confirms one user cannot access another's account
- **Error Messages**: Validates appropriate error messages for unauthorized access

### 3. Login After Logout
- **Persistent Keys**: Tests that keys persist in local storage
- **Re-authentication**: Validates user can login again with same credentials
- **Session Restoration**: Confirms session GUID is maintained

## Screenshot Validation

Tests capture screenshots at key UI states in the `e2e-screenshots/` directory using a smart helper that **only writes files when content changes**:

1. `01-initial-load.png` - Initial authentication page
2. `02-registration-form-filled.png` - Registration form with data
3. `03-authenticated.png` - Authenticated user state
4. `04-after-logout.png` - Post-logout state
5. `05-login-attempt-different-session.png` - Login form in different session
6. `06-login-error-no-key.png` - Error message for missing credentials
7. `07-login-form-filled.png` - Login form filled with credentials
8. `08-login-success.png` - Successful login state

The screenshot helper (`e2e/helpers/screenshot.ts`) compares SHA-256 hashes before writing, ensuring that **identical screenshots don't appear as modified in git**. This prevents false positives when tests are re-run without visual changes.

**These screenshots should be reviewed after each test run to ensure:**
- UI layout is correct
- No visual regressions
- Error messages display properly
- Authentication states are clearly indicated

## Running the Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Build the client:
```bash
npm run build:client
```

4. Start MongoDB:
```bash
docker run -d --name test-mongo -p 27017:27017 mongo:7.0
```

### Run E2E Tests

```bash
# Run all E2E tests (starts dev server automatically)
npm run test:e2e

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode to see the browser
npx playwright test --headed
```

### View Test Results

```bash
# View HTML report
npx playwright show-report

# View trace for a failed test
npx playwright show-trace test-results/<trace-file>.zip
```

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./e2e`
- **Screenshots**: Captured on failure and at key workflow points
- **Auto Server**: Automatically starts/stops dev server
- **Browser**: Chromium (Desktop Chrome)

## Test Requirements

As per `.github/copilot-instructions.md`:

- ✅ All E2E tests must pass before PR completion
- ✅ Screenshots must be captured at key UI states
- ✅ Screenshots must be reviewed for visual correctness
- ✅ No skipped or failing tests are acceptable
- ✅ Tests must validate both functionality and UI layout

## Troubleshooting

### Browser Not Installed
```bash
npx playwright install chromium
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues
```bash
# Restart MongoDB container
docker restart test-mongo
```

### Screenshots Not Generated
- Check `e2e-screenshots/` directory exists
- Verify test is reaching screenshot lines (no early failures)
- Check disk space availability

## Adding New Tests

When adding new E2E tests:

1. Follow existing test structure
2. Add screenshot captures at key states
3. Use descriptive screenshot filenames
4. Document expected behavior
5. Test both success and failure paths
6. Update this README with new test scenarios
