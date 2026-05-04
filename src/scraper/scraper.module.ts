import { Module, Global } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { FinancialJuiceTarget } from './target/financialjuice.target';
import { CoinmarketCapTarget } from './target/coinmarketcap.target';

/**
 * Module for Playwright-based web scraping functionality.
 * Provides the ScraperService for advanced web scraping operations
 * including single/multiple page scraping, structured data extraction,
 * and concurrent scraping with configurable options.
 *
 * Can be imported globally to make the ScraperService available
 * throughout the application.
 */
@Global()
@Module({
  providers: [ScraperService, FinancialJuiceTarget, CoinmarketCapTarget],
  controllers: [ScraperController],
  exports: [ScraperService, FinancialJuiceTarget, CoinmarketCapTarget],
})
export class ScraperModule {}
