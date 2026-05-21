import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Injectable,
  Inject,
  Param,
  Put,
  Delete,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ScraperService } from './scraper.service';
import { ScrapeOptions, ExtractConfig } from './interfaces/scraper.interface';
import {
  ApiResponse,
  errorResponse,
  successResponse,
} from '../common/utils/response.util';
import { FinancialJuiceTarget, NewsItem } from './target/financialjuice.target';
import { CoinData, CoinmarketCapTarget } from './target/coinmarketcap.target';
import { YahooFinanceTarget, YahooNewsItem } from './target/yahoofinance.target';
import { Public } from '../common/decorators/public.decorator';
import {
  APP_CONSTANTS,
  appConstants,
  AppConstants,
} from '../constants/app.constants';
import { ScrapingSourceEntity } from '../supabase/entities/scraping-source.entity';
import { ScrapedDataEntity } from '../supabase/entities/scraped-data.entity';
import * as crypto from 'crypto';

/**
 * Controller for web scraping operations.
 */
@Controller('/api/v1/scraper')
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly financialJuiceTarget: FinancialJuiceTarget,
    private readonly coinmarketCapTarget: CoinmarketCapTarget,
    private readonly yahooFinanceTarget: YahooFinanceTarget,
    @Inject(APP_CONSTANTS) private readonly constants: AppConstants,
    @InjectRepository(ScrapingSourceEntity)
    private readonly scrapingSourceRepository: Repository<ScrapingSourceEntity>,
    @InjectRepository(ScrapedDataEntity)
    private readonly scrapedDataRepository: Repository<ScrapedDataEntity>,
  ) {}

  /**
   * Scrapes a single webpage
   */
  @Post('scrape')
  async scrape(@Body() options: ScrapeOptions): Promise<any> {
    this.logger.verbose(`Scrape request for: ${options.url}`);
    try {
      return await this.scraperService.scrape(options);
    } catch (error) {
      this.logger.error(`Scrape failed for ${options.url}:`, error as Error);
      throw error;
    }
  }

  /**
   * Scrapes multiple pages concurrently
   */
  @Post('scrape-multiple')
  async scrapeMultiple(
    @Body('options') options: ScrapeOptions[],
    @Body('concurrency') concurrency = 3,
    @Body('continueOnError') contineOnError?: boolean,
    @Body('maxRetries') maxRetries = 3,
  ): Promise<any> {
    this.logger.verbose(
      `Scraping ${options.length} URLs with concurrency ${concurrency}`,
    );
    try {
      return await this.scraperService.scrapeMultiple(
        options,
        concurrency,
        contineOnError,
        maxRetries,
      );
    } catch (error) {
      this.logger.error('Multiple scrape failed:', error as Error);
      throw error;
    }
  }

  /**
   * Extracts structured data from a webpage
   */
  @Post('extract')
  async extractStructured(
    @Body('url') url: string,
    @Body('config') config: ExtractConfig,
  ): Promise<any> {
    this.logger.verbose(`Extracting structured data from: ${url}`);
    try {
      const result = await this.scraperService.scrape({
        url,
        waitForSelector: config.title || undefined,
      });

      const browser = await this.scraperService['getBrowser']();
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      const extractedData = await this.scraperService.extractStructuredData(
        page,
        config,
      );

      await context.close();

      return {
        url,
        extracted: extractedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Structured extraction failed for ${url}:`, error as Error);
      throw error;
    }
  }

  /**
   * Health check endpoint for the scraper service
   */
  @Public()
  @Get('health')
  async healthCheck(): Promise<any> {
    return { status: 'ok', service: 'scraper' };
  }

  /**
   * FinancialJuice endpoint for get latest news
   */
  @Get('financialjuice')
  async financialJuice(): Promise<any> {
    this.logger.verbose('Requested to scrape FinancialJuice');
    const content = appConstants.scrapedContentStore.get('financialjuice');
    if (content != undefined) {
      return content;
    }
    return successResponse(undefined, 'on process routine', 202);
  }

  /**
   * CoinmarketCap endpoint for get latest price
   */
  @Get('coinmarketcap')
  async coinmarketCap(): Promise<any> {
    this.logger.verbose('Requested to scrape CoinmarketCap');
    const content = appConstants.scrapedContentStore.get('coinmarketcap');
    if (content != undefined) {
      return content;
    }
    return successResponse(undefined, 'on process routine', 202);
  }

  /**
   * Yahoo Finance endpoint for get latest news
   */
  @Get('yahoofinance')
  async yahooFinance(): Promise<any> {
    this.logger.verbose('Requested to scrape Yahoo Finance');
    const content = appConstants.scrapedContentStore.get('yahoofinance');
    if (content != undefined) {
      return content;
    }
    return successResponse(undefined, 'on process routine', 202);
  }

  /**
   * Get all scraping sources
   */
  @Get('sources')
  async getAllSources(): Promise<ScrapingSourceEntity[]> {
    this.logger.verbose('Getting all scraping sources');
    return await this.scrapingSourceRepository.find();
  }

  /**
   * Get a specific scraping source by ID
   */
  @Get('sources/:id')
  async getSource(@Param('id') id: string): Promise<ScrapingSourceEntity> {
    this.logger.verbose(`Getting scraping source: ${id}`);
    const source = await this.scrapingSourceRepository.findOne({ where: { id } });
    if (!source) {
      throw new Error('Scraping source not found');
    }
    return source;
  }

  /**
   * Create a new scraping source
   */
  @Post('sources')
  async createSource(
    @Body() sourceData: Partial<ScrapingSourceEntity>,
  ): Promise<ScrapingSourceEntity> {
    this.logger.verbose('Creating new scraping source');
    const source = this.scrapingSourceRepository.create(sourceData);
    return await this.scrapingSourceRepository.save(source);
  }

  /**
   * Update an existing scraping source
   */
  @Put('sources/:id')
  async updateSource(
    @Param('id') id: string,
    @Body() sourceData: Partial<ScrapingSourceEntity>,
  ): Promise<ScrapingSourceEntity> {
    this.logger.verbose(`Updating scraping source: ${id}`);
    await this.scrapingSourceRepository.update(id, sourceData);
    const updatedSource = await this.scrapingSourceRepository.findOne({
      where: { id },
    });
    if (!updatedSource) {
      throw new Error('Scraping source not found');
    }
    return updatedSource;
  }

  /**
   * Delete a scraping source
   */
  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string): Promise<void> {
    this.logger.verbose(`Deleting scraping source: ${id}`);
    const result = await this.scrapingSourceRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Scraping source not found');
    }
  }

  /**
   * Scrape data using a configured scraping source
   */
  @Post('scrape-source/:id')
  async scrapeSource(@Param('id') id: string): Promise<any> {
    this.logger.verbose(`Scraping using source: ${id}`);
    const source = await this.scrapingSourceRepository.findOne({
      where: { id },
    });
    if (!source) {
      throw new Error('Scraping source not found');
    }
    if (!source.is_active) {
      throw new Error('Scraping source is not active');
    }
    const options: ScrapeOptions = source.connection_config as ScrapeOptions;
    const scrapeResult = await this.scraperService.scrape(options);

    const rawContent = JSON.stringify(scrapeResult);
    const dataHash = crypto
      .createHash('sha256')
      .update(rawContent)
      .digest('hex')
      .substring(0, 64);

    const scrapedData = this.scrapedDataRepository.create({
      source_id: id,
      raw_content: rawContent,
      parsed_data: scrapeResult.data,
      data_hash: dataHash,
      status: 'processed',
    });

    await this.scrapedDataRepository.save(scrapedData);

    return scrapeResult;
  }

  /**
   * Get all scraped data
   */
  @Get('scraped-data')
  async getAllScrapedData(): Promise<ScrapedDataEntity[]> {
    this.logger.verbose('Getting all scraped data');
    return await this.scrapedDataRepository.find({ relations: ['source'] });
  }

  /**
   * Get latest scraped data (llm result)
   */
  @Get('scraped-data/result/latest/:size')
  async getResultLatest(
    @Param('size') size?: number,
  ): Promise<ScrapedDataEntity[]> {
    this.logger.verbose('Getting single processed result');
    return await this.scrapedDataRepository.find({
      where: { source_id: 'ac851202-bc72-43c8-b784-e213b5907159' },
      relations: ['source'],
      take: size || 1,
      skip: 0,
      order: { captured_at: 'DESC' },
    });
  }

  /**
   * Get scraped data by source ID
   */
  @Get('scraped-data/source/:sourceId')
  async getScrapedDataBySource(
    @Param('sourceId') sourceId: string,
  ): Promise<ScrapedDataEntity[]> {
    this.logger.verbose(`Getting scraped data for source: ${sourceId}`);
    return await this.scrapedDataRepository.find({
      where: { source_id: sourceId },
      relations: ['source'],
      order: { captured_at: 'DESC' },
    });
  }

  /**
   * Get a specific scraped data by ID
   */
  @Get('scraped-data/:id')
  async getScrapedData(@Param('id') id: string): Promise<ScrapedDataEntity> {
    this.logger.verbose(`Getting scraped data: ${id}`);
    const data = await this.scrapedDataRepository.findOne({
      where: { id },
      relations: ['source'],
    });
    if (!data) {
      throw new Error('Scraped data not found');
    }
    return data;
  }

  /**
   * Create new scraped data
   */
  @Post('scraped-data')
  async createScrapedData(
    @Body() data: Partial<ScrapedDataEntity>,
  ): Promise<ScrapedDataEntity> {
    this.logger.verbose('Creating new scraped data');
    const scrapedData = this.scrapedDataRepository.create(data);
    return await this.scrapedDataRepository.save(scrapedData);
  }

  /**
   * Update scraped data
   */
  @Put('scraped-data/:id')
  async updateScrapedData(
    @Param('id') id: string,
    @Body() data: Partial<ScrapedDataEntity>,
  ): Promise<ScrapedDataEntity> {
    this.logger.verbose(`Updating scraped data: ${id}`);
    await this.scrapedDataRepository.update(id, data);
    const updatedData = await this.scrapedDataRepository.findOne({
      where: { id },
      relations: ['source'],
    });
    if (!updatedData) {
      throw new Error('Scraped data not found');
    }
    return updatedData;
  }

  /**
   * Delete scraped data
   */
  @Delete('scraped-data/:id')
  async deleteScrapedData(@Param('id') id: string): Promise<void> {
    this.logger.verbose(`Deleting scraped data: ${id}`);
    const result = await this.scrapedDataRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Scraped data not found');
    }
  }
}
