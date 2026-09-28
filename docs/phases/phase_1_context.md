# Phase 1 Context: Phase 1 - Foundation Hardening: Refactor errorMiddleware, create AppError, asyncHandler, attendanceCalc, types, validators

## Global Project Guidelines
- Primary Backend Stack: MongoDB, Express.js, TypeScript
- Runtime: Node.js
- Controllers should primarily handle request validation, authentication context, calling services, and formatting responses.
- Business logic such as attendance calculations, bulk validation, database operations, and authorization logic should reside primarily in services.
- Use schema validation at the API boundary. Every API request should validate payloads, parameters, query params, and filters.
- The API should return consistent errors. 
Example:
```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_INCOMPLETE",
    "message": "Attendance must be provided for all students."
  }
}
```
Important error categories:
- UNAUTHORIZED
- FORBIDDEN
- VALIDATION_ERROR
- NOT_FOUND
- INVALID_ATTENDANCE_STATUS
- DUPLICATE_STUDENT_IN_PAYLOAD
- INTERNAL_SERVER_ERROR

## Phase-Specific Requirements
- Express + TypeScript setup (Foundation)
- Error handling
- Request validation
- Base middleware
- attendanceCalc (attendance calculations)
- types

## Resolved Clarifications (Relevant to This Phase)
None specified for this phase in the PRD.

## Schema Context
Schema map not yet generated. This phase will create it.

## Shared Utilities Available
No shared utilities registered yet.

## API Contracts from Previous Phases
None
