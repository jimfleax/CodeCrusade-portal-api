# Product Requirements Document
## Centralized Python Workshop Attendance Tracker

**Document Status:** Product / Engineering Planning  
**Version:** 1.0  
**Primary Backend Stack:** MongoDB, Express.js, TypeScript  
**Runtime:** Node.js  
**Primary Users:** Super Admin, Coordinators  
**Student Login:** Not required in V1

---

# 1. Product Overview

The Centralized Python Workshop Attendance Tracker is a web-based administrative system for recording, managing, monitoring, and analyzing student attendance during a multi-day Python workshop.

The workshop is expected to run for approximately seven days, but the system must support extension beyond seven days without requiring any architectural changes.

The application has two primary user-facing areas:

1. **Coordinator Interface** — used by one or more coordinators to mark and modify student attendance.
2. **Super Admin Interface** — used by the workshop authority to monitor students, attendance, labs, daily attendance, and overall workshop statistics.

Student data will initially be populated manually in the database. Each student has a fixed lab assignment.

Attendance is recorded exactly once per student per workshop day and has only two possible states:

```text
PRESENT
ABSENT
```

All students are expected to attend every workshop day.

The system must prioritize correctness of attendance data, simplicity of marking attendance, strong database integrity, and useful administrative insights.

---

# 2. Product Goals

## 2.1 Primary Goals

The system must:

- Maintain a centralized student database.
- Maintain a list of workshop days.
- Maintain fixed lab assignments for students.
- Allow coordinators to mark attendance for all students.
- Allow attendance to be filtered by day and lab.
- Support bulk attendance submission for an entire day.
- Allow coordinators to correct attendance later.
- Prevent duplicate attendance records.
- Ensure every expected student has an explicit attendance status.
- Provide the super admin with a complete attendance overview.
- Provide day-level, lab-level, and student-level attendance insights.
- Provide searchable and filterable administrative views.
- Preserve sufficient metadata to identify who created or modified attendance records.
- Support workshops longer than seven days.

## 2.2 Secondary Goals

The architecture should make it possible to add later:

- Student attendance portals.
- Attendance exports.
- Advanced reporting.
- Notifications.
- Attendance thresholds.
- More detailed audit trails.
- Automated attendance mechanisms such as QR check-in.

These are not required to complicate V1.

---

# 3. Non-Goals for V1

The following are explicitly outside the core V1 scope:

- Student authentication.
- Student self-service attendance dashboards.
- Multiple attendance sessions per day.
- Different attendance states such as Late or Excused.
- Variable lab assignment during the workshop.
- Student-specific daily attendance eligibility.
- QR-based attendance.
- Biometric attendance.
- Attendance approval workflows.
- Coordinator-to-coordinator approval systems.

The architecture should not prevent these capabilities from being added later.

---

# 4. Core Business Rules

These rules define the fundamental behavior of the system.

## 4.1 Workshop duration

The normal workshop duration is seven days.

The system must not hard-code seven days into the database schema.

A workshop may contain:

```text
Day 1
Day 2
...
Day N
```

where N is determined by the actual workshop schedule.

## 4.2 One attendance event per day

There is exactly one attendance marking opportunity for each student on each day.

There are no separate sessions within a day.

Therefore:

```text
Student + Day = one attendance record
```

## 4.3 Every student is expected to attend every day

There is no concept of "not applicable" attendance in V1.

If there are:

```text
180 students
7 completed days
```

then the expected number of attendance records is:

```text
180 × 7 = 1,260
```

## 4.4 Attendance statuses

Only two statuses are supported:

```text
PRESENT
ABSENT
```

## 4.5 Fixed lab assignment

Every student belongs to exactly one lab.

That lab assignment remains fixed during the workshop.

The lab is therefore a property of the student rather than of an individual attendance record.

## 4.6 Attendance uniqueness

There must never be more than one attendance record for the same student on the same day.

Database-level uniqueness must enforce:

```text
UNIQUE(studentId, dayId)
```

## 4.7 Coordinator modification

Coordinators may modify previously submitted attendance.

The system should not impose an approval workflow in V1.

However, the system must retain:

- who originally marked the attendance,
- when it was marked,
- who last modified it,
- when it was last modified.

## 4.8 Coordinator access

A coordinator is responsible for workshop attendance generally rather than being restricted to a specific lab.

Therefore a coordinator can:

- view students,
- filter students by lab,
- mark attendance,
- modify attendance,
- view existing attendance.

The lab is a filtering and analytical dimension, not an authorization boundary.

## 4.9 Super Admin access

The Super Admin has unrestricted visibility and administrative access to the workshop.

The Super Admin can:

- view all students,
- view all labs,
- view all days,
- view all attendance,
- filter attendance,
- inspect individual students,
- inspect individual labs,
- inspect individual days,
- modify attendance,
- inspect attendance metadata.

---

# 5. User Roles

## 5.1 Super Admin

The Super Admin represents the primary workshop authority.

### Permissions

The Super Admin can:

- authenticate,
- view all students,
- view all labs,
- view all days,
- view all attendance,
- filter all attendance data,
- search students,
- inspect student attendance histories,
- inspect lab statistics,
- inspect day statistics,
- modify attendance,
- add or manage days,
- manage workshop configuration,
- manage staff accounts if implemented,
- inspect data-quality issues.

---

## 5.2 Coordinator

One or more coordinators may exist.

### Permissions

A Coordinator can:

- authenticate,
- view the student roster,
- filter students by lab,
- select a day,
- view current attendance for that day,
- mark attendance,
- submit bulk attendance,
- modify previously submitted attendance.

Coordinators do not require lab-specific authorization in V1.

---

## 5.3 Student

Students are represented as database entities but do not require authentication in V1.

Students are not responsible for submitting attendance themselves.

---

# 6. High-Level Architecture

The system consists of:

```text
Frontend
   │
   │ HTTP / HTTPS
   ▼
Express + TypeScript API
   │
   ├── Authentication / Authorization
   ├── Student Services
   ├── Day Services
   ├── Lab Services
   ├── Attendance Services
   ├── Dashboard / Analytics Services
   └── Audit / Activity Metadata
   │
   ▼
MongoDB
```

Recommended implementation structure:

```text
src/
├── config/
├── controllers/
├── services/
├── routes/
├── models/
├── middleware/
├── validators/
├── utils/
├── types/
└── app.ts
```

The controllers should remain thin.

Business logic such as attendance validation, bulk upsert behavior, statistics calculation, and permission checks should reside primarily in services.

---

# 7. Core Domain Model

The core entities are:

```text
StaffUser
Student
Lab
Day
Attendance
```

An optional supporting entity is:

```text
AuditLog
```

---

# 8. Staff User Model

Represents authenticated administrative users.

### Fields

```text
StaffUser
-------------------------
_id
name
email
passwordHash
role
active
createdAt
updatedAt
```

### Role

```text
SUPER_ADMIN
COORDINATOR
```

### Constraints

- Email must be unique.
- Inactive staff cannot authenticate.
- Passwords must never be stored in plaintext.

---

# 9. Student Model

Represents workshop participants.

### Fields

```text
Student
-------------------------
_id
rollNo
name
email
branch
labId
createdAt
updatedAt
```

Additional student metadata may be added if required:

```text
phone
college
year
batch
```

### Constraints

- `rollNo` should be unique.
- `labId` is required.
- Student identity data should not be duplicated inside attendance records.

---

# 10. Lab Model

Represents the fixed workshop labs.

### Fields

```text
Lab
-------------------------
_id
name
code
description
active
createdAt
updatedAt
```

Example:

```text
Lab A
Lab B
Lab C
```

`code` should be unique if used.

---

# 11. Day Model

Represents a workshop day.

### Fields

```text
Day
-------------------------
_id
dayNumber
date
title
status
createdAt
updatedAt
```

### Example

```text
dayNumber: 1
title: "Day 1"
date: 2026-10-01
```

### Status

A simple lifecycle can be:

```text
UPCOMING
ACTIVE
COMPLETED
```

The status is administrative metadata and does not replace the actual attendance records.

### Constraints

`dayNumber` must be unique within the workshop.

The application must never assume that the final day is Day 7.

---

# 12. Attendance Model

Attendance is the central transactional entity.

### Fields

```text
Attendance
-------------------------
_id
studentId
dayId
status
markedBy
markedAt
updatedBy
updatedAt
```

### Status

```text
PRESENT
ABSENT
```

### Relationships

```text
Attendance
   ├── studentId → Student
   ├── dayId → Day
   ├── markedBy → StaffUser
   └── updatedBy → StaffUser
```

### Critical database constraint

A compound unique index must exist on:

```text
(studentId, dayId)
```

This guarantees:

```text
One student
+
One day
=
One attendance record
```

---

# 13. Why Lab Is Not Stored in Attendance

Because every student's lab assignment is fixed, `labId` should exist on `Student`, not `Attendance`.

For example:

```text
Student
Rahul
Lab A
```

His Day 3 attendance becomes:

```text
Attendance
Rahul
Day 3
PRESENT
```

The associated lab is obtained through the student relationship.

This avoids inconsistent states such as:

```text
Student → Lab A

Attendance → Lab B
```

The student's lab remains the single source of truth.

---

# 14. Attendance Integrity Rules

The backend must enforce all of the following.

## Rule 1 — Every student must have an explicit status

A daily bulk submission is only valid when every expected student is included.

For:

```text
200 students
```

the submitted attendance payload must contain exactly 200 distinct students.

## Rule 2 — No unknown students

Attendance cannot be created for a student ID that does not exist.

## Rule 3 — No unknown days

Attendance cannot be created for an invalid day.

## Rule 4 — No duplicate student entries

A bulk request containing the same student twice must be rejected.

## Rule 5 — No duplicate database attendance

The database compound unique index prevents duplicate `(studentId, dayId)` records.

## Rule 6 — Only valid statuses

Only:

```text
PRESENT
ABSENT
```

are accepted.

## Rule 7 — Attendance updates cannot accidentally create duplicates

Existing attendance should be updated rather than blindly inserted.

---

# 15. Coordinator Attendance Workflow

## Step 1 — Select Day

The coordinator selects:

```text
Day 1
Day 2
Day 3
...
Day N
```

## Step 2 — Load student roster

The backend returns the complete student roster and any existing attendance for the selected day.

If attendance has not yet been recorded, the UI should show students as unmarked.

## Step 3 — Filter

The coordinator can filter by:

```text
Lab
Search
```

Search can include:

```text
Name
Roll Number
Email
```

Lab filtering changes only the displayed subset; it does not restrict the coordinator's permissions.

## Step 4 — Mark attendance

Each student is assigned:

```text
PRESENT
```

or:

```text
ABSENT
```

## Step 5 — Submit

The frontend sends the complete day's attendance payload.

## Step 6 — Validate

The server verifies:

```text
All students included
No duplicates
All students exist
Day exists
Statuses valid
```

## Step 7 — Save

The backend performs an atomic bulk upsert/update operation.

## Step 8 — Confirmation

The frontend displays confirmation that attendance was successfully saved.

---

# 16. Bulk Attendance API Contract

Conceptual request:

```http
PUT /api/days/:dayId/attendance
```

Request:

```json
{
  "attendance": [
    {
      "studentId": "student-id-1",
      "status": "PRESENT"
    },
    {
      "studentId": "student-id-2",
      "status": "ABSENT"
    }
  ]
}
```

The backend determines:

```text
dayId
+
studentId
```

and performs an update or insert accordingly.

The request should be treated atomically wherever practical.

If validation fails, the entire operation should fail rather than partially updating attendance.

---

# 17. Attendance Modification

The coordinator may return to a completed day and make changes.

Example:

```text
Day 3
Rahul → ABSENT

Later:

Rahul → PRESENT
```

The system updates the existing attendance record.

The metadata must reflect the change:

```text
markedBy
markedAt

updatedBy
updatedAt
```

For the initial implementation, the system does not require an explicit "reason for correction" field.

---

# 18. Super Admin Dashboard

The Super Admin dashboard should provide information at multiple levels.

---

## 18.1 Overall Workshop Overview

Primary metrics:

```text
Total Students
Total Labs
Days Created
Days Completed
Expected Attendance
Recorded Attendance
Present
Absent
Overall Attendance %
```

Example:

```text
Students:             180
Days Completed:         5
Expected Attendance:  900

Present:              824
Absent:                76

Attendance Rate:     91.56%
```

---

# 19. Attendance Rate Definition

The system should use a single centralized definition.

For the basic two-state model:

```text
Attendance Rate
=
Present Records
÷
Expected Attendance Records
× 100
```

For example:

```text
824 / 900 × 100
= 91.56%
```

The formula should live in a service/helper layer and be reused by:

- Dashboard
- Student analytics
- Lab analytics
- Day analytics
- Exports

This prevents different parts of the application from calculating attendance differently.

---

# 20. Day-Level Analytics

The Super Admin should be able to inspect attendance for each day.

Example:

```text
Day 1
----------------
Present: 176
Absent: 4
Rate: 97.78%
```

Across the workshop:

```text
Day 1 → 97.78%
Day 2 → 95.56%
Day 3 → 94.44%
Day 4 → 90.00%
Day 5 → 91.67%
```

Recommended visualization:

- day-by-day attendance trend,
- present vs absent distribution,
- number of students marked.

The dashboard must clearly distinguish:

```text
No attendance submitted
```

from:

```text
Attendance submitted with 100% absence/presence distribution
```

---

# 21. Lab-Level Analytics

The Super Admin should be able to inspect each lab.

Example:

```text
Lab A
Students: 60
Present: 278
Absent: 22
Attendance Rate: 92.67%
```

Lab analytics should support:

```text
All Days
Specific Day
```

For example:

```text
Lab A
-------------------------
Day 1    96%
Day 2    94%
Day 3    91%
Day 4    89%
...
```

---

# 22. Student-Level Analytics

The Super Admin must be able to search for a student.

Search fields:

```text
Name
Roll Number
Email
```

Student profile should contain:

```text
Name
Roll No
Email
Branch
Lab
Overall Attendance
Present Count
Absent Count
Days Recorded
```

Attendance timeline:

```text
Day 1   Present
Day 2   Present
Day 3   Absent
Day 4   Present
Day 5   Present
```

This gives the authority an immediate view of an individual student's attendance history.

---

# 23. Attendance Matrix / Heatmap

The Super Admin should have an optional matrix view:

```text
Student             D1   D2   D3   D4   D5   D6   D7

Rahul Sharma        P    P    A    P    P    P    P
Ananya Das          P    P    P    P    A    P    P
Arjun Roy           A    P    P    A    P    P    P
```

Where:

```text
P = Present
A = Absent
```

The matrix should support:

- search,
- lab filtering,
- branch filtering,
- day filtering.

---

# 24. Attendance Distribution

The dashboard may show how attendance is distributed across students.

Example:

```text
100% attendance       84 students
90–99%                 48 students
80–89%                 29 students
70–79%                 12 students
Below 70%               7 students
```

This provides a more useful picture than a single overall percentage.

The exact ranges should be configurable if implemented.

---

# 25. Data Completion Monitoring

The Super Admin should be able to determine whether attendance has been fully recorded.

Example:

```text
Day 1
180 / 180 recorded
COMPLETE

Day 2
180 / 180 recorded
COMPLETE

Day 3
175 / 180 recorded
INCOMPLETE
```

Because every student is expected to attend every day, a completed day must contain exactly:

```text
number of students
```

attendance records.

This provides a direct data-quality indicator.

---

# 26. Daily Summary

For each day:

```text
Day 4

Total Students:       180
Present:              160
Absent:                20

Attendance Rate:    88.89%

Lab Breakdown
-------------------------
Lab A    54 / 60
Lab B    53 / 60
Lab C    53 / 60
```

The Super Admin should be able to drill down into the actual student records from the summary.

---

# 27. Filtering and Search

Filtering should be available throughout the administrative interface.

### Global student filtering

```text
Name
Roll No
Email
Branch
Lab
```

### Attendance filtering

```text
Day
Lab
Student
Status
```

For V1, the most important required filters are:

```text
Day
Lab
```

Search and branch filtering are useful secondary filters.

---

# 28. Proposed API Structure

The API should follow resource-oriented design.

## Authentication

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

If token refresh is used:

```text
POST   /api/auth/refresh
```

---

## Students

```text
GET    /api/students
GET    /api/students/:id
POST   /api/students
PATCH  /api/students/:id
DELETE /api/students/:id
```

Student creation can remain an administrative/development operation during the initial deployment.

---

## Labs

```text
GET    /api/labs
GET    /api/labs/:id
POST   /api/labs
PATCH  /api/labs/:id
```

---

## Days

```text
GET    /api/days
GET    /api/days/:id
POST   /api/days
PATCH  /api/days/:id
```

---

## Attendance

```text
GET    /api/attendance
GET    /api/attendance/:id
GET    /api/students/:studentId/attendance
GET    /api/days/:dayId/attendance

PUT    /api/days/:dayId/attendance

PATCH  /api/attendance/:id
```

Example filters:

```text
GET /api/attendance?dayId=...
GET /api/attendance?dayId=...&labId=...
GET /api/attendance?dayId=...&status=ABSENT
```

---

## Dashboard

Dedicated aggregation endpoints are recommended:

```text
GET /api/dashboard/overview
GET /api/dashboard/days
GET /api/dashboard/labs
GET /api/dashboard/students/:studentId
```

Analytics should preferably be calculated server-side rather than sending all raw attendance records to the frontend for every dashboard calculation.

---

# 29. Query and Indexing Strategy

MongoDB indexes should support the most common operations.

Recommended indexes:

### Students

```text
unique: rollNo
index: labId
index: email
```

### Days

```text
unique: dayNumber
index: date
```

### Attendance

```text
unique compound: { studentId, dayId }
index: dayId
index: studentId
```

Because lab filtering is performed through the student's `labId`, attendance does not require a duplicated `labId` field.

For high-performance analytics involving frequent day + lab filtering, aggregation pipelines using `$lookup` or denormalized reporting strategies can be introduced later if required.

---

# 30. Backend Service Responsibilities

Controllers should primarily handle:

- request validation,
- authentication context,
- calling services,
- response formatting,
- HTTP status codes.

Services should handle:

- business rules,
- attendance calculations,
- bulk validation,
- database operations,
- authorization logic,
- dashboard aggregations.

Example:

```text
attendance.controller.ts
        ↓
attendance.service.ts
        ↓
Attendance Model
Student Model
Day Model
```

This separation should prevent business logic from becoming tightly coupled to Express controllers.

---

# 31. Validation

Use schema validation at the API boundary.

A suitable validation library can be selected during implementation.

Every API request should validate:

- IDs,
- enums,
- required fields,
- arrays,
- duplicates,
- pagination parameters,
- filters.

The bulk attendance endpoint in particular requires strict validation.

---

# 32. Authentication and Authorization

The system should authenticate administrative users before allowing attendance operations.

Recommended V1 model:

```text
Authentication
→ JWT or secure session

Authorization
→ Role-based access control
```

Roles:

```text
SUPER_ADMIN
COORDINATOR
```

Example middleware:

```text
authenticate
authorize("SUPER_ADMIN")
authorize("SUPER_ADMIN", "COORDINATOR")
```

Attendance read/write endpoints can be accessible to both Super Admin and Coordinator.

Administrative configuration endpoints should be restricted appropriately.

---

# 33. Security Requirements

The backend must:

- hash passwords securely,
- never return password hashes through APIs,
- validate authorization on the server,
- validate all IDs,
- reject unauthorized attendance operations,
- use HTTPS in production,
- protect authentication endpoints against abuse,
- avoid trusting client-provided role information,
- sanitize/validate user-provided strings,
- configure CORS explicitly,
- use secure environment variables for secrets.

The frontend must never be considered the source of truth for permissions.

---

# 34. Audit Metadata

V1 does not require a complex audit-management interface, but attendance records should retain:

```text
markedBy
markedAt
updatedBy
updatedAt
```

This provides basic accountability.

A future `AuditLog` collection can record full before/after changes:

```text
AuditLog
-------------------------
_id
actorId
entityType
entityId
action
before
after
timestamp
```

This is recommended if the system becomes operationally important or corrections become frequent.

---

# 35. Error Handling

The API should return consistent errors.

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

```text
INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
DUPLICATE_RESOURCE
ATTENDANCE_INCOMPLETE
INVALID_ATTENDANCE_STATUS
DUPLICATE_STUDENT_IN_PAYLOAD
INTERNAL_SERVER_ERROR
```

---

# 36. Important Edge Cases

The implementation must account for:

### Duplicate attendance submission

The same day can be submitted multiple times.

The operation must update existing records rather than create duplicates.

### Partial payload

A coordinator sends attendance for only 170 of 180 students.

The API should reject the submission.

### Duplicate student in payload

The same student appears twice.

The API should reject the request.

### Student deleted/changed

Student deletion should be handled carefully because historical attendance references that student.

Soft deletion is preferable if student deletion is ever supported.

### Lab modification

Because lab assignment is intended to be fixed, changing a student's lab should be treated as an administrative operation rather than ordinary attendance editing.

### Repeated day creation

The system should prevent duplicate day numbers.

### Attendance modification

A coordinator modifies a record created earlier.

The original timestamp and modification timestamp should remain distinguishable.

---

# 37. Coordinator UI Requirements

The coordinator interface should prioritize speed.

The primary screen should include:

```text
Day Selector
Lab Filter
Search
Student List
Attendance Controls
Save Button
```

The UI should show:

```text
Total Students
Present
Absent
Unmarked
```

The coordinator should be able to:

- mark individuals,
- mark all as Present,
- switch individual statuses,
- filter by lab,
- search students,
- save all changes.

A "Mark All Present" convenience action is recommended because most workshops will likely have a high percentage of attendance.

The UI must still require a valid state for every student before submission.

---

# 38. Super Admin UI Requirements

The Super Admin interface should be dashboard-first.

Recommended structure:

```text
Dashboard
Students
Attendance
Labs
Days
Staff
```

## Dashboard

Shows:

- total students,
- overall attendance,
- present/absent counts,
- day completion,
- day trend,
- lab breakdown,
- attendance distribution.

## Students

Shows:

- student list,
- profile,
- lab,
- attendance percentage,
- attendance history.

## Attendance

Provides:

- day filtering,
- lab filtering,
- status filtering,
- student search,
- detailed records.

## Labs

Provides:

- lab list,
- number of students,
- attendance statistics.

## Days

Provides:

- day list,
- completion status,
- daily attendance statistics.

---

# 39. Responsive Design

The system should work on:

- desktop,
- laptop,
- tablet.

Coordinator attendance marking should remain usable on smaller screens, though desktop/laptop is the primary assumed operational environment.

Tables should support:

- horizontal scrolling where necessary,
- sticky table headers,
- compact controls,
- efficient filtering.

---

# 40. Performance Requirements

The initial workshop dataset is expected to be relatively small.

For example:

```text
100–500 students
7–15 days
multiple labs
```

The system should comfortably support this scale.

The backend should nevertheless avoid:

- N+1 database queries,
- retrieving unnecessary fields,
- transferring the entire database to the frontend,
- calculating large analytics datasets repeatedly on the client.

Bulk attendance operations should use MongoDB bulk operations where appropriate.

---

# 41. Data Consistency Requirements

Attendance is authoritative data.

Therefore:

- attendance writes should be validated server-side,
- unique database constraints must exist,
- bulk updates should avoid partial writes,
- the frontend must not determine whether data is valid,
- analytics should use the database as the source of truth.

The backend should ideally perform daily bulk attendance updates atomically.

---

# 42. Day Completion Logic

A day is considered attendance-complete when:

```text
Attendance Records
=
Total Active Students
```

Example:

```text
Students: 180
Attendance Records: 180

→ COMPLETE
```

Where:

```text
Attendance Records: 179
```

the day remains incomplete.

The system should not infer completion solely from the existence of any attendance data.

---

# 43. Reporting and Export

Recommended V1/V1.1 reporting options:

### Student attendance report

```text
Roll No
Name
Branch
Lab
Day 1
Day 2
Day 3
...
Overall Attendance
```

### Detailed attendance report

```text
Day
Date
Roll No
Student
Branch
Lab
Status
Marked By
Marked At
Updated At
```

Export formats:

```text
CSV
XLSX
```

PDF can be added later if required.

---

# 44. Suggested Future Features

These should not complicate the initial implementation.

## Student Portal

Students could eventually log in and view:

```text
Overall Attendance
Daily History
Attendance Percentage
```

## QR Attendance

A future system could generate a daily QR code for faster check-in.

## Notifications

Possible notifications:

```text
Daily attendance completion
Low attendance
Incomplete attendance
Administrative corrections
```

## Attendance Threshold

A configurable threshold could identify students requiring attention, for example:

```text
Attendance < configured threshold
```

The threshold should be configurable rather than hard-coded.

## Advanced Audit Log

Full before/after history for every modification.

## Attendance Reports

More advanced printable and downloadable reports.

---

# 45. V1 Feature Prioritization

## Must Have

```text
Student management
Lab management
Day management
Staff authentication
Role-based authorization
Coordinator attendance marking
Bulk attendance submission
Attendance modification
Day filtering
Lab filtering
Student search
Super Admin dashboard
Student attendance history
Day analytics
Lab analytics
Attendance completion status
Database uniqueness constraints
Attendance metadata
```

## Should Have

```text
Attendance trend charts
Attendance matrix
CSV/XLSX export
Branch filtering
Coordinator activity information
Basic audit history
```

## Could Have

```text
Configurable attendance threshold
Automated notifications
Advanced reports
Student portal
QR attendance
```

---

# 46. Acceptance Criteria

The system is considered functionally complete for V1 when all of the following are true.

### Student data

- Students can exist with unique roll numbers.
- Every active student has a fixed lab.
- Student information can be retrieved and searched.

### Days

- Day 1 through Day N can be represented.
- Seven days are supported naturally.
- Additional days can be added without code/schema changes.
- Duplicate day numbers are prevented.

### Attendance

- Every student can have exactly one attendance record per day.
- Only Present and Absent are accepted.
- Duplicate attendance records are impossible at the database level.
- A complete daily submission contains every active student.
- Bulk submission works.
- Existing records are updated correctly.
- Coordinators can make later corrections.

### Coordinator

- Coordinator authentication works.
- Coordinator can view all students.
- Coordinator can filter by lab.
- Coordinator can select a day.
- Coordinator can mark attendance.
- Coordinator can modify existing attendance.

### Super Admin

- Super Admin can view all students.
- Super Admin can view all attendance.
- Super Admin can filter by day.
- Super Admin can filter by lab.
- Super Admin can search students.
- Super Admin can view individual student attendance.
- Super Admin can view day-level statistics.
- Super Admin can view lab-level statistics.
- Super Admin can view overall attendance.
- Super Admin can identify incomplete attendance.

### Data integrity

- Invalid students are rejected.
- Invalid days are rejected.
- Invalid statuses are rejected.
- Duplicate student entries in a bulk request are rejected.
- Partial daily attendance submission is rejected.
- Attendance modifications update modification metadata.

---

# 47. Recommended Initial MongoDB Collections

The initial database can contain:

```text
staffUsers
students
labs
days
attendances
```

Optionally:

```text
auditLogs
```

There is no need for a complex collection hierarchy.

The fundamental relationship is:

```text
Lab
  ↑
Student
  ↑
Attendance
  ↓
Day
```

and:

```text
StaffUser
   ↑
Attendance
```

---

# 48. Recommended Development Order

Implementation should proceed in dependency order.

### Phase 1 — Foundation

- Express + TypeScript setup
- Environment configuration
- MongoDB connection
- Error handling
- Request validation
- Base middleware

### Phase 2 — Authentication

- Staff model
- Password hashing
- Login
- JWT/session strategy
- Role middleware

### Phase 3 — Core entities

- Lab model
- Student model
- Day model
- CRUD APIs

### Phase 4 — Attendance

- Attendance model
- Compound unique index
- Daily retrieval
- Bulk attendance endpoint
- Attendance update endpoint
- Validation rules

### Phase 5 — Coordinator interface

- Day selection
- Student roster
- Lab filtering
- Search
- Bulk marking
- Existing attendance loading
- Save/update workflow

### Phase 6 — Super Admin dashboard

- Overview metrics
- Day analytics
- Lab analytics
- Student analytics
- Attendance matrix
- Completion monitoring

### Phase 7 — Hardening

- Security review
- Index optimization
- Error handling
- Audit metadata
- Testing
- Production deployment

---

# 49. Testing Strategy

The backend should include tests for:

## Unit tests

- Attendance percentage calculation
- Daily completion calculation
- Payload validation
- Permission checks
- Duplicate detection

## Integration tests

- Staff authentication
- Student retrieval
- Day retrieval
- Attendance submission
- Attendance modification
- Dashboard aggregation

## Critical attendance tests

Test that:

```text
Student + Day cannot be duplicated
```

Test that:

```text
179/180 attendance records cannot be submitted as complete
```

Test that:

```text
Invalid status cannot be stored
```

Test that:

```text
Existing attendance is updated rather than duplicated
```

Test that:

```text
Coordinator cannot access unauthorized administrative operations
```

---

# 50. Final System Definition

The finalized V1 system can be summarized as:

```text
                    ┌───────────────┐
                    │   StaffUser   │
                    │               │
                    │ Super Admin   │
                    │ Coordinator   │
                    └───────┬───────┘
                            │
                            │ marks/modifies
                            ▼
┌──────────┐         ┌───────────────┐         ┌──────────┐
│   Lab    │◄────────│    Student    │────────►│Attendance│
└──────────┘         └───────────────┘         └────┬─────┘
                                                     │
                                                     │
                                                     ▼
                                                 ┌─────────┐
                                                 │   Day   │
                                                 └─────────┘
```

The central invariant is:

```text
One student
+
One day
=
Exactly one attendance record
```

The student determines the lab:

```text
Student → Lab
```

The attendance record determines:

```text
Student → Day → Present / Absent
```

The coordinator operates primarily at the daily roster level:

```text
Select Day
→ Load all students
→ Filter by Lab/Search
→ Mark Present/Absent
→ Bulk Save
```

The Super Admin operates at the analytical level:

```text
Overall
→ Day
→ Lab
→ Student
→ Individual Attendance
```

This architecture deliberately keeps the core model simple while leaving enough structure to grow from a seven-day Python workshop into a more general attendance platform later.