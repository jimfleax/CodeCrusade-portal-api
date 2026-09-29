import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.use(authenticate);
router.get('/', authorize('SUPER_ADMIN', 'COORDINATOR'), analyticsController.getAnalytics);

export default router;
