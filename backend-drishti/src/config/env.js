import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'https://drishti-beta-six.vercel.app',
  JWT_SECRET: process.env.JWT_SECRET || 'drishti_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'drishti-images',
  
  // Provider-Independent AI Configuration
  AI_PROVIDER: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  AI_API_KEY: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-3.8-flash',
  AI_API_URL: process.env.AI_API_URL || '',
  
  // Rate Limits
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  AI_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '50', 10),
  
  isSupabaseConfigured() {
    return Boolean(
      this.SUPABASE_URL &&
      this.SUPABASE_URL.startsWith('http') &&
      this.SUPABASE_ANON_KEY &&
      !this.SUPABASE_URL.includes('your-supabase-project')
    );
  },
  
  isAiConfigured() {
    return Boolean(this.AI_API_KEY && this.AI_API_KEY.trim().length > 5);
  }
};
