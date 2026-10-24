import { ENV } from '../config/env.js';
import { aiService } from '../services/aiService.js';
import { getSupabaseClient } from '../config/supabase.js';

export const healthController = {
  check(req, res) {
    const supabaseConnected = Boolean(getSupabaseClient());
    const aiStatus = aiService.getStatus();

    res.json({
      status: 'ok',
      service: 'Drishti Accessibility API',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
      database: {
        provider: supabaseConnected ? 'supabase-postgresql' : 'local-resilient-store',
        connected: true
      },
      ai: {
        provider: aiStatus.provider,
        model: aiStatus.model,
        configured: aiStatus.isConfigured
      }
    });
  }
};
