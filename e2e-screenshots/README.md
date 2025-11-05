# E2E Test Screenshots

This directory contains expected screenshots for Playwright E2E test visual regression testing.

## Visual Regression Testing

Screenshots are compared against expected versions during test runs. Tests **fail** if screenshots differ from expectations, requiring manual review and approval before updating.

### How It Works

The screenshot helper (`e2e/helpers/screenshot.ts`) implements visual regression testing:

1. **Takes screenshot** to memory buffer
2. **Compares SHA-256 hash** with expected screenshot
3. **Test passes** if hashes match (identical visual content)
4. **Test fails** if hashes differ (visual change detected)
5. **Creates file** if it doesn't exist (first-time setup)

This ensures that visual changes are:
- Detected immediately
- Reviewed before acceptance
- Intentionally committed as new expectations

## Screenshot Update Workflow

When a test fails due to screenshot mismatch:

### 1. Inspect the Screenshot

```bash
# Run tests to see which screenshots differ
npm run test:e2e

# Test fails with message:
# Screenshot mismatch: 02-registration-form-filled.png
# The screenshot differs from the expected version.
```

### 2. Review the Visual Changes

Open the screenshot file and verify the changes:
- Is the visual change intentional and correct?
- Does it match your expectations for the UI?

### 3A. If Changes Are Correct (Accept New Expectations)

```bash
# Update expected screenshots
UPDATE_SCREENSHOTS=1 npm run test:e2e

# Verify stability - run tests again without update mode
npm run test:e2e

# Should pass with: "✓ Screenshot matches expected"

# Commit the new expectations
git add e2e-screenshots/
git commit -m "Update screenshot expectations for [feature/fix]"
```

### 3B. If Changes Are Incorrect (Reject and Fix)

```bash
# Revert the screenshot changes
git checkout -- e2e-screenshots/02-registration-form-filled.png

# Fix the source of the visual difference in your code

# Run tests again
npm run test:e2e

# Tests should now pass
```

## Screenshot Files

When `npm run test:e2e` is executed, the following screenshots are validated:

### Authentication Flow (auth.spec.ts)
1. `01-initial-load.png` - Initial authentication page load
2. `02-registration-form-filled.png` - Registration form with filled data
3. `03-authenticated.png` - Authenticated user state
4. `04-after-logout.png` - Post-logout state
5. `05-login-attempt-different-session.png` - Login form in different session
6. `06-login-error-no-key.png` - Error message for missing credentials
7. `07-login-form-filled.png` - Login form filled with credentials
8. `08-login-success.png` - Successful login state

### Game Creation and Lobby (game-creation.spec.ts)
9. `09-game-lobby-authenticated.png` - Game lobby after authentication
10. `10-game-create-form.png` - Create game form
11. `11-game-created.png` - Game created successfully
12. `12-game-waiting-for-players.png` - Game waiting for players to join
13. `13-game-second-player-view.png` - Second player's view of the game
14. `14-game-started.png` - Game started with all players
15. `15-game-time-initial.png` - Initial game time display
16. `16-game-time-progressed.png` - Game time after progression
17. `17-game-full-no-join.png` - Full game cannot be joined
18. `18-game-details-modal.png` - Game details modal view

### Map View and Rendering (map-view.spec.ts)
19. `19-map-section-visible.png` - Map section visible in started game
20. `20-map-view-complete.png` - Complete map view with tiles and legend
21. `21-map-starting-city-marker.png` - Starting city marker on map
22. `22-map-with-resources.png` - Map showing resource markers on tiles
23. `23-game-waiting-no-map.png` - Waiting game without map section

### Map Interactions (map-interactions.spec.ts)
24. `24-map-before-pan.png` - Map view before panning
25. `25-map-after-pan-mouse.png` - Map view after mouse drag pan
26. `26-map-before-zoom.png` - Map view before zooming
27. `27-map-zoom-in.png` - Map zoomed in to 150%
28. `28-map-zoom-out.png` - Map zoomed back out to 100%
29. `29-map-zoom-min.png` - Map at minimum zoom (50%)
30. `30-map-zoom-max.png` - Map at maximum zoom (200%)
31. `31-map-pan-zoom-combined.png` - Map with combined pan and zoom operations
32. `32-map-cursor-feedback.png` - Map with grab cursor feedback
33-35. _(Reserved for future use)_
36. `36-initial-settlers-unit.png` - Initial settlers unit at game start
37. _(Reserved for future use)_
38. `38-settlement-created.png` - Settlement created from settlers unit
39. _(Reserved for future use)_
40. `40-canvas-initial-size.png` - Full-screen canvas at initial viewport size (960x720)
41. `41-canvas-resized-small.png` - Canvas resized to smaller viewport (520x600)
42. `42-canvas-resized-large.png` - Canvas resized to larger viewport (1200x1200)

## Purpose

These screenshot expectations serve to:
- **Detect visual regressions** automatically during test runs
- **Validate UI layout correctness** against known-good baselines
- **Require explicit approval** for visual changes before merging
- **Document expected UI states** throughout the application
- **Aid in debugging** when tests fail due to visual changes
- **Provide visual narrative** of user workflows

## Technical Details

### Timestamp Stabilization

To ensure screenshots are 100% reproducible across test runs, timestamps are stabilized using the `mockDateInBrowser()` helper from `e2e/helpers/mock-time.ts`.

**How it works:**
1. Before each test, `Date.prototype.toLocaleString()` is overridden in the browser
2. All date formatting returns the fixed string: `"1/1/2024, 12:00:00 PM"`
3. This ensures screenshots with timestamps (e.g., game creation times) are always identical

**Implementation:**
- Applied in `test.beforeEach()` hooks in all test files
- Also applied to additional browser contexts created during tests
- Only affects date formatting, not actual date values or logic

This approach ensures that screenshots containing timestamps (like `18-game-details-modal.png`) remain stable and don't change between test runs due to different creation times.

### Visual Regression Testing

The tests use `screenshotIfChanged()` from `e2e/helpers/screenshot.ts` which:

1. Takes screenshot to a buffer in memory
2. Calculates SHA-256 hash of the new screenshot
3. Compares with hash of expected screenshot
4. **Fails test if hashes differ** (visual change detected)
5. Passes test if hashes match (no visual change)

### Update Mode

Set `UPDATE_SCREENSHOTS=1` environment variable to update expected screenshots:

```bash
UPDATE_SCREENSHOTS=1 npm run test:e2e
```

In update mode:
- Screenshot differences **update the expected files** instead of failing
- Used after reviewing and approving visual changes
- Should be followed by a normal test run to verify stability

### First-Time Setup

When a screenshot doesn't exist (first test run):
- The screenshot is automatically created
- Logged as "Created expected screenshot"
- No test failure occurs

## Benefits

- **Explicit approval required**: Visual changes must be reviewed before acceptance
- **Clear workflow**: Inspect → approve/reject → commit
- **Prevents regressions**: Unintended visual changes are caught immediately
- **Git-friendly**: Only intentional changes are committed
- **Deterministic**: Same UI state always produces same hash

## Common Scenarios

### Scenario 1: UI Change is Intentional

Developer modifies button styling:
1. Tests fail: "Screenshot mismatch: 02-registration-form-filled.png"
2. Developer reviews screenshot - change looks correct
3. Developer runs: `UPDATE_SCREENSHOTS=1 npm run test:e2e`
4. Tests now pass with updated expectations
5. Developer commits new screenshot expectations

### Scenario 2: UI Change is Unintended

Tests fail unexpectedly:
1. Tests fail: "Screenshot mismatch: 03-authenticated.png"
2. Developer reviews screenshot - unexpected layout shift
3. Developer reverts screenshot: `git checkout -- e2e-screenshots/03-authenticated.png`
4. Developer fixes CSS bug causing layout shift
5. Tests now pass with original expectations

### Scenario 3: New Feature with New Screenshots

Adding new UI:
1. New test with new screenshot path
2. First run creates expected screenshot
3. Developer reviews screenshot to ensure it's correct
4. Runs tests again to verify stability
5. Commits new screenshot expectations with feature

## Note

This directory is initially empty. Screenshots are generated when Playwright tests run successfully.
