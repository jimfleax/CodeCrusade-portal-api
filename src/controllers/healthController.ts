import { Request, Response } from 'express';

export const checkHealth = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'CodeCrusade Portal API is running successfully'
  });
};
