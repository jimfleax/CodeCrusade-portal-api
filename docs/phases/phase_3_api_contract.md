# Phase 3 API Contract

## GET /api/students
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Query parameters: optional filters (e.g. labId)
- Success: 200 { success: true, data: { students: [{ _id: string, rollNo: string, name: string, email: string, branch: string, labId: string, createdAt: string, updatedAt: string }] } }
- Errors: 401 (unauthorized), 500 (server error)

## GET /api/students/:id
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { student: { _id: string, rollNo: string, name: string, email: string, branch: string, labId: string, createdAt: string, updatedAt: string } } }
- Errors: 401 (unauthorized), 404 (not found), 500 (server error)

## POST /api/students
- Auth required: Yes (SUPER_ADMIN)
- Request body: { rollNo: string, name: string, email: string, branch: string, labId: string }
- Success: 201 { success: true, data: { student: { _id: string, rollNo: string, name: string, email: string, branch: string, labId: string } } }
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 500 (server error)

## PATCH /api/students/:id
- Auth required: Yes (SUPER_ADMIN)
- Request body: { rollNo?: string, name?: string, email?: string, branch?: string, labId?: string }
- Success: 200 { success: true, data: { student: { _id: string, ... } } }
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

## DELETE /api/students/:id
- Auth required: Yes (SUPER_ADMIN)
- Request body: None
- Success: 200 { success: true, message: "Student deleted" }
- Errors: 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

## GET /api/labs
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { labs: [{ _id: string, name: string, code: string, description: string, active: boolean }] } }
- Errors: 401 (unauthorized), 500 (server error)

## GET /api/labs/:id
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { lab: { _id: string, name: string, code: string, description: string, active: boolean } } }
- Errors: 401 (unauthorized), 404 (not found), 500 (server error)

## POST /api/labs
- Auth required: Yes (SUPER_ADMIN)
- Request body: { name: string, code: string, description: string, active?: boolean }
- Success: 201 { success: true, data: { lab: { _id: string, name: string, code: string, description: string, active: boolean } } }
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 500 (server error)

## PATCH /api/labs/:id
- Auth required: Yes (SUPER_ADMIN)
- Request body: { name?: string, code?: string, description?: string, active?: boolean }
- Success: 200 { success: true, data: { lab: { _id: string, ... } } }
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

## GET /api/days
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { days: [{ _id: string, dayNumber: number, date: string, title: string, status: string }] } }
- Errors: 401 (unauthorized), 500 (server error)

## GET /api/days/:id
- Auth required: Yes (SUPER_ADMIN, COORDINATOR)
- Request body: None
- Success: 200 { success: true, data: { day: { _id: string, dayNumber: number, date: string, title: string, status: string } } }
- Errors: 401 (unauthorized), 404 (not found), 500 (server error)

## POST /api/days
- Auth required: Yes (SUPER_ADMIN)
- Request body: { dayNumber: number, date: string, title: string, status?: string }
- Success: 201 { success: true, data: { day: { _id: string, dayNumber: number, date: string, title: string, status: string } } }
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 500 (server error)

## PATCH /api/days/:id
- Auth required: Yes (SUPER_ADMIN)
- Request body: { dayNumber?: number, date?: string, title?: string, status?: string }
- Success: 200 { success: true, data: { day: { _id: string, ... } } }
- Errors: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
