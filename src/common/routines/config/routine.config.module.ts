import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoutineExecutionMode } from './routine.config';

/**
 * Configuration interface for RoutineService
 */
export interface RoutineConfig {
  enabled: boolean;
  executionMode?: RoutineExecutionMode;
}

/**
 * Token for injecting routine configuration
 */
export const ROUTINE_CONFIG = 'ROUTINE_CONFIG';

/**
 * Service that provides routine configuration from ConfigService
 */
@Injectable()
export class RoutineConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): RoutineConfig {
    return {
      enabled: this.configService.get<string>('ROUTINE_ENABLED') === 'true',
      executionMode:
        (this.configService.get<string>(
          'ROUTINE_EXECUTION_MODE',
        ) as RoutineExecutionMode) || 'wait',
    };
  }
}

/**
 * Global module that provides routine configuration
 */
@Global()
@Module({
  providers: [
    RoutineConfigService,
    {
      provide: ROUTINE_CONFIG,
      useFactory: (configService: RoutineConfigService) =>
        configService.getConfig(),
      inject: [RoutineConfigService],
    },
  ],
  exports: [ROUTINE_CONFIG, RoutineConfigService],
})
export class RoutineConfigModule {}
