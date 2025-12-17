import { test, expect, Browser } from '@playwright/test';
import { clearDatabase, enableE2ETestMode, resetUuidCounter, triggerManualTick } from '../global-setup';
import { screenshotIfChanged } from '../helpers/screenshot';
import { mockDateInBrowser } from '../helpers/mock-time';
import { expectation } from '../helpers/expectation';
import { createTimer } from '../helpers/timing';
import fs from 'fs';
import path from 'path';

// Clear database before each test to prevent data carryover between retries
test.beforeEach(async ({ page }) => {
  const timer = createTimer();
  await timer.measure('beforeEach: enableE2ETestMode', () => enableE2ETestMode());
  await timer.measure('beforeEach: clearDatabase', () => clearDatabase());
  await timer.measure('beforeEach: resetUuidCounter', () => resetUuidCounter());
  // Mock the Date object to ensure stable timestamps in screenshots
  await timer.measure('beforeEach: mockDateInBrowser', () => mockDateInBrowser(page));
  console.log('[beforeEach timing]');
  timer.printReport();
});

// Helper to register and login a user
async function registerAndLogin(page: any, alias: string, password: string, timer: any): Promise<void> {
  // Navigate to page
  await timer.measure('Navigate to /', () => page.goto('/'));
  
  // Wait for redirect to session GUID URL
  await timer.measure('Wait for URL redirect', () => page.waitForURL(/\/id=[a-f0-9-]+/));

  // Fill registration form
  await timer.measure('Fill alias', () => page.fill('input[id="alias"]', alias));
  await timer.measure('Fill password', () => page.fill('input[id="password"]', password));
  await timer.measure('Fill confirm', () => page.fill('input[id="passwordConfirm"]', password));
  
  // Submit registration
  await timer.measure('Click submit', () => page.locator('form button[type="submit"]').first().click());

  // Wait for registration to complete - authenticated section appears
  await timer.measure('Wait for authenticated section', async () => {
    await expect(page.locator('.authenticated')).toBeVisible({
      timeout: 90000 // 90 seconds for key generation (can be slow in CI)
    });
  });
}

// Register two users in parallel to save time
async function registerTwoUsersParallel(browser: Browser, alias1: string, alias2: string, password: string) {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Mock date in both pages to ensure stable timestamps
  await Promise.all([
    mockDateInBrowser(page1),
    mockDateInBrowser(page2)
  ]);
  
  // Create timers for parallel registration
  const timer1 = createTimer();
  const timer2 = createTimer();
  
  // Start both registrations in parallel
  await Promise.all([
    registerAndLogin(page1, alias1, password, timer1),
    registerAndLogin(page2, alias2, password, timer2)
  ]);
  
  return { context1, context2, page1, page2 };
}

test.describe('001-game-creation-and-lobby', () => {
  test('should complete game creation and lobby workflow', async ({ page, browser }) => {
    test.setTimeout(300000); // 5 minutes - registration + game setup takes time
    const timer = createTimer();
    const screenshotDir = 'e2e/001-game-creation-and-lobby/screenshots';
    const readmeContent: string[] = [];
    
    timer.measureSync('Setup: Initialize README content', () => {
      readmeContent.push('# Test: Game Creation and Lobby\n\n');
      readmeContent.push('## Overview\n\n');
      readmeContent.push('This test verifies the complete game creation and lobby workflow including creating games, joining games, and managing game state. It represents the core multiplayer game setup experience in SimCiv.\n\n');
      readmeContent.push('## Screenshots\n\n');
    });

    // Step 1: Register and authenticate first user
    const alias = 'gameuser';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password, timer);

    // Verify game lobby is visible
    timer.measureSync('Step 1: Add README header', () => {
      readmeContent.push('### 009-game-lobby-authenticated.png\n\n');
      readmeContent.push('![009-game-lobby-authenticated.png](screenshots/009-game-lobby-authenticated.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 1: Verify game lobby header', () =>
      expectation(
        expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible(),
        '- ✓ Game Lobby header is visible\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 1: Verify create button', () =>
      expectation(
        expect(page.locator('button:has-text("Create New Game")')).toBeVisible(),
        '- ✓ Create New Game button is visible\n'
      )
    ));
    
    timer.measureSync('Step 1: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify game lobby layout and styling\n');
      readmeContent.push('- Check button styling and positioning\n');
      readmeContent.push('- Confirm user information is displayed\n\n');
    });
    
    await timer.measure('Step 1: Screenshot - game lobby', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/009-game-lobby-authenticated.png`,
        fullPage: true 
      })
    );

    // Step 2: Open create game form
    await timer.measure('Step 2: Click create game button', () =>
      page.click('button:has-text("Create New Game")')
    );
    
    timer.measureSync('Step 2: Add README header', () => {
      readmeContent.push('### 010-game-create-form.png\n\n');
      readmeContent.push('![010-game-create-form.png](screenshots/010-game-create-form.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 2: Verify form header', () =>
      expectation(
        expect(page.locator('h3:has-text("Create New Game")')).toBeVisible(),
        '- ✓ Create New Game form header is visible\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 2: Verify max players select', () =>
      expectation(
        expect(page.locator('select#maxPlayers')).toBeVisible(),
        '- ✓ Max Players selector is visible\n'
      )
    ));
    
    timer.measureSync('Step 2: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify create game form layout\n');
      readmeContent.push('- Check form field styling\n');
      readmeContent.push('- Confirm select dropdown appearance\n\n');
    });
    
    await timer.measure('Step 2: Screenshot - create form', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/010-game-create-form.png`,
        fullPage: true 
      })
    );

    // Step 3: Create the game
    await timer.measure('Step 3: Select 2 players', () =>
      page.selectOption('select#maxPlayers', '2')
    );
    await timer.measure('Step 3: Click create button', () =>
      page.click('button:has-text("Create Game")')
    );
    await timer.measure('Step 3: Wait for game card', () =>
      page.waitForSelector('.game-card', { timeout: 10000 })
    );
    
    timer.measureSync('Step 3: Add README header', () => {
      readmeContent.push('### 011-game-created.png\n\n');
      readmeContent.push('![011-game-created.png](screenshots/011-game-created.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    const gameCard = page.locator('.game-card').first();
    readmeContent.push(await timer.measure('Step 3: Verify game card visible', () =>
      expectation(
        expect(gameCard).toBeVisible(),
        '- ✓ Game card is visible in lobby\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 3: Verify game state waiting', () =>
      expectation(
        expect(gameCard.locator('.game-state.waiting')).toContainText('Waiting'),
        '- ✓ Game state shows "Waiting" for players\n'
      )
    ));
    
    timer.measureSync('Step 3: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify game card layout and styling\n');
      readmeContent.push('- Check game state badge appearance\n');
      readmeContent.push('- Confirm game information display\n\n');
    });
    
    await timer.measure('Step 3: Screenshot - game created', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/011-game-created.png`,
        fullPage: true 
      })
    );

    // Get game ID for later
    const gameIdText = await timer.measure('Get game ID', () =>
      page.locator('.game-card').first().locator('.game-id').textContent()
    );
    const gameId = timer.measureSync('Extract game ID', () => 
      gameIdText?.replace('Game #', '').trim() || ''
    );

    // Step 4: Show waiting state before second player joins
    timer.measureSync('Step 4: Add README header', () => {
      readmeContent.push('### 012-game-waiting-for-players.png\n\n');
      readmeContent.push('![012-game-waiting-for-players.png](screenshots/012-game-waiting-for-players.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 4: Verify view button', () =>
      expectation(
        expect(gameCard.locator('button:has-text("View")')).toBeVisible(),
        '- ✓ View button is available for creator\n'
      )
    ));
    
    timer.measureSync('Step 4: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify game is in waiting state\n');
      readmeContent.push('- Check available actions for game creator\n\n');
    });
    
    await timer.measure('Step 4: Screenshot - waiting for players', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/012-game-waiting-for-players.png`,
        fullPage: true 
      })
    );

    // Step 5: Create second user and show their view
    await timer.measure('Step 5: Clear cookies', () => page.context().clearCookies());
    const alias2 = 'gameuser2';
    await registerAndLogin(page, alias2, password, timer);
    
    await timer.measure('Step 5: Wait for game lobby', () =>
      expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible()
    );
    
    timer.measureSync('Step 5: Add README header', () => {
      readmeContent.push('### 013-game-second-player-view.png\n\n');
      readmeContent.push('![013-game-second-player-view.png](screenshots/013-game-second-player-view.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    const gameCard2 = page.locator('.game-card').first();
    readmeContent.push(await timer.measure('Step 5: Verify game visible to second player', () =>
      expectation(
        expect(gameCard2).toBeVisible(),
        '- ✓ Game is visible to other players in lobby\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 5: Verify join button', () =>
      expectation(
        expect(gameCard2.locator('button:has-text("Join")')).toBeVisible(),
        '- ✓ Join button is available for second player\n'
      )
    ));
    
    timer.measureSync('Step 5: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify second player can see the game\n');
      readmeContent.push('- Check join button styling and placement\n\n');
    });
    
    await timer.measure('Step 5: Screenshot - second player view', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/013-game-second-player-view.png`,
        fullPage: true 
      })
    );

    // Step 6: Join the game and verify it starts
    await timer.measure('Step 6: Click join button', () =>
      gameCard2.locator('button:has-text("Join")').click()
    );
    
    timer.measureSync('Step 6: Add README header', () => {
      readmeContent.push('### 014-game-started.png\n\n');
      readmeContent.push('![014-game-started.png](screenshots/014-game-started.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 6: Verify game started', () =>
      expectation(
        expect(page.locator('.game-state.started').first()).toBeVisible({ timeout: 5000 }),
        '- ✓ Game state changed to "Started" after second player joined\n'
      )
    ));
    
    timer.measureSync('Step 6: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify game state badge shows "Started"\n');
      readmeContent.push('- Check that game now shows started state styling\n\n');
    });
    
    await timer.measure('Step 6: Screenshot - game started', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/014-game-started.png`,
        fullPage: true 
      })
    );

    // Step 7: Verify time display in started game
    timer.measureSync('Step 7: Add README header', () => {
      readmeContent.push('### 015-game-time-initial.png\n\n');
      readmeContent.push('![015-game-time-initial.png](screenshots/015-game-time-initial.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    const yearValue = page.locator('.value.year').first();
    readmeContent.push(await timer.measure('Step 7: Verify year display', () =>
      expectation(
        expect(yearValue).toBeVisible(),
        '- ✓ Game year is displayed\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 7: Verify initial year', () =>
      expectation(
        expect(yearValue).toContainText('5000 BC'),
        '- ✓ Initial year is 5000 BC\n'
      )
    ));
    
    timer.measureSync('Step 7: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify game time display is visible and readable\n');
      readmeContent.push('- Check time formatting and styling\n\n');
    });
    
    await timer.measure('Step 7: Screenshot - initial time', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/015-game-time-initial.png`,
        fullPage: true 
      })
    );

    // Step 8: Trigger manual tick and verify time progression
    await timer.measure('Step 8: Trigger manual tick', () => triggerManualTick(gameId));
    await timer.measure('Step 8: Wait for UI update', () => page.waitForTimeout(500));
    
    timer.measureSync('Step 8: Add README header', () => {
      readmeContent.push('### 016-game-time-progressed.png\n\n');
      readmeContent.push('![016-game-time-progressed.png](screenshots/016-game-time-progressed.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    readmeContent.push(await timer.measure('Step 8: Verify time progression', () =>
      expectation(
        expect(yearValue).toContainText('4999 BC'),
        '- ✓ Year progressed to 4999 BC after game tick\n'
      )
    ));
    
    timer.measureSync('Step 8: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify time has updated correctly\n');
      readmeContent.push('- Check that year display refreshed\n\n');
    });
    
    await timer.measure('Step 8: Screenshot - time progressed', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/016-game-time-progressed.png`,
        fullPage: true 
      })
    );

    // Step 9: Test full game scenario - create third user who cannot join
    await timer.measure('Step 9: Clear cookies', () => page.context().clearCookies());
    const alias3 = 'gameuser3';
    await registerAndLogin(page, alias3, password, timer);
    
    await timer.measure('Step 9: Wait for game lobby', () =>
      expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible()
    );
    
    timer.measureSync('Step 9: Add README header', () => {
      readmeContent.push('### 017-game-full-no-join.png\n\n');
      readmeContent.push('![017-game-full-no-join.png](screenshots/017-game-full-no-join.png)\n\n');
      readmeContent.push('**Programmatic Verification:**\n\n');
    });
    
    const gameCard3 = page.locator('.game-card').first();
    readmeContent.push(await timer.measure('Step 9: Verify game shows started', () =>
      expectation(
        expect(gameCard3.locator('.game-state.started')).toContainText('Started', { timeout: 5000 }),
        '- ✓ Full game shows "Started" state without join button\n'
      )
    ));
    readmeContent.push(await timer.measure('Step 9: Verify no join button', () =>
      expectation(
        expect(gameCard3.locator('button:has-text("Join")')).not.toBeVisible(),
        '- ✓ Join button is not visible for full games\n'
      )
    ));
    
    timer.measureSync('Step 9: Add manual verification notes', () => {
      readmeContent.push('\n**Manual Visual Verification:**\n\n');
      readmeContent.push('- Verify third player cannot join full game\n');
      readmeContent.push('- Check that started games show correct state\n\n');
    });
    
    await timer.measure('Step 9: Screenshot - full game', () =>
      screenshotIfChanged(page, { 
        path: `${screenshotDir}/017-game-full-no-join.png`,
        fullPage: true 
      })
    );

    // Generate README.md
    timer.measureSync('Cleanup: Write README.md', () => {
      fs.writeFileSync(
        'e2e/001-game-creation-and-lobby/README.md',
        readmeContent.join('')
      );
    });
    
    // Print comprehensive timing report
    console.log('\n📊 TEST TIMING ANALYSIS - should complete game creation and lobby workflow');
    timer.printReport();
  });

  test('should navigate to full-page game view', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes - registration takes time
    const timer = createTimer();
    const screenshotDir = 'e2e/001-game-creation-and-lobby/screenshots';
    
    const alias = 'viewtestuser';
    const password = 'TestPassword123!';
    
    await registerAndLogin(page, alias, password, timer);
    await timer.measure('Wait for game lobby', () =>
      expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible()
    );

    // Create game
    await timer.measure('Click create button', () => page.click('button:has-text("Create New Game")'));
    await timer.measure('Select players', () => page.selectOption('select#maxPlayers', '4'));
    await timer.measure('Click create', () => page.click('button:has-text("Create Game")'));
    await timer.measure('Wait for game card', () => page.waitForSelector('.game-card'));

    // Click view button
    await timer.measure('Click view button', () =>
      page.locator('.game-card').first().locator('button:has-text("View")').click()
    );

    // Verify we're in the full-page game view
    await timer.measure('Verify game view', () =>
      expect(page.locator('.game-view')).toBeVisible({ timeout: 5000 })
    );

    // Navigate back to lobby
    await timer.measure('Click back button', () => page.click('button:has-text("Back to Lobby")'));
    
    // Verify we're back in the lobby
    await timer.measure('Verify back in lobby', () =>
      expect(page.locator('h2:has-text("Game Lobby")')).toBeVisible({ timeout: 5000 })
    );
    await timer.measure('Verify game view hidden', () =>
      expect(page.locator('.game-view')).not.toBeVisible()
    );
    
    console.log('\n📊 TEST TIMING ANALYSIS - should navigate to full-page game view');
    timer.printReport();
  });
});
