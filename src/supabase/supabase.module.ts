import { Global, Module } from '@nestjs/common';
import { SupabaseTypeOrmModule } from '../common/typeorm/typeorm.module';
import { SupabaseController } from './supabase.controller';
import { SupabaseService } from './supabase.service';

/**
 * Global module for Supabase integration.
 * Exposes SupabaseService for injection throughout the application.
 */
@Global()
@Module({
  imports: [SupabaseTypeOrmModule],
  providers: [SupabaseService],
  controllers: [SupabaseController],
  exports: [SupabaseService, SupabaseTypeOrmModule],
})
export class SupabaseModule {}
