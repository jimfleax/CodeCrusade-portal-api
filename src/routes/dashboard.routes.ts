import { Router } from 'express';
import { getOverview, getDays, getLabs, getStudent, getMatrix, getDistribution } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'COORDINATOR'));

router.get('/overview', getOverview);
router.get('/days', getDays);
router.get('/labs', getLabs);
router.get('/students/:studentId', getStudent);
router.get('/matrix', getMatrix);
router.get('/distribution', getDistribution);

export default router;
