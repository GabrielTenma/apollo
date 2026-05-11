import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseController } from './supabase.controller';

/**
 * Global module for Supabase integration.
 * Exposes SupabaseService for injection throughout the application.
 */
@Global()
@Module({
  providers: [SupabaseService],
  controllers: [SupabaseController],
  exports: [SupabaseService],
})
export class SupabaseModule {}
