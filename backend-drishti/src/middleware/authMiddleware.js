import { verifyToken } from '../utils/jwt.js';
import { supabaseService } from '../services/supabaseService.js';

/**
 * Strict authentication: Request must have a valid JWT
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please sign in again.'
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication: If token is provided, attach user; otherwise proceed as guest
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    next();
  } catch (error) {
    // In optional auth, do not block the request
    next();
  }
};
