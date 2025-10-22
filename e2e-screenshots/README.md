# E2E Test Screenshots

This directory contains screenshots captured during Playwright E2E test execution.

## Screenshot Files

When `npm run test:e2e` is executed, the following screenshots are automatically generated:

1. `01-initial-load.png` - Initial authentication page load
2. `02-registration-form-filled.png` - Registration form with filled data
3. `03-authenticated.png` - Authenticated user state
4. `04-after-logout.png` - Post-logout state
5. `05-login-attempt-different-session.png` - Login form in different session
6. `06-login-error-no-key.png` - Error message for missing credentials
7. `07-login-form-filled.png` - Login form filled with credentials
8. `08-login-success.png` - Successful login state

## Purpose

These screenshots serve to:
- Validate UI layout correctness
- Prevent visual regressions
- Document expected UI states
- Aid in debugging test failures

## Note

This directory is initially empty. Screenshots are generated when Playwright tests run successfully.
