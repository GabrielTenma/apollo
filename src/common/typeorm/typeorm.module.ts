import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FeatureConfigEntity } from '../../supabase/entities/feature-config.entity';
import { ScrapedDataEntity } from '../../supabase/entities/scraped-data.entity';
import { ScrapingSourceEntity } from '../../supabase/entities/scraping-source.entity';
import { TelegramBotEntity } from '../../supabase/entities/telegram-bot.entity';
import { TelegramChatEntity } from '../../supabase/entities/telegram-chat.entity';
import { TelegramUpdateEntity } from '../../supabase/entities/telegram-update.entity';
import { UserEntity } from '../../supabase/entities/user.entity';
import { UserAuthProviderEntity } from '../../supabase/entities/user-auth-provider.entity';
import { UserSessionEntity } from '../../supabase/entities/user-session.entity';
import { SupabaseOrmService } from './typeorm.service';

/**
 * Detect the TypeORM dialect from a connection URL.
 *
 * @param url - The raw DATABASE_URL string.
 * @returns One of `'postgres' | 'sqlite' | 'mysql' | 'mariadb' | 'mssql' | 'oracle'`.
 */
function resolveDialect(
  url: string,
): 'postgres' | 'sqlite' | 'mysql' | 'mariadb' | 'mssql' | 'oracle' {
  const lower = url.toLowerCase().trim();
  if (lower.startsWith('sqlite:')) return 'sqlite';
  if (lower.startsWith('mysql:')) return 'mysql';
  if (lower.startsWith('mariadb:')) return 'mariadb';
  if (lower.startsWith('mssql:')) return 'mssql';
  if (lower.startsWith('oracle:')) return 'oracle';
  // Default to postgres for postgresql:// style URLs
  return 'postgres';
}

/**
 * Module that sets up TypeORM for the configured database.
 *
 * The dialect is resolved dynamically from the `DATABASE_URL` environment variable
 * so the same code path works for PostgreSQL (Supabase) and SQLite (local dev).
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL') ?? '';
        const dialect = resolveDialect(url);
        const base: Record<string, any> = {
          type: dialect,
          url,
          synchronize: false,
          autoLoadEntities: true,
        };
        if (dialect === 'sqlite') {
          base.extra = { verbose: false };
        }
        return base;
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      UserAuthProviderEntity,
      UserSessionEntity,
      TelegramBotEntity,
      TelegramChatEntity,
      TelegramUpdateEntity,
      ScrapingSourceEntity,
      ScrapedDataEntity,
      FeatureConfigEntity,
    ]),
  ],
  providers: [
    {
      provide: 'DATA_SOURCE',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [DataSource],
    },
    SupabaseOrmService,
  ],
  exports: [TypeOrmModule, 'DATA_SOURCE', SupabaseOrmService],
})
export class SupabaseTypeOrmModule {}
