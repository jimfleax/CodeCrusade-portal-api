import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as labService from '../services/labService';

export const createLab = asyncHandler(async (req: Request, res: Response) => {
  const { name, code: labCode, description, active } = req.body;
  const lab = await labService.createLab({ name, code: labCode, description, active });
  res.status(201).json({ status: 'success', data: lab });
});

export const getLabs = asyncHandler(async (req: Request, res: Response) => {
  const result = await labService.getLabs(req.query);
  res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
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
