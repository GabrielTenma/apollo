import { Module, Global } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { OpenRouterController } from './openrouter.controller';

/**
 * Module for OpenRouter AI functionality.
 * Provides the OpenRouterService for interacting with OpenRouter API,
 * including chat completions, model listing, and other AI operations.
 *
 * Can be imported globally to make the OpenRouterService available
 * throughout the application.
 */
@Global()
@Module({
  providers: [OpenRouterService],
  controllers: [OpenRouterController],
  exports: [OpenRouterService],
})
export class OpenRouterModule {}