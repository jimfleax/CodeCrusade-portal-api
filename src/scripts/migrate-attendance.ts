import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import Attendance from '../models/Attendance';
import Student from '../models/Student';

const BATCH_SIZE = 1000;

async function migrateAttendance() {
  console.log('Starting attendance migration...');

  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    // Find all attendance records missing labId or branch
    const filter = {
      $or: [
        { labId: { $exists: false } },
        { branch: { $exists: false } }
      ]
    };

    const totalToMigrate = await Attendance.countDocuments(filter);
    console.log(`Found ${totalToMigrate} attendance records to migrate.`);

    if (totalToMigrate === 0) {
      console.log('No migration needed. Exiting.');
      process.exit(0);
    }

    let processed = 0;
    
    // We'll iterate using a cursor to handle potentially large datasets
    const cursor = Attendance.find(filter).cursor();
    
    let bulkOps: mongoose.AnyBulkWriteOperation[] = [];
    
    // Cache student data to avoid querying the same student multiple times
    // Assuming student data is small enough for this migration, or we can clear cache
    const studentCache = new Map<string, { labId: mongoose.Types.ObjectId, branch: string }>();

    for await (const doc of cursor) {
      const studentIdStr = doc.studentId.toString();
      
      let studentData = studentCache.get(studentIdStr);
      
      if (!studentData) {
        const student = await Student.findById(doc.studentId).lean();
        if (student) {
          studentData = { labId: student.labs?.[0], branch: student.branch };
          studentCache.set(studentIdStr, studentData);
        }
      }

      if (studentData) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { labId: studentData.labId, branch: studentData.branch } }
          }
        });
      }

      if (bulkOps.length >= BATCH_SIZE) {
        await Attendance.bulkWrite(bulkOps);
        processed += bulkOps.length;
        console.log(`Processed ${processed}/${totalToMigrate} records...`);
        bulkOps = [];
      }
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
      processed += bulkOps.length;
      console.log(`Processed ${processed}/${totalToMigrate} records...`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAttendance();
