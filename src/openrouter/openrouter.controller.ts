import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import {
  ChatCompletionOptions,
  ChatCompletionResponse,
  OpenRouterModel,
} from './interfaces/openrouter.interface';
import { ApiResponse } from '../common/utils/response.util';

/**
 * Controller for OpenRouter AI operations.
 * Provides endpoints for chat completions, model listing,
 * and other AI model interactions through OpenRouter API.
 */
@Controller('/api/v1/openrouter')
export class OpenRouterController {
  private readonly logger = new Logger(OpenRouterController.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  /**
   * Creates a chat completion
   * @param options - Chat completion options
   * @returns Chat completion result
   *
   * @example
   * POST /openrouter/chat
   * {
   *   "model": "google/gemini-2.0-flash-exp:free",
   *   "messages": [
   *     { "role": "user", "content": "Hello, how are you?" }
   *   ],
   *   "temperature": 0.7
   * }
   */
  @Post('chat')
  async createChatCompletion(
    @Body() options: ChatCompletionOptions,
  ): Promise<ApiResponse> {
    this.logger.log(`Chat completion request with model: ${options.model}`);
    try {
      const result = await this.openRouterService.createChatCompletion(options);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Chat completion failed:', error);
      throw error;
    }
  }

  /**
   * Lists available models from OpenRouter
   * @returns Array of available models
   *
   * @example
   * GET /openrouter/models
   */
  @Get('models')
  async listModels(): Promise<ApiResponse> {
    this.logger.log('Listing available models');
    try {
      const models = await this.openRouterService.listModels();
      return {
        success: true,
        data: models,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to list models:', error);
      throw error;
    }
  }

  /**
   * Simple chat endpoint with just a prompt
   * @param prompt - User prompt
   * @param model - Model to use (optional)
   * @param systemPrompt - System prompt (optional)
   * @returns Generated text response
   *
   * @example
   * POST /openrouter/simple-chat
   * {
   *   "prompt": "What is the capital of France?",
   *   "model": "google/gemini-2.0-flash-exp:free",
   *   "systemPrompt": "You are a helpful assistant"
   * }
   */
  @Post('simple-chat')
  async simpleChat(
    @Body('prompt') prompt: string,
    @Body('model') model?: string,
    @Body('systemPrompt') systemPrompt?: string,
  ): Promise<ApiResponse> {
    this.logger.log(`Simple chat request: ${prompt.substring(0, 50)}...`);
    try {
      const response = await this.openRouterService.chat(
        prompt,
        model,
        systemPrompt,
      );
      return {
        success: true,
        data: { response },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Simple chat failed:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint for the OpenRouter service
   * @returns Health status
   */
  @Get('health')
  async healthCheck(): Promise<ApiResponse> {
    return {
      success: true,
      data: { status: 'ok', service: 'openrouter' },
      timestamp: new Date().toISOString(),
    };
  }
}