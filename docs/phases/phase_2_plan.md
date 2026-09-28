# Phase 2: Phase 2 - Authentication & Authorization: StaffUser model, authService, authController, authMiddleware

## Context
- The codebase already contains foundational utilities like `AppError` and `asyncHandler` from Phase 1.
- Mongoose schema for `StaffUser` is already scaffolded.
- Essential auth implementation is present across `authService.ts`, `authController.ts`, `authMiddleware.ts`, and `authRoutes.ts`.

## Dependency Map
- `src/routes/authRoutes.ts` → imports → `authController.ts`, `authMiddleware.ts`
- `src/controllers/authController.ts` → imports → `authService.ts`, `asyncHandler.ts`
- `src/middleware/authMiddleware.ts` → imports → `authService.ts`, `AppError.ts`
- `src/services/authService.ts` → imports → `StaffUser.ts`, `bcrypt`, `jsonwebtoken`, `AppError.ts`

## Proposed Changes

### Auth Implementation Review & Refinement

#### MODIFY src/services/authService.ts
- What: Ensure environment variables for JWT are strictly typed or properly validated.
- Why: DRY reuse and robust error handling.
- Impact: Token signing and verification.

#### MODIFY src/controllers/authController.ts
- What: Add input validation for email and password fields.
- Why: Prevent unhandled errors or NoSQL injections during login.
- Impact: Login route.

#### MODIFY src/middleware/authMiddleware.ts
- What: Ensure `req.user` is properly typed via `express.d.ts`.
- Why: TypeScript safety.
- Impact: Protected routes.

## DRY Context
- Reuse `AppError` for throwing structured errors.
- Reuse `asyncHandler` for wrapping async controller methods.

## Risks & Edge Cases
- Missing validation middleware (e.g., Joi/Zod) on the `/login` route.
- Token expiration edge cases.
