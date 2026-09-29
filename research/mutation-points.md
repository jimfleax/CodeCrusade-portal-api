# Data Mutation Points

This document lists all exact controller methods and routes where dynamic data is altered (created, updated, deleted, etc.) for the `Attendance`, `Day`, `Student`, and `StaffUser` models. These points are candidates for inserting cache invalidation triggers.

## 1. Student Model Mutations

**Controller:** `src/controllers/studentController.ts`
**Routes prefix:** `/students`

* **Create Student:**
  * Route: `POST /students/`
  * Controller Method: `studentController.createStudent`
* **Update Student:**
  * Route: `PUT /students/:id`
  * Controller Method: `studentController.updateStudent`
* **Delete Student:**
  * Route: `DELETE /students/:id`
  * Controller Method: `studentController.deleteStudent`

## 2. Day Model Mutations

**Controller:** `src/controllers/dayController.ts`
**Routes prefix:** `/days`

* **Create Day:**
  * Route: `POST /days/`
  * Controller Method: `dayController.createDay`
* **Update Day:**
  * Route: `PUT /days/:id`
  * Controller Method: `dayController.updateDay`
* **Delete Day:**
  * Route: `DELETE /days/:id`
  * Controller Method: `dayController.deleteDay`
* **Freeze Day:**
  * Route: `POST /days/:id/freeze`
  * Controller Method: `dayController.freezeDay`
* **Unfreeze Day:**
  * Route: `POST /days/:id/unfreeze`
  * Controller Method: `dayController.unfreezeDay`
* **Freeze Lab Attendance:**
  * Route: `POST /days/:dayId/labs/:labId/freeze`
  * Controller Method: `dayController.freezeLabAttendance`
* **Unfreeze Lab Attendance:**
  * Route: `POST /days/:dayId/labs/:labId/unfreeze`
  * Controller Method: `dayController.unfreezeLabAttendance`

## 3. Attendance Model Mutations

**Controller:** `src/controllers/attendanceController.ts`
**Routes prefix:** `/attendance`

* **Bulk Upsert Attendance:**
  * Route: `PUT /attendance/day/:dayId`
  * Controller Method: `attendanceController.bulkUpsertAttendance`
* **Mark Missing as Absent:**
  * Route: `POST /attendance/day/:dayId/mark-missing-absent`
  * Controller Method: `attendanceController.markMissingAsAbsent`
* **Update Single Attendance:**
  * Route: `PATCH /attendance/:id`
  * Controller Method: `attendanceController.updateAttendance`

## 4. StaffUser Model Mutations

* **Note:** Currently, there are no exposed controller methods or routes that mutate the `StaffUser` model. `StaffUser` documents are only created via the database seed script (`src/scripts/seed.ts`). Wait, I should confirm there's really nothing. Confirmed via codebase search.
