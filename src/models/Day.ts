import mongoose, { Schema, Document } from 'mongoose';

export interface IDay extends Document {
  dayNumber: number;
  date: Date;
  title: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

const DaySchema: Schema = new Schema({
  dayNumber: { type: Number, required: true, unique: true },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'], default: 'UPCOMING' }
}, {
  timestamps: true
});

DaySchema.index({ status: 1 });
DaySchema.index({ date: 1 });

export default mongoose.model<IDay>('Day', DaySchema);
