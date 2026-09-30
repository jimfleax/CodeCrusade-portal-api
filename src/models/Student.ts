import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  rollNo: string;
  name: string;
  email?: string;
  branch: string;
  labs: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { 
    type: String, 
    sparse: true, 
    unique: true, 
    set: (v: string) => v === '' ? undefined : v 
  },
  branch: { type: String, required: true },
  labs: [{ type: Schema.Types.ObjectId, ref: 'Lab' }]
}, {
  timestamps: true
});

StudentSchema.index({ labs: 1 });
StudentSchema.index({ branch: 1 });
StudentSchema.index({ labs: 1, branch: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
