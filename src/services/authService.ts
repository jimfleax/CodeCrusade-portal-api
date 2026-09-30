import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import StaffUser, { IStaffUser } from '../models/StaffUser';
import { AuthenticationError, ApplicationError } from '../utils/errors';
import { config } from '../config/env';

export const authService = {
  async login(username: string, password: string):Promise<{ user: IStaffUser, token: string }> {
    const user = await StaffUser.findOne({ username }).select('+passwordHash');
    if (!user) {
      throw new ApplicationError('Invalid username or password', 'INVALID_CREDENTIALS', 401);
    }
    if (!user.active) {
      throw new ApplicationError('User account is inactive', 'INACTIVE_USER', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApplicationError('Invalid username or password', 'INVALID_CREDENTIALS', 401);
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
        throw new AuthenticationError('Invalid token or inactive user');
      }
      return user;
    } catch (error) {
      throw new AuthenticationError('Token is invalid or expired');
    }
  }
};
