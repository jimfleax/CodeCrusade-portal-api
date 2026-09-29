## Destination

Optimize the backend API's performance by adding in-memory response caching with event-driven invalidation, optimizing the Analytics, Dashboard, and Attendance endpoints, and adding missing MongoDB indexes based on query plan analysis.

## Notes

- Domain: Backend API Performance Optimization.
- Skills: `optimizing-web-performance`, `wayfinder`.
- Preferences: In-memory caching over Redis. Event-driven cache invalidation to prevent stale data.

## Decisions so far

- [[Research] Analyze slow query plans in MongoDB (#2)](https://github.com/jimfleax/CodeCrusade-portal-api/issues/2) — Indexes needed: `createdAt: -1`, `updatedAt: -1`, `dayId: 1, status: 1`, `studentId: 1, status: 1` on Attendance. `labId: 1, branch: 1` on Student. Also found major bottleneck in `$lookup` joins.
- [[Research] Identify all data mutation points for cache invalidation (#6)](https://github.com/jimfleax/CodeCrusade-portal-api/issues/6) — Mutation points found across `Attendance`, `Day`, and `Student` controllers. No `StaffUser` mutations found in controllers. Event-driven cache invalidation hooks must be placed in these exact spots.
- **Cache Eviction**: Use TTL + LRU policy for the in-memory cache if it grows too large.
- **Denormalization Strategy**: Denormalize `labId` and `branch` onto the `Attendance` schema. Since students never change branch/lab, we don't need update triggers for student changes. A migration script will be needed for existing data.

## Not yet specified
*(None - the way is fully clear!)*

## Out of scope
