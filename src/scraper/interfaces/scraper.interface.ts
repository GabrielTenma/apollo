import { PageFunction } from "node_modules/playwright-core/types/structs";

/**
 * Interface for scrape options
 */
export interface ScrapeOptions {
  url: string;
  waitForSelector?: string;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path?: string;
  }>;
  bypassCSP?: boolean;
  screenshot?: boolean;
  screenshotPath?: string;
  handlePopupClose?: boolean;
  pageLocatorPerformClick?: string;
  pageLocatorPerformClickCoordinate?: {x: number, y: number}
  pageLocatorPerformAutoScroll?: boolean;
  addPageEvaluate?: Array<PageFunction<void, any>>;
  addStyleHidePopup?: boolean
}

/**
 * Interface for scrape result
 */
export interface ScrapeResult {
  url: string;
  title?: string;
  content?: string;
  data: Record<string, unknown>;
  screenshot?: string;
  timestamp: string;
  duration: number;
}

/**
 * Interface for element selector
 */
export interface ElementSelector {
  selector: string;
  multiple?: boolean;
  attribute?: string;
  textContent?: boolean;
}

/**
 * Interface for structured data extraction
 */
export interface ExtractConfig {
  title?: string;
  description?: string;
  image?: string;
  links?: {
    selector: string;
    attribute?: string;
  };
  custom?: Record<string, ElementSelector>;
}