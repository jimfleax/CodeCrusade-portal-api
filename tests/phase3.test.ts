import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

config();

import studentRoutes from '../src/routes/studentRoutes';
import labRoutes from '../src/routes/labRoutes';
import dayRoutes from '../src/routes/dayRoutes';
import StaffUser from '../src/models/StaffUser';
import Student from '../src/models/Student';
import Lab from '../src/models/Lab';
import Day from '../src/models/Day';
import { errorHandler } from '../src/middlewares/errorMiddleware';

const app = express();
app.use(express.json());
app.use('/api/students', studentRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/days', dayRoutes);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

describe('Phase 3 Endpoints (Lab, Student, Day)', () => {
  let token = '';

  beforeAll(async () => {
    const user = await StaffUser.create({
      name: 'Super Admin',
      username: 'super@admin.com',
      passwordHash: 'xx',
      role: 'SUPER_ADMIN',
      active: true
    });
    token = jwt.sign({ id: user._id, role: 'SUPER_ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
  });

  afterAll(async () => {
    await StaffUser.deleteMany({});
  });

  afterEach(async () => {
    await Student.deleteMany({});
    await Lab.deleteMany({});
    await Day.deleteMany({});
  });

  describe('Lab Endpoints', () => {
    it('should create a lab', async () => {
      const res = await request(app)
        .post('/api/labs')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Lab 1', code: 'L1', description: 'Test Lab' });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Lab 1');
    });

    it('should get labs', async () => {
      await Lab.create({ name: 'Lab 1', code: 'L1' });
      const res = await request(app)
        .get('/api/labs')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get a lab by id', async () => {
      const lab = await Lab.create({ name: 'Lab 1', code: 'L1' });
      const res = await request(app)
        .get(`/api/labs/${lab._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Lab 1');
    });

    it('should update a lab', async () => {
      const lab = await Lab.create({ name: 'Lab 1', code: 'L1' });
      const res = await request(app)
        .put(`/api/labs/${lab._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Lab 2' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Lab 2');
    });

    it('should delete a lab', async () => {
      const lab = await Lab.create({ name: 'Lab 1', code: 'L1' });
      const res = await request(app)
        .delete(`/api/labs/${lab._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });

  describe('Student Endpoints', () => {
    let labId: string;
    beforeEach(async () => {
      const lab = await Lab.create({ name: 'Lab 1', code: 'L1' });
      labId = (lab._id as mongoose.Types.ObjectId).toString();
    });

    it('should create a student', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({ rollNo: '123', name: 'John Doe', email: 'john@doe.com', branch: 'CS', labId });
      expect(res.status).toBe(201);
      expect(res.body.data.rollNo).toBe('123');
    });

    it('should get students', async () => {
      await Student.create({ rollNo: '123', name: 'John Doe', email: 'john@doe.com', branch: 'CS', labId });
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get a student by id', async () => {
      const student = await Student.create({ rollNo: '123', name: 'John Doe', email: 'john@doe.com', branch: 'CS', labId });
      const res = await request(app)
        .get(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John Doe');
    });

    it('should update a student', async () => {
      const student = await Student.create({ rollNo: '123', name: 'John Doe', email: 'john@doe.com', branch: 'CS', labId });
      const res = await request(app)
        .put(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Jane Doe' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Jane Doe');
    });

    it('should delete a student', async () => {
      const student = await Student.create({ rollNo: '123', name: 'John Doe', email: 'john@doe.com', branch: 'CS', labId });
      const res = await request(app)
        .delete(`/api/students/${student._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });

  describe('Day Endpoints', () => {
    it('should create a day', async () => {
      const res = await request(app)
        .post('/api/days')
        .set('Authorization', `Bearer ${token}`)
        .send({ dayNumber: 1, date: '2023-01-01T00:00:00.000Z', title: 'Day 1' });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Day 1');
    });

    it('should get days', async () => {
      await Day.create({ dayNumber: 1, date: new Date(), title: 'Day 1' });
      const res = await request(app)
        .get('/api/days')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should get a day by id', async () => {
      const day = await Day.create({ dayNumber: 1, date: new Date(), title: 'Day 1' });
      const res = await request(app)
        .get(`/api/days/${day._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Day 1');
    });

    it('should update a day', async () => {
      const day = await Day.create({ dayNumber: 1, date: new Date(), title: 'Day 1' });
      const res = await request(app)
        .put(`/api/days/${day._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Day 2' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Day 2');
    });

    it('should delete a day', async () => {
      const day = await Day.create({ dayNumber: 1, date: new Date(), title: 'Day 1' });
      const res = await request(app)
        .delete(`/api/days/${day._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });
});
