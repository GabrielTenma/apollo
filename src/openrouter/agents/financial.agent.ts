import { Injectable } from '@nestjs/common';
import { OpenRouterService } from '../openrouter.service';
import {
   ChatCompletionOptions,
   ChatMessage,
} from '../interfaces/openrouter.interface';

@Injectable()
export class FinancialAgentService {
   constructor(private readonly openRouterService: OpenRouterService) { }

   /**
    * Simple chat completion
    */
   async queryChat(finanicalJuice: string, yahooFinance: string, coinmarketCap: string): Promise<string> {
      const response = await this.openRouterService.chat(
         this.getPrompt(finanicalJuice, yahooFinance, coinmarketCap),
         `openrouter/free`, //'openai/gpt-oss-120b:free'
         'You are a helpful financial consultant assistant.',
      );

      console.log('Response:', response.length);
      return response;
   }

   getPrompt(financialJuice: string, yahooFinance: string, coinmarketCap: string): string {
      let textLength: number = 500;
      let ideaWords: number = 50;
      let tradeIdeas: string = '1-5';
      let language: string = 'native indonesian';
      
      return (`You are an elite financial analyst. You will be given three separate JSON data sources: FinancialJuice (US macro/live news) "${financialJuice}", Yahoo Finance (equity news) "${yahooFinance}", and CoinMarketCap (real-time crypto prices, 24h changes, volume, market cap) "${coinmarketCap}". 

Synthesize the incoming data and output ONLY three short paragraphs of plain text. Do not use any formatting, markdown, tables, bullet points, or emojis. The entire response must be plain text under ${textLength} words.

Paragraph 1: "Overall Market Stance". State the short-term directional bias for US equities (e.g., cautiously bearish/defensive, favoring specific sectors) and for crypto (e.g., neutral with a bullish BTC tilt, selective alt momentum). Attribute the stance to the single biggest macro or news driver from the provided data.

Paragraph 2: "High-Conviction Tactical Ideas". Name exactly ${tradeIdeas} trade ideas (stock ticker or crypto symbol) with entry, target, and stop logic. Keep each idea under ${ideaWords} words.

Paragraph 3: "Risk & Percentage Impact". Based solely on the provided news and CoinMarketCap price data (never using internal knowledge), estimate: for the US stock market, potential upside percentage and downside percentage with the ticker(s) most impacted; for crypto, potential upside percentage and downside percentage with the crypto ticker(s) most impacted. Compare the news sentiment with the latest CoinMarketCap price action to justify the estimates. Use only the actual CoinMarketCap price and 24h change from the input data for any price references. End with a 5-word risk reminder.

Use assertive, ${language} appropriate for a hedge fund morning note.`)
   }
}