# MongoDB Slow Query Analysis

## 1. Missing Indexes Found

Based on reading the `Attendance`, `Dashboard`, and `Analytics` controllers/services, the following indexes are missing and causing slow queries or in-memory sorts:

### `Attendance` Collection:
1. **`{ createdAt: -1 }`**
   - **Where:** `attendanceService.ts` (`getAttendances`)
   - **Why:** The paginated API sorts by `-createdAt`. Without an index, this will lead to slow, in-memory sorting operations for large attendance lists.
2. **`{ updatedAt: -1 }`**
   - **Where:** `dashboard.service.ts` (`getOverview`)
   - **Why:** To fetch the 5 most recently updated records (`Attendance.find().sort({ updatedAt: -1 }).limit(5)`).
3. **`{ dayId: 1, status: 1 }`**
   - **Where:** `dashboard.service.ts` (`getOverview`) and `analyticsService.ts` (`branchContribution`)
   - **Why:** Used frequently to count present/absent students on a given day (`Attendance.countDocuments({ dayId: ..., status: 'PRESENT' })`).
4. **`{ studentId: 1, status: 1 }`**
   - **Where:** `dashboard.service.ts` (`getDistribution`)
   - **Why:** Could allow for a covered query or efficient index scan when grouping by student to count total and present days.

### `Student` Collection:
1. **`{ labId: 1, branch: 1 }`**
   - **Where:** `dashboard.service.ts` (`getMatrix`) and `analyticsService.ts` 
   - **Why:** Filtering students simultaneously by `labId` and `branch` is currently unindexed as a compound match.

---

## 2. Slow / Complex Aggregations

Several operations rely on intensive aggregations that will scale poorly as the collections grow.

### A. Full Collection Scans & Groupings
- **`DashboardService.getOverview()` & `getDistribution()`:**
  Both functions perform `$group` on the entire `Attendance` collection without any `$match` condition. This requires scanning every document.
- **`DashboardService.getDays()` & `getLabs()`:**
  These perform an aggregation on the *entire* `Attendance` collection (or an entire day) followed by a `$lookup` into `students` to group by `labId`.

### B. Heavy `$lookup` Operations (`analyticsService.ts`)
- **`retentionCurve`, `branchContribution`, `labUtilization`, `atRiskStudents`:**
  All of these pipelines join (`$lookup`) the `Student` collection (and sometimes `Day`) on a large number of `Attendance` records just to filter or group by `branch` and `labId`.
- **Architectural Solution:** Instead of trying to index these aggregations, **denormalization** is highly recommended. If `labId` and `branch` are stored directly on the `Attendance` schema, all `$lookup`s can be completely removed from `analyticsService.ts` and `dashboard.service.ts`. This would allow fast, indexed queries like: `Attendance.aggregate([{ $match: { branch: 'CS' } }, ...])`.

## 3. Query Replacements
- **`DashboardService.getStudent(studentId)`:**
  Uses a `$lookup` to join `days` and sort by `dayNumber` inside an aggregation. This could be simplified to a `find({ studentId }).populate('dayId')` and sorted by `createdAt`, skipping the heavy DB aggregation engine for a simple chronological fetch.
