import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service wrapper around Supabase client.
 * Provides simple CRUD helpers used by the controller and other services.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL') || '';
    const key = this.configService.get<string>('SUPABASE_KEY') || '';
    if (!url || !key) {
      this.logger.warn('Supabase URL or key not configured');
    }
    this.client = createClient(url, key);
  }

  async create(table: string, data: any): Promise<any> {
    const { data: result, error } = await this.client.from(table).insert(data);
    if (error) {
      this.logger.error('Supabase create error', error);
      throw error;
    }
    return result;
  }

  async read(table: string, filter?: any): Promise<any> {
    let query: any = this.client.from(table).select('*');
    if (filter && filter.field && filter.value !== undefined) {
      query = query.eq(filter.field, filter.value);
    }
    const { data, error } = await query;
    if (error) {
      this.logger.error('Supabase read error', error);
      throw error;
    }
    return data;
  }

  async update(table: string, id: string | number, data: any): Promise<any> {
    const { data: result, error } = await this.client.from(table).update(data).eq('id', id);
    if (error) {
      this.logger.error('Supabase update error', error);
      throw error;
    }
    return result;
  }

  async delete(table: string, id: string | number): Promise<any> {
    const { data: result, error } = await this.client.from(table).delete().eq('id', id);
    if (error) {
      this.logger.error('Supabase delete error', error);
      throw error;
    }
    return result;
  }
}
