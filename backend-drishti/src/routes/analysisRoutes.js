import { Router } from 'express';
import { analysisController } from '../controllers/analysisController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Analyze image (can accept file upload via multipart/form-data or base64 JSON)
router.post(
  '/analyze',
  aiLimiter,
  optionalAuth,
  upload.any(),
  (req, res, next) => {
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === 'imageFile' || f.fieldname === 'image') || req.files[0];
    }
    next();
  },
  analysisController.analyze
);

// Get user history
router.get('/history', optionalAuth, analysisController.getHistory);

// Get single analysis
router.get('/:id', optionalAuth, analysisController.getById);

// Delete analysis
router.delete('/:id', requireAuth, analysisController.deleteById);

// Follow up inquiry
router.post('/:id/follow-up', aiLimiter, optionalAuth, analysisController.askFollowUp);

export default router;
