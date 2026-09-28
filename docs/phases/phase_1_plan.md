# Phase 1: Foundation Hardening

## Context
- The project has a basic `express` and `mongoose` setup in `src/app.ts`.
- `src/middlewares/errorMiddleware.ts` exists but doesn't conform to the API's standard error response shape `{"success": false, "error": {"code": "...", "message": "..."}}`.
- No `AppError`, `asyncHandler`, `attendanceCalc`, `types` (except what was created in models), or `validators` exist yet.

## Dependency Map
- `src/app.ts` → imports → `src/middlewares/errorMiddleware.ts`
- Routes/Controllers (future) → will import → `src/utils/AppError.ts`, `src/utils/asyncHandler.ts`, `src/validators/*`, `src/services/attendanceCalc.ts`

## Proposed Changes

### Utilities

#### [NEW] src/utils/AppError.ts
- What: Create a custom error class `AppError` extending `Error`. It should accept `statusCode` and `code` (e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR').
- Why: To standardize error throwing across the app and allow the error middleware to easily extract the status and error code.
- Impact: Will be used heavily by controllers and services.

#### [NEW] src/utils/asyncHandler.ts
- What: Create a wrapper function that catches async errors and passes them to `next`.
- Why: Removes the need for `try/catch` blocks in every Express controller (DRY).
- Impact: Simplifies all future controller implementations.

### Middlewares

#### [MODIFY] src/middlewares/errorMiddleware.ts
- What: Refactor `errorHandler` to check if `err` is an instance of `AppError`. Format the JSON response as `{ success: false, error: { code, message } }`. Refactor `notFound` to throw an `AppError` with 404 and code 'NOT_FOUND'.
- Why: To conform to the API contract dictated by the PRD.
- Impact: All API errors will now follow a strict structure.

### Services

#### [NEW] src/services/attendanceCalc.ts
- What: Create utility functions for attendance calculations (e.g., `calculateAttendancePercentage(present: number, total: number)`, `calculateDayCompletion(marked: number, expected: number)`).
- Why: Extracted early as a shared utility to be used by the Dashboard (Phase 5) and potentially Attendance (Phase 4).
- Impact: Centralizes business logic for calculations.

### Validators & Types

#### [NEW] src/types/index.ts
- What: Define shared TypeScript interfaces/types (e.g., standard API Response shapes, Error shapes, or generic pagination types).
- Why: To strictly type the frontend/backend contract.
- Impact: Keeps types organized in a central place.

#### [NEW] src/middlewares/validateRequest.ts
- What: Create a middleware that takes a schema (e.g., Joi or Zod) and validates `req.body`, `req.query`, or `req.params`.
- Why: PRD rule 31: "Use schema validation at the API boundary."
- Impact: Will be applied to all incoming routes that accept payloads.

## DRY Context
- We are setting up the DRY utilities (`AppError`, `asyncHandler`, `validateRequest`) to be used in all subsequent phases.

## Risks & Edge Cases
- Breaking changes: Any existing route using `errorMiddleware` will now receive the new JSON format. Not an issue since there are no core routes yet.
- Test coverage: Ensure `AppError`, `asyncHandler`, and `errorMiddleware` have unit tests to verify error formatting and async error catching.
