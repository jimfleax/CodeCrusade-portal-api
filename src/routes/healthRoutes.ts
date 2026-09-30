import { Router } from 'express';
import { checkHealth, clearCache } from '../controllers/healthController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', checkHealth);
router.post('/cache/clear', authenticate, authorize('SUPER_ADMIN', 'COORDINATOR'), clearCache);

export default router;
