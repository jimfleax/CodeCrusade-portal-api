import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffUser extends Document {
  name: string;
  username: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'COORDINATOR';
  active: boolean;
  labId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const StaffUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'COORDINATOR'], required: true },
  active: { type: Boolean, default: true },
  labId: { type: Schema.Types.ObjectId, ref: 'Lab', default: null }
}, {
  timestamps: true
});

StaffUserSchema.index({ role: 1 });
StaffUserSchema.index({ active: 1 });

export default mongoose.model<IStaffUser>('StaffUser', StaffUserSchema);
