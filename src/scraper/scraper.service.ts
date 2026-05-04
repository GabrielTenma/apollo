import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import {
  ScrapeOptions,
  ScrapeResult,
  ExtractConfig,
  ElementSelector,
} from './interfaces/scraper.interface';

/**
 * Advanced Playwright scraper service for web scraping operations.
 * Provides methods for single page scraping, multiple page scraping,
 * structured data extraction, and more.
 */
@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private browser: Browser | null = null;

  /**
   * Initializes and returns a Playwright browser instance
   * @param headless - Whether to run in headless mode (default: true)
   * @returns Browser instance
   */
  private async getBrowser(headless = true): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless, args: ['--disable-gpu', '--disable-dev-shm-usage'] });
    }
    return this.browser;
  }

  /**
   * Creates a new browser context with optional configurations
   * @param browser - Browser instance
   * @param options - Scrape options for context configuration
   * @returns Browser context
   */
  private async createContext(
    browser: Browser,
    options: ScrapeOptions,
  ): Promise<BrowserContext> {
    const context = await browser.newContext({
      userAgent: options.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      extraHTTPHeaders: options.headers,
      bypassCSP: options.bypassCSP || false
    });

    // Set cookies if provided
    if (options.cookies && options.cookies.length > 0) {
      await context.addCookies(options.cookies);
    }

    await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    return context;
  }

  /**
   * Scrapes a single webpage with advanced options
   * @param options - Scrape configuration options
   * @returns Scrape result with extracted data
   */
  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    const startTime = Date.now();
    const browser = await this.getBrowser();
    const context = await this.createContext(browser, options);
    const page = await context.newPage();

    try {
      this.logger.log(`Scraping: ${options.url}`);

      // Perform default popup close
      if (options.handlePopupClose) {
        await page.addLocatorHandler(
          page.getByRole('button', { name: 'Close' }), // Locator popup
          async () => {
            await page.getByRole('button', { name: 'Close' }).click();
          }
        );
      }

      // Navigate to the page
      await page.goto(options.url, {
        waitUntil: 'domcontentloaded',
        timeout: options.timeout || 30000,
      });

      // Add style hide popup
      if (options.addStyleHidePopup) {
        await page.addStyleTag({ content: '#popup-id { display: none !important; }' });
      }

      // Perform click
      if (options.pageLocatorPerformClick) {
        await page.locator(options.pageLocatorPerformClick).click();
      }

      // Perform click by coordinate
      if (options.pageLocatorPerformClickCoordinate) {
        await page.waitForTimeout(3000);
        await page.mouse.click(
          options.pageLocatorPerformClickCoordinate.x,
          options.pageLocatorPerformClickCoordinate.y,
          { button: "left", clickCount: 1, delay: 0 });
      }

      // Custom page evaluate
      if (options.addPageEvaluate) {
        await Promise.all(options.addPageEvaluate.map(async (value) => {
          await page.evaluate(value)
        }))
      }

      // Perform auto scroll
      if (options.pageLocatorPerformAutoScroll) {
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
              let scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if (totalHeight >= scrollHeight) {
                clearInterval(timer);
                resolve();
              }

            }, 100);
          })
        })
      }

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.locator(options.waitForSelector);
      }

      // Extract basic page information
      const title = await page.title();
      const content = await page.content();

      const result: ScrapeResult = {
        url: options.url,
        title,
        content,
        data: {},
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };

      // Take screenshot if requested
      if (options.screenshot) {
        const screenshotPath =
          options.screenshotPath || `screenshot-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;
      }

      await context.close();
      this.logger.log(`Successfully scraped: ${options.url}`);

      return result;
    } catch (error) {
      await context.close();
      this.logger.error(`Failed to scrape: ${options.url}`, error);
      throw error;
    }
  }

  /**
   * Extracts structured data from a page based on configuration
   * @param page - Playwright Page object
   * @param config - Extraction configuration
   * @returns Extracted structured data
   */
  async extractStructuredData(
    page: Page,
    config: ExtractConfig,
  ): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    // Extract title
    if (config.title) {
      data.title = await page.textContent(config.title);
    }

    // Extract description
    if (config.description) {
      data.description = await page.textContent(config.description);
    }

    // Extract image
    if (config.image) {
      data.image = await page.getAttribute(config.image, 'src');
    }

    // Extract links
    if (config.links) {
      const links = await page.$$eval(
        config.links.selector,
        (elements, attr) => elements.map((el) => el.getAttribute(attr || 'href')),
        config.links.attribute || 'href',
      );
      data.links = links.filter((link): link is string => link !== null);
    }

    // Extract custom data
    if (config.custom) {
      for (const [key, selector] of Object.entries(config.custom)) {
        data[key] = await this.extractElementData(page, selector);
      }
    }

    return data;
  }

  /**
   * Extracts data from a single element based on selector configuration
   * @param page - Playwright Page object
   * @param selector - Element selector configuration
   * @returns Extracted element data
   */
  private async extractElementData(
    page: Page,
    selector: ElementSelector,
  ): Promise<unknown> {
    if (selector.multiple) {
      // Extract multiple elements
      const elements = await page.$$(selector.selector);
      const results: unknown[] = [];

      for (const element of elements) {
        if (selector.attribute) {
          const attr = await element.getAttribute(selector.attribute);
          if (attr !== null) results.push(attr);
        } else if (selector.textContent) {
          const text = await element.textContent();
          if (text !== null) results.push(text.trim());
        } else {
          const text = await element.textContent();
          if (text !== null) results.push(text.trim());
        }
      }

      return results;
    } else {
      // Extract single element
      const element = await page.$(selector.selector);
      if (!element) return null;

      if (selector.attribute) {
        return await element.getAttribute(selector.attribute);
      } else if (selector.textContent) {
        const text = await element.textContent();
        return text?.trim() || null;
      } else {
        const text = await element.textContent();
        return text?.trim() || null;
      }
    }
  }

  /**
   * Scrapes multiple pages concurrently
   * @param urls - Array of URLs to scrape
   * @param options - Common scrape options (can be overridden per URL)
   * @param concurrency - Number of concurrent scrapes (default: 3)
   * @returns Array of scrape results
   */
  async scrapeMultiple(
    urls: string[],
    options?: Omit<ScrapeOptions, 'url'>,
    concurrency = 3,
  ): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    const chunks: string[][] = [];

    // Split URLs into chunks for concurrency control
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map((url) =>
        this.scrape({ ...options, url }).catch((error) => {
          this.logger.error(`Failed to scrape ${url}:`, error);
          return null;
        }),
      );

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults.filter((r): r is ScrapeResult => r !== null));
    }

    return results;
  }

  /**
   * Closes the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }
}