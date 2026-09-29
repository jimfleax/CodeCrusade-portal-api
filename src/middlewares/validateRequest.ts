import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error?.issues || error?.errors) {
        const errs = error.issues || error.errors || [];
        const message = errs.map((err: any) => err.message).join(', ');
        return next(new ValidationError(message));
      }
      return next(error);
    }
  };
};
