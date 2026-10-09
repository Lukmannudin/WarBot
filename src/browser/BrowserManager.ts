import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async launch(): Promise<Page> {
    if (this.browser !== null) {
      throw new Error("Browser is already running");
    }

    this.browser = await chromium.launch({
      headless: false,
    });

    try {
      this.context = await this.browser.newContext({
        viewport: {
          width: 1440,
          height: 900,
        },
      });

      this.page = await this.context.newPage();

      return this.page;
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  async close(): Promise<void> {
    const browser = this.browser;

    this.browser = null;
    this.context = null;
    this.page = null;

    if (browser !== null) {
      await browser.close();
    }
  }
}