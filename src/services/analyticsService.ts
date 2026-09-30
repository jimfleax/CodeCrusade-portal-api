import Student from '../models/Student';
import Attendance from '../models/Attendance';
import mongoose from 'mongoose';

interface AnalyticsFilters {
  labId?: string;
  branch?: string;
  dayId?: string;
}

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export const getAnalyticsData = async (filters: AnalyticsFilters = {}) => {
  const { labId, branch, dayId } = filters;

  // Build student-level match based on labId and branch
  const studentMatchStage = (labId || branch) ? {
    $match: {
      ...(labId ? { labId: toObjectId(labId) } : {}),
      ...(branch ? { branch: branch } : {})
    }
  } : null;

  // Build day-level match based on dayId
  const dayMatchStage = dayId ? {
    $match: { dayId: toObjectId(dayId) }
  } : null;

  // Pre-fetch all days for mapping
  const allDays = await mongoose.model('Day').find().lean();
  const dayMap = new Map();
  allDays.forEach((d: any) => dayMap.set(d._id.toString(), d.dayNumber));

  // =====================
  // 1. RETENTION CURVE
  // Applies: labId, branch, dayId filters.
  // =====================
  const retentionPipeline: any[] = [
    { $match: { status: 'PRESENT' } },
    ...(dayId ? [{ $match: { dayId: toObjectId(dayId) } }] : []),
    ...(studentMatchStage ? [studentMatchStage] : []),
    {
      $group: {
        _id: '$dayId',
        present: { $sum: 1 }
      }
    }
  ];

  const retentionRaw = await Attendance.aggregate(retentionPipeline);
  
  // Map dayNumber in JS
  const retentionMapped = retentionRaw.map(r => ({
    dayNumber: dayMap.get(r._id.toString()) || 0,
    dayId: r._id,
    present: r.present
  }));
  retentionMapped.sort((a, b) => a.dayNumber - b.dayNumber);
  
  const retentionCurve = retentionMapped.map(r => ({
    dayNumber: `Day ${r.dayNumber}`,
    dayId: r.dayId,
    present: r.present
  }));

  // =====================
  // 2. BRANCH CONTRIBUTION
  // Applies: dayId, labId, branch filters.
  // =====================
  const branchPipeline: any[] = [
    { $match: { status: 'PRESENT', ...(dayId ? { dayId: toObjectId(dayId) } : {}) } },
    ...(labId ? [{ $match: { labId: toObjectId(labId) } }] : []),
    ...(branch ? [{ $match: { branch: branch } }] : []),
    {
      $group: {
        _id: '$branch',
        present: { $sum: 1 }
      }
    },
    { $sort: { present: -1 } }
  ];

  const branchRaw = await Attendance.aggregate(branchPipeline);
  const branchContribution = branchRaw.map(b => ({
    branch: b._id || 'Unknown',
    present: b.present
  }));

  // =====================
  // 3. LAB UTILIZATION
  // Applies: dayId, branch, labId filters.
  // =====================
  const labPipeline: any[] = [
    ...(dayId ? [{ $match: { dayId: toObjectId(dayId) } }] : []),
    ...(branch ? [{ $match: { branch: branch } }] : []),
    ...(labId ? [{ $match: { labId: toObjectId(labId) } }] : []),
    {
      $lookup: {
        from: 'labs',
        localField: 'labId',
        foreignField: '_id',
        as: 'lab'
      }
    },
    { $unwind: '$lab' },
    {
      $group: {
        _id: '$labId',
        labName: { $first: '$lab.name' },
        totalRecords: { $sum: 1 },
        presentRecords: {
          $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] }
        }
      }
    },
    { $sort: { labName: 1 } }
  ];

  const labRaw = await Attendance.aggregate(labPipeline);
  const labUtilization = labRaw.map(l => ({
    labId: l._id,
    labName: l.labName,
    attendanceRate: l.totalRecords > 0 ? Number(((l.presentRecords / l.totalRecords) * 100).toFixed(2)) : 0
  }));

  // =====================
  // 4. AT-RISK STUDENTS + DEFAULTER RATE
  // Applies: all three filters
  // =====================
  const atRiskPipeline: any[] = [
    ...(dayId ? [{ $match: { dayId: toObjectId(dayId) } }] : []),
    ...(studentMatchStage ? [studentMatchStage] : []),
    {
      $group: {
        _id: '$studentId',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
      }
    }
  ];

  const studentAttRaw = await Attendance.aggregate(atRiskPipeline);

  const studentIds = studentAttRaw.map(sa => sa._id);
  const students = await Student.find({ _id: { $in: studentIds } }, '_id rollNo name email branch').lean();
  const studentMap = new Map();
  students.forEach((s: any) => studentMap.set(s._id.toString(), s));

  // Count eligible students (scoped to filters for denominator)
  const studentQuery: any = {};
  if (labId) studentQuery.labId = toObjectId(labId);
  if (branch) studentQuery.branch = branch;
  const totalStudentsCount = await Student.countDocuments(studentQuery);

  let defaultersCount = 0;
  const atRiskStudents: any[] = [];

  studentAttRaw.forEach(sa => {
    const rate = sa.total > 0 ? (sa.present / sa.total) * 100 : 0;
    if (rate < 80) {
      defaultersCount++;
      const student = studentMap.get(sa._id.toString());
      if (student) {
        atRiskStudents.push({
          _id: student._id,
          rollNo: student.rollNo,
          name: student.name,
          email: student.email,
          branch: student.branch,
          attendanceRate: Number(rate.toFixed(2))
        });
      }
    }
  });

  atRiskStudents.sort((a, b) => a.attendanceRate - b.attendanceRate);
  const defaulterRate = totalStudentsCount > 0 ? Number(((defaultersCount / totalStudentsCount) * 100).toFixed(2)) : 0;

  return {
    retentionCurve,
    branchContribution,
    labUtilization,
    defaulterRate,
    atRiskStudents
  };
};
