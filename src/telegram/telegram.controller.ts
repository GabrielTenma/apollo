import { Controller, Post, Body, Get, Headers, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import {
  TelegramUpdate,
  SendMessageOptions,
  TelegramMessage,
} from './interfaces/telegram.interface';

/**
 * Controller for Telegram bot operations.
 */
@Controller('/api/v1/telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Webhook endpoint for receiving Telegram updates
   */
  @Post('webhook')
  async webhook(
    @Body() update: TelegramUpdate,
    @Headers('X-Telegram-Bot-Api-Secret-Token') secretToken?: string,
  ): Promise<any> {
    this.logger.verbose(`Received update: ${update.update_id}`);

    try {
      if (update.message) {
        await this.handleMessage(update.message);
      }
      return { processed: true };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Sends a message to a chat
   */
  @Post('send-message')
  async sendMessage(@Body() options: SendMessageOptions): Promise<any> {
    this.logger.verbose(`Send message request to chat: ${options.chat_id}`);
    try {
      return await this.telegramService.sendMessage(options);
    } catch (error) {
      this.logger.error('Send message failed:', error);
      throw error;
    }
  }

  /**
   * Sends a simple text message
   */
  @Post('send-text')
  async sendText(
    @Body('chatId') chatId: number | string,
    @Body('text') text: string,
    @Body('parseMode') parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML',
  ): Promise<any> {
    this.logger.verbose(`Send text request to chat: ${chatId}`);
    try {
      return await this.telegramService.sendText(chatId, text, parseMode);
    } catch (error) {
      this.logger.error('Send text failed:', error);
      throw error;
    }
  }

  /**
   * Gets bot information
   */
  @Get('bot-info')
  async getBotInfo(): Promise<any> {
    this.logger.verbose('Getting bot info');
    try {
      return await this.telegramService.getMe();
    } catch (error) {
      this.logger.error('Get bot info failed:', error);
      throw error;
    }
  }

  /**
   * Sets webhook URL
   */
  @Post('set-webhook')
  async setWebhook(
    @Body('url') url: string,
    @Body('secretToken') secretToken?: string,
  ): Promise<any> {
    this.logger.verbose(`Setting webhook to: ${url}`);
    try {
      const result = await this.telegramService.setWebhook(url, secretToken);
      return { success: result };
    } catch (error) {
      this.logger.error('Set webhook failed:', error);
      throw error;
    }
  }

  /**
   * Gets webhook information
   */
  @Get('webhook-info')
  async getWebhookInfo(): Promise<any> {
    this.logger.verbose('Getting webhook info');
    try {
      return await this.telegramService.getWebhookInfo();
    } catch (error) {
      this.logger.error('Get webhook info failed:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint for the Telegram service
   */
  @Get('health')
  async healthCheck(): Promise<any> {
    return { status: 'ok', service: 'telegram' };
  }

  /**
   * Handles incoming messages
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    if (message.text) {
      this.logger.verbose(
        `Received message: ${message.text.substring(0, 50)}...`,
      );
      if (message.text.startsWith('/start')) {
        await this.telegramService.sendText(
          message.chat.id,
          'Welcome to Apollo Bot! I am now active.',
        );
      }
    }
  }
}
