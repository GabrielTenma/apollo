import { Controller, Post, Body, Get, Query, Logger, Injectable } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import {
    ScrapeOptions,
    ExtractConfig,
} from './interfaces/scraper.interface';
import { ApiResponse } from '../common/utils/response.util';
import { FinancialJuiceTarget } from './target/financialjuice.target';
import { CoinmarketCapTarget } from './target/coinmarketcap.target';
import { YahooFinanceTarget } from './target/yahoofinance.target';

/**
 * Controller for web scraping operations.
 * Provides endpoints for single page scraping, multiple page scraping,
 * and structured data extraction using Playwright.
 */
@Controller('/api/v1/scraper')
export class ScraperController {
    private readonly logger = new Logger(ScraperController.name);

    constructor(
        private readonly scraperService: ScraperService,
        private readonly financialJuiceTarget: FinancialJuiceTarget,
        private readonly coinmarketCapTarget: CoinmarketCapTarget,
        private readonly yahooFinanceTarget: YahooFinanceTarget
    ) { }

    /**
     * Scrapes a single webpage
     * @param options - Scrape options including URL and configuration
     * @returns Scrape result with extracted data
     *
     * @example
     * POST /scraper/scrape
     * {
     *   "url": "https://example.com",
     *   "waitForSelector": ".content",
     *   "timeout": 30000,
     *   "screenshot": true
     * }
     */
    @Post('scrape')
    async scrape(@Body() options: ScrapeOptions): Promise<ApiResponse> {
        this.logger.log(`Scrape request for: ${options.url}`);
        try {
            const result = await this.scraperService.scrape(options);
            return {
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(`Scrape failed for ${options.url}:`, error);
            throw error;
        }
    }

    /**
     * Scrapes multiple pages concurrently
     * @param urls - Array of URLs to scrape
     * @param options - Common scrape options (optional)
     * @param concurrency - Number of concurrent scrapes (default: 3)
     * @returns Array of scrape results
     *
     * @example
     * POST /scraper/scrape-multiple
     * {
     *   "urls": ["https://example1.com", "https://example2.com"],
     *   "concurrency": 2,
     *   "options": {
     *     "timeout": 30000
     *   }
     * }
     */
    @Post('scrape-multiple')
    async scrapeMultiple(
        @Body('urls') urls: string[],
        @Body('options') options?: Omit<ScrapeOptions, 'url'>,
        @Body('concurrency') concurrency = 3,
    ): Promise<ApiResponse> {
        this.logger.log(`Scraping ${urls.length} URLs with concurrency ${concurrency}`);
        try {
            const results = await this.scraperService.scrapeMultiple(
                urls,
                options,
                concurrency,
            );
            return {
                success: true,
                data: results,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('Multiple scrape failed:', error);
            throw error;
        }
    }

    /**
     * Extracts structured data from a webpage
     * @param url - URL to scrape
     * @param config - Extraction configuration
     * @returns Extracted structured data
     *
     * @example
     * POST /scraper/extract
     * {
     *   "url": "https://example.com",
     *   "config": {
     *     "title": "h1",
     *     "description": ".description",
     *     "image": "img.hero",
     *     "links": {
     *       "selector": "a",
     *       "attribute": "href"
     *     },
     *     "custom": {
     *       "prices": {
     *         "selector": ".price",
     *         "multiple": true,
     *         "textContent": true
     *       }
     *     }
     *   }
     * }
     */
    @Post('extract')
    async extractStructured(
        @Body('url') url: string,
        @Body('config') config: ExtractConfig,
    ): Promise<ApiResponse> {
        this.logger.log(`Extracting structured data from: ${url}`);
        try {
            const result = await this.scraperService.scrape({
                url,
                waitForSelector: config.title || undefined,
            });

            // Re-open page for structured extraction (simplified example)
            const browser = await this.scraperService['getBrowser']();
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto(url, { waitUntil: 'networkidle' });

            const extractedData = await this.scraperService.extractStructuredData(
                page,
                config,
            );

            await context.close();

            return {
                success: true,
                data: {
                    url,
                    extracted: extractedData,
                    timestamp: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(`Structured extraction failed for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Health check endpoint for the scraper service
     * @returns Health status
     */
    @Get('health')
    async healthCheck(): Promise<ApiResponse> {
        return {
            success: true,
            data: { status: 'ok', service: 'scraper' },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * FinancialJuice endpoint for get latest news
     * @returns News
     */
    @Get('financialjuice')
    async financialJuice(): Promise<ApiResponse> {
        this.logger.log(`Requested to scrape FinancialJuice`);
        return {
            success: true,
            data: await this.financialJuiceTarget.scrapeLatestNews(),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * CoinmarketCap endpoint for get latest price
     * @returns Coins
     */
    @Get('coinmarketcap')
    async coinmarketCap(): Promise<ApiResponse> {
        this.logger.log(`Requested to scrape CoinmarketCap`);
        return {
            success: true,
            data: await this.coinmarketCapTarget.scrapeLatestPrice(),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * CoinmarketCap endpoint for get latest price
     * @returns Coins
     */
    @Get('yahoofinance')
    async yahooFinance(): Promise<ApiResponse> {
        this.logger.log(`Requested to scrape Yahoo Finance`);
        return {
            success: true,
            data: await this.yahooFinanceTarget.scrapeLatestNews(),
            timestamp: new Date().toISOString(),
        };
    }
}