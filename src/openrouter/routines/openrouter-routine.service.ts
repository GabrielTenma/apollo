import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from '../../common/routines/services/routine.service';
import { APP_CONSTANTS, appConstants, AppConstants } from '../../constants/app.constants';
import { FinancialAgentService } from '../agents/financial.agent';


@Injectable()
export class OpenrouterRoutineService implements OnModuleInit {
  private readonly logger = new Logger(OpenrouterRoutineService.name);
  private routineTime: number = 20000;
  constructor(
    private readonly routineService: RoutineService,
    private readonly financialAgentService: FinancialAgentService,
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
      'openrouter-routine',
      async () => {
        this.logger.log('Scraper collector routine executed');
        
        // fill value
        let financialJuice = appConstants.scrapedContentStore.get('financialjuice');
        let yahooFinance = appConstants.scrapedContentStore.get('yahoofinance');
        let coinmarketCap = appConstants.scrapedContentStore.get('coinmarketcap');
        let completionPrev = appConstants.scrapedContentStore.get('completion-previous')

        let isStoreHasContents = (financialJuice != undefined) && (yahooFinance != undefined) && (coinmarketCap != undefined);
        
        // execute by condition
        if (isStoreHasContents) {
          let chatCompletion = await this.financialAgentService.queryChat({
            financialJuiceContent: JSON.stringify(financialJuice),
            yahooFinanceContent: JSON.stringify(yahooFinance),
            coinmarketCapContent: JSON.stringify(coinmarketCap),
            maxTextLength: 500,
            ideaWordsLength: 300,
            riskReminder: 3,
            tradeIdeas: '1-5',
            language: 'indonesian'
          })
          appConstants.scrapedContentStore.set('completion', chatCompletion);

          let isFillCompletionPrev = (completionPrev != undefined) && (chatCompletion != completionPrev);
          appConstants.scrapedContentStore.set('completion-previous', isFillCompletionPrev ? chatCompletion : completionPrev);
          
          this.routineTime = 100000;
        } else {
          this.logger.log(
            `Not ready yet! skipped.`,
          );
          this.routineTime = 20000;
        }
      },
      this.routineTime, // 600,000 ms = 10 minutes - individual interval for this routine
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