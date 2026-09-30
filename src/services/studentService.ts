import mongoose from 'mongoose';
import Student, { IStudent } from '../models/Student';
import Attendance from '../models/Attendance';
import { NotFoundError } from '../utils/errors';

import { APIFeatures } from '../utils/apiFeatures';

export const createStudent = async (data: Partial<IStudent>) => {
  return await Student.create(data);
};

export const getStudents = async (queryString: any = {}) => {
  const features = new APIFeatures(Student.find(), queryString)
    .filter()
    .sort()
    .limitFields();

  const total = await Student.countDocuments(features.query.getFilter());
  
  features.paginate();
  const students = await features.query.populate('labs');
  
  const studentIds = students.map((s: any) => s._id);
  const attendanceStats = await Attendance.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $group: { 
      _id: '$studentId', 
      total: { $sum: 1 }, 
      present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } } 
    } }
  ]);
  const statsMap = new Map(attendanceStats.map(s => [s._id.toString(), s]));

  const enrichedStudents = students.map((s: any) => {
    const sDoc = s.toJSON ? s.toJSON() : s;
    const stat = statsMap.get(s._id.toString());
    const attendanceRate = stat && stat.total > 0 ? (stat.present / stat.total) * 100 : 0;
    return { ...sDoc, attendanceRate: Number(attendanceRate.toFixed(2)) };
  });
  
  const page = parseInt(queryString.page as string, 10) || 1;
  const limit = parseInt(queryString.limit as string, 10) || 10;
  
  return {
    data: enrichedStudents,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getStudentById = async (id: string) => {
  const student = await Student.findById(id).populate('labs');
  if (!student) throw new NotFoundError('Student not found');
  return student;
};

export const updateStudent = async (id: string, data: Partial<IStudent>) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!student) throw new NotFoundError('Student not found');
  return student;
};

export const deleteStudent = async (id: string) => {
  const student = await Student.findById(id);
  if (!student) throw new NotFoundError('Student not found');
  
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await Attendance.deleteMany({ studentId: id }).session(session);
    await student.deleteOne({ session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getBranches = async () => {
  const branches = await Student.distinct('branch');
  return branches.filter(b => b); // remove empty or null
};
