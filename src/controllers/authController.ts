import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/authService';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new ValidationError('Invalid username or password format');
  }

  const { username, password } = parseResult.data;
  const { user, token } = await authService.login(username, password);

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      },
      token
    }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    }
  });
});
