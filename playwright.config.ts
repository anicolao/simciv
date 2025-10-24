import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Let Playwright use its bundled Chromium
      },
    },
  ],
  webServer: {
    command: 'MONGO_URI=mongodb://localhost:27017 DB_NAME=simciv-test npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Server should already be running from e2e-setup
    timeout: 120 * 1000,
  },
});
