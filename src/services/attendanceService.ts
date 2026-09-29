/**
 * @file attendanceService.ts
 * @description Services for attendance
 * @architecture Service layer
 */

import mongoose from 'mongoose';
import Attendance from '../models/Attendance';
import Student from '../models/Student';
import Day from '../models/Day';
import { ValidationError, NotFoundError } from '../utils/errors';

import { APIFeatures } from '../utils/apiFeatures';

export const getAttendances = async (queryString: any = {}) => {
  const features = new APIFeatures(Attendance.find(), queryString)
    .filter()
    .sort('-createdAt')
    .limitFields();

  const total = await Attendance.countDocuments(features.query.getFilter());
  
  features.paginate();
  const attendances = await features.query.populate('studentId dayId markedBy updatedBy');
  
  const page = parseInt(queryString.page as string, 10) || 1;
  const limit = parseInt(queryString.limit as string, 10) || 10;
  
  return {
    data: attendances,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getAttendanceById = async (id: string) => {
  const attendance = await Attendance.findById(id).populate('studentId dayId markedBy updatedBy');
  if (!attendance) throw new NotFoundError('Attendance not found');
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
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'COMPLETED') throw new ValidationError('Attendance is frozen for this day');

  // Validate no duplicates in payload
  const studentIds = attendanceData.map(a => a.studentId);
  const uniqueStudentIds = new Set(studentIds);
  if (uniqueStudentIds.size !== studentIds.length) {
    throw new ValidationError('Duplicate student IDs in payload');
  }


  
  const studentsFromDb = await Student.find({ _id: { $in: studentIds } });
  if (studentsFromDb.length !== uniqueStudentIds.size) {
    throw new ValidationError('One or more invalid student IDs in payload');
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
  const attendance = await Attendance.findById(id).populate('dayId');
  if (!attendance) throw new NotFoundError('Attendance not found');
  
  if ((attendance.dayId as any).status === 'COMPLETED') {
    throw new ValidationError('Attendance is frozen for this day');
  }
  
  attendance.status = status;
  attendance.updatedBy = new mongoose.Types.ObjectId(staffUserId);
  
  await attendance.save();
  return attendance;
};

export const markMissingAsAbsent = async (dayId: string, staffUserId: string) => {
  const day = await Day.findById(dayId);
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'COMPLETED') throw new ValidationError('Day is frozen');

  const allStudents = await Student.find({}, '_id');
  const existingRecords = await Attendance.find({ dayId }, 'studentId');
  
  const existingStudentIds = new Set(existingRecords.map(r => r.studentId.toString()));
  const missingStudents = allStudents.filter(s => !existingStudentIds.has(s._id.toString()));

  if (missingStudents.length > 0) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const bulkOps = missingStudents.map(student => ({
        insertOne: {
          document: {
            studentId: student._id,
            dayId: new mongoose.Types.ObjectId(dayId),
            status: 'ABSENT',
            markedBy: new mongoose.Types.ObjectId(staffUserId)
          }
        }
      }));
      await Attendance.bulkWrite(bulkOps, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  return { markedCount: missingStudents.length };
};
