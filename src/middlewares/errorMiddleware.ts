import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Duplicate field value entered';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(404, 'NOT_FOUND', `Not Found - ${req.originalUrl}`);
  next(error);
};
