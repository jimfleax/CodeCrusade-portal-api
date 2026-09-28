/**
 * @file attendanceRoutes.ts
 * @description Routes for attendance
 * @architecture Route layer
 */

import { Router } from 'express';
import * as attendanceController from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.use(authenticate);

const validateBulkUpsert = [
  body('attendanceData').isArray().withMessage('attendanceData must be an array'),
  body('attendanceData.*.studentId').isMongoId().withMessage('Valid studentId required'),
  body('attendanceData.*.status').isIn(['PRESENT', 'ABSENT']).withMessage('Status must be PRESENT or ABSENT'),
  validateRequest
];

const validateUpdate = [
  body('status').isIn(['PRESENT', 'ABSENT']).withMessage('Status must be PRESENT or ABSENT'),
  validateRequest
];

router.get('/', authorize('SUPER_ADMIN', 'COORDINATOR'), attendanceController.getAttendances);
router.get('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), attendanceController.getAttendanceById);
router.get('/student/:studentId', authorize('SUPER_ADMIN', 'COORDINATOR'), attendanceController.getStudentAttendance);
router.get('/day/:dayId', authorize('SUPER_ADMIN', 'COORDINATOR'), attendanceController.getDayAttendance);

router.put('/day/:dayId', authorize('SUPER_ADMIN', 'COORDINATOR'), validateBulkUpsert, attendanceController.bulkUpsertAttendance);
router.patch('/:id', authorize('SUPER_ADMIN', 'COORDINATOR'), validateUpdate, attendanceController.updateAttendance);

export default router;
