import mongoose from 'mongoose';
import Day from '../models/Day';
import Student from '../models/Student';
import Lab from '../models/Lab';
import Attendance from '../models/Attendance';
import { AppError } from '../utils/AppError';

export class DashboardService {
  static async getOverview() {
    const totalStudents = await Student.countDocuments();
    const totalLabs = await Lab.countDocuments();
    
    const dayStats = await Day.aggregate([
      {
        $group: {
          _id: null,
          created: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }
        }
      }
    ]);

    const daysCreated = dayStats.length > 0 ? dayStats[0].created : 0;
    const daysCompleted = dayStats.length > 0 ? dayStats[0].completed : 0;
    
    const expectedAttendance = totalStudents * daysCreated;

    const attStats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          recorded: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
        }
      }
    ]);

    const recordedAttendance = attStats.length > 0 ? attStats[0].recorded : 0;
    const present = attStats.length > 0 ? attStats[0].present : 0;
    const absent = attStats.length > 0 ? attStats[0].absent : 0;

    const overallAttendanceRate = expectedAttendance > 0 ? (present / expectedAttendance) * 100 : 0;

    const latestDay = await Day.findOne().sort({ createdAt: -1 });
    const presentToday = latestDay 
      ? await Attendance.countDocuments({ dayId: latestDay._id, status: 'PRESENT' }) 
      : 0;

    const recentAttendance = await Attendance.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('studentId', 'name')
      .lean();

    return {
      totalStudents,
      totalLabs,
      daysCreated,
      daysCompleted,
      expectedAttendance,
      recordedAttendance,
      present,
      absent,
      presentToday,
      overallAttendanceRate: Number(overallAttendanceRate.toFixed(2)),
      recentAttendance
    };
  }

  static async getDays() {
    const labStats = await Student.aggregate([
      { $group: { _id: "$labId", total: { $sum: 1 } } }
    ]);
    const labTotals = new Map(labStats.map(ls => [ls._id?.toString(), ls.total]));
    const totalStudents = await Student.countDocuments();
    
    const labs = await Lab.find().lean();
    const days = await Day.find().sort({ dayNumber: 1 }).lean();
    
    const dayAttendances = await Attendance.aggregate([
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
          _id: { dayId: '$dayId', labId: '$student.labId' },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } }
        }
      }
    ]);

    const attByDay = new Map();
    dayAttendances.forEach(da => {
      const dayId = da._id.dayId?.toString();
      const labId = da._id.labId?.toString();
      if (!dayId) return;
      if (!attByDay.has(dayId)) attByDay.set(dayId, []);
      attByDay.get(dayId).push({ labId, present: da.present, absent: da.absent });
    });

    return days.map(day => {
      const dayIdStr = day._id?.toString();
      const atts = attByDay.get(dayIdStr) || [];
      
      let dayPresent = 0;
      let dayAbsent = 0;
      
      const labBreakdown = labs.map(lab => {
        const labIdStr = lab._id?.toString();
        const labAtt = atts.find((a: any) => a.labId === labIdStr) || { present: 0, absent: 0 };
        const total = labTotals.get(labIdStr) || 0;
        dayPresent += labAtt.present;
        dayAbsent += labAtt.absent;
        
        return {
          labId: labIdStr,
          name: lab.name,
          present: labAtt.present,
          total,
          attendanceRate: total > 0 ? Number(((labAtt.present / total) * 100).toFixed(2)) : 0
        };
      });

      return {
        dayId: day._id,
        dayNumber: day.dayNumber,
        date: day.date,
        totalStudents,
        present: dayPresent,
        absent: dayAbsent,
        attendanceRate: totalStudents > 0 ? Number(((dayPresent / totalStudents) * 100).toFixed(2)) : 0,
        isComplete: day.status === 'COMPLETED',
        labBreakdown
      };
    });
  }

  static async getLabs(dayId?: string) {
    const matchStage: any = {};
    if (dayId && mongoose.Types.ObjectId.isValid(dayId)) {
      matchStage.dayId = new mongoose.Types.ObjectId(dayId);
    }

    const labs = await Lab.find().lean();
    const labStats = await Student.aggregate([
      { $group: { _id: "$labId", total: { $sum: 1 } } }
    ]);
    const labTotals = new Map(labStats.map(ls => [ls._id?.toString(), ls.total]));

    const atts = await Attendance.aggregate([
      { $match: matchStage },
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
          _id: { labId: '$student.labId', dayId: '$dayId' },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } }
        }
      }
    ]);

    const labData = new Map();
    labs.forEach(lab => {
      const labIdStr = lab._id?.toString();
      labData.set(labIdStr, {
        labId: labIdStr,
        name: lab.name,
        students: labTotals.get(labIdStr) || 0,
        present: 0,
        absent: 0,
        daysMap: new Map() // dayId -> { present, absent }
      });
    });

    atts.forEach(a => {
      const labId = a._id.labId?.toString();
      const dayId = a._id.dayId?.toString();
      if (!labId || !dayId) return;

      const l = labData.get(labId);
      if (l) {
        l.present += a.present;
        l.absent += a.absent;
        if (!l.daysMap.has(dayId)) l.daysMap.set(dayId, { present: 0, absent: 0 });
        l.daysMap.get(dayId).present += a.present;
        l.daysMap.get(dayId).absent += a.absent;
      }
    });

    return Array.from(labData.values()).map((l: any) => {
      const totalAtts = l.present + l.absent;
      const attendanceRate = totalAtts > 0 ? (l.present / totalAtts) * 100 : 0;
      
      const daysArray = Array.from(l.daysMap.entries()).map((entry: any) => { const [dId, stats] = entry;
        const dTotal = stats.present + stats.absent;
        return {
          dayId: dId,
          attendanceRate: dTotal > 0 ? Number(((stats.present / dTotal) * 100).toFixed(2)) : 0
        };
      });

      return {
        labId: l.labId,
        name: l.name,
        students: l.students,
        present: l.present,
        absent: l.absent,
        attendanceRate: Number(attendanceRate.toFixed(2)),
        days: daysArray
      };
    });
  }

  static async getStudent(studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid student ID');
    }

    const student = await Student.findById(studentId).populate('labId', 'name').lean();
    if (!student) {
      throw new AppError(404, 'NOT_FOUND', 'Student not found');
    }

    const attendances = await Attendance.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      {
        $lookup: {
          from: 'days',
          localField: 'dayId',
          foreignField: '_id',
          as: 'day'
        }
      },
      { $unwind: '$day' },
      { $sort: { 'day.dayNumber': 1 } }
    ]);

    let presentCount = 0;
    let absentCount = 0;
    const timeline = attendances.map(a => {
      if (a.status === 'PRESENT') presentCount++;
      if (a.status === 'ABSENT') absentCount++;
      return {
        dayId: a.dayId,
        dayNumber: a.day.dayNumber,
        date: a.day.date,
        status: a.status
      };
    });

    const daysRecorded = presentCount + absentCount;
    const overallAttendanceRate = daysRecorded > 0 ? (presentCount / daysRecorded) * 100 : 0;

    return {
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        branch: student.branch,
        lab: student.labId
      },
      overallAttendanceRate: Number(overallAttendanceRate.toFixed(2)),
      presentCount,
      absentCount,
      daysRecorded,
      timeline
    };
  }

  static async getMatrix(labId?: string, branch?: string, dayId?: string) {
    const studentMatch: any = {};
    if (labId && mongoose.Types.ObjectId.isValid(labId)) {
      studentMatch.labId = new mongoose.Types.ObjectId(labId);
    }
    if (branch) {
      studentMatch.branch = branch;
    }

    const students = await Student.find(studentMatch).select('_id name rollNo').lean();
    const studentIds = students.map(s => s._id);

    const dayMatch: any = {};
    if (dayId && mongoose.Types.ObjectId.isValid(dayId)) {
      dayMatch._id = new mongoose.Types.ObjectId(dayId);
    }
    const days = await Day.find(dayMatch).sort({ dayNumber: 1 }).select('_id dayNumber').lean();
    const dayIds = days.map(d => d._id);

    const attendances = await Attendance.find({
      studentId: { $in: studentIds },
      dayId: { $in: dayIds }
    }).select('studentId dayId status').lean();

    const attMap = new Map();
    attendances.forEach(a => {
      const sId = a.studentId?.toString();
      if (!sId) return;
      if (!attMap.has(sId)) attMap.set(sId, new Map());
      attMap.get(sId).set(a.dayId?.toString(), a.status);
    });

    const studentData = students.map(s => {
      const sId = s._id?.toString();
      const sAtts = attMap.get(sId) || new Map();
      const attendanceArray = days.map(d => {
        const dId = d._id?.toString();
        return {
          dayId: dId,
          status: sAtts.get(dId) || 'PENDING'
        };
      });
      return {
        _id: s._id,
        name: s.name,
        rollNo: s.rollNo,
        attendance: attendanceArray
      };
    });

    return {
      days: days.map(d => ({ _id: d._id, dayNumber: d.dayNumber })),
      students: studentData
    };
  }

  static async getDistribution() {
    const studentsAtt = await Attendance.aggregate([
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } }
        }
      }
    ]);

    const ranges = {
      "0-20%": 0,
      "21-40%": 0,
      "41-60%": 0,
      "61-80%": 0,
      "81-100%": 0
    };

    studentsAtt.forEach(sa => {
      const rate = sa.total > 0 ? (sa.present / sa.total) * 100 : 0;
      if (rate <= 20) ranges["0-20%"]++;
      else if (rate <= 40) ranges["21-40%"]++;
      else if (rate <= 60) ranges["41-60%"]++;
      else if (rate <= 80) ranges["61-80%"]++;
      else ranges["81-100%"]++;
    });

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count
    }));
  }
}
