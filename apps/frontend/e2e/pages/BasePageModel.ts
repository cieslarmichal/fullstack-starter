import type { Page, Locator } from '@playwright/test';

export class BasePageModel {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForURL(path: string | RegExp): Promise<void> {
    await this.page.waitForURL(path);
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async clickAndWaitForNavigation(locator: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation(), locator.click()]);
  }

  async fillField(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async waitForVisible(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
  }

  async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }
}
