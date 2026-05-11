import { registerAs } from '@nestjs/config';

/**
 * Supabase configuration loaded from environment variables.
 *
 * Example .env entries:
 *   SUPABASE_URL=https://xyzcompany.supabase.co
 *   SUPABASE_KEY=public-anon-key
 */
export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
}));
