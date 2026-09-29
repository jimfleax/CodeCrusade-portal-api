import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { ApplicationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal Server Error';
  let details: any = undefined;

  if (err instanceof ApplicationError) {
    statusCode = err.statusCode;
    code = err.code;
    details = err.details;
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Duplicate field value entered';
  }

  if (statusCode >= 500) {
    logger.error(`Unexpected error: ${message}`, { 
      code, 
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  } else {
    logger.warn(`Expected failure: ${message}`, { code, details });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError('Route', req.originalUrl);
  next(error);
};
