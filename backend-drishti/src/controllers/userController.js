import { supabaseService } from '../services/supabaseService.js';

export const userController = {
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = await supabaseService.getUserPreferences(userId);
      res.json({
        success: true,
        data: preferences || {}
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await supabaseService.updateUserPreferences(userId, req.body);
      res.json({
        success: true,
        message: 'Accessibility preferences updated successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
};
