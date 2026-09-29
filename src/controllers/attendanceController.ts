/**
 * @file attendanceController.ts
 * @description Controllers for attendance
 * @architecture Controller layer
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as attendanceService from '../services/attendanceService';

export const getAttendances = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.getAttendances(req.query);
  res.status(200).json({ success: true, data: result.data, meta: result.meta });
});

export const getAttendanceById = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getAttendanceById(req.params.id as string);
  res.status(200).json({ success: true, data });
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getStudentAttendance(req.params.studentId as string);
  res.status(200).json({ success: true, data });
});

export const getDayAttendance = asyncHandler(async (req: Request, res: Response) => {
  const data = await attendanceService.getDayAttendance(req.params.dayId as string);
  res.status(200).json({ success: true, data });
});

export const bulkUpsertAttendance = asyncHandler(async (req: Request, res: Response) => {
  const staffUserId = (req as any).user._id || (req as any).user.id; 
  const result = await attendanceService.bulkUpsertAttendance(req.params.dayId as string, req.body.attendanceData, staffUserId);
  res.status(200).json({ success: true, data: result });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const staffUserId = (req as any).user._id || (req as any).user.id;
  const result = await attendanceService.updateAttendance(req.params.id as string, req.body.status, staffUserId);
  res.status(200).json({ success: true, data: result });
});

export const markMissingAsAbsent = asyncHandler(async (req: Request, res: Response) => {
  const staffUserId = (req as any).user._id || (req as any).user.id;
  const result = await attendanceService.markMissingAsAbsent(req.params.dayId as string, staffUserId);
  res.status(200).json({ success: true, data: result });
});
