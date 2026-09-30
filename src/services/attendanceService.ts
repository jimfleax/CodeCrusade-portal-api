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
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
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

export const getDayAttendance = async (dayId: string, labId?: string) => {
  const query: any = { dayId };
  if (labId) query.labId = new mongoose.Types.ObjectId(labId);
  return Attendance.find(query).populate('studentId markedBy updatedBy');
};

export const bulkUpsertAttendance = async (
  dayId: string,
  attendanceData: { studentId: string; status: 'PRESENT' | 'ABSENT' }[],
  staffUserId: string,
  staffLabId?: string
) => {
  const day = await Day.findById(dayId);
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'COMPLETED') throw new ValidationError('Attendance is frozen for this day');

  const studentIds = attendanceData.map(a => a.studentId);
  const uniqueStudentIds = new Set(studentIds);
  if (uniqueStudentIds.size !== studentIds.length) {
    throw new ValidationError('Duplicate student IDs in payload');
  }

  const studentsFromDb = await Student.find({ _id: { $in: studentIds } });
  if (studentsFromDb.length !== uniqueStudentIds.size) {
    throw new ValidationError('One or more invalid student IDs in payload');
  }

  const studentMap = new Map();
  studentsFromDb.forEach(s => studentMap.set(s._id.toString(), s));

  // Check if any student's lab is frozen or if staff lacks access
  for (const record of attendanceData) {
    const student = studentMap.get(record.studentId);
    if (student?.labId) {
      if (staffLabId && student.labId.toString() !== staffLabId) {
        throw new ValidationError(`Cannot update attendance for student ${student.name} because they belong to a different lab`);
      }
      const isLabFrozen = day.labFreezes?.some(f => f.labId.toString() === student.labId.toString());
      if (isLabFrozen) {
        throw new ValidationError(`Cannot update attendance for student ${student.name} because their lab is frozen`);
      }
    }
  }

  const bulkOps = attendanceData.map(record => {
    const student = studentMap.get(record.studentId);
    return {
      updateOne: {
        filter: {
          dayId: new mongoose.Types.ObjectId(dayId),
          studentId: new mongoose.Types.ObjectId(record.studentId)
        },
        update: {
          $set: { 
            status: record.status, 
            updatedBy: new mongoose.Types.ObjectId(staffUserId),
            labId: student?.labId,
            branch: student?.branch
          },
          $setOnInsert: { markedBy: new mongoose.Types.ObjectId(staffUserId) }
        },
        upsert: true
      }
    };
  });

  return await Attendance.bulkWrite(bulkOps);
};

export const updateAttendance = async (id: string, status: 'PRESENT' | 'ABSENT', staffUserId: string, staffLabId?: string) => {
  const attendance = await Attendance.findById(id).populate('dayId');
  if (!attendance) throw new NotFoundError('Attendance not found');

  const day = attendance.dayId as any;
  if (day.status === 'COMPLETED') {
    throw new ValidationError('Attendance is frozen for this day');
  }

  if (attendance.labId) {
    if (staffLabId && attendance.labId.toString() !== staffLabId) {
      throw new ValidationError('You can only update attendance for students in your own lab.');
    }
    const isLabFrozen = day.labFreezes?.some((f: any) => f.labId.toString() === attendance.labId?.toString());
    if (isLabFrozen) {
      throw new ValidationError('Attendance for this lab is frozen');
    }
  }

  attendance.status = status;
  attendance.updatedBy = new mongoose.Types.ObjectId(staffUserId);
  await attendance.save();
  return attendance;
};

export const markMissingAsAbsent = async (dayId: string, staffUserId: string, labId?: string) => {
  const day = await Day.findById(dayId);
  if (!day) throw new NotFoundError('Day not found');

  if (!labId && day.status === 'COMPLETED') throw new ValidationError('Day is frozen');
  if (labId) {
    const frozen = day.labFreezes.some(f => f.labId.toString() === labId);
    if (frozen) throw new ValidationError('Lab attendance is already frozen');
  }

  let studentQuery: any = {};
  if (labId) {
    studentQuery = { labId: new mongoose.Types.ObjectId(labId) };
  } else if (day.labFreezes.length > 0) {
    // Global call: skip students in already-frozen labs
    const frozenLabIds = day.labFreezes.map(f => f.labId);
    studentQuery = { labId: { $nin: frozenLabIds } };
  }

  const allStudents = await Student.find(studentQuery, '_id labId branch');
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
            labId: student.labId,
            branch: student.branch,
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
