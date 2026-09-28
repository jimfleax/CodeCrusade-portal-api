import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import StaffUser, { IStaffUser } from '../models/StaffUser';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';

export const authService = {
  async login(email: string, password: string):Promise<{ user: IStaffUser, token: string }> {
    const user = await StaffUser.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (!user.active) {
      throw new AppError(401, 'INACTIVE_USER', 'User account is inactive');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return { user, token };
  },

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string, role: string };
      const user = await StaffUser.findById(decoded.id);
      if (!user || !user.active) {
        throw new AppError(401, 'UNAUTHORIZED', 'Invalid token or inactive user');
      }
      return user;
    } catch (error) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token is invalid or expired');
    }
  }
};
