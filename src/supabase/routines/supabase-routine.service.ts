import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from '../../common/routines/services/routine.service';
import { SupabaseService } from '../supabase.service';

/**
 * Routine service for Supabase integration.
 * This service can be used to perform periodic background tasks such as data sync.
 * It follows the same pattern as other routine services in the project.
 */
@Injectable()
export class SupabaseRoutineService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseRoutineService.name);
  private readonly routineName = 'supabase-routine';
  // Example interval: run every 5 minutes (300,000 ms)
  private readonly intervalMs = 300_000;

  constructor(
    private readonly routineService: RoutineService,
    private readonly supabaseService: SupabaseService,
  ) {}

  onModuleInit() {
    if (!this.routineService.isEnabled()) {
      this.logger.log('Routines are disabled globally, skipping Supabase routine setup');
      return;
    }

    this.routineService.startRoutine(
      this.routineName,
      async () => {
        this.logger.log('Supabase routine executed');
        // Placeholder for routine logic. For example, you could sync data from an external source.
        // Example: await this.supabaseService.create('example_table', { synced: true });
      },
      this.intervalMs,
    );

    this.logger.log(`Supabase routine started with interval ${this.intervalMs}ms`);
  }
}
