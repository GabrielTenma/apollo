/**
 * Routine execution configuration
 * This file contains the configuration for routine execution service
 */

export type RoutineExecutionMode = 'wait' | 'skip' | 'overlap';

export interface RoutineConfig {
  enabled: boolean;
  /**
   * Execution mode for routines:
   * - 'wait': Wait for routine to complete before starting next execution (recommended)
   * - 'skip': Skip next execution if previous is still running
   * - 'overlap': Allow overlapping executions (original behavior, not recommended)
   */
  executionMode?: RoutineExecutionMode;
}

import { ConfigService } from '@nestjs/config';
import { CommonConfigService } from '../../config/config.service';

// Instantiate CommonConfigService using Nest's ConfigService to access environment variables.
const commonConfigService = new CommonConfigService(new ConfigService());

export const routineConfig: RoutineConfig = {
  enabled: commonConfigService.getBoolean('ROUTINE_ENABLED') ?? false,
  executionMode:
    (commonConfigService.get(
      'ROUTINE_EXECUTION_MODE',
    ) as RoutineExecutionMode) || 'wait',
};

/**
 * Validation function for Routine configuration
 */
export function validateRoutineConfig() {
  const errors: string[] = [];

  const validModes = ['wait', 'skip', 'overlap'];
  if (
    routineConfig.executionMode &&
    !validModes.includes(routineConfig.executionMode)
  ) {
    errors.push(
      `Invalid ROUTINE_EXECUTION_MODE: ${
        routineConfig.executionMode
      }. Must be one of: ${validModes.join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
