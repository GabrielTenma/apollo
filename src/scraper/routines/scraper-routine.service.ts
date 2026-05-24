import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutineService } from '../../common/routines/services/routine.service';
import { APP_CONSTANTS, AppConstants } from '../../constants/app.constants';
import { ScrapedDataEntity } from '../../supabase/entities/scraped-data.entity';
import { ScrapeOptions } from '../interfaces/scraper.interface';
import { ScraperService } from '../scraper.service';
import { CoinmarketCapTarget } from '../target/coinmarketcap.target';
import { FinancialJuiceTarget } from '../target/financialjuice.target';
import { YahooFinanceTarget } from '../target/yahoofinance.target';

/**
 * Service for executing scraper routines based on configuration.
 */
@Injectable()
export class ScraperRoutineService implements OnModuleInit {
  private readonly logger = new Logger(ScraperRoutineService.name);
  private routineTime = 20000;

  constructor(
    private readonly routineService: RoutineService,
    private readonly coinMarketCapTarget: CoinmarketCapTarget,
    private readonly yahooFinanceTarget: YahooFinanceTarget,
    private readonly financialJuiceTarget: FinancialJuiceTarget,
    private readonly scraperService: ScraperService,
    @InjectRepository(ScrapedDataEntity)
    readonly _scrapedDataRepository: Repository<ScrapedDataEntity>,
    @Inject(APP_CONSTANTS) private readonly constants: AppConstants,
  ) {}

  onModuleInit() {
    // Only set up routines if globally enabled
    if (!this.routineService.isEnabled()) {
      this.logger.verbose('Routines are disabled globally, skipping setup');
      return;
    }

    // Scraper routine that runs every 10 minutes
    this.routineService.startRoutine(
      'scraper-routine',
      async () => {
        this.logger.verbose('Scraper collector routine executed');

        const scrapedContentStore = this.constants.scrapedContentStore;

        // multiple scrape
        const scrapeOptions: ScrapeOptions[] = [
          this.coinMarketCapTarget.getOptions(),
          this.yahooFinanceTarget.getOptions(),
          this.financialJuiceTarget.getOptions(),
        ];
        const scrapeAllResult = await this.scraperService.scrapeMultiple(
          scrapeOptions,
          1,
          true,
          0,
        );
        scrapedContentStore.set(
          'coinmarketcap',
          this.coinMarketCapTarget.parsePriceList(
            scrapeAllResult[0].content || '',
          ),
        );
        scrapedContentStore.set(
          'yahoofinance',
          this.yahooFinanceTarget.parseNewsItems(
            scrapeAllResult[1].content || '',
          ),
        );
        scrapedContentStore.set(
          'financialjuice',
          this.financialJuiceTarget.parseNewsItems(
            scrapeAllResult[2].content || '',
          ),
        );

        // adjust routine time
        if (this.routineTime < 100000) {
          this.routineTime = 100000;
        }

        this.logger.verbose(`scrape routine done ${scrapeAllResult.length}`);
      },
      this.routineTime,
    );

    this.logger.verbose(
      `Started ${
        this.routineService.getRunningRoutines().length
      } collector routines`,
    );
  }

  /**
   * Manually trigger a routine (useful for testing or manual execution)
   */
  async runManually(name: string): Promise<void> {
    await this.routineService.executeRoutine(name, async () => {
      this.logger.verbose('Manual scraper routine executed');
    });
  }
}
