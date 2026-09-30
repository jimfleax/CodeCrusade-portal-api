/**
 * @file Attendance.ts
 * @description Attendance model
 * @architecture Model layer
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  dayId: mongoose.Types.ObjectId;
  labId?: mongoose.Types.ObjectId;
  branch?: string;
  status: 'PRESENT' | 'ABSENT';
  markedBy: mongoose.Types.ObjectId;
  markedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  dayId: { type: Schema.Types.ObjectId, ref: 'Day', required: true },
  labId: { type: Schema.Types.ObjectId, ref: 'Lab' },
  branch: { type: String },
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'StaffUser', required: true },
  markedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'StaffUser' }
}, {
  timestamps: true
});

AttendanceSchema.index({ studentId: 1, dayId: 1, labId: 1 }, { unique: true });
AttendanceSchema.index({ dayId: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ markedBy: 1 });
AttendanceSchema.index({ createdAt: -1 });
AttendanceSchema.index({ updatedAt: -1 });
AttendanceSchema.index({ dayId: 1, status: 1 });
AttendanceSchema.index({ studentId: 1, status: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
