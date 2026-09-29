import Student, { IStudent } from '../models/Student';
import Attendance from '../models/Attendance';
import { AppError } from '../utils/AppError';

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
  const students = await features.query.populate('labId');
  
  const page = parseInt(queryString.page as string, 10) || 1;
  const limit = parseInt(queryString.limit as string, 10) || 10;
  
  return {
    data: students,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getStudentById = async (id: string) => {
  const student = await Student.findById(id).populate('labId');
  if (!student) throw new AppError(404, 'NOT_FOUND', 'Student not found');
  return student;
};

export const updateStudent = async (id: string, data: Partial<IStudent>) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!student) throw new AppError(404, 'NOT_FOUND', 'Student not found');
  return student;
};

export const deleteStudent = async (id: string) => {
  const student = await Student.findById(id);
  if (!student) throw new AppError(404, 'NOT_FOUND', 'Student not found');
  
  await Attendance.deleteMany({ studentId: id });
  await student.deleteOne();
};
