/**
 * @file attendanceController.ts
 * @description Controllers for attendance
 * @architecture Controller layer
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as attendanceService from '../services/attendanceService';
import { cache } from '../utils/cache';
import { ForbiddenError, ValidationError } from '../utils/errors';

export const getAttendances = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'COORDINATOR' && user.labId) {
    req.query.labId = user.labId.toString();
  }
  const result = await attendanceService.getAttendances(req.query);
  res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

export const getAttendanceById = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getAttendanceById(req.params.id as string);
  const user = (req as any).user;
  if (user && user.role === 'COORDINATOR' && user.labId) {
    if (data.labId?.toString() !== user.labId.toString()) {
      throw new ForbiddenError('You can only view attendance records for your own lab.');
    }
  }
  res.status(200).json({ success: true, data });
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getStudentAttendance(req.params.studentId as string);
  const user = (req as any).user;
  if (user && user.role === 'COORDINATOR' && user.labId) {
    if (data.length > 0 && data[0].labId?.toString() !== user.labId.toString()) {
      throw new ForbiddenError('You can only view attendance records for students in your own lab.');
    }
  }
  res.status(200).json({ success: true, data });
});

export const getDayAttendance = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const labId = (user && user.role === 'COORDINATOR' && user.labId) ? user.labId.toString() : undefined;
  const data = await attendanceService.getDayAttendance(req.params.dayId as string, labId);
  res.status(200).json({ success: true, data });
});

export const bulkUpsertAttendance = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const staffUserId = user._id || user.id;
  const targetLabId = (user && user.role === 'COORDINATOR' && user.labId) ? user.labId.toString() : req.body.labId;
  
  if (!targetLabId) {
    throw new ValidationError('labId is required to update attendance.');
  }

  const result = await attendanceService.bulkUpsertAttendance(req.params.dayId as string, req.body.attendanceData, staffUserId, targetLabId);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ success: true, data: result });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const staffUserId = user._id || user.id;
  const targetLabId = (user && user.role === 'COORDINATOR' && user.labId) ? user.labId.toString() : req.body.labId;

  if (!targetLabId) {
    throw new ValidationError('labId is required to update attendance.');
  }

  const result = await attendanceService.updateAttendance(req.params.id as string, req.body.status, staffUserId, targetLabId);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ success: true, data: result });
});

export const markMissingAsAbsent = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const staffUserId = user._id || user.id;
  let { labId } = req.body || {};

  if (user && user.role === 'COORDINATOR' && user.labId) {
    if (labId && labId !== user.labId.toString()) {
      throw new ForbiddenError('You can only mark students absent in your own lab.');
    }
    labId = user.labId.toString();
  }

  const result = await attendanceService.markMissingAsAbsent(req.params.dayId as string, staffUserId, labId);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ success: true, data: result });
});
