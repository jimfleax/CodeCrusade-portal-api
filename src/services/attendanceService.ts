/**
 * @file attendanceService.ts
 * @description Services for attendance
 * @architecture Service layer
 */

import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import Student from '../models/Student';
import Day from '../models/Day';
import { AppError } from '../utils/AppError';

export const getAttendances = async (filters: any) => {
  return Attendance.find(filters).populate('studentId dayId markedBy updatedBy');
};

export const getAttendanceById = async (id: string) => {
  const attendance = await Attendance.findById(id).populate('studentId dayId markedBy updatedBy');
  if (!attendance) throw new AppError(404, 'NOT_FOUND', 'Attendance not found');
  return attendance;
};

export const getStudentAttendance = async (studentId: string) => {
  return Attendance.find({ studentId }).populate('dayId markedBy updatedBy');
};

export const getDayAttendance = async (dayId: string) => {
  return Attendance.find({ dayId }).populate('studentId markedBy updatedBy');
};

export const bulkUpsertAttendance = async (dayId: string, attendanceData: { studentId: string; status: 'PRESENT' | 'ABSENT' }[], staffUserId: string) => {
  // Validate day exists
  const day = await Day.findById(dayId);
  if (!day) throw new AppError(404, 'NOT_FOUND', 'Day not found');

  // Validate no duplicates in payload
  const studentIds = attendanceData.map(a => a.studentId);
  const uniqueStudentIds = new Set(studentIds);
  if (uniqueStudentIds.size !== studentIds.length) {
    throw new AppError(400, 'BAD_REQUEST', 'Duplicate student IDs in payload');
  }


  
  const studentsFromDb = await Student.find({ _id: { $in: studentIds } });
  if (studentsFromDb.length !== uniqueStudentIds.size) {
    throw new AppError(400, 'BAD_REQUEST', 'One or more invalid student IDs in payload');
  }

  // Bulk upsert
  const bulkOps = attendanceData.map(record => ({
    updateOne: {
      filter: { dayId: new mongoose.Types.ObjectId(dayId), studentId: new mongoose.Types.ObjectId(record.studentId) },
      update: {
        $set: { status: record.status, updatedBy: new mongoose.Types.ObjectId(staffUserId) },
        $setOnInsert: { markedBy: new mongoose.Types.ObjectId(staffUserId) }
      },
      upsert: true
    }
  }));

  const result = await Attendance.bulkWrite(bulkOps);
  return result;
};

export const updateAttendance = async (id: string, status: 'PRESENT' | 'ABSENT', staffUserId: string) => {
  const attendance = await Attendance.findById(id);
  if (!attendance) throw new AppError(404, 'NOT_FOUND', 'Attendance not found');
  
  attendance.status = status;
  attendance.updatedBy = new mongoose.Types.ObjectId(staffUserId);
  
  await attendance.save();
  return attendance;
};
