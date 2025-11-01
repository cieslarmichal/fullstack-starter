import type { Page } from '@playwright/test';
import { BasePageModel } from './BasePageModel.ts';

export class LoginPageModel extends BasePageModel {
  override readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get passwordInput() {
    return this.page.getByLabel('Password', { exact: true });
  }

  get loginButton() {
    return this.page.getByTestId('login-submit-button');
  }

  get registerTab() {
    return this.page.getByTestId('register-tab-button');
  }

  get fieldErrorMessage() {
    return this.page.locator('[data-slot="form-message"]').first();
  }

  get formErrorMessage() {
    return this.page.locator('div.text-destructive.text-sm').filter({ hasText: /invalid email|password/i });
  }

  get errorMessage() {
    return this.formErrorMessage;
  }

  override async goto(): Promise<void> {
    await super.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.loginButton.click();
  }

  async clickRegisterTab(): Promise<void> {
    await this.registerTab.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.getTextContent(this.errorMessage);
  }

  async hasErrorMessage(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}
