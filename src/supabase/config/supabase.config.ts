import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { CommonConfigService } from '../../common/config/config.service';

// Instantiate CommonConfigService using Nest's ConfigService to access environment variables.
const commonConfigService = new CommonConfigService(new ConfigService());

/**
 * Supabase configuration loaded from environment variables.
 *
 * Example .env entries:
 *   SUPABASE_URL=https://xyzcompany.supabase.co
 *   SUPABASE_KEY=public-anon-key
 */
export const supabaseConfig = registerAs('supabase', () => ({
  url: commonConfigService.get('SUPABASE_URL') ?? '',
  key: commonConfigService.get('SUPABASE_KEY') ?? '',
}));
