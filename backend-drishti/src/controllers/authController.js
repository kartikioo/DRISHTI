import bcrypt from 'bcryptjs';
import { supabaseService } from '../services/supabaseService.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, full_name } = req.body;

      const existingUser = await supabaseService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newUser = await supabaseService.createUser({
        email,
        password_hash,
        full_name: full_name || 'Drishti User',
        role: 'user'
      });

      const token = generateToken(newUser);
      const preferences = await supabaseService.getUserPreferences(newUser.id);

      logger.info('New user registered successfully', { userId: newUser.id, email: newUser.email });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role
          },
          token,
          preferences
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await supabaseService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const token = generateToken(user);
      const preferences = await supabaseService.getUserPreferences(user.id);

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Signed in successfully.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          token,
          preferences
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await supabaseService.findUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
      }

      const preferences = await supabaseService.getUserPreferences(user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          preferences
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async guestSession(req, res, next) {
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const token = generateToken({
        id: guestId,
        email: `${guestId}@drishti.local`,
        role: 'guest'
      });

      res.json({
        success: true,
        message: 'Guest session initialized.',
        data: {
          user: {
            id: guestId,
            email: 'guest@drishti.local',
            full_name: 'Guest User',
            role: 'guest'
          },
          token,
          preferences: {
            speech_rate: 1.0,
            speech_pitch: 1.0,
            auto_speak: true,
            high_contrast: false,
            contrast_theme: 'standard-dark',
            sound_cues: true,
            haptic_feedback: true
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
