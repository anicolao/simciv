# E2E Test Screenshots

This directory contains screenshots captured during Playwright E2E test execution.

## How Screenshots Are Managed

Screenshots are automatically captured during test runs using a smart helper function that **only writes files when content has changed**. This prevents unnecessary git modifications when screenshots are identical.

The helper function (`e2e/helpers/screenshot.ts`) compares SHA-256 hashes of new and existing screenshots before writing files. If the content is identical, the file is not modified, avoiding false positives in git status.

## Screenshot Files

When `npm run test:e2e` is executed, the following screenshots are automatically generated:

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

## Purpose

These screenshots serve to:
- Validate UI layout correctness
- Prevent visual regressions when UI changes are made
- Document expected UI states throughout the application
- Aid in debugging test failures
- Provide visual narrative of user workflows

## Technical Details

### Smart Screenshot Helper

The tests use `screenshotIfChanged()` from `e2e/helpers/screenshot.ts` which:
1. Takes screenshot to a buffer in memory
2. Calculates SHA-256 hash of the new screenshot
3. Compares with hash of existing file (if it exists)
4. Only writes to disk if content differs
5. Logs whether screenshot was created, updated, or skipped

This approach ensures that:
- **Identical screenshots don't trigger git changes** (no timestamp/metadata differences)
- **Visual changes are still detected** (hash comparison catches any pixel differences)
- **Test runs are deterministic** (same visual state = same file)

### Benefits

- **Cleaner git history**: Only commits actual visual changes
- **Faster reviews**: Changed screenshots indicate real UI modifications
- **CI/CD friendly**: Tests don't generate spurious file modifications
- **Developer experience**: No need to manually check if screenshots actually changed

## Note

This directory is initially empty. Screenshots are generated when Playwright tests run successfully.
