import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import * as studentController from '../controllers/studentController';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

const validateStudent = [
  body('rollNo').notEmpty().withMessage('Roll number is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('branch').notEmpty().withMessage('Branch is required'),
  body('labId').isMongoId().withMessage('Valid lab ID is required'),
  validateRequest
];

router.get('/', authorize('SUPER_ADMIN', 'COORDINATOR'), studentController.getStudents);
router.get('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), studentController.getStudentById);

router.post('/', authorize('SUPER_ADMIN', 'COORDINATOR'), validateStudent, studentController.createStudent);
router.put('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), studentController.updateStudent);
router.delete('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), studentController.deleteStudent);

export default router;
