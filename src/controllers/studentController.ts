import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as studentService from '../services/studentService';
import { cache } from '../utils/cache';
import { ForbiddenError } from '../utils/errors';

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'COORDINATOR' && user.labId) {
    throw new ForbiddenError('Only main coordinators can create a student.');
  }

  const { rollNo, name, email, branch, labId } = req.body;
  const student = await studentService.createStudent({ rollNo, name, email, branch, labId });
  cache.delPattern(/analytics|dashboard/);
  res.status(201).json({ status: 'success', data: student });
});

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const query: any = { ...req.query };
  // Force-scope to coordinator's assigned lab regardless of client query params
  if (reqUser.role === 'COORDINATOR' && reqUser.labId) {
    query.labId = reqUser.labId.toString();
  }
  const result = await studentService.getStudents(query);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.getStudentById(req.params.id as string);
  res.status(200).json({ status: 'success', data: student });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'COORDINATOR' && user.labId) {
    throw new ForbiddenError('Only main coordinators can update a student.');
  }

  const { name, email, branch, labId } = req.body;
  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (branch) data.branch = branch;
  if (labId) data.labId = labId;
  const student = await studentService.updateStudent(req.params.id as string, data);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ status: 'success', data: student });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'COORDINATOR' && user.labId) {
    throw new ForbiddenError('Only main coordinators can delete a student.');
  }

  await studentService.deleteStudent(req.params.id as string);
  cache.delPattern(/analytics|dashboard/);
  res.status(204).send();
});

export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const branches = await studentService.getBranches();
  res.status(200).json({ status: 'success', data: branches });
});
