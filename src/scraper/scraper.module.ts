import { Global, Module } from '@nestjs/common';
import { AppConstantsModule } from '../constants/app.module';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { CoinmarketCapTarget } from './target/coinmarketcap.target';
import { FinancialJuiceTarget } from './target/financialjuice.target';
import { YahooFinanceTarget } from './target/yahoofinance.target';

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
  imports: [AppConstantsModule],
  providers: [
    ScraperService,
    FinancialJuiceTarget,
    CoinmarketCapTarget,
    YahooFinanceTarget,
  ],
  controllers: [ScraperController],
  exports: [
    ScraperService,
    FinancialJuiceTarget,
    CoinmarketCapTarget,
    YahooFinanceTarget,
  ],
})
export class ScraperModule {}
