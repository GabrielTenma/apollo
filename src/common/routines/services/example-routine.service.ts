import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from './routine.service';

/**
 * Example routine service demonstrating how to use the RoutineService
 */
@Injectable()
export class ExampleRoutineService implements OnModuleInit {
  private readonly logger = new Logger(ExampleRoutineService.name);

  constructor(private readonly routineService: RoutineService) {}

  onModuleInit() {
    if (!this.routineService.isEnabled()) {
      this.logger.verbose('Routines are disabled globally, skipping setup');
      return;
    }

    this.routineService.startRoutine(
      'example-heartbeat',
      async () => {
        this.logger.verbose('Heartbeat routine executed');
      },
      30000,
    );

    this.routineService.startRoutine(
      'example-data-sync',
      async () => {
        this.logger.verbose('Data sync routine executed');
        await this.syncData();
      },
      300000,
    );

    this.routineService.startRoutine(
      'example-cleanup',
      async () => {
        this.logger.verbose('Cleanup routine executed');
        await this.cleanupOldData();
      },
      3600000,
    );

    this.logger.verbose(
      `Started ${
        this.routineService.getRunningRoutines().length
      } example routines`,
    );
  }

  private async syncData(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async cleanupOldData(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async runHeartbeatManually(): Promise<void> {
    await this.routineService.executeRoutine(
      'example-heartbeat-manual',
      async () => {
        this.logger.verbose('Manual heartbeat executed');
      },
    );
  }
}
