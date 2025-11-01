import { test, expect } from '@playwright/test';
import { LoginPageModel } from '../pages/LoginPageModel.ts';
import { RegisterPageModel } from '../pages/RegisterPageModel.ts';
import { generateUniqueEmail } from '../fixtures/testData.js';

test.describe('Authentication Flow', () => {
  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const registerPage = new RegisterPageModel(page);

      await registerPage.goto();

      const uniqueEmail = generateUniqueEmail();
      await registerPage.register(uniqueEmail, 'TestPassword123!');

      // Should show back to sign in page button
      await expect(registerPage.backToSignInButton).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      const registerPage = new RegisterPageModel(page);

      await registerPage.goto();

      await registerPage.emailInput.fill('invalid-email');
      await registerPage.passwordInput.fill('TestPassword123!');
      await registerPage.repeatPasswordInput.fill('TestPassword123!');

      // Trigger validation by blurring the email field
      await registerPage.emailInput.blur();

      // Should display validation error for invalid email format
      await expect(registerPage.errorMessage).toBeVisible();
      await expect(registerPage.errorMessage).toContainText(/invalid email/i);
    });

    test('should show error for weak password', async ({ page }) => {
      const registerPage = new RegisterPageModel(page);

      await registerPage.goto();

      const uniqueEmail = generateUniqueEmail();
      await registerPage.emailInput.fill(uniqueEmail);
      await registerPage.passwordInput.fill('weak');

      // Trigger validation by blurring the password field
      await registerPage.passwordInput.blur();

      // Should display validation error for weak password
      await expect(registerPage.errorMessage).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
      const registerPage = new RegisterPageModel(page);

      await registerPage.goto();

      const uniqueEmail = generateUniqueEmail();
      await registerPage.emailInput.fill(uniqueEmail);
      await registerPage.passwordInput.fill('TestPassword123!');
      await registerPage.repeatPasswordInput.fill('DifferentPassword123!');

      // Trigger validation by blurring the repeat password field
      await registerPage.repeatPasswordInput.blur();

      // Should display validation error for password mismatch
      await expect(registerPage.errorMessage).toBeVisible();
      await expect(registerPage.errorMessage).toContainText(/passwords must match/i);
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPageModel(page);

      // First, register a user
      const registerPage = new RegisterPageModel(page);
      await registerPage.goto();

      const uniqueEmail = generateUniqueEmail();
      const password = 'TestPassword123!';

      await registerPage.register(uniqueEmail, password);

      // Wait for success message and click back to sign in
      await expect(registerPage.backToSignInButton).toBeVisible({ timeout: 10000 });
      await registerPage.backToSignInButton.click();

      // Wait for navigation to login tab with longer timeout for CI
      await page.waitForURL(/\/login(\?tab=login)?$/, { timeout: 15000 });

      // Wait for page to be stable
      await page.waitForLoadState('networkidle');

      // Now try to login
      await loginPage.login(uniqueEmail, password);

      // Should redirect to home page after successful login
      await page.waitForURL('/', { timeout: 15000 });
      await expect(page).toHaveURL('/');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPageModel(page);

      await loginPage.goto();
      await loginPage.login('nonexistent@example.com', 'WrongPassword123!');

      // Should display form-level error message from backend
      await expect(loginPage.formErrorMessage).toBeVisible();
    });

    test('should navigate to registration tab', async ({ page }) => {
      const loginPage = new LoginPageModel(page);

      await loginPage.goto();
      await loginPage.clickRegisterTab();

      // Should navigate to register tab
      await expect(page).toHaveURL(/\/login\?tab=register/);
    });
  });
});
