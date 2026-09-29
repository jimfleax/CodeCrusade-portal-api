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
      ...(labId ? { 'student.labId': toObjectId(labId) } : {}),
      ...(branch ? { 'student.branch': branch } : {})
    }
  } : null;

  // Build day-level match based on dayId
  const dayMatchStage = dayId ? {
    $match: { dayId: toObjectId(dayId) }
  } : null;

  // =====================
  // 1. RETENTION CURVE
  // Applies: labId, branch filters. Ignores: dayId (so you can see trend across all days)
  // =====================
  const retentionPipeline: any[] = [
    { $match: { status: 'PRESENT' } },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    ...(studentMatchStage ? [studentMatchStage] : []),
    {
      $lookup: {
        from: 'days',
        localField: 'dayId',
        foreignField: '_id',
        as: 'day'
      }
    },
    { $unwind: '$day' },
    {
      $group: {
        _id: '$dayId',
        dayNumber: { $first: '$day.dayNumber' },
        present: { $sum: 1 }
      }
    },
    { $sort: { dayNumber: 1 } }
  ];

  const retentionRaw = await Attendance.aggregate(retentionPipeline);
  const retentionCurve = retentionRaw.map(r => ({
    dayNumber: `Day ${r.dayNumber}`,
    dayId: r._id,
    present: r.present
  }));

  // =====================
  // 2. BRANCH CONTRIBUTION
  // Applies: dayId, labId filters. Ignores: branch (so you can compare branches)
  // =====================
  const branchPipeline: any[] = [
    { $match: { status: 'PRESENT', ...(dayId ? { dayId: toObjectId(dayId) } : {}) } },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    ...(labId ? [{ $match: { 'student.labId': toObjectId(labId) } }] : []),
    {
      $group: {
        _id: '$student.branch',
        present: { $sum: 1 }
      }
    },
    { $sort: { present: -1 } }
  ];

  const branchRaw = await Attendance.aggregate(branchPipeline);
  const branchContribution = branchRaw.map(b => ({
    branch: b._id,
    present: b.present
  }));

  // =====================
  // 3. LAB UTILIZATION
  // Applies: dayId, branch filters. Ignores: labId (so you can compare all labs)
  // =====================
  const labPipeline: any[] = [
    ...(dayId ? [{ $match: { dayId: toObjectId(dayId) } }] : []),
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    ...(branch ? [{ $match: { 'student.branch': branch } }] : []),
    {
      $lookup: {
        from: 'labs',
        localField: 'student.labId',
        foreignField: '_id',
        as: 'lab'
      }
    },
    { $unwind: '$lab' },
    {
      $group: {
        _id: '$lab._id',
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
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    ...(labId ? [{ $match: { 'student.labId': toObjectId(labId) } }] : []),
    ...(branch ? [{ $match: { 'student.branch': branch } }] : []),
    {
      $group: {
        _id: '$studentId',
        student: { $first: '$student' },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
      }
    }
  ];

  const studentAttRaw = await Attendance.aggregate(atRiskPipeline);

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
      atRiskStudents.push({
        _id: sa.student._id,
        rollNo: sa.student.rollNo,
        name: sa.student.name,
        email: sa.student.email,
        branch: sa.student.branch,
        attendanceRate: Number(rate.toFixed(2))
      });
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
