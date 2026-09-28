import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { DashboardService } from '../services/dashboard.service';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const data = await DashboardService.getOverview();
  res.status(200).json({ success: true, data });
});

export const getDays = asyncHandler(async (req: Request, res: Response) => {
  const data = await DashboardService.getDays();
  res.status(200).json({ success: true, data });
});

export const getLabs = asyncHandler(async (req: Request, res: Response) => {
  const dayId = req.query.dayId as string | undefined;
  const data = await DashboardService.getLabs(dayId);
  res.status(200).json({ success: true, data });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.params.studentId as string;
  const data = await DashboardService.getStudent(studentId);
  res.status(200).json({ success: true, data });
});

export const getMatrix = asyncHandler(async (req: Request, res: Response) => {
  const labId = req.query.labId as string | undefined;
  const branch = req.query.branch as string | undefined;
  const dayId = req.query.dayId as string | undefined;
  const data = await DashboardService.getMatrix(labId, branch, dayId);
  res.status(200).json({ success: true, data });
});

export const getDistribution = asyncHandler(async (req: Request, res: Response) => {
  const data = await DashboardService.getDistribution();
  res.status(200).json({ success: true, data });
});
