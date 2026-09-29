import Lab, { ILab } from '../models/Lab';
import Student from '../models/Student';
import { AppError } from '../utils/AppError';

import { APIFeatures } from '../utils/apiFeatures';

export const createLab = async (data: Partial<ILab>) => {
  return await Lab.create(data);
};

export const getLabs = async (queryString: any = {}) => {
  const features = new APIFeatures(Lab.find(), queryString)
    .filter()
    .sort()
    .limitFields();

  const total = await Lab.countDocuments(features.query.getFilter());
  
  features.paginate();
  const labs = await features.query;
  
  const page = parseInt(queryString.page as string, 10) || 1;
  const limit = parseInt(queryString.limit as string, 10) || 10;
  
  return {
    data: labs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getLabById = async (id: string) => {
  const lab = await Lab.findById(id);
  if (!lab) throw new AppError(404, 'NOT_FOUND', 'Lab not found');
  return lab;
};

export const updateLab = async (id: string, data: Partial<ILab>) => {
  const lab = await Lab.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!lab) throw new AppError(404, 'NOT_FOUND', 'Lab not found');
  return lab;
};

export const deleteLab = async (id: string) => {
  const lab = await Lab.findById(id);
  if (!lab) throw new AppError(404, 'NOT_FOUND', 'Lab not found');
  
  const studentCount = await Student.countDocuments({ labId: id });
  if (studentCount > 0) {
    throw new AppError(400, 'BAD_REQUEST', 'Cannot delete lab with assigned students');
  }
  
  await lab.deleteOne();
};
