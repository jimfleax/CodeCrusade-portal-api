import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import * as labController from '../controllers/labController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

const validateLab = [
  body('name').notEmpty().withMessage('Name is required'),
  validateRequest
];

router.get('/', authorize('SUPER_ADMIN', 'COORDINATOR'), labController.getLabs);
router.get('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), labController.getLabById);

router.post('/', authorize('SUPER_ADMIN', 'COORDINATOR'), validateLab, labController.createLab);
router.put('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), labController.updateLab);
router.delete('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), labController.deleteLab);

export default router;
