import { Global, Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

/**
 * Module for Telegram Bot functionality.
 * Provides the TelegramService for interacting with Telegram Bot API,
 * including sending messages, webhook handling, and bot operations.
 *
 * Can be imported globally to make the TelegramService available
 * throughout the application.
 */
@Global()
@Module({
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
