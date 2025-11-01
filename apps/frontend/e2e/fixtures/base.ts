import { test as base } from '@playwright/test';

/**
 * Extended test fixture with automatic database cleanup
 * Use this instead of importing from @playwright/test directly
 */
export const test = base.extend({
  // Add custom fixtures here if needed
  page: async ({ page }, use) => {
    // Setup: runs before each test

    // Use the page in the test
    await use(page);

    // Teardown: runs after each test
    // Wait a bit for any async operations to complete
    await page.waitForTimeout(100);
  },
});

export { expect } from '@playwright/test';
