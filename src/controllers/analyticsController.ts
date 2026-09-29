import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as analyticsService from '../services/analyticsService';

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getAnalyticsData();
  res.status(200).json({ status: 'success', data });
});
