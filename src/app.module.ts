import { Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EvlogModule } from 'evlog/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { openRouterConfig } from './openrouter/config/openrouter.config';
import { OpenRouterModule } from './openrouter/openrouter.module';
import { ScraperModule } from './scraper/scraper.module';
import { supabaseConfig } from './supabase/config/supabase.config';
import { SupabaseModule } from './supabase/supabase.module';
import { telegramConfig } from './telegram/config/telegram.config';
import { TelegramModule } from './telegram/telegram.module';

const interceptors: Provider[] = [
  {
    provide: APP_INTERCEPTOR,
    useClass: TransformInterceptor,
  },
];

const filters: Provider[] = [
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [openRouterConfig, telegramConfig, supabaseConfig],
    }),
    EvlogModule.forRoot(),
    CommonModule,
    AuthModule,
    ScraperModule,
    OpenRouterModule,
    TelegramModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, ...interceptors, ...filters],
})
export class AppModule {}
