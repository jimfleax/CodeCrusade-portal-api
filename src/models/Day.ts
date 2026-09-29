import mongoose, { Schema, Document } from 'mongoose';

export interface IDay extends Document {
  dayNumber: number;
  date: Date;
  title: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  labFreezes: Array<{ labId: mongoose.Types.ObjectId; frozenAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const DaySchema: Schema = new Schema({
  dayNumber: { type: Number, required: true, unique: true },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'], default: 'UPCOMING' },
  labFreezes: {
    type: [{
      labId: { type: Schema.Types.ObjectId, ref: 'Lab', required: true },
      frozenAt: { type: Date, default: Date.now }
    }],
    default: []
  }
}, {
  timestamps: true
});

DaySchema.index({ status: 1 });
DaySchema.index({ date: 1 });
DaySchema.index({ 'labFreezes.labId': 1 });

export default mongoose.model<IDay>('Day', DaySchema);
