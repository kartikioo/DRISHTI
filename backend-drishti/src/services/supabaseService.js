import { getSupabaseClient } from '../config/supabase.js';
import { localStore } from '../database/localStore.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export const supabaseService = {
  /**
   * Upload image to Supabase Storage or save locally if Supabase is unconfigured
   */
  async uploadImage(fileBuffer, mimeType = 'image/jpeg', fileName = null) {
    const ext = mimeType.split('/')[1] || 'jpg';
    const uniqueName = fileName || `capture_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const bucket = ENV.SUPABASE_STORAGE_BUCKET;
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(uniqueName, fileBuffer, {
            contentType: mimeType,
            upsert: false
          });

        if (error) {
          logger.warn('Supabase storage upload error, falling back to local file storage', { error: error.message });
        } else {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(uniqueName);

          return {
            imageUrl: publicUrlData?.publicUrl || null,
            storageKey: uniqueName,
            provider: 'supabase'
          };
        }
      } catch (err) {
        logger.error('Error during Supabase upload', { error: err.message });
      }
    }

    // Local file storage fallback
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const localFilePath = path.join(UPLOADS_DIR, uniqueName);
      fs.writeFileSync(localFilePath, fileBuffer);
      return {
        imageUrl: `/uploads/${uniqueName}`,
        storageKey: uniqueName,
        provider: 'local'
      };
    } catch (err) {
      logger.error('Failed to save image locally', { error: err.message });
      // Inline base64 fallback
      return {
        imageUrl: `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
        storageKey: uniqueName,
        provider: 'inline'
      };
    }
  },

  /**
   * Save analysis result to Database (Supabase PostgreSQL with localStore fallback)
   */
  async saveAnalysis(analysisData) {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('analyses')
          .insert([
            {
              user_id: analysisData.user_id || null,
              image_url: analysisData.image_url || null,
              mode: analysisData.mode || 'general',
              custom_prompt: analysisData.custom_prompt || null,
              summary: analysisData.summary,
              detailed_description: analysisData.detailed_description,
              detected_text: analysisData.detected_text,
              detected_objects: analysisData.detected_objects,
              hazards: analysisData.hazards,
              navigation_advice: analysisData.navigation_advice,
              audio_transcript: analysisData.audio_transcript,
              ai_provider: analysisData.ai_provider,
              ai_model: analysisData.ai_model,
              latency_ms: analysisData.latency_ms,
              is_favorite: false
            }
          ])
          .select()
          .single();

        if (error) {
          logger.warn('Supabase insert failed, saving to local store', { error: error.message });
          return localStore.createAnalysis(analysisData);
        }

        return data;
      } catch (err) {
        logger.error('Exception during Supabase analysis save', { error: err.message });
        return localStore.createAnalysis(analysisData);
      }
    }

    return localStore.createAnalysis(analysisData);
  },

  /**
   * Get analyses for a user
   */
  async getUserAnalyses(userId, options = {}) {
    const supabase = getSupabaseClient();

    if (supabase && userId) {
      try {
        let query = supabase
          .from('analyses')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (options.mode && options.mode !== 'all') {
          query = query.eq('mode', options.mode);
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }

        const { data, count, error } = await query;
        if (!error && data) {
          return { data, count };
        }
      } catch (err) {
        logger.warn('Supabase fetch error, fallback to local store', { error: err.message });
      }
    }

    return localStore.getUserAnalyses(userId, options);
  },

  /**
   * Get single analysis by ID
   */
  async getAnalysisById(id, userId = null) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('analyses').select('*').eq('id', id);
        if (userId) {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await query.single();
        if (!error && data) return data;
      } catch (err) {
        // Fall back
      }
    }
    return localStore.getAnalysisById(id, userId);
  },

  /**
   * Delete analysis
   */
  async deleteAnalysis(id, userId = null) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('analyses').delete().eq('id', id);
        if (userId) {
          query = query.eq('user_id', userId);
        }
        const { error } = await query;
        if (!error) return true;
      } catch (err) {
        // Fall back
      }
    }
    return localStore.deleteAnalysis(id, userId);
  },

  /**
   * User operations
   */
  async findUserByEmail(email) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();
        if (!error && data) return data;
      } catch (err) {
        // fallback
      }
    }
    return localStore.findUserByEmail(email);
  },

  async createUser(userData) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              email: userData.email.toLowerCase(),
              password_hash: userData.password_hash,
              full_name: userData.full_name || 'Drishti User',
              role: userData.role || 'user'
            }
          ])
          .select()
          .single();

        if (!error && data) {
          // initialize default preferences
          await supabase.from('user_preferences').insert([
            {
              user_id: data.id,
              speech_rate: 1.0,
              speech_pitch: 1.0,
              auto_speak: true
            }
          ]);
          return data;
        }
      } catch (err) {
        logger.warn('Failed to insert user into Supabase, saving to local store', { error: err.message });
      }
    }
    return localStore.createUser(userData);
  },

  async getUserPreferences(userId) {
    const supabase = getSupabaseClient();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data;
      } catch (err) {
        // fallback
      }
    }
    return localStore.getUserPreferences(userId);
  },

  async updateUserPreferences(userId, updateData) {
    const supabase = getSupabaseClient();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .upsert({ user_id: userId, ...updateData })
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        // fallback
      }
    }
    return localStore.updateUserPreferences(userId, updateData);
  }
};
