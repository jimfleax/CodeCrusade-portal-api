import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

config();

import dashboardRoutes from '../src/routes/dashboard.routes';
import StaffUser from '../src/models/StaffUser';
import Student from '../src/models/Student';
import Lab from '../src/models/Lab';
import Day from '../src/models/Day';
import Attendance from '../src/models/Attendance';
import { errorHandler } from '../src/middlewares/errorMiddleware';

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);
app.use(errorHandler);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

describe('Phase 5 Endpoints (Dashboard)', () => {
  let token = '';

  beforeAll(async () => {
    const user = await StaffUser.create({
      name: 'Super Admin',
      email: 'super_dash@admin.com',
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
    await Attendance.deleteMany({});
  });

  async function seedData() {
    const lab = await Lab.create({ name: 'Lab 1', code: 'L1' });
    const student = await Student.create({ rollNo: '123', name: 'John Doe', email: 'john@doe.com', branch: 'CS', labId: lab._id });
    const student2 = await Student.create({ rollNo: '124', name: 'Jane Doe', email: 'jane@doe.com', branch: 'IT', labId: lab._id });
    const day = await Day.create({ dayNumber: 1, date: new Date(), title: 'Day 1', status: 'COMPLETED' });
    
    await Attendance.create({ dayId: day._id, studentId: student._id, status: 'PRESENT', markedBy: new mongoose.Types.ObjectId() });
    await Attendance.create({ dayId: day._id, studentId: student2._id, status: 'ABSENT', markedBy: new mongoose.Types.ObjectId() });
    return { lab, student, student2, day };
  }

  it('should get overview', async () => {
    await seedData();
    const res = await request(app).get('/api/dashboard/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalStudents).toBe(2);
    expect(res.body.data.daysCreated).toBe(1);
    expect(res.body.data.daysCompleted).toBe(1);
    expect(res.body.data.present).toBe(1);
  });

  it('should get days', async () => {
    await seedData();
    const res = await request(app).get('/api/dashboard/days').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].present).toBe(1);
  });

  it('should get labs', async () => {
    const { day } = await seedData();
    // without dayId
    let res = await request(app).get('/api/dashboard/labs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].present).toBe(1);
    
    // with dayId
    res = await request(app).get(`/api/dashboard/labs?dayId=${day._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].present).toBe(1);
  });
  
  it('should get matrix', async () => {
    const { lab, day } = await seedData();
    
    // without filters
    let res = await request(app).get('/api/dashboard/matrix').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.students.length).toBe(2);
    expect(res.body.data.days.length).toBe(1);
    
    // with labId, branch, dayId filters
    res = await request(app).get(`/api/dashboard/matrix?labId=${lab._id}&branch=CS&dayId=${day._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.students.length).toBe(1);
  });
  
  it('should get distribution', async () => {
    await seedData();
    const res = await request(app).get('/api/dashboard/distribution').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // expect distribution array
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get student stats', async () => {
    const { student } = await seedData();
    const res = await request(app).get(`/api/dashboard/students/${student._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.name).toBe('John Doe');
    expect(res.body.data.presentCount).toBe(1);
  });

  it('should return 400 for invalid student id', async () => {
    const res = await request(app).get('/api/dashboard/students/invalid_id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent student', async () => {
    const res = await request(app).get(`/api/dashboard/students/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
