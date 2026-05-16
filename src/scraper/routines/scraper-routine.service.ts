import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from '../../common/routines/services/routine.service';
import { CoinmarketCapTarget } from '../target/coinmarketcap.target';
import { YahooFinanceTarget } from '../target/yahoofinance.target';
import { FinancialJuiceTarget } from '../target/financialjuice.target';
import { ScraperService } from '../scraper.service';
import { APP_CONSTANTS, AppConstants } from '../../constants/app.constants';
import { ScrapeOptions } from '../interfaces/scraper.interface';
import { Repository } from 'typeorm';
import { ScrapedDataEntity } from '../../supabase/entities/scraped-data.entity';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ScraperRoutineService implements OnModuleInit {
  private readonly logger = new Logger(ScraperRoutineService.name);

  constructor(
    private readonly routineService: RoutineService,
    private readonly coinMarketCapTarget: CoinmarketCapTarget,
    private readonly yahooFinanceTarget: YahooFinanceTarget,
    private readonly financialJuiceTarget: FinancialJuiceTarget,
    private readonly scraperService: ScraperService,
    @InjectRepository(ScrapedDataEntity)
    private readonly scrapedDataRepository: Repository<ScrapedDataEntity>,
    @Inject(APP_CONSTANTS) private readonly constants: AppConstants,
  ) {}

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

        // Storing section
        const coinmarketcapDataEntity: ScrapedDataEntity = {
          source_id: '9d5d44d9-97b1-49d5-93df-fe4e461f6488',
          parsed_data: scrapedContentStore.get('coinmarketcap'),
          raw_content: Buffer.from(scrapeAllResult[0].content || '').toString(
            'utf-8',
          ),
          data_hash: crypto
            .createHash('sha256')
            .update(scrapeAllResult[0].content || '')
            .digest('hex')
            .substring(0, 64),
          status: 'new',
        };
        const yahoofinanceDataEntity: ScrapedDataEntity = {
          source_id: 'a1a84270-de34-4dd9-ae0b-90dc00b39dbc',
          parsed_data: scrapedContentStore.get('yahoofinance'),
          raw_content: Buffer.from(scrapeAllResult[1].content || '').toString(
            'utf-8',
          ),
          data_hash: crypto
            .createHash('sha256')
            .update(scrapeAllResult[1].content || '')
            .digest('hex')
            .substring(0, 64),
          status: 'new',
        };
        const financialjuiceDataEntity: ScrapedDataEntity = {
          source_id: '3ede22a5-e89b-4667-9b06-7cf404996720',
          parsed_data: scrapedContentStore.get('financialjuice'),
          raw_content: Buffer.from(scrapeAllResult[2].content || '').toString(
            'utf-8',
          ),
          data_hash: crypto
            .createHash('sha256')
            .update(scrapeAllResult[2].content || '')
            .digest('hex')
            .substring(0, 64),
          status: 'new',
        };

        const scrapedData = this.scrapedDataRepository.create([
          coinmarketcapDataEntity,
          yahoofinanceDataEntity,
          financialjuiceDataEntity,
        ]);
        await this.scrapedDataRepository.save(scrapedData);

        this.logger.log(`scrape routine done ${scrapeAllResult.length}`);
      },
      20000, // 600,000 ms = 10 minutes - individual interval for this routine
    );

    this.logger.log(
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
      this.logger.log('Manual scraper routine executed');
    });
  }
}
