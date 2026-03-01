import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ActOne Studio E2E tests.
 *
 * Launches the SvelteKit dev server and runs tests against it.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:54530',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:54530',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    cwd: '../..',
  },
});
