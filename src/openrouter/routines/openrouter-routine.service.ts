import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from '../../common/routines/services/routine.service';
import { APP_CONSTANTS, AppConstants } from 'src/constants/app.constants';

@Injectable()
export class OpenrouterRoutineService implements OnModuleInit {
  private readonly logger = new Logger(OpenrouterRoutineService.name);

  constructor(
    private readonly routineService: RoutineService,
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
      'openrouter-routine',
      async () => {
        this.logger.log('Scraper collector routine executed');
        
        
    },
      600000, // 600,000 ms = 10 minutes - individual interval for this routine
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