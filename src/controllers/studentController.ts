import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as studentService from '../services/studentService';

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { rollNo, name, email, branch, labId } = req.body;
  const student = await studentService.createStudent({ rollNo, name, email, branch, labId });
  res.status(201).json({ status: 'success', data: student });
});

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentService.getStudents(req.query);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.getStudentById(req.params.id as string);
  res.status(200).json({ status: 'success', data: student });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, branch, labId } = req.body;
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (branch) data.branch = branch;
  if (labId) data.labId = labId;
  const student = await studentService.updateStudent(req.params.id as string, data);
  res.status(200).json({ status: 'success', data: student });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  await studentService.deleteStudent(req.params.id as string);
  res.status(204).send();
});
