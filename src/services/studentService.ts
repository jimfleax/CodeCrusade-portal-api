import Student, { IStudent } from '../models/Student';
import Attendance from '../models/Attendance';
import { AppError } from '../utils/AppError';

export const createStudent = async (data: Partial<IStudent>) => {
  return await Student.create(data);
};

export const getStudents = async (query: any = {}) => {
  return await Student.find(query).populate('labId');
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
