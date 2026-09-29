import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as analyticsService from '../services/analyticsService';

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { labId, branch, dayId } = req.query as { labId?: string; branch?: string; dayId?: string };
  const data = await analyticsService.getAnalyticsData({ labId, branch, dayId });
  res.status(200).json({ status: 'success', data });
});
