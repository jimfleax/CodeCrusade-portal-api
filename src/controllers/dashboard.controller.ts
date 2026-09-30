import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { DashboardService } from '../services/dashboard.service';
import { cache } from '../utils/cache';
import { ForbiddenError } from '../utils/errors';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `dashboard:overview:${req.originalUrl}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.status(200).json({ success: true, data: cachedData });

  const data = await DashboardService.getOverview();
  cache.set(cacheKey, data);
  res.status(200).json({ success: true, data });
});

export const getDays = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `dashboard:days:${req.originalUrl}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.status(200).json({ success: true, data: cachedData });

  const data = await DashboardService.getDays();
  cache.set(cacheKey, data);
  res.status(200).json({ success: true, data });
});

export const getLabs = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `dashboard:labs:${req.originalUrl}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.status(200).json({ success: true, data: cachedData });

  const dayId = req.query.dayId as string | undefined;
  const data = await DashboardService.getLabs(dayId);
  cache.set(cacheKey, data);
  res.status(200).json({ success: true, data });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.params.studentId as string;
  const user = (req as any).user;
  const cacheKey = `dashboard:student:${req.originalUrl}`;
  
  let data;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    data = cachedData;
  } else {
    data = await DashboardService.getStudent(studentId);
    cache.set(cacheKey, data);
  }

  if (user && user.role === 'COORDINATOR' && user.labId) {
    const studentLabId = data.student.labId?._id?.toString() || data.student.labId?.toString();
    if (studentLabId !== user.labId.toString()) {
      throw new ForbiddenError('You can only view students assigned to your own lab.');
    }
  }

  res.status(200).json({ success: true, data });
});

export const getMatrix = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `dashboard:matrix:${req.originalUrl}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.status(200).json({ success: true, data: cachedData });

  const labId = req.query.labId as string | undefined;
  const branch = req.query.branch as string | undefined;
  const dayId = req.query.dayId as string | undefined;
  const data = await DashboardService.getMatrix(labId, branch, dayId);
  cache.set(cacheKey, data);
  res.status(200).json({ success: true, data });
});

export const getDistribution = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `dashboard:distribution:${req.originalUrl}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.status(200).json({ success: true, data: cachedData });

  const data = await DashboardService.getDistribution();
  cache.set(cacheKey, data);
  res.status(200).json({ success: true, data });
});
