import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as dayService from '../services/dayService';
import { assertLabAccess } from '../utils/assertLabAccess';
import { cache } from '../utils/cache';

export const createDay = asyncHandler(async (req: Request, res: Response) => {
  const { dayNumber, date, title, status } = req.body;
  const day = await dayService.createDay({ dayNumber, date, title, status });
  cache.delPattern(/analytics|dashboard/);
  res.status(201).json({ status: 'success', data: day });
});

export const getDays = asyncHandler(async (req: Request, res: Response) => {
  const result = await dayService.getDays(req.query);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
});

export const getDayById = asyncHandler(async (req: Request, res: Response) => {
  const day = await dayService.getDayById(req.params.id as string);
  res.status(200).json({ status: 'success', data: day });
});

export const updateDay = asyncHandler(async (req: Request, res: Response) => {
  const { date, title, status } = req.body;
  const data: any = {};
  if (date) data.date = date;
  if (title) data.title = title;
  if (status) data.status = status;
  const day = await dayService.updateDay(req.params.id as string, data);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ status: 'success', data: day });
});

export const deleteDay = asyncHandler(async (req: Request, res: Response) => {
  await dayService.deleteDay(req.params.id as string);
  cache.delPattern(/analytics|dashboard/);
  res.status(204).send();
});

export const freezeDay = asyncHandler(async (req: Request, res: Response) => {
  const day = await dayService.freezeDay(req.params.id as string);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ status: 'success', data: day });
});

export const unfreezeDay = asyncHandler(async (req: Request, res: Response) => {
  const day = await dayService.unfreezeDay(req.params.id as string);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ status: 'success', data: day });
});

export const freezeLabAttendance = asyncHandler(async (req: Request, res: Response) => {
  const dayId = req.params.dayId as string;
  const labId = req.params.labId as string;
  assertLabAccess((req as any).user, labId);
  const day = await dayService.freezeLab(dayId, labId);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ success: true, data: day });
});

export const unfreezeLabAttendance = asyncHandler(async (req: Request, res: Response) => {
  const dayId = req.params.dayId as string;
  const labId = req.params.labId as string;
  assertLabAccess((req as any).user, labId);
  const day = await dayService.unfreezeLab(dayId, labId);
  cache.delPattern(/analytics|dashboard/);
  res.status(200).json({ success: true, data: day });
});
