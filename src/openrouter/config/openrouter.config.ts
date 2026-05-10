/**
 * OpenRouter configuration
 * This file contains the configuration for OpenRouter API
 */
export const openRouterConfig = () => ({
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openrouter/free',
    timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '30000', 10),
  },
});

/**
 * Validation function for OpenRouter configuration
 */
export function validateOpenRouterConfig() {
  const config = openRouterConfig();
  const errors: string[] = [];

  if (!config.openrouter.apiKey) {
    errors.push('OPENROUTER_API_KEY is not set in environment variables');
  }

  if (config.openrouter.timeout <= 0) {
    errors.push('OPENROUTER_TIMEOUT must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
