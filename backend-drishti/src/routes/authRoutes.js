import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRegistration, validateLogin } from '../middleware/validateRequest.js';

const router = Router();

router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/me', requireAuth, authController.getMe);
router.post('/guest', authController.guestSession);

export default router;
