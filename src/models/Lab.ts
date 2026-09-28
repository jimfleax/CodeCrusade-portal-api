import mongoose, { Schema, Document } from 'mongoose';

export interface ILab extends Document {
  name: string;
  code: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  description: { type: String },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

LabSchema.index({ active: 1 });

export default mongoose.model<ILab>('Lab', LabSchema);
