import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Tests must run serially due to shared server state
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries - tests should pass or fail on first attempt
  workers: 1, // Always use 1 worker for deterministic UUID generation
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "on",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use system chromium to avoid playwright download issues
        // When CHROMIUM_PATH is set, use that path with new headless mode
        ...(process.env.CHROMIUM_PATH
          ? {
              launchOptions: {
                executablePath: process.env.CHROMIUM_PATH,
                args: ["--headless=new"],
              },
            }
          : {
              // Default: use playwright's bundled chromium with headless mode
              headless: true,
            }),
      },
    },
  ],
  // Commenting out webServer - run e2e-setup script manually first
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
