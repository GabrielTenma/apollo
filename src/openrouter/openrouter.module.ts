import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedDataEntity } from '../supabase/entities/scraped-data.entity';
import { FinancialAgentService } from './agents/financial.agent';
import { OpenRouterController } from './openrouter.controller';
import { OpenRouterService } from './openrouter.service';

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
  imports: [TypeOrmModule.forFeature([ScrapedDataEntity])],
  providers: [OpenRouterService, FinancialAgentService],
  controllers: [OpenRouterController],
  exports: [OpenRouterService, FinancialAgentService],
})
export class OpenRouterModule {}
