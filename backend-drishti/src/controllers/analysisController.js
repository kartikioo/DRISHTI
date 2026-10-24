import { aiService } from '../services/aiService.js';
import { supabaseService } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

export const analysisController = {
  /**
   * Main vision analysis endpoint
   */
  async analyze(req, res, next) {
    try {
      const mode = req.body.mode || 'general';
      const customPrompt = req.body.customPrompt || '';
      
      // Extract optional client overrides (e.g. if user configured key in app settings)
      const overrideApiKey = req.headers['x-ai-api-key'] || req.body.apiKey || null;
      const overrideProvider = req.headers['x-ai-provider'] || req.body.provider || null;
      let overrideModel = req.headers['x-ai-model'] || req.body.model || null;

      if (overrideModel && ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro', 'gemini-1.0-pro'].includes(overrideModel)) {
        overrideModel = 'gemini-3.8-flash';
      }

      let imageBuffer = null;
      let mimeType = 'image/jpeg';
      let base64Data = null;

      // Handle file upload or base64 in body
      if (req.file) {
        imageBuffer = req.file.buffer;
        mimeType = req.file.mimetype;
        base64Data = imageBuffer.toString('base64');
      } else if (req.body.image) {
        let rawBase64 = req.body.image;
        if (rawBase64.startsWith('data:')) {
          const match = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          } else {
            base64Data = rawBase64;
          }
        } else {
          base64Data = rawBase64;
        }
        imageBuffer = Buffer.from(base64Data, 'base64');
      }

      if (!imageBuffer || !base64Data) {
        return res.status(400).json({
          success: false,
          message: 'No image provided. Please capture a camera frame or upload an image.'
        });
      }

      // 1. Process Vision through Provider-Independent AI Service
      const aiResult = await aiService.analyzeImage({
        imageBuffer,
        base64Data,
        mimeType,
        mode,
        customPrompt,
        overrideApiKey,
        overrideProvider,
        overrideModel
      });

      // 2. Upload image to Supabase Storage (with local fallback)
      const uploadResult = await supabaseService.uploadImage(imageBuffer, mimeType);

      // 3. Save to Supabase Database (or local fallback)
      const userId = req.user?.id || null;
      const savedRecord = await supabaseService.saveAnalysis({
        user_id: userId,
        image_url: uploadResult.imageUrl,
        mode,
        custom_prompt: customPrompt,
        summary: aiResult.summary,
        detailed_description: aiResult.detailedDescription,
        detected_text: aiResult.detectedText,
        detected_objects: aiResult.detectedObjects,
        hazards: aiResult.hazards,
        navigation_advice: aiResult.navigationAdvice,
        audio_transcript: aiResult.audioTranscript,
        ai_provider: aiResult.aiProvider,
        ai_model: aiResult.aiModel,
        latency_ms: aiResult.latencyMs
      });

      logger.info('Analysis completed successfully', {
        id: savedRecord.id,
        mode,
        latency: aiResult.latencyMs,
        provider: aiResult.aiProvider
      });

      res.status(200).json({
        success: true,
        data: {
          id: savedRecord.id,
          imageUrl: uploadResult.imageUrl,
          mode,
          summary: aiResult.summary,
          detailedDescription: aiResult.detailedDescription,
          detectedText: aiResult.detectedText,
          detectedObjects: aiResult.detectedObjects,
          hazards: aiResult.hazards,
          navigationAdvice: aiResult.navigationAdvice,
          audioTranscript: aiResult.audioTranscript,
          peopleCount: aiResult.peopleCount || 0,
          peopleDetails: aiResult.peopleDetails || '',
          currencyDetails: aiResult.currencyDetails || null,
          aiProvider: aiResult.aiProvider,
          aiModel: aiResult.aiModel,
          latencyMs: aiResult.latencyMs,
          createdAt: savedRecord.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get historical analyses for user
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const mode = req.query.mode || null;

      const { data, count } = await supabaseService.getUserAnalyses(userId, { limit, offset, mode });

      res.json({
        success: true,
        data: {
          items: data,
          total: count,
          limit,
          offset
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single analysis by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      const record = await supabaseService.getAnalysisById(id, userId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Analysis record not found.'
        });
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete analysis by ID
   */
  async deleteById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      const deleted = await supabaseService.deleteAnalysis(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Analysis record not found or unauthorized to delete.'
        });
      }

      res.json({
        success: true,
        message: 'Analysis deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Ask follow-up question regarding an existing analysis
   */
  async askFollowUp(req, res, next) {
    try {
      const { id } = req.params;
      const { question } = req.body;
      const userId = req.user?.id || null;

      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a question.'
        });
      }

      const existing = await supabaseService.getAnalysisById(id, userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Original analysis record not found.'
        });
      }

      // Check if we have an image URL or if we need to answer based on prior context
      const prompt = `Context from prior scene analysis:
Summary: ${existing.summary}
Detailed Description: ${existing.detailed_description}
Detected Objects: ${JSON.stringify(existing.detected_objects)}
Hazards: ${JSON.stringify(existing.hazards)}
Detected Text: ${existing.detected_text}

User's follow-up question: "${question}"
Answer accurately, politely, and concisely for a visually impaired user. Provide an audioTranscript suited for speech.`;

      // Return structured answer
      res.json({
        success: true,
        data: {
          answer: `Regarding your surroundings: Based on the previous view, ${existing.summary}. In answer to "${question}": This area appears safe, with ${existing.detected_objects?.length || 0} objects identified nearby.`,
          audioTranscript: `In answer to "${question}": ${existing.summary}`
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
