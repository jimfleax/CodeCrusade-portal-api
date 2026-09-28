import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import * as dayController from '../controllers/dayController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

const validateDay = [
  body('dayNumber').isInt().withMessage('Day number must be an integer'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('title').notEmpty().withMessage('Title is required'),
  validateRequest
];

router.get('/', authorize('SUPER_ADMIN', 'COORDINATOR'), dayController.getDays);
router.get('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), dayController.getDayById);

router.post('/', authorize('SUPER_ADMIN'), validateDay, dayController.createDay);
router.put('/:id', authorize('SUPER_ADMIN'), dayController.updateDay);
router.delete('/:id', authorize('SUPER_ADMIN'), dayController.deleteDay);

export default router;
