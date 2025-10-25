import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(c => c.newPage());
  
  // Just navigate and screenshot
  await page.goto('http://localhost:3000/');
  await page.waitForURL(/\/id=/);
  await page.screenshot({ path: 'e2e-screenshots/simple-home.png', fullPage: true });
  console.log('Home page screenshot saved');
  
  await browser.close();
})();
