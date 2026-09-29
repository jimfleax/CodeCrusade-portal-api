import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import { authService } from '../services/authService';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AuthenticationError('Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.verifyToken(token);
    
    // @ts-ignore
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    if (!roles.includes((req as any).user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    
    next();
  };
};
