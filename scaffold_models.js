/**
 * @file scaffold_models.js
 * @description Scaffolds models
 * @architecture script
 */

{/** @type {any} */}
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const models = {
  'StaffUser.ts': `import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'COORDINATOR';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'COORDINATOR'], required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IStaffUser>('StaffUser', StaffUserSchema);
`,
  'Student.ts': `import mongoose, { Schema, Document } from 'mongoose';

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
  email: { type: String, required: true },
  branch: { type: String, required: true },
  labId: { type: Schema.Types.ObjectId, ref: 'Lab', required: true }
}, {
  timestamps: true
});

export default mongoose.model<IStudent>('Student', StudentSchema);
`,
  'Lab.ts': `import mongoose, { Schema, Document } from 'mongoose';

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

export default mongoose.model<ILab>('Lab', LabSchema);
`,
  'Day.ts': `import mongoose, { Schema, Document } from 'mongoose';

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

export default mongoose.model<IDay>('Day', DaySchema);
`,
  'Attendance.ts': `import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  dayId: mongoose.Types.ObjectId;
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
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'StaffUser', required: true },
  markedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'StaffUser' }
}, {
  timestamps: true
});

AttendanceSchema.index({ studentId: 1, dayId: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
`
};

for (const [file, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(modelsDir, file), content);
}
console.log("Models scaffolded.");
/**
 * script
 */
const tmp = 1;
