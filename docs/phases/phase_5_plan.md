# Phase 5: Dashboard & Analytics

## Context
- The system currently has `StaffUser`, `Student`, `Lab`, `Day`, and `Attendance` models.
- We need to implement dashboard analytics endpoints to provide overview stats, day-level stats, lab-level stats, student-level stats, an attendance matrix, and attendance distribution.
- Endpoints will be consumed by the Super Admin dashboard.
- A new controller `dashboard.controller.ts`, service `dashboard.service.ts`, and routes `dashboard.routes.ts` will be created.

## Dependency Map
- `src/routes/dashboard.routes.ts` → imports → `src/controllers/dashboard.controller.ts`
- `src/controllers/dashboard.controller.ts` → calls → `src/services/dashboard.service.ts`
- `src/services/dashboard.service.ts` → imports → `Attendance`, `Student`, `Day`, `Lab` models.
- `src/app.ts` → imports → `src/routes/dashboard.routes.ts` (Phase 6 will likely integrate it, but we can set up the route file now or just add it to app.ts). We'll assume app.ts integration is in Phase 6 as per objective, but we'll create the route file.

## Proposed Changes

### Dashboard Routes & Controller
#### [NEW] src/routes/dashboard.routes.ts
- What: Create router for dashboard endpoints (`/overview`, `/days`, `/labs`, `/students/:studentId`, `/matrix`, `/distribution`).
- Why: To expose analytics endpoints.
- Impact: New route module to be mounted in `app.ts`.

#### [NEW] src/controllers/dashboard.controller.ts
- What: Dashboard controller implementing handlers for the endpoints.
- Why: To parse requests and format responses.
- Impact: Consumes `dashboard.service.ts`.

### Dashboard Service
#### [NEW] src/services/dashboard.service.ts
- What: Business logic for calculating analytics. Uses MongoDB aggregation pipelines for efficient calculation of attendance rates, counts, and distributions.
- Why: Analytics should be calculated server-side.
- Impact: Main analytical engine for Phase 5.

## DRY Context
- We should reuse any existing error handlers (`asyncHandler`, `AppError`).

## Risks & Edge Cases
- Aggregation pipelines might be complex and require careful testing.
- Must ensure `isComplete` logic for days correctly checks against total expected students (which can change if students are added/removed, but PRD says manual populating initially).
- Missing test coverage for complex aggregations; we should add unit/integration tests for `dashboard.service.ts`.

## Scope Validation Notes
- Scope checked: touches only new dashboard files.
- PRD consistency checked: all requested dashboard features are covered.
- Completeness checked: endpoints are protected (will use auth middleware in routes, though not explicitly detailed here, routes will use `authorize('SUPER_ADMIN')`). Tests are mentioned in risks.
