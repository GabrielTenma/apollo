import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from './routine.service';

@Injectable()
export class ScraperRoutineService implements OnModuleInit {
  private readonly logger = new Logger(ScraperRoutineService.name);

  constructor(private readonly routineService: RoutineService) {}

  onModuleInit() {
    // Only set up routines if globally enabled
    if (!this.routineService.isEnabled()) {
      this.logger.log('Routines are disabled globally, skipping setup');
      return;
    }

    // 1: A routine that runs every 10 minutes
    this.routineService.startRoutine(
      'scraper-heartbeat',
      async () => {
        this.logger.log('Heartbeat collector routine executed');
        // Add your logic here
      },
      600000, // 600.000 mil seconds means 10 minutes - individual interval for this routine
    );

    this.logger.log(
      `Started ${this.routineService.getRunningRoutines().length} collector routines`,
    );
  }

  /**
   * Manually trigger a routine (useful for testing or manual execution)
   */
  async runHeartbeatManually(name: string): Promise<void> {
    await this.routineService.executeRoutine(name, async () => {
      this.logger.log('Manual heartbeat executed');
    });
  }
}