import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as labService from '../services/labService';

export const createLab = asyncHandler(async (req: Request, res: Response) => {
  const { name, code: labCode, description, active } = req.body;
  const lab = await labService.createLab({ name, code: labCode, description, active });
  res.status(201).json({ status: 'success', data: lab });
});

export const getLabs = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.query;
  const query: any = {};
  if (active !== undefined) query.active = active;
  const labs = await labService.getLabs(query);
  res.status(200).json({ status: 'success', data: labs });
});

export const getLabById = asyncHandler(async (req: Request, res: Response) => {
  const lab = await labService.getLabById(req.params.id as string);
  res.status(200).json({ status: 'success', data: lab });
});

export const updateLab = asyncHandler(async (req: Request, res: Response) => {
  const { name, code: labCode, description, active } = req.body;
  const data: any = {};
  if (name) data.name = name;
  if (labCode) data.code = labCode;
  if (description !== undefined) data.description = description;
  if (active !== undefined) data.active = active;
  const lab = await labService.updateLab(req.params.id as string, data);
  res.status(200).json({ status: 'success', data: lab });
});

export const deleteLab = asyncHandler(async (req: Request, res: Response) => {
  await labService.deleteLab(req.params.id as string);
  res.status(204).send();
});
