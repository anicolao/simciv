# E2E Test Screenshots

This directory contains screenshots captured during Playwright E2E test execution.

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
22. `22-map-resource-markers.png` - Resource markers on map tiles
23. `23-game-waiting-no-map.png` - Waiting game without map section

## Purpose

These screenshots serve to:
- Validate UI layout correctness
- Prevent visual regressions when UI changes are made
- Document expected UI states throughout the application
- Aid in debugging test failures
- Provide visual narrative of user workflows

## Note

This directory is initially empty. Screenshots are generated when Playwright tests run successfully.
