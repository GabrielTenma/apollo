/**
 * Telegram configuration
 * This file contains the configuration for Telegram Bot API
 */
export const telegramConfig = () => ({
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
    timeout: parseInt(process.env.TELEGRAM_TIMEOUT || '30000', 10),
  },
});

/**
 * Validation function for Telegram configuration
 */
export function validateTelegramConfig() {
  const config = telegramConfig();
  const errors: string[] = [];

  if (!config.telegram.botToken) {
    errors.push('TELEGRAM_BOT_TOKEN is not set in environment variables');
  }

  if (config.telegram.timeout <= 0) {
    errors.push('TELEGRAM_TIMEOUT must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
