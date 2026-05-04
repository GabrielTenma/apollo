import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { routineConfig } from '../config/routine.config';

/**
 * Service for executing routines based on configuration.
 * Can be enabled/disabled via environment variables.
 * Each routine can have its own individual interval.
 */
@Injectable()
export class RoutineService implements OnModuleDestroy {
  private readonly logger = new Logger(RoutineService.name);
  private readonly intervals = new Map<string, NodeJS.Timeout>();

  /**
   * Check if routine execution is enabled globally
   */
  isEnabled(): boolean {
    return routineConfig.enabled;
  }

  /**
   * Execute a routine function once if routines are enabled
   * @param routineName - Name of the routine for logging purposes
   * @param routineFn - The routine function to execute
   */
  async executeRoutine(routineName: string, routineFn: () => Promise<void>): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`Routine "${routineName}" is disabled, skipping execution`);
      return;
    }

    try {
      this.logger.log(`Executing routine: ${routineName}`);
      await routineFn();
      this.logger.log(`Routine "${routineName}" completed successfully`);
    } catch (error: any) {
      this.logger.error(`Routine "${routineName}" failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Start a routine with individual interval
   * @param routineName - Name of the routine for logging purposes
   * @param routineFn - The routine function to execute
   * @param intervalMs - Individual interval in milliseconds for this routine
   * @returns The interval ID
   */
  startRoutine(routineName: string, routineFn: () => Promise<void>, intervalMs: number): NodeJS.Timeout {
    if (!this.isEnabled()) {
      this.logger.debug(`Routine "${routineName}" is disabled, not starting`);
      return null;
    }

    if (intervalMs <= 0) {
      throw new Error(`Invalid interval for routine "${routineName}": must be positive`);
    }

    // Clear existing interval if any
    this.stopRoutine(routineName);

    this.logger.log(`Starting routine "${routineName}" with interval ${intervalMs}ms`);

    const intervalId = setInterval(async () => {
      await this.executeRoutine(routineName, routineFn);
    }, intervalMs);

    this.intervals.set(routineName, intervalId);
    return intervalId;
  }

  /**
   * Stop a running routine
   * @param routineName - Name of the routine to stop
   */
  stopRoutine(routineName: string): void {
    const intervalId = this.intervals.get(routineName);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(routineName);
      this.logger.log(`Stopped routine: ${routineName}`);
    }
  }

  /**
   * Stop all running routines
   */
  stopAllRoutines(): void {
    for (const [name, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId);
      this.logger.log(`Stopped routine: ${name}`);
    }
    this.intervals.clear();
  }

  /**
   * Get all running routine names
   */
  getRunningRoutines(): string[] {
    return Array.from(this.intervals.keys());
  }

  /**
   * Clean up all intervals when module is destroyed
   */
  onModuleDestroy() {
    this.stopAllRoutines();
  }
}