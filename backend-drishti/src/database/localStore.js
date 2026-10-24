import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'drishti_data.json');

// Initialize store file if it does not exist
const initStore = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      users: [],
      user_preferences: [],
      analyses: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

const readStore = () => {
  try {
    initStore();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    logger.error('Error reading localStore data file', { error: error.message });
    return { users: [], user_preferences: [], analyses: [] };
  }
};

const writeStore = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Error writing localStore data file', { error: error.message });
  }
};

export const localStore = {
  // Users
  findUserByEmail(email) {
    const data = readStore();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById(id) {
    const data = readStore();
    return data.users.find((u) => u.id === id) || null;
  },

  createUser(userData) {
    const data = readStore();
    const newUser = {
      id: crypto.randomUUID(),
      email: userData.email,
      password_hash: userData.password_hash,
      full_name: userData.full_name || 'Drishti User',
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.users.push(newUser);
    
    // Create default preferences
    const defaultPrefs = {
      id: crypto.randomUUID(),
      user_id: newUser.id,
      speech_rate: 1.0,
      speech_pitch: 1.0,
      voice_name: '',
      auto_speak: true,
      high_contrast: false,
      contrast_theme: 'standard-dark',
      font_size: 'normal',
      sound_cues: true,
      haptic_feedback: true,
      preferred_mode: 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.user_preferences.push(defaultPrefs);
    
    writeStore(data);
    return newUser;
  },

  // Preferences
  getUserPreferences(userId) {
    const data = readStore();
    return data.user_preferences.find((p) => p.user_id === userId) || null;
  },

  updateUserPreferences(userId, updateData) {
    const data = readStore();
    let prefIndex = data.user_preferences.findIndex((p) => p.user_id === userId);
    if (prefIndex === -1) {
      const newPref = {
        id: crypto.randomUUID(),
        user_id: userId,
        speech_rate: 1.0,
        speech_pitch: 1.0,
        voice_name: '',
        auto_speak: true,
        high_contrast: false,
        contrast_theme: 'standard-dark',
        font_size: 'normal',
        sound_cues: true,
        haptic_feedback: true,
        preferred_mode: 'general',
        ...updateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      data.user_preferences.push(newPref);
      writeStore(data);
      return newPref;
    }

    data.user_preferences[prefIndex] = {
      ...data.user_preferences[prefIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    writeStore(data);
    return data.user_preferences[prefIndex];
  },

  // Analyses
  createAnalysis(analysisData) {
    const data = readStore();
    const newRecord = {
      id: crypto.randomUUID(),
      user_id: analysisData.user_id || null,
      image_url: analysisData.image_url || null,
      mode: analysisData.mode || 'general',
      custom_prompt: analysisData.custom_prompt || null,
      summary: analysisData.summary || '',
      detailed_description: analysisData.detailed_description || '',
      detected_text: analysisData.detected_text || '',
      detected_objects: analysisData.detected_objects || [],
      hazards: analysisData.hazards || [],
      navigation_advice: analysisData.navigation_advice || '',
      audio_transcript: analysisData.audio_transcript || '',
      ai_provider: analysisData.ai_provider || 'gemini',
      ai_model: analysisData.ai_model || 'gemini-1.5-flash',
      latency_ms: analysisData.latency_ms || 0,
      is_favorite: Boolean(analysisData.is_favorite),
      metadata: analysisData.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.analyses.unshift(newRecord);
    writeStore(data);
    return newRecord;
  },

  getUserAnalyses(userId, { limit = 20, offset = 0, mode = null } = {}) {
    const data = readStore();
    let userRecords = data.analyses.filter((a) => !userId || a.user_id === userId);
    if (mode && mode !== 'all') {
      userRecords = userRecords.filter((a) => a.mode === mode);
    }
    const total = userRecords.length;
    const paginated = userRecords.slice(offset, offset + limit);
    return { data: paginated, count: total };
  },

  getAnalysisById(id, userId = null) {
    const data = readStore();
    const record = data.analyses.find((a) => a.id === id);
    if (!record) return null;
    if (userId && record.user_id && record.user_id !== userId) {
      return null;
    }
    return record;
  },

  deleteAnalysis(id, userId = null) {
    const data = readStore();
    const index = data.analyses.findIndex((a) => a.id === id);
    if (index === -1) return false;
    if (userId && data.analyses[index].user_id && data.analyses[index].user_id !== userId) {
      return false;
    }
    data.analyses.splice(index, 1);
    writeStore(data);
    return true;
  }
};
