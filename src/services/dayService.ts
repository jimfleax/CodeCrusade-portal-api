import Day, { IDay } from '../models/Day';
import Attendance from '../models/Attendance';
import { AppError } from '../utils/AppError';

export const createDay = async (data: Partial<IDay>) => {
  const existing = await Day.findOne({ dayNumber: data.dayNumber });
  if (existing) throw new AppError(400, 'BAD_REQUEST', 'Day number already exists');
  return await Day.create(data);
};

export const getDays = async (query: any = {}) => {
  return await Day.find(query).sort({ dayNumber: 1 });
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
