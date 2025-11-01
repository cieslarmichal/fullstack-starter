import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  globalSetup: './e2e/globalSetup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000,
    navigationTimeout: 15 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        trace: 'retain-on-failure',
      },
    },
  ],
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      port: 5000,
      reuseExistingServer: !process.env['CI'],
      env: {
        NODE_ENV: 'test',
      },
      timeout: 120 * 1000,
      stdout: 'pipe', // Added: Capture server output for debugging
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env['CI'],
      timeout: 120 * 1000,
      stdout: 'pipe', // Added: Capture server output for debugging
      stderr: 'pipe',
    },
  ],
});
