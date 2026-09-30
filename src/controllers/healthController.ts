import { Request, Response } from 'express';
import { cache } from '../utils/cache';

export const checkHealth = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'CodeCrusade Portal API is running successfully'
  });
};

/** POST /api/health/cache/clear  — SUPER_ADMIN or main coordinator (no labId) */
export const clearCache = (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.role === 'COORDINATOR' && user?.labId) {
    res.status(403).json({ success: false, error: { message: 'Only the main coordinator can clear the cache.' } });
    return;
  }
  cache.clear();
  res.status(200).json({ success: true, message: 'In-memory cache cleared.' });
};
