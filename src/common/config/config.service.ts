import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

/**
 * Thread‑safe configuration service.
 *
 * The service eagerly copies all environment variables into a private, immutable
 * map during construction. Subsequent reads are performed against this map, which
 * guarantees that no mutation can occur after the service is instantiated –
 * providing safe concurrent access in an async Node.js environment.
 *
 * All helper methods operate on the cached map, falling back to optional default
 * values when a key is missing.
 */
@Injectable()
export class CommonConfigService {
  /**
   * Internal immutable map of configuration values.
   */
  private readonly configMap: Record<string, string>;

  constructor(private readonly configService: NestConfigService) {
    // Populate the map once – this is safe because process.env is static for the
    // lifetime of the Node.js process.
    const map: Record<string, string> = {};
    for (const key of Object.keys(process.env)) {
      const value = process.env[key];
      if (value !== undefined && value !== null && value !== '') {
        map[key] = value;
      }
    }
    this.configMap = map;
  }

  /** Retrieve a raw string value. */
  get(key: string, defaultValue?: string): string | undefined {
    const value = this.configMap[key];
    return value !== undefined ? value : defaultValue;
  }

  /** Retrieve a numeric value, parsed with base‑10. */
  getNumber(key: string, defaultValue?: number): number | undefined {
    const raw = this.get(key);
    if (raw === undefined) return defaultValue;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /** Retrieve a boolean value (case‑insensitive "true"). */
  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const raw = this.get(key);
    if (raw === undefined) return defaultValue;
    return raw.toLowerCase() === 'true';
  }

  /** Check existence of a key. */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /** Return a shallow copy of the entire configuration map. */
  getAll(): Record<string, string> {
    return { ...this.configMap };
  }

  /** Return all configuration keys. */
  getKeys(): string[] {
    return Object.keys(this.configMap);
  }

  /** Return a map of entries that start with the given prefix. */
  getByPrefix(prefix: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.configMap)) {
      if (key.startsWith(prefix)) {
        result[key] = value;
      }
    }
    return result;
  }
}