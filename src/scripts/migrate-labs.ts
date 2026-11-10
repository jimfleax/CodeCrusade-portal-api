import mongoose from 'mongoose';
import Student from '../models/Student';
import { logger } from '../utils/logger';

export const migrateLabs = async () => {
  try {
    logger.info('Starting Lab migration (labId to labs array)...');
    
    // Find students where labId exists and labs does not exist or is empty
    const students = await Student.find({ labId: { $exists: true } });
    
    if (students.length === 0) {
      logger.info('No students found requiring migration.');
      return;
    }

    let count = 0;
    const bulkOps = students.map((student: any) => {
      count++;
      return {
        updateOne: {
          filter: { _id: student._id },
          update: {
            $set: { labs: [student.labId] },
            $unset: { labId: 1 }
          }
        }
      };
    });

    if (bulkOps.length > 0) {
      await (Student as any).bulkWrite(bulkOps as any);
      logger.info(`Successfully migrated ${count} students to use labs array.`);
    }
  } catch (error) {
    logger.error('Error during Lab migration:', error);
    throw error;
  }
};

// If run directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codecrusade').then(async () => {
    await migrateLabs();
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
