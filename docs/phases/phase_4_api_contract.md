# Phase 4 API Contract

## GET /api/attendance
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Query parameters: optional filters (e.g. dayId, labId, status)
- Success: 200 { success: true, data: { attendances: [{ _id: string, studentId: string, dayId: string, status: string, markedBy: string, markedAt: string, updatedBy: string, updatedAt: string, createdAt: string }] } }
- Errors: 401 (unauthorized), 500 (server error)

## GET /api/attendance/:id
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { attendance: { _id: string, studentId: string, dayId: string, status: string, markedBy: string, markedAt: string, updatedBy: string, updatedAt: string, createdAt: string } } }
- Errors: 401 (unauthorized), 404 (not found), 500 (server error)

## GET /api/students/:studentId/attendance
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { attendances: [{ _id: string, studentId: string, dayId: string, status: string, markedBy: string, markedAt: string, updatedBy: string, updatedAt: string, createdAt: string }] } }
- Errors: 401 (unauthorized), 404 (student not found), 500 (server error)

## GET /api/days/:dayId/attendance
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { attendances: [{ _id: string, studentId: string, dayId: string, status: string, markedBy: string, markedAt: string, updatedBy: string, updatedAt: string, createdAt: string }] } }
- Errors: 401 (unauthorized), 404 (day not found), 500 (server error)

## PUT /api/days/:dayId/attendance
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: { attendance: [{ studentId: string, status: string (PRESENT|ABSENT) }] }
- Success: 200 { success: true, message: "Attendance saved successfully", data: { modifiedCount: number, upsertedCount: number } }
- Errors: 400 (validation, partial payload, duplicate student), 401 (unauthorized), 404 (day not found, unknown student), 500 (server error)

## PATCH /api/attendance/:id
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: { status: string (PRESENT|ABSENT) }
- Success: 200 { success: true, data: { attendance: { _id: string, studentId: string, dayId: string, status: string, markedBy: string, markedAt: string, updatedBy: string, updatedAt: string, createdAt: string } } }
- Errors: 400 (validation), 401 (unauthorized), 404 (not found), 500 (server error)
