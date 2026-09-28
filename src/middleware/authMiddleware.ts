import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { authService } from '../services/authService';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.verifyToken(token);
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    
    next();
  };
};
