# Database Schema — EduTrack

## Engine: MySQL via Prisma ORM

---

## Entity Relationship Overview

```
User ──< Enrollment >── Course ──< Announcement
 |                         |
 |                         └──< Assignment ──< Submission
 |                                                  |
 ├──────────────────────────────────────────────────┘ (student)
 |
 ├──< SelfNote
 └──< ActivityLog
```

---

## Full Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

enum SubmissionStatus {
  PENDING     // assignment exists but student hasn't submitted
  SUBMITTED   // file uploaded, not yet graded
  GRADED      // instructor has graded
  LATE        // submitted after dueDate
}

enum TaskStatus {
  PENDING
  COMPLETED
}

// ─── Users ───────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(STUDENT)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  coursesCreated Course[]      @relation("InstructorCourses")
  enrollments    Enrollment[]
  submissions    Submission[]
  selfNotes      SelfNote[]
  activityLogs   ActivityLog[]
}

// ─── Courses ─────────────────────────────────────────────────────────────────

model Course {
  id           String   @id @default(cuid())
  title        String
  description  String?  @db.Text
  classCode    String   @unique
  isArchived   Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  instructorId  String
  instructor    User           @relation("InstructorCourses", fields: [instructorId], references: [id])
  enrollments   Enrollment[]
  announcements Announcement[]
  assignments   Assignment[]
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

model Enrollment {
  id       String   @id @default(cuid())
  joinedAt DateTime @default(now())

  userId   String
  courseId String
  user     User   @relation(fields: [userId], references: [id])
  course   Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
  @@index([courseId])
}

// ─── Announcements ───────────────────────────────────────────────────────────

model Announcement {
  id        String   @id @default(cuid())
  title     String
  body      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  courseId String
  course   Course @relation(fields: [courseId], references: [id])

  @@index([courseId])
}

// ─── Assignments ─────────────────────────────────────────────────────────────

model Assignment {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  dueDate     DateTime
  maxPoints   Int      @default(100)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  courseId    String
  course      Course       @relation(fields: [courseId], references: [id])
  submissions Submission[]

  @@index([courseId])
  @@index([dueDate])
}

// ─── Submissions ─────────────────────────────────────────────────────────────

model Submission {
  id          String           @id @default(cuid())
  fileUrl     String?
  fileName    String?
  status      SubmissionStatus @default(PENDING)
  grade       Int?             // 0 to maxPoints
  feedback    String?          @db.Text
  submittedAt DateTime?
  gradedAt    DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  studentId    String
  assignmentId String
  student      User       @relation(fields: [studentId], references: [id])
  assignment   Assignment @relation(fields: [assignmentId], references: [id])

  @@unique([studentId, assignmentId])
  @@index([assignmentId])
  @@index([studentId])
}

// ─── Self-Notes ───────────────────────────────────────────────────────────────

model SelfNote {
  id        String   @id @default(cuid())
  title     String
  body      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id])

  @@index([userId])
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

model ActivityLog {
  id        String   @id @default(cuid())
  action    String   // LOGIN | ENROLL_COURSE | SUBMIT_ASSIGNMENT | etc.
  metadata  Json?    // { courseId, assignmentId, submissionId, ... }
  createdAt DateTime @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
  @@index([action])
}
```

---

## Seed Data Targets

The `prisma/seed.ts` file should create:

| Entity | Count |
|---|---|
| Admin users | 1 |
| Instructor users | 2 |
| Student users | 10 |
| Courses | 3 (each with a unique class code) |
| Enrollments | Students distributed across courses |
| Announcements | 2 per course |
| Assignments | 3 per course |
| Submissions | ~50% of student-assignment combinations |
| Self-notes | 3 per student |
| Activity logs | Auto-generated from above actions |

---

## Class Code Generator

```typescript
// lib/classCode.ts
import { prisma } from "./prisma"

export async function generateUniqueClassCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no ambiguous chars
  let code: string
  let exists = true

  while (exists) {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("")
    const found = await prisma.course.findUnique({ where: { classCode: code } })
    exists = !!found
  }

  return code!
}
```

---

## Key Queries Reference

### Get student's task list
```typescript
// All assignments from enrolled courses with submission status
const tasks = await prisma.assignment.findMany({
  where: {
    course: {
      enrollments: { some: { userId: studentId } },
      isArchived: false,
    },
  },
  include: {
    course: { select: { title: true } },
    submissions: {
      where: { studentId },
      select: { status: true, grade: true, submittedAt: true },
    },
  },
  orderBy: { dueDate: "asc" },
})
```

### Get instructor's course with full data
```typescript
const course = await prisma.course.findUnique({
  where: { id: courseId },
  include: {
    enrollments: { include: { user: { select: { id: true, name: true, email: true } } } },
    announcements: { orderBy: { createdAt: "desc" } },
    assignments: {
      orderBy: { dueDate: "asc" },
      include: { _count: { select: { submissions: true } } },
    },
  },
})
```

### Admin analytics
```typescript
const [totalUsers, totalCourses, submissionsByStatus] = await prisma.$transaction([
  prisma.user.count(),
  prisma.course.count(),
  prisma.submission.groupBy({
    by: ["status"],
    _count: true,
  }),
])
```
