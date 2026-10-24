import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/preferences', requireAuth, userController.getPreferences);
router.put('/preferences', requireAuth, userController.updatePreferences);

export default router;
