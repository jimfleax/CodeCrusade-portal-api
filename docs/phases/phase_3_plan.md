# Phase 3: Core Entities: Lab, Student, Day models, CRUD services, controllers, and routes

## Context
- The project already has the models scaffolded (`Lab`, `Student`, `Day`, `Attendance`, `StaffUser`) in `src/models/`.
- Phase 1 & 2 set up `AppError`, `asyncHandler`, `authMiddleware`, and `errorHandler`.
- This phase focuses on creating the CRUD services, controllers, and routing for `Lab`, `Student`, and `Day`.

## Dependency Map
- `src/routes/studentRoutes.ts`, `src/routes/labRoutes.ts`, `src/routes/dayRoutes.ts` → import → Controllers
- Controllers (`src/controllers/studentController.ts`, `src/controllers/labController.ts`, `src/controllers/dayController.ts`) → import → Services
- Services (`src/services/studentService.ts`, `src/services/labService.ts`, `src/services/dayService.ts`) → import → Models
- Services also import `AppError`
- Controllers use `asyncHandler`
- Routes use `authenticate`, `authorize` from `src/middleware/authMiddleware.ts`
- `src/routes/index.ts` → imports → All route files

## Proposed Changes

### Students
#### NEW src/services/studentService.ts
- What: Create, Read, Update, Delete methods for students. Include cascade delete for attendance.
- Why: Isolate business logic.

#### NEW src/controllers/studentController.ts
- What: HTTP handlers wrapped in `asyncHandler`.

#### NEW src/routes/studentRoutes.ts
- What: Define Express routes mapped to controllers, with auth and validation middleware. GET routes allow COORDINATOR and SUPER_ADMIN. POST/PUT/DELETE require SUPER_ADMIN.

### Labs
#### NEW src/services/labService.ts
- What: CRUD operations for Labs. Prevent deletion if students exist.

#### NEW src/controllers/labController.ts
- What: HTTP handlers for Labs.

#### NEW src/routes/labRoutes.ts
- What: Routes for Labs, with auth and validation middleware. GET routes allow COORDINATOR and SUPER_ADMIN. POST/PUT/DELETE require SUPER_ADMIN.

### Days
#### NEW src/services/dayService.ts
- What: CRUD operations for Days. Prevent duplicates. Include cascade delete for attendance.

#### NEW src/controllers/dayController.ts
- What: HTTP handlers for Days.

#### NEW src/routes/dayRoutes.ts
- What: Routes for Days, with auth and validation middleware. GET routes allow COORDINATOR and SUPER_ADMIN. POST/PUT/DELETE require SUPER_ADMIN.

### Routing Integration
#### MODIFY src/routes/index.ts
- What: Register `studentRoutes`, `labRoutes`, `dayRoutes`.
- Why: Expose endpoints on `/api/students`, `/api/labs`, `/api/days`.

## DRY Context
- Reuse `asyncHandler` for all async controller methods.
- Reuse `AppError` for throwing errors from services or controllers.
- Reuse `authenticate` and `authorize` for protection, allowing SUPER_ADMIN full access and COORDINATOR read-only access where applicable.

## Risks & Edge Cases
- When deleting a student, we should delete their attendance records. The `Student` model may or may not have a pre-hook, we should handle cascade logic in the service.
- Prevent deleting a Lab if it still has students assigned.
- Handle Day uniqueness constraint cleanly.
- When deleting a Day, cascade delete its associated attendance records.
- Controller functions must be tested for proper error handling and response formatting.

## Scope Validation Notes
- **PRD_CONTRADICTION**: Adjusted route authorization. PRD states Coordinators can view student roster, select a day, and filter by lab. Changed generic `authorize('SUPER_ADMIN')` to allow `COORDINATOR` access on GET routes for Students, Labs, and Days.
- **MISSING_COMPANION**: Added validation middleware requirement to routes (`studentRoutes`, `labRoutes`, `dayRoutes`).
- **MISSING_COMPANION**: Added cascade delete requirement for attendance when deleting a Day in `dayService` and Risks & Edge Cases.
- **MISSING_COMPANION**: Added test target note for new controller functions in Risks & Edge Cases.
