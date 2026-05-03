/**
 * Advanced Usage Examples for Playwright Scraper Service
 *
 * This file demonstrates various advanced scraping scenarios
 * that can be implemented using the ScraperService.
 *
 * Note: This is an example file and not meant to be imported directly.
 * Use these patterns in your services or controllers.
 */

import { Injectable } from '@nestjs/common';
import { ScraperService } from '../scraper.service';
import { NewsItem, ScrapeOptions } from '../interfaces/scraper.interface';
import * as cheerio from 'cheerio';

/**
 * Scrapes financialjuice web latest news
 */
@Injectable()
export class FinancialJuiceTarget {
    constructor(private readonly scraperService: ScraperService) { }

    /**
     * Mengambil berita terbaru dari halaman utama FinancialJuice
     * dengan menunggu elemen dinamis #mainFeed muncul.
     */
    async scrapeLatestNews(): Promise<NewsItem[]> {
        const url = 'https://www.financialjuice.com/home';

        const options: ScrapeOptions = {
            url,
            waitForSelector: '#mainFeed', // Tunggu sampai minimal 1 item muncul
            pageLocatorPerformClickCoordinate: {x: 24, y: 19},
            addStyleHidePopup: true
        };

        // Panggil ScraperService (asumsikan mengembalikan { url, content: string })
        const result = await this.scraperService.scrape(options);

        if (!result.content) {
            throw new Error('Scraping gagal: konten HTML tidak tersedia');
        }

        // Parse HTML dengan Cheerio
        const news = this.parseNewsItems(result.content);
        return news;
    }

    /**
     * Parse HTML dan ekstrak item berita dari #mainFeed
     */
    private parseNewsItems(html: string): NewsItem[] {
        const $ = cheerio.load(html);
        const items: NewsItem[] = [];

        $('#mainFeed .infinite-item.headline-item').each((_, element) => {
            const $item = $(element);

            // Lewati item tanpa judul (biasanya iklan / placeholder)
            const anchor = $item.find('p.headline-title a');
            let title: string;
            let link: string;

            if (anchor.length > 0) {
                title = anchor.text().trim();
                const href = anchor.attr('href') || '';
                link = href.startsWith('http') ? href : `https://www.financialjuice.com${href}`;
            } else {
                const span = $item.find('span.headline-title-nolink');
                title = span.text().trim();
                link = '';
            }

            if (!title) return; // ignore non-news content

            const time = $item.find('p.time').text().trim();

            const tags: string[] = [];
            $item.find('span.news-label').each((_, tagEl) => {
                const tagText = $(tagEl).text().trim();
                if (tagText) tags.push(tagText);
            });

            const id = $item.attr('data-headlineid') || '';

            if (id == "0") return; // ignore promotial content

            items.push({ id, title, link, time, tags });
        });

        return items;
    }
}