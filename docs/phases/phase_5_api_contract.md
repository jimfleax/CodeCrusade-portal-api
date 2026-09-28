# Phase 5 API Contract: Dashboard & Analytics

## GET /api/dashboard/overview
- Auth required: Yes (Super Admin)
- Request body: None
- Query parameters: None
- Success: 200 { success: boolean, data: { totalStudents: number, totalLabs: number, daysCreated: number, daysCompleted: number, expectedAttendance: number, recordedAttendance: number, present: number, absent: number, overallAttendanceRate: number } }
- Errors: 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)

## GET /api/dashboard/days
- Auth required: Yes (Super Admin)
- Request body: None
- Query parameters: None
- Success: 200 { success: boolean, data: [ { dayId: string, dayNumber: number, date: string, totalStudents: number, present: number, absent: number, attendanceRate: number, isComplete: boolean, labBreakdown: [ { labId: string, name: string, present: number, total: number, attendanceRate: number } ] } ] }
- Errors: 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)

## GET /api/dashboard/labs
- Auth required: Yes (Super Admin)
- Request body: None
- Query parameters: dayId (optional)
- Success: 200 { success: boolean, data: [ { labId: string, name: string, students: number, present: number, absent: number, attendanceRate: number, days: [ { dayId: string, attendanceRate: number } ] } ] }
- Errors: 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)

## GET /api/dashboard/students/:studentId
- Auth required: Yes (Super Admin)
- Request body: None
- Query parameters: None
- Success: 200 { success: boolean, data: { student: { _id: string, name: string, rollNo: string, email: string, branch: string, lab: { _id: string, name: string } }, overallAttendanceRate: number, presentCount: number, absentCount: number, daysRecorded: number, timeline: [ { dayId: string, dayNumber: number, date: string, status: string } ] } }
- Errors: 400 (Invalid ID), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

## GET /api/dashboard/matrix
- Auth required: Yes (Super Admin)
- Request body: None
- Query parameters: labId (optional), branch (optional), dayId (optional)
- Success: 200 { success: boolean, data: { days: [ { _id: string, dayNumber: number } ], students: [ { _id: string, name: string, rollNo: string, attendance: [ { dayId: string, status: string } ] } ] } }
- Errors: 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)

## GET /api/dashboard/distribution
- Auth required: Yes (Super Admin)
- Request body: None
- Query parameters: None
- Success: 200 { success: boolean, data: [ { range: string, count: number } ] }
- Errors: 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)
