import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import labRoutes from './labRoutes';
import dayRoutes from './dayRoutes';
import healthRoutes from './healthRoutes';
import attendanceRoutes from './attendanceRoutes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/labs', labRoutes);
router.use('/days', dayRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
