# Performance & Architectural Research

This directory contains deep-dive technical investigations, query plan analyses, and architecture proposals aimed at optimizing backend performance and scalability for the CodeCrusade Attendance Tracker API.

---

## Documents Catalog

### 1. [slow-queries.md](./slow-queries.md) — MongoDB Slow Query Plan Analysis
- **Focus:** Query execution bottleneck analysis across Attendance, Student, Dashboard, and Analytics services.
- **Key Findings:**
  - Missing compound indexes on `Attendance` (`{ createdAt: -1 }`, `{ updatedAt: -1 }`, `{ dayId: 1, status: 1 }`, `{ studentId: 1, status: 1 }`).
  - Missing compound indexes on `Student` (`{ labId: 1, branch: 1 }` / `{ labs: 1, branch: 1 }`).
  - Heavy `$lookup` join operations in `analyticsService.ts` causing collection scans.
  - Architectural proposal for selective denormalization of `labId` and `branch` directly onto the `Attendance` schema to eliminate `$lookup` bottlenecks.
- **Implementation Status:**
  - Core compound indexes were implemented in `src/models/Attendance.ts` and `src/models/Student.ts`.

### 2. [mutation-points.md](./mutation-points.md) — Data Mutation Points Audit
- **Focus:** Complete audit of controller endpoints where dynamic state is mutated (created, updated, deleted, frozen/unfrozen).
- **Purpose:** Identifies exact hook locations required for event-driven in-memory cache invalidation.
- **Key Findings:**
  - **Student Mutations:** `POST /students`, `PUT /students/:id`, `DELETE /students/:id`.
  - **Day Mutations:** `POST /days`, `PUT /days/:id`, `DELETE /days/:id`, `POST /days/:id/freeze`, `POST /days/:id/unfreeze`, lab freeze endpoints.
  - **Attendance Mutations:** `PUT /attendance/day/:dayId` (bulk upsert), `POST /attendance/day/:dayId/mark-missing-absent`, `PATCH /attendance/:id`.
  - **StaffUser Mutations:** None in controllers (only seeded via `src/scripts/seed.ts`).
- **Implementation Status:**
  - Paired with `src/utils/cache.ts` (LRU/TTL in-memory cache) for targeted cache invalidation upon entity mutations.

---

## How to Conduct New Research

When conducting new performance benchmarks or architectural investigations:
1. Place research notes and findings here in `research/<topic-name>.md`.
2. Include concrete query plans, benchmark data, or route inventories.
3. Update this index with a brief abstract and the implementation status in the codebase.
