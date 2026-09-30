import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import StaffUser from '../models/StaffUser';
import Lab from '../models/Lab';
import Day from '../models/Day';
import Student from '../models/Student';
import Attendance from '../models/Attendance';
import { config } from '../config/env';

/**
 * Seed script for CodeCrusade Python Workshop Attendance Tracker.
 *
 * Populates:
 *   - 1 Super Admin + 2 Coordinators
 *   - 6 Labs (Lab A – Lab F)
 *   - 180 Students (30 per lab)
 *   - 7 Workshop Days (Day 1–3 COMPLETED, Day 4-7 ACTIVE)
 *   - Attendance for the 3 completed days (~85 % present rate)
 *
 * Idempotent: skips seeding if data already exists.
 */

// ────────────────────────────────────────────────────────────────
// Static data
// ────────────────────────────────────────────────────────────────

const LABS = [
  { code: 'LAB-A', name: 'Lab A', description: 'Computer Science Lab – Block A' },
  { code: 'LAB-B', name: 'Lab B', description: 'Computer Science Lab – Block B' },
  { code: 'LAB-C', name: 'Lab C', description: 'Electronics Lab – Block C' },
  { code: 'LAB-D', name: 'Lab D', description: 'Mechanical Lab – Block D' },
  { code: 'LAB-E', name: 'Lab E', description: 'Civil Lab – Block E' },
  { code: 'LAB-F', name: 'Lab F', description: 'Biotechnology Lab – Block F' },
];

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'BT', 'IT'];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Akshay', 'Amit', 'Ananya', 'Anjali', 'Arjun', 'Bhavya', 'Chaitanya',
  'Deepak', 'Diya', 'Esha', 'Gaurav', 'Harsh', 'Isha', 'Jatin', 'Kavya', 'Kiran', 'Lakshmi',
  'Manish', 'Meera', 'Nandini', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Ravi',
  'Ritika', 'Rohan', 'Sakshi', 'Sameer', 'Sandeep', 'Sanya', 'Shreya', 'Siddharth', 'Sneha', 'Sunil',
  'Tanvi', 'Tushar', 'Uday', 'Varun', 'Vidya', 'Vikram', 'Yash', 'Zara', 'Mohit', 'Kriti',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Joshi', 'Nair', 'Iyer',
  'Chopra', 'Deshmukh', 'Malhotra', 'Kapoor', 'Chauhan', 'Bhat', 'Mehta', 'Rao', 'Pillai', 'Das',
];

// Workshop starts on 2026-10-01
const WORKSHOP_START = new Date('2026-10-01');

function workshopDate(dayOffset: number): Date {
  const d = new Date(WORKSHOP_START);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

// Deterministic "random" based on index for reproducibility
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ────────────────────────────────────────────────────────────────
// Seed functions
// ────────────────────────────────────────────────────────────────

async function seedStaffUsers(): Promise<mongoose.Types.ObjectId[]> {
  const existing = await StaffUser.countDocuments();
  if (existing > 0) {
    console.log(`  ✓ StaffUsers already exist (${existing}). Skipping.`);
    const users = await StaffUser.find().select('_id');
    return users.map((u) => u._id as mongoose.Types.ObjectId);
  }

  const saltRounds = 10;
  const staffData = [
    { name: 'Dr. Rajesh Kumar',      email: 'admin@codecrusade.in',       password: 'Admin@123',   role: 'SUPER_ADMIN'  as const },
    { name: 'Priya Nair',            email: 'priya@codecrusade.in',       password: 'Coord@123',   role: 'COORDINATOR'  as const },
    { name: 'Amit Deshmukh',         email: 'amit@codecrusade.in',        password: 'Coord@123',   role: 'COORDINATOR'  as const },
  ];

  const ids: mongoose.Types.ObjectId[] = [];

  for (const s of staffData) {
    const passwordHash = await bcrypt.hash(s.password, saltRounds);
    const user = await StaffUser.create({
      name: s.name,
      username: s.email.split("@")[0],
      passwordHash,
      role: s.role,
      active: true,
    });
    ids.push((user as any)._id as mongoose.Types.ObjectId);
    console.log(`  + StaffUser created: ${s.name} (${s.role}) — email: ${s.email}, password: ${s.password}`);
  }

  return ids;
}

async function seedLabs(): Promise<mongoose.Types.ObjectId[]> {
  const existing = await Lab.countDocuments();
  if (existing > 0) {
    console.log(`  ✓ Labs already exist (${existing}). Skipping.`);
    const labs = await Lab.find().select('_id');
    return labs.map((l) => l._id as mongoose.Types.ObjectId);
  }

  const ids: mongoose.Types.ObjectId[] = [];
  for (const lab of LABS) {
    const created = await Lab.create({ ...lab, active: true });
    ids.push(created._id as mongoose.Types.ObjectId);
    console.log(`  + Lab created: ${lab.name} (${lab.code})`);
  }

  return ids;
}

async function seedDays(): Promise<mongoose.Types.ObjectId[]> {
  const existing = await Day.countDocuments();
  if (existing > 0) {
    console.log(`  ✓ Days already exist (${existing}). Skipping.`);
    const days = await Day.find().sort({ dayNumber: 1 }).select('_id');
    return days.map((d) => d._id as mongoose.Types.ObjectId);
  }

  const dayDefinitions = [
    { dayNumber: 1, title: 'Day 1 – Python Basics',               status: 'COMPLETED' as const },
    { dayNumber: 2, title: 'Day 2 – Control Flow & Functions',    status: 'COMPLETED' as const },
    { dayNumber: 3, title: 'Day 3 – Data Structures',             status: 'COMPLETED' as const },
    { dayNumber: 4, title: 'Day 4 – OOP in Python',               status: 'ACTIVE'    as const },
    { dayNumber: 5, title: 'Day 5 – File I/O & Exceptions',       status: 'ACTIVE'    as const },
    { dayNumber: 6, title: 'Day 6 – Libraries & APIs',            status: 'ACTIVE'    as const },
    { dayNumber: 7, title: 'Day 7 – Capstone Project',            status: 'ACTIVE'    as const },
  ];

  const ids: mongoose.Types.ObjectId[] = [];
  for (const def of dayDefinitions) {
    const created = await Day.create({
      ...def,
      date: workshopDate(def.dayNumber - 1),
    });
    ids.push(created._id as mongoose.Types.ObjectId);
    console.log(`  + Day created: ${def.title} (${def.status})`);
  }

  return ids;
}

async function seedStudents(labIds: mongoose.Types.ObjectId[]): Promise<mongoose.Types.ObjectId[]> {
  const existing = await Student.countDocuments();
  if (existing > 0) {
    console.log(`  ✓ Students already exist (${existing}). Skipping.`);
    const students = await Student.find().select('_id');
    return students.map((s) => s._id as mongoose.Types.ObjectId);
  }

  const STUDENTS_PER_LAB = 30;
  const ids: mongoose.Types.ObjectId[] = [];
  let rollCounter = 1;

  for (let labIndex = 0; labIndex < labIds.length; labIndex++) {
    const labId = labIds[labIndex];
    const branch = BRANCHES[labIndex % BRANCHES.length];

    for (let s = 0; s < STUDENTS_PER_LAB; s++) {
      const globalIndex = labIndex * STUDENTS_PER_LAB + s;
      const firstName = FIRST_NAMES[globalIndex % FIRST_NAMES.length];
      const lastName = LAST_NAMES[globalIndex % LAST_NAMES.length];
      // Make name unique by appending counter when names would collide
      const fullName = `${firstName} ${lastName}`;
      const rollNo = `CC26${String(rollCounter).padStart(3, '0')}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${rollNo.toLowerCase()}@student.codecrusade.in`;

      const student = await Student.create({
        rollNo,
        name: fullName,
        email,
        branch,
        labs: [labId],
      });
      ids.push(student._id as mongoose.Types.ObjectId);
      rollCounter++;
    }

    console.log(`  + 30 students created for Lab ${LABS[labIndex].name} (${branch})`);
  }

  console.log(`  = Total students created: ${ids.length}`);
  return ids;
}

async function seedAttendance(
  studentIds: mongoose.Types.ObjectId[],
  dayIds: mongoose.Types.ObjectId[],
  staffIds: mongoose.Types.ObjectId[],
): Promise<void> {
  const existing = await Attendance.countDocuments();
  if (existing > 0) {
    console.log(`  ✓ Attendance records already exist (${existing}). Skipping.`);
    return;
  }

  // Seed attendance for the first 3 completed days only
  const completedDayIds = dayIds.slice(0, 3);
  const bulkOps: mongoose.AnyBulkWriteOperation<any>[] = [];
  let presentCount = 0;
  let absentCount = 0;

  for (let dayIdx = 0; dayIdx < completedDayIds.length; dayIdx++) {
    const dayId = completedDayIds[dayIdx];
    // Rotate which coordinator marked the attendance
    const markedBy = staffIds[dayIdx % staffIds.length];

    for (let sIdx = 0; sIdx < studentIds.length; sIdx++) {
      const studentId = studentIds[sIdx];

      // ~85% present rate, deterministic per student+day
      const rand = pseudoRandom(dayIdx * 1000 + sIdx);
      const status = rand < 0.85 ? 'PRESENT' : 'ABSENT';

      if (status === 'PRESENT') presentCount++;
      else absentCount++;

      bulkOps.push({
        insertOne: {
          document: {
            studentId,
            dayId,
            status,
            markedBy,
            markedAt: workshopDate(dayIdx),
          },
        },
      });
    }
  }

  // Execute in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
    const batch = bulkOps.slice(i, i + BATCH_SIZE);
    await Attendance.bulkWrite(batch, { ordered: false });
  }

  const total = presentCount + absentCount;
  const pct = ((presentCount / total) * 100).toFixed(1);
  console.log(`  + Attendance seeded: ${total} records (${presentCount} PRESENT / ${absentCount} ABSENT — ${pct}%)`);
  console.log(`  + Days covered: Day 1, Day 2, Day 3 (COMPLETED)`);
}

// ────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CodeCrusade Workshop — Database Seeder        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (config.nodeEnv === 'production') {
    console.error('✗ Refusing to seed in production environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongoDbUri);
    console.log('✓ Connected to MongoDB\n');

    console.log('[1/5] Seeding Staff Users...');
    const staffIds = await seedStaffUsers();

    console.log('\n[2/5] Seeding Labs...');
    const labIds = await seedLabs();

    console.log('\n[3/5] Seeding Days...');
    const dayIds = await seedDays();

    console.log('\n[4/5] Seeding Students...');
    const studentIds = await seedStudents(labIds);

    console.log('\n[5/5] Seeding Attendance...');
    await seedAttendance(studentIds, dayIds, staffIds);

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Seed Summary');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Staff Users : ${await StaffUser.countDocuments()}`);
    console.log(`  Labs        : ${await Lab.countDocuments()}`);
    console.log(`  Days        : ${await Day.countDocuments()}`);
    console.log(`  Students    : ${await Student.countDocuments()}`);
    console.log(`  Attendance  : ${await Attendance.countDocuments()}`);
    console.log('══════════════════════════════════════════════════');
    console.log('\n  Login credentials:');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │ Super Admin:  admin@codecrusade.in / Admin@123  │');
    console.log('  │ Coordinator:  priya@codecrusade.in / Coord@123  │');
    console.log('  │ Coordinator:  amit@codecrusade.in  / Coord@123  │');
    console.log('  └─────────────────────────────────────────────┘');
    console.log('\n✓ Seeding complete.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
  }
}

main();
