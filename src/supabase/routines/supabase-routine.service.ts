import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoutineService } from '../../common/routines/services/routine.service';
import { SupabaseService } from '../supabase.service';

/**
 * Routine service for Supabase integration.
 */
@Injectable()
export class SupabaseRoutineService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseRoutineService.name);
  private readonly routineName = 'supabase-routine';
  private readonly intervalMs = 300_000;

  constructor(
    private readonly routineService: RoutineService,
    readonly _supabaseService: SupabaseService,
  ) {}

  onModuleInit() {
    if (!this.routineService.isEnabled()) {
      this.logger.verbose(
        'Routines are disabled globally, skipping Supabase routine setup',
      );
      return;
    }

    this.routineService.startRoutine(
      this.routineName,
      async () => {
        this.logger.verbose('Supabase routine executed');
      },
      this.intervalMs,
    );

    this.logger.verbose(
      `Supabase routine started with interval ${this.intervalMs}ms`,
    );
  }
}
