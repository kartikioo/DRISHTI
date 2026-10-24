import app from './app.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { getSupabaseClient } from './config/supabase.js';

const PORT = ENV.PORT;

const startServer = () => {
  // Test/initialize Supabase connection
  getSupabaseClient();

  app.listen(PORT, () => {
    logger.info(`👁️ DRISHTI Backend Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`AI Provider: ${ENV.AI_PROVIDER} (Configured: ${ENV.isAiConfigured()})`);
    logger.info(`Supabase PostgreSQL: ${ENV.isSupabaseConfigured() ? 'Connected' : 'Using resilient local storage'}`);
  });
};

startServer();
