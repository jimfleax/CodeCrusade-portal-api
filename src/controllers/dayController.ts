import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as dayService from '../services/dayService';

export const createDay = asyncHandler(async (req: Request, res: Response) => {
  const { dayNumber, date, title, status } = req.body;
  const day = await dayService.createDay({ dayNumber, date, title, status });
  res.status(201).json({ status: 'success', data: day });
});

export const getDays = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const query: any = {};
  if (status) query.status = status;
  const days = await dayService.getDays(query);
  res.status(200).json({ status: 'success', data: days });
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
  res.status(200).json({ status: 'success', data: day });
});

export const deleteDay = asyncHandler(async (req: Request, res: Response) => {
  await dayService.deleteDay(req.params.id as string);
  res.status(204).send();
});
