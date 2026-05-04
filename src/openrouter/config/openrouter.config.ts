/**
 * OpenRouter configuration
 * This file contains the configuration for OpenRouter API
 */
export const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseUrl:
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultModel:
    process.env.OPENROUTER_DEFAULT_MODEL ||
    'openrouter/free',
  timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '30000', 10),
};

/**
 * Validation function for OpenRouter configuration
 */
export function validateOpenRouterConfig() {
  const errors: string[] = [];

  if (!openRouterConfig.apiKey) {
    errors.push('OPENROUTER_API_KEY is not set in environment variables');
  }

  if (openRouterConfig.timeout <= 0) {
    errors.push('OPENROUTER_TIMEOUT must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}