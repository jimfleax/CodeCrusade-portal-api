import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  rollNo: string;
  name: string;
  email: string;
  branch: string;
  labId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  labId: { type: Schema.Types.ObjectId, ref: 'Lab', required: true }
}, {
  timestamps: true
});

StudentSchema.index({ labId: 1 });
StudentSchema.index({ branch: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
