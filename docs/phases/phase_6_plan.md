# Phase 6: Phase 6 - Hardening & Polish: Integrate routes in app.ts, seed script, security hardening, final tests

## Context
- The app already has most routes integrated in `src/routes/index.ts` and `src/app.ts`.
- `app.ts` includes `helmet`, `cors`, `morgan`, and `rateLimit`.
- The `seed.ts` script is missing and needs to be created to insert an initial Super Admin and basic data.
- Security hardening needs `express-mongo-sanitize` and `xss-clean` or similar defenses.
- Final tests must be consolidated or confirmed.

## Dependency Map
- `src/app.ts` → `src/routes/index.ts`
- `src/scripts/seed.ts` → Models (`StaffUser`, etc.)

## Proposed Changes

### App Security Hardening

#### [MODIFY] src/app.ts
- What: Add NoSQL injection prevention and XSS sanitization.
- Why: PRD Section 33 requires sanitizing user inputs and protecting endpoints. We will add `express-mongo-sanitize` and potentially a custom xss middleware or `xss-clean`.
- Impact: Modifies global middleware.

#### [MODIFY] package.json
- What: Install `express-mongo-sanitize` and `xss-clean`.
- Why: Required for the middleware mentioned above.
- Impact: Adds dependencies.

### Database Seeding

#### [NEW] src/scripts/seed.ts
- What: Create a database seeding script.
- Why: Needed to initialize a Super Admin user and test labs/days to make the system usable post-deployment.
- Impact: Adds a new script file, no impact on runtime API.

### Final Tests

#### [NEW] tests/phase6.test.ts
- What: Add or ensure coverage for critical attendance tests.
- Why: PRD Section 49 lists specific critical integration tests to run (e.g. 179/180 attendance incomplete, duplicate detection).
- Impact: Enhances test coverage.

## DRY Context
- Reuse existing models and config for the seed script.
- The `routes/index.ts` is already integrated.

## Risks & Edge Cases
- Seeding script should not accidentally drop the database in production. It should check `NODE_ENV`.
- Adding `express-mongo-sanitize` might strip valid keys if they happen to start with `$`, though rare in standard REST JSON payloads.
