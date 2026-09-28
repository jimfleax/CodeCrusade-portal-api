import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authService } from '../services/authService';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid email or password format');
  }

  const { email, password } = parseResult.data;
  const { user, token } = await authService.login(email, password);

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
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
  const user = req.user;
  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});
