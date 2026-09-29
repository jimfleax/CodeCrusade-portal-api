import Day from '../models/Day';
import Student from '../models/Student';
import Lab from '../models/Lab';
import Attendance from '../models/Attendance';
import mongoose from 'mongoose';

export const getAnalyticsData = async () => {
  // 1. Retention Curve: Group by dayId, count PRESENT
  const retentionRaw = await Attendance.aggregate([
    { $match: { status: 'PRESENT' } },
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
  ]);

  const retentionCurve = retentionRaw.map(r => ({
    dayNumber: `Day ${r.dayNumber}`,
    present: r.present
  }));

  // 2. Branch Contribution: Group by branch, count PRESENT
  const branchRaw = await Attendance.aggregate([
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
    {
      $group: {
        _id: '$student.branch',
        present: { $sum: 1 }
      }
    },
    { $sort: { present: -1 } }
  ]);

  const branchContribution = branchRaw.map(b => ({
    branch: b._id,
    present: b.present
  }));

  // 3. Lab Utilization
  const labRaw = await Attendance.aggregate([
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
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
  ]);

  const labUtilization = labRaw.map(l => ({
    labName: l.labName,
    attendanceRate: l.totalRecords > 0 ? Number(((l.presentRecords / l.totalRecords) * 100).toFixed(2)) : 0
  }));

  // 4. At-Risk Students and Defaulter Rate
  const studentAttRaw = await Attendance.aggregate([
    {
      $group: {
        _id: '$studentId',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } }
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' }
  ]);

  let totalStudentsCount = await Student.countDocuments();
  let defaultersCount = 0;
  const atRiskStudents: any[] = [];

  studentAttRaw.forEach(sa => {
    const rate = sa.total > 0 ? (sa.present / sa.total) * 100 : 0;
    if (rate < 60) {
      defaultersCount++;
      atRiskStudents.push({
        rollNo: sa.student.rollNo,
        name: sa.student.name,
        email: sa.student.email,
        branch: sa.student.branch,
        attendanceRate: Number(rate.toFixed(2))
      });
    }
  });

  // Sort at risk students by lowest attendance first
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
