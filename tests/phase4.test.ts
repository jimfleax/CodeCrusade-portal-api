import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import attendanceRoutes from '../src/routes/attendanceRoutes';
import StaffUser from '../src/models/StaffUser';
import Student from '../src/models/Student';
import Day from '../src/models/Day';
import Lab from '../src/models/Lab';
import Attendance from '../src/models/Attendance';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
// Mock req.user for tests before routes
app.use((req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
      (req as any).user = decoded;
    } catch (err) {
      // ignore
    }
  }
  next();
});
app.use('/api/attendance', attendanceRoutes);

// Generic error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'test_secret');
};

describe('Phase 4 - Attendance System', () => {
  let adminToken: string;
  let adminId: string;
  let student1Id: string;
  let student2Id: string;
  let dayId: string;
  let attendance1Id: string;

  beforeAll(async () => {
    await Day.deleteMany({});
    await Student.deleteMany({});
    await StaffUser.deleteMany({});
    await Attendance.deleteMany({});
    await Lab.deleteMany({});

    const admin = await StaffUser.create({
      name: 'Admin User',
      username: 'admin.att@test.com',
      passwordHash: 'password123',
      role: 'SUPER_ADMIN'
    });
    adminId = (admin._id as any).toString();
    adminToken = generateToken(adminId, 'SUPER_ADMIN');

    const day = await Day.create({
      dayNumber: 1,
      date: new Date(),
      title: 'Day 1',
      status: 'UPCOMING'
    });
    dayId = (day._id as any).toString();

    const lab = await Lab.create({
      name: 'Lab 1',
      code: 'L1',
      description: 'Lab 1 desc'
    });

    const student1 = await Student.create({
      rollNo: 'R1',
      name: 'S1',
      email: 's1@test.com',
      branch: 'CS',
      labId: lab._id
    });
    student1Id = (student1._id as any).toString();

    const student2 = await Student.create({
      rollNo: 'R2',
      name: 'S2',
      email: 's2@test.com',
      branch: 'CS',
      labId: lab._id
    });
    student2Id = (student2._id as any).toString();
  });

  afterAll(async () => {
    await Day.deleteMany({});
    await Student.deleteMany({});
    await StaffUser.deleteMany({});
    await Attendance.deleteMany({});
    await Lab.deleteMany({});
  });

  it('should prevent bulk upsert with duplicate students', async () => {
    expect.assertions(1);
    const res = await request(app)
      .put(`/api/attendance/day/${dayId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attendanceData: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student1Id, status: 'ABSENT' }
        ]
      });
    expect(res.status).toBe(400);
  });

  it('should prevent bulk upsert if not all students are included', async () => {
    expect.assertions(1);
    const res = await request(app)
      .put(`/api/attendance/day/${dayId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attendanceData: [
          { studentId: student1Id, status: 'PRESENT' }
        ]
      });
    expect(res.status).toBe(400);
  });

  it('should allow bulk upsert if all students are included', async () => {
    expect.assertions(2);
    const res = await request(app)
      .put(`/api/attendance/day/${dayId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attendanceData: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student2Id, status: 'ABSENT' }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should get attendance by dayId', async () => {
    expect.assertions(2);
    const res = await request(app)
      .get(`/api/attendance/day/${dayId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    attendance1Id = res.body.data[0]._id;
  });

  it('should update single attendance', async () => {
    expect.assertions(2);
    const res = await request(app)
      .patch(`/api/attendance/${attendance1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ABSENT' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ABSENT');
  });

  it('should get all attendances', async () => {
    expect.assertions(2);
    const res = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('should get attendance by id', async () => {
    expect.assertions(2);
    const res = await request(app)
      .get(`/api/attendance/${attendance1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(attendance1Id);
  });

  it('should get student attendance', async () => {
    expect.assertions(2);
    const res = await request(app)
      .get(`/api/attendance/student/${student1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
