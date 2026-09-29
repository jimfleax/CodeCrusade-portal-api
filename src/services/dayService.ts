import mongoose from 'mongoose';
import Day, { IDay } from '../models/Day';
import Lab from '../models/Lab';
import Attendance from '../models/Attendance';
import { ValidationError, NotFoundError } from '../utils/errors';
import { APIFeatures } from '../utils/apiFeatures';

export const createDay = async (data: Partial<IDay>) => {
  const existing = await Day.findOne({ dayNumber: data.dayNumber });
  if (existing) throw new ValidationError('Day number already exists');
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
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

export const getDayById = async (id: string) => {
  const day = await Day.findById(id);
  if (!day) throw new NotFoundError('Day not found');
  return day;
};

export const updateDay = async (id: string, data: Partial<IDay>) => {
  if (data.status) {
    delete data.status; // status must be updated via explicit freeze/unfreeze endpoints
  }
  if (data.dayNumber) {
    const existing = await Day.findOne({ dayNumber: data.dayNumber, _id: { $ne: id } });
    if (existing) throw new ValidationError('Day number already exists');
  }
  const day = await Day.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!day) throw new NotFoundError('Day not found');
  return day;
};

export const deleteDay = async (id: string) => {
  const day = await Day.findById(id);
  if (!day) throw new NotFoundError('Day not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await Attendance.deleteMany({ dayId: id }).session(session);
    await day.deleteOne({ session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const freezeDay = async (id: string) => {
  const day = await Day.findById(id);
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'COMPLETED') throw new ValidationError('Day is already frozen');

  // Auto-freeze all labs not yet individually frozen
  const allLabs = await Lab.find({}, '_id').lean();
  const alreadyFrozenIds = new Set(day.labFreezes.map(f => f.labId.toString()));
  for (const lab of allLabs) {
    if (!alreadyFrozenIds.has((lab._id as any).toString())) {
      day.labFreezes.push({ labId: lab._id as mongoose.Types.ObjectId, frozenAt: new Date() });
    }
  }

  day.status = 'COMPLETED';
  await day.save();
  return day;
};

export const unfreezeDay = async (id: string) => {
  const day = await Day.findById(id);
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'ACTIVE') throw new ValidationError('Day is already active');

  day.status = 'ACTIVE';
  await day.save();
  return day;
};

export const freezeLab = async (dayId: string, labId: string) => {
  const day = await Day.findById(dayId);
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'COMPLETED') throw new ValidationError('Day is already fully frozen');

  const alreadyFrozen = day.labFreezes.some(f => f.labId.toString() === labId);
  if (alreadyFrozen) throw new ValidationError('Lab attendance is already frozen');

  day.labFreezes.push({ labId: new mongoose.Types.ObjectId(labId), frozenAt: new Date() });
  await day.save();
  return day;
};

export const unfreezeLab = async (dayId: string, labId: string) => {
  const day = await Day.findById(dayId);
  if (!day) throw new NotFoundError('Day not found');
  if (day.status === 'COMPLETED') throw new ValidationError('Day is fully frozen; unfreeze the day first');

  (day as any).labFreezes = day.labFreezes.filter(f => f.labId.toString() !== labId);
  await day.save();
  return day;
};
