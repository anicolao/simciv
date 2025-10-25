import { chromium } from '@playwright/test';

(async () => {
  console.log('Starting manual map verification test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
  const page = await context.newPage();
  
  try {
    console.log('1. Loading home page...');
    await page.goto('http://localhost:3000/');
    await page.waitForURL(/\/id=/);
    console.log('✓ Page loaded');
    
    const timestamp = Date.now();
    const user1 = `maptest1_${timestamp}`;
    const user2 = `maptest2_${timestamp}`;
    const password = 'TestPass123!';
    
    console.log('2. Registering first user:', user1);
    await page.fill('input[id="alias"]', user1);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="passwordConfirm"]', password);
    await page.locator('form button[type="submit"]').first().click();
    await page.locator('.message.success').waitFor({ timeout: 90000 });
    console.log('✓ User 1 registered');
    
    console.log('3. Creating a 2-player game...');
    await page.click('button:has-text("Create New Game")');
    await page.selectOption('select#maxPlayers', '2');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('.game-card', { timeout: 10000 });
    const gameIdText = await page.locator('.game-card').first().locator('.game-id').textContent();
    const gameId = gameIdText?.replace('Game #', '').trim();
    console.log('✓ Game created:', gameId);
    
    console.log('4. Opening second user session...');
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
    const page2 = await context2.newPage();
    await page2.goto('http://localhost:3000/');
    await page2.waitForURL(/\/id=/);
    
    console.log('5. Registering second user:', user2);
    await page2.fill('input[id="alias"]', user2);
    await page2.fill('input[id="password"]', password);
    await page2.fill('input[id="passwordConfirm"]', password);
    await page2.locator('form button[type="submit"]').first().click();
    await page2.locator('.message.success').waitFor({ timeout: 90000 });
    console.log('✓ User 2 registered');
    
    console.log('6. User 2 joining game...');
    const gameCard = page2.locator('.game-card').filter({ hasText: `Game #${gameId}` });
    await gameCard.waitFor({ timeout: 10000 });
    await gameCard.locator('button:has-text("Join")').click();
    console.log('✓ User 2 joined');
    
    console.log('7. Waiting for game to start...');
    await gameCard.locator('.game-state.started').waitFor({ timeout: 30000 });
    console.log('✓ Game started');
    
    console.log('8. Waiting for map generation (15 seconds)...');
    await page2.waitForTimeout(15000);
    
    console.log('9. Opening game details modal...');
    // Force click the View button
    await page2.evaluate((gid) => {
      const cards = document.querySelectorAll('.game-card');
      for (const card of cards) {
        if (card.textContent.includes(`Game #${gid}`)) {
          const viewBtn = card.querySelector('button.view-btn');
          if (viewBtn) viewBtn.click();
          break;
        }
      }
    }, gameId);
    await page2.waitForTimeout(3000);
    
    await page2.screenshot({ path: 'e2e-screenshots/proof-01-game-modal.png', fullPage: true });
    console.log('✓ Screenshot saved: proof-01-game-modal.png');
    
    const bodyText = await page2.locator('body').textContent();
    console.log('10. Checking page content:');
    console.log('    "Game Map" found:', bodyText?.includes('Game Map'));
    console.log('    "Loading map" found:', bodyText?.includes('Loading map'));
    console.log('    ".map-canvas" exists:', await page2.locator('.map-canvas').count() > 0);
    console.log('    ".map-section" exists:', await page2.locator('.map-section').count() > 0);
    
    console.log('\n✅ Manual test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'e2e-screenshots/proof-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
