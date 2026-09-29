import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as analyticsService from '../services/analyticsService';
import { cache } from '../utils/cache';

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { labId, branch, dayId } = req.query as { labId?: string; branch?: string; dayId?: string };
  const cacheKey = `analytics:${req.originalUrl}`;
  
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({ status: 'success', data: cachedData });
  }

  const data = await analyticsService.getAnalyticsData({ labId, branch, dayId });
  cache.set(cacheKey, data);
  
  res.status(200).json({ status: 'success', data });
});
