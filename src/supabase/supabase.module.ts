import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseController } from './supabase.controller';
import { SupabaseTypeOrmModule } from '../common/typeorm/typeorm.module';

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
