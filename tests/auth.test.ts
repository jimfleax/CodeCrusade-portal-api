import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

config();

import authRoutes from '../src/routes/authRoutes';
import StaffUser from '../src/models/StaffUser';
import { errorHandler } from '../src/middlewares/errorMiddleware';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

describe('Auth Endpoints', () => {
  afterEach(async () => {
    await StaffUser.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return token', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await StaffUser.create({
        name: 'Test Admin',
        username: 'admin@test.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        active: true
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe('admin@test.com');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // ensure not exposed
    });

    it('should return 401 for invalid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      await StaffUser.create({
        name: 'Test Admin',
        username: 'admin@test.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        active: true
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for inactive user', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      await StaffUser.create({
        name: 'Test Admin',
        username: 'admin@test.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        active: false // Inactive
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INACTIVE_USER');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const token = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
      // create user so verifyToken passes
      const decoded = jwt.decode(token) as any;
      await StaffUser.create({
        _id: decoded.id,
        name: 'Test',
        username: 't@t.com',
        passwordHash: 'xx',
        role: 'SUPER_ADMIN',
        active: true
      });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user details when authenticated', async () => {
      const user = await StaffUser.create({
        name: 'Test',
        username: 'me@t.com',
        passwordHash: 'xx',
        role: 'SUPER_ADMIN',
        active: true
      });
      const token = jwt.sign({ id: user._id, role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '1d' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('me@t.com');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer invalidtoken`);
      
      expect(res.status).toBe(401);
    });
  });
});
