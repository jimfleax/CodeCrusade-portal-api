# Phase 4: Phase 4 - Attendance System: Attendance model, bulk upsert business logic, validation, endpoints

## Context
- The codebase already has `src/models/Attendance.ts` scaffolded with the correct schema and unique indexes.
- `src/services/attendanceCalc.ts` exists for percentage calculations.
- We need to implement the core business logic for retrieving and bulk upserting attendance records.

## Dependency Map
- `src/routes/index.ts` → imports → `src/routes/attendanceRoutes.ts`
- `src/routes/attendanceRoutes.ts` → imports → `src/controllers/attendanceController.ts`, `src/middleware/validateRequest.ts`, auth middleware
- `src/controllers/attendanceController.ts` → calls → `src/services/attendanceService.ts`
- `src/services/attendanceService.ts` → imports → `src/models/Attendance.ts`, `src/models/Student.ts`, `src/models/Day.ts`

## Proposed Changes

### src/services/attendanceService.ts
#### NEW src/services/attendanceService.ts
- What: Create the service to handle business logic for attendance.
  - `getAttendances(filters)`: Retrieves attendance records based on dayId, labId, status.
  - `getAttendanceById(id)`: Retrieves a specific attendance record.
  - `getStudentAttendance(studentId)`: Retrieves all attendance records for a student.
  - `getDayAttendance(dayId)`: Retrieves all attendance records for a day.
  - `bulkUpsertAttendance(dayId, attendanceData, staffUserId)`:
    - Validates that `dayId` exists.
    - Validates that all students in `attendanceData` exist.
    - Validates no duplicate studentIds in payload.
    - Validates all active students are included (full day attendance payload).
    - Performs bulk upsert (using MongoDB `bulkWrite`) to either update or insert records atomically.
  - `updateAttendance(id, status, staffUserId)`: Updates a single attendance record.
- Why: Encapsulates attendance business rules outside of controllers.

### src/controllers/attendanceController.ts
#### NEW src/controllers/attendanceController.ts
- What: Create the controller for handling HTTP requests.
  - Methods: `getAll`, `getById`, `getByStudent`, `getByDay`, `bulkUpsert`, `update`.
  - Parses parameters and body, calls `attendanceService`.
- Why: Interface between HTTP layer and service layer.

### src/routes/attendanceRoutes.ts
#### NEW src/routes/attendanceRoutes.ts
- What: Create Express router for attendance endpoints.
  - Registers routes:
    - `GET /`
    - `GET /:id`
    - `GET /student/:studentId` (mapped to API contract `/api/students/:studentId/attendance` via parent router if needed or handle directly)
    - `GET /day/:dayId`
    - `PUT /day/:dayId`
    - `PATCH /:id`
  - Uses Joi validation schemas and `validateRequest` middleware.
  - Protects all routes with `protect` and `authorize('SUPER_ADMIN', 'COORDINATOR')`.
- Why: Exposes the controller methods to HTTP clients.

### src/routes/index.ts
#### MODIFY src/routes/index.ts
- What: Import and mount `attendanceRoutes`.
- Why: Wire up the new endpoints to the main API.

## DRY Context
- Use `src/middleware/validateRequest.ts` (or `src/middlewares/validateRequest.ts` based on what exists).
- Use `AppError` and `asyncHandler` from `src/utils` or `src/middleware`.
- Use `protect` and `authorize` from `src/middlewares/authMiddleware.ts` (or similar).

## Risks & Edge Cases
- Bulk Upsert Atomicity: MongoDB `bulkWrite` should be used to ensure either everything is written or nothing (if possible), or at least optimize DB calls.
- Validating full payload: Must query the `Student` collection to ensure the payload length matches the active student count, and all student IDs match exactly.
- Modifying Attendance: When updating, `updatedBy` and `updatedAt` must be updated, while keeping `markedBy` and `markedAt` intact.

## Scope Validation Notes
- **MISSING_COMPANION**: Added test target notes to Risks & Edge Cases for the new controller functions (`bulkUpsertAttendance`, `updateAttendance`, `getAttendances`, etc.).
- **MISSING_COMPANION**: Ensured bulk operations include validation logic for all required rules from PRD (e.g., partial payload rejection).

## Testing Targets (Added during Scope Validation)
- `src/controllers/attendanceController.ts`: Test `bulkUpsert` for proper validation failure on partial payload.
- `src/controllers/attendanceController.ts`: Test `bulkUpsert` for duplicate student rejection.
- `src/services/attendanceService.ts`: Test `bulkUpsertAttendance` atomicity using MongoDB `bulkWrite`.
