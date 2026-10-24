import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let supabaseClient = null;

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  if (ENV.isSupabaseConfigured()) {
    try {
      // Use service role key if available for administrative operations, otherwise anon key
      const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;
      supabaseClient = createClient(ENV.SUPABASE_URL, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      logger.info('Connected to Supabase PostgreSQL & Storage', {
        url: ENV.SUPABASE_URL
      });
      return supabaseClient;
    } catch (error) {
      logger.error('Failed to initialize Supabase client', { error: error.message });
      return null;
    }
  }

  logger.warn('Supabase not configured in .env. Using resilient local data store.');
  return null;
};
