import Lab, { ILab } from '../models/Lab';
import Student from '../models/Student';
import { ValidationError, NotFoundError } from '../utils/errors';

import { APIFeatures } from '../utils/apiFeatures';

export const createLab = async (data: Partial<ILab>) => {
  return await Lab.create(data);
};

export const getLabs = async (queryString: any = {}) => {
  const page = parseInt(queryString.page as string, 10) || 1;
  const limit = parseInt(queryString.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  // Build match stage from query if needed (excluding special fields like page, limit, sort)
  const queryObj = { ...queryString };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // Advanced filtering can be added here if needed, keeping it simple for now
  const matchStage = Object.keys(queryObj).length > 0 ? { $match: queryObj } : { $match: {} };

  const total = await Lab.countDocuments(matchStage.$match);
  
  const labs = await Lab.aggregate([
    matchStage,
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'labs',
        as: 'students'
      }
    },
    {
      $addFields: {
        studentCount: { $size: '$students' },
        id: '$_id'
      }
    },
    {
      $project: {
        students: 0 // Remove the full array, we only need the count
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);
  
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
  if (!lab) throw new NotFoundError('Lab not found');
  return lab;
};

export const updateLab = async (id: string, data: Partial<ILab>) => {
  const lab = await Lab.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!lab) throw new NotFoundError('Lab not found');
  return lab;
};

export const deleteLab = async (id: string) => {
  const lab = await Lab.findById(id);
  if (!lab) throw new NotFoundError('Lab not found');
  
  const studentCount = await Student.countDocuments({ labs: id });
  if (studentCount > 0) {
    throw new ValidationError('Cannot delete lab with assigned students');
  }
  
  await lab.deleteOne();
};
