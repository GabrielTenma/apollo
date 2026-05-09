import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from '../../common/routines/services/routine.service';
import { CoinmarketCapTarget } from '../target/coinmarketcap.target';
import { YahooFinanceTarget } from '../target/yahoofinance.target';
import { FinancialJuiceTarget } from '../target/financialjuice.target';
import { ScraperService } from '../scraper.service';
import { APP_CONSTANTS, AppConstants } from '../../constants/app.constants';
import { ScrapeOptions } from '../interfaces/scraper.interface';

@Injectable()
export class ScraperRoutineService implements OnModuleInit {
  private readonly logger = new Logger(ScraperRoutineService.name);

  constructor(
    private readonly routineService: RoutineService,
    private readonly coinMarketCapTarget: CoinmarketCapTarget,
    private readonly yahooFinanceTarget: YahooFinanceTarget,
    private readonly financialJuiceTarget: FinancialJuiceTarget,
    private readonly scraperService: ScraperService,
    @Inject(APP_CONSTANTS) private readonly constants: AppConstants,
  ) { }

  onModuleInit() {
    // Only set up routines if globally enabled
    if (!this.routineService.isEnabled()) {
      this.logger.log('Routines are disabled globally, skipping setup');
      return;
    }

    // Scraper routine that runs every 10 minutes
    this.routineService.startRoutine(
      'scraper-routine',
      async () => {
        this.logger.log('Scraper collector routine executed');

        const scrapedContentStore = this.constants.scrapedContentStore;

        // multiple scrape
        const scrapeOptions: ScrapeOptions[] = [
          this.coinMarketCapTarget.getOptions(),
          this.yahooFinanceTarget.getOptions(),
          this.financialJuiceTarget.getOptions()
        ]
        let scrapeAllResult = await this.scraperService.scrapeMultiple(scrapeOptions, 1, true, 0);
        scrapedContentStore.set('coinmarketcap', this.coinMarketCapTarget.parsePriceList(scrapeAllResult[0].content || ''));
        scrapedContentStore.set('yahoofinance', this.yahooFinanceTarget.parseNewsItems(scrapeAllResult[1].content || ''));
        scrapedContentStore.set('financialjuice', this.financialJuiceTarget.parseNewsItems(scrapeAllResult[2].content || ''));
        this.logger.log(`scrape routine done ${scrapeAllResult.length}`)
      },
      20000, // 600,000 ms = 10 minutes - individual interval for this routine
    );

    this.logger.log(
      `Started ${this.routineService.getRunningRoutines().length} collector routines`,
    );
  }

  /**
   * Manually trigger a routine (useful for testing or manual execution)
   */
  async runManually(name: string): Promise<void> {
    await this.routineService.executeRoutine(name, async () => {
      this.logger.log('Manual scraper routine executed');
    });
  }
}