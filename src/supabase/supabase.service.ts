import { Injectable, Logger } from '@nestjs/common';
import { CommonConfigService } from '../common/config/config.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service wrapper around Supabase clients.
 * Supports multiple Supabase connections.
 * Provides simple CRUD helpers used by the controller and other services.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly clients: Map<string, SupabaseClient> = new Map();
  private defaultClient?: SupabaseClient;

  constructor(private readonly commonConfig: CommonConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    const configs = this.commonConfig.getByPrefix('SUPABASE_');
    const connections: Record<string, { url?: string; key?: string }> = {};

    for (const [key, value] of Object.entries(configs)) {
      if (key === 'SUPABASE_URL') {
        connections['default'] = { ...connections['default'], url: value };
      } else if (key === 'SUPABASE_KEY') {
        connections['default'] = { ...connections['default'], key: value };
      } else if (key.endsWith('_URL')) {
        const name = key.replace('SUPABASE_', '').replace('_URL', '');
        connections[name] = { ...connections[name], url: value };
      } else if (key.endsWith('_KEY')) {
        const name = key.replace('SUPABASE_', '').replace('_KEY', '');
        connections[name] = { ...connections[name], key: value };
      }
    }

    for (const [name, config] of Object.entries(connections)) {
      this.logger.warn(`Found supabase connection ${name}`)
      if (config.url && config.key) {
        this.clients.set(name, createClient(config.url, config.key));
        if (name === 'default') {
          this.defaultClient = this.clients.get(name);
        }
      } else {
        this.logger.warn(`Incomplete config for Supabase connection ${name}`);
      }
    }

    if (!this.defaultClient) {
      this.logger.warn('No default Supabase connection configured');
    }
  }

  private getClient(connection = 'default'): SupabaseClient {
    const client = this.clients.get(connection);
    if (!client) {
      throw new Error(`Supabase connection '${connection}' not found`);
    }
    return client;
  }

  async create(table: string, data: any, connection = 'default'): Promise<any> {
    const client = this.getClient(connection);
    const { data: result, error } = await client.from(table).insert(data);
    if (error) {
      this.logger.error(
        `Supabase create error on connection ${connection}`,
        error,
      );
      throw error;
    }
    return result;
  }

  async read(
    table: string,
    filter?: any,
    connection = 'default',
  ): Promise<any> {
    const client = this.getClient(connection);
    let query: any = client.from(table).select('*');
    if (filter && filter.field && filter.value !== undefined) {
      query = query.eq(filter.field, filter.value);
    }
    const { data, error } = await query;
    if (error) {
      this.logger.error(
        `Supabase read error on connection ${connection}`,
        error,
      );
      throw error;
    }
    return data;
  }

  async update(
    table: string,
    id: string | number,
    data: any,
    connection = 'default',
  ): Promise<any> {
    const client = this.getClient(connection);
    const { data: result, error } = await client
      .from(table)
      .update(data)
      .eq('id', id);
    if (error) {
      this.logger.error(
        `Supabase update error on connection ${connection}`,
        error,
      );
      throw error;
    }
    return result;
  }

  async delete(
    table: string,
    id: string | number,
    connection = 'default',
  ): Promise<any> {
    const client = this.getClient(connection);
    const { data: result, error } = await client
      .from(table)
      .delete()
      .eq('id', id);
    if (error) {
      this.logger.error(
        `Supabase delete error on connection ${connection}`,
        error,
      );
      throw error;
    }
    return result;
  }
}
