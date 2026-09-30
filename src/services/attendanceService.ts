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
  targetLabId: string
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
    if (student?.labs) {
      if (!student.labs.some((l: any) => l.toString() === targetLabId)) {
        throw new ValidationError(`Cannot update attendance for student ${student.name} because they do not belong to the target lab`);
      }
      const isLabFrozen = day.labFreezes?.some((f: any) => f.labId.toString() === targetLabId);
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
          studentId: new mongoose.Types.ObjectId(record.studentId),
          labId: new mongoose.Types.ObjectId(targetLabId)
        },
        update: {
          $set: { 
            status: record.status, 
            updatedBy: new mongoose.Types.ObjectId(staffUserId),
            labId: new mongoose.Types.ObjectId(targetLabId),
            branch: student?.branch
          },
          $setOnInsert: { markedBy: new mongoose.Types.ObjectId(staffUserId) }
        },
        upsert: true
      }
    };
  });

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await Attendance.bulkWrite(bulkOps, { session });
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateAttendance = async (id: string, status: 'PRESENT' | 'ABSENT', staffUserId: string, targetLabId: string) => {
  const attendance = await Attendance.findById(id).populate('dayId');
  if (!attendance) throw new NotFoundError('Attendance not found');

  const day = attendance.dayId as any;
  if (day.status === 'COMPLETED') {
    throw new ValidationError('Attendance is frozen for this day');
  }

  if (attendance.labId) {
    if (attendance.labId.toString() !== targetLabId) {
      throw new ValidationError('You can only update attendance for the specified lab.');
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
    studentQuery = { labs: new mongoose.Types.ObjectId(labId) };
  } else if (day.labFreezes.length > 0) {
    // Global call: skip students in already-frozen labs
    const frozenLabIds = day.labFreezes.map(f => f.labId);
    studentQuery = { labs: { $nin: frozenLabIds } };
  }

  const allStudents = await Student.find(studentQuery, '_id labs branch');
  const existingRecords = await Attendance.find({ dayId }, 'studentId labId');
  const existingSet = new Set(existingRecords.map(r => `${r.studentId.toString()}-${r.labId?.toString()}`));

  const bulkOps = [];
  for (const student of allStudents) {
    if (!student.labs) continue;
    for (const sLab of student.labs) {
      if (labId && sLab.toString() !== labId) continue;
      if (!labId && day.labFreezes.some((f: any) => f.labId.toString() === sLab.toString())) continue;

      const key = `${student._id.toString()}-${sLab.toString()}`;
      if (!existingSet.has(key)) {
        bulkOps.push({
          insertOne: {
            document: {
              studentId: student._id,
              dayId: new mongoose.Types.ObjectId(dayId),
              labId: sLab,
              branch: student.branch,
              status: 'ABSENT',
              markedBy: new mongoose.Types.ObjectId(staffUserId)
            }
          }
        });
      }
    }
  }

  if (bulkOps.length > 0) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await Attendance.bulkWrite(bulkOps, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  return { markedCount: bulkOps.length };
};
