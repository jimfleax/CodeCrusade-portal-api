import Day, { IDay } from '../models/Day';
import Attendance from '../models/Attendance';
import { AppError } from '../utils/AppError';

import { APIFeatures } from '../utils/apiFeatures';

export const createDay = async (data: Partial<IDay>) => {
  const existing = await Day.findOne({ dayNumber: data.dayNumber });
  if (existing) throw new AppError(400, 'BAD_REQUEST', 'Day number already exists');
  return await Day.create(data);
};

export const getDays = async (queryString: any = {}) => {
  const features = new APIFeatures(Day.find(), queryString)
    .filter()
    .sort('-createdAt')
    .limitFields();

  const total = await Day.countDocuments(features.query.getFilter());
  
  features.paginate();
  const days = await features.query;
  
  const page = parseInt(queryString.page as string, 10) || 1;
  const limit = parseInt(queryString.limit as string, 10) || 10;
  
  return {
    data: days,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getDayById = async (id: string) => {
  const day = await Day.findById(id);
  if (!day) throw new AppError(404, 'NOT_FOUND', 'Day not found');
  return day;
};

export const updateDay = async (id: string, data: Partial<IDay>) => {
  if (data.dayNumber) {
    const existing = await Day.findOne({ dayNumber: data.dayNumber, _id: { $ne: id } });
    if (existing) throw new AppError(400, 'BAD_REQUEST', 'Day number already exists');
  }
  const day = await Day.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!day) throw new AppError(404, 'NOT_FOUND', 'Day not found');
  return day;
};

export const deleteDay = async (id: string) => {
  const day = await Day.findById(id);
  if (!day) throw new AppError(404, 'NOT_FOUND', 'Day not found');
  
  await Attendance.deleteMany({ dayId: id });
  await day.deleteOne();
};
