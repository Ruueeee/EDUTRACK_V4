# EduTrack — AI Project Prompt
> Web-Based Classroom and Task Management System  
> Version 1.1 | Caraga State University

---

## 🎯 Project Mission

Build **EduTrack**, a production-quality web application that centralizes academic task management for university students and instructors. The system must feel like a modern SaaS product — clean, fast, and purposeful. No unnecessary visual noise, no gradient soup. Think Linear, Notion, or Vercel's dashboard aesthetic: functional elegance.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 (credentials provider) |
| Database | MySQL via Prisma ORM |
| File Uploads | UploadThing or local `/uploads` folder |
| Server | Apache (production) / Next.js dev server |
| State | Zustand or React Context |
| Forms | React Hook Form + Zod |
| Notifications | Sonner (toast) |
| Icons | Lucide React |

---

## 👤 User Roles

Three distinct roles with separate dashboards and permissions:

### Student
- Register/login with email + password
- Enroll in courses via class code
- View announcements
- Submit assignments (file upload)
- View grades and feedback
- Task Tracker (pending/completed tasks with deadline highlights)
- Self-Notes (private, CRUD)
- Activity Log (auto-tracked actions)

### Instructor
- Register/login with instructor flag
- Create, edit, archive courses
- Generate unique class codes
- Post announcements to enrolled students
- Create assignments with deadlines
- Grade submissions, provide text feedback
- View class roster and activity

### Admin
- Manage all users (view, deactivate, role assignment)
- Monitor system-wide activity logs
- View analytics dashboard (submission rates, active users, etc.)

---

## 🗄️ Database Schema

Use Prisma with MySQL. Implement all models below.

```prisma
// schema.prisma

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
  PENDING
  SUBMITTED
  GRADED
  LATE
}

enum TaskStatus {
  PENDING
  COMPLETED
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          Role      @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  coursesCreated   Course[]       @relation("InstructorCourses")
  enrollments      Enrollment[]
  submissions      Submission[]
  selfNotes        SelfNote[]
  activityLogs     ActivityLog[]
}

model Course {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text
  classCode   String    @unique
  isArchived  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  instructorId String
  instructor   User         @relation("InstructorCourses", fields: [instructorId], references: [id])
  enrollments  Enrollment[]
  announcements Announcement[]
  assignments  Assignment[]
}

model Enrollment {
  id        String   @id @default(cuid())
  joinedAt  DateTime @default(now())

  userId    String
  courseId  String
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}

model Announcement {
  id        String   @id @default(cuid())
  title     String
  body      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
}

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
}

model Submission {
  id          String           @id @default(cuid())
  fileUrl     String?
  fileName    String?
  status      SubmissionStatus @default(PENDING)
  grade       Int?
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
}

model SelfNote {
  id        String   @id @default(cuid())
  title     String
  body      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  user      User     @relation(fields: [userId], references: [id])
}

model ActivityLog {
  id        String   @id @default(cuid())
  action    String   // e.g. "LOGIN", "SUBMIT_ASSIGNMENT", "VIEW_COURSE"
  metadata  Json?    // optional: { courseId, assignmentId, etc. }
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}
```

---

## 📁 Project File Structure

```
edutrack/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # shared sidebar + topbar
│   │   ├── student/
│   │   │   ├── page.tsx            # student home/dashboard
│   │   │   ├── courses/page.tsx
│   │   │   ├── courses/[courseId]/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── notes/page.tsx
│   │   │   └── activity/page.tsx
│   │   ├── instructor/
│   │   │   ├── page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   ├── courses/[courseId]/page.tsx
│   │   │   ├── courses/[courseId]/assignments/[assignmentId]/page.tsx
│   │   │   └── courses/[courseId]/grade/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       └── logs/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── courses/route.ts
│       ├── courses/[courseId]/route.ts
│       ├── courses/[courseId]/enroll/route.ts
│       ├── announcements/route.ts
│       ├── assignments/route.ts
│       ├── submissions/route.ts
│       ├── submissions/[submissionId]/grade/route.ts
│       ├── notes/route.ts
│       ├── notes/[noteId]/route.ts
│       ├── activity/route.ts
│       └── admin/users/route.ts
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── PageHeader.tsx
│   ├── courses/
│   │   ├── CourseCard.tsx
│   │   ├── CourseCreateForm.tsx
│   │   └── EnrollForm.tsx
│   ├── assignments/
│   │   ├── AssignmentCard.tsx
│   │   ├── AssignmentForm.tsx
│   │   ├── SubmissionForm.tsx
│   │   └── GradeForm.tsx
│   ├── tasks/
│   │   └── TaskList.tsx
│   ├── notes/
│   │   ├── NoteCard.tsx
│   │   └── NoteEditor.tsx
│   ├── announcements/
│   │   ├── AnnouncementCard.tsx
│   │   └── AnnouncementForm.tsx
│   └── activity/
│       └── ActivityTable.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── logger.ts                   # activity log helper
│   ├── classCode.ts                # generates unique class codes
│   └── validators/
│       ├── course.ts
│       ├── assignment.ts
│       └── note.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── .env.local
├── tailwind.config.ts
└── package.json
```

---

## 🎨 Design System

### Core Philosophy
- **No decorative gradients.** Color only carries meaning (status, role, alert).
- **Whitespace is structure.** Padding and spacing do the visual work.
- **Typography leads.** Font weight and size hierarchy replace color hierarchy.
- **Micro-interactions, not animations.** Subtle hover states and transitions only.

### Color Palette (CSS Variables)
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --primary: 222 47% 11%;         /* near-black: buttons, active states */
  --primary-foreground: 0 0% 100%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --ring: 222 47% 11%;
  --radius: 0.5rem;

  /* Status colors */
  --status-pending: 38 92% 50%;   /* amber */
  --status-submitted: 217 91% 60%; /* blue */
  --status-graded: 142 76% 36%;   /* green */
  --status-late: 0 84% 60%;       /* red */
}
```

### Typography Scale
```
Page title:      text-2xl font-semibold tracking-tight
Section header:  text-lg font-medium
Card title:      text-sm font-medium
Body:            text-sm text-muted-foreground
Label:           text-xs font-medium uppercase tracking-wide text-muted-foreground
```

### Component Patterns
- Cards: `rounded-lg border bg-card p-4 shadow-sm`
- Sidebar nav items: `rounded-md px-3 py-2 text-sm font-medium`
- Active nav: `bg-accent text-accent-foreground`
- Status badges: pill-shaped, color-coded, no border
- Tables: borderless rows, subtle hover, sticky header
- Empty states: centered illustration + CTA, never blank

---

## 🔐 Auth Flow

```
POST /api/auth/register
  body: { name, email, password, role }
  → hash password (bcrypt, 12 rounds)
  → create User in DB
  → return session

POST /api/auth/[...nextauth]
  → credentials provider
  → verify hash
  → return JWT with { id, name, email, role }

Middleware:
  → protect /student/* for STUDENT role
  → protect /instructor/* for INSTRUCTOR role
  → protect /admin/* for ADMIN role
  → redirect to /login if unauthenticated
```

---

## 🤖 AI Sub-Agent Architecture

Use this mental model when implementing with AI assistance. Break the build into autonomous sub-tasks:

### Agent 1 — Schema & Seed Agent
**Scope:** Database foundation  
**Files:** `prisma/schema.prisma`, `prisma/seed.ts`, `lib/prisma.ts`  
**Prompt pattern:** "Given the Prisma schema in SCHEMA.md, generate a complete seed file that creates 1 admin, 2 instructors, 10 students, 3 courses with enrollments, announcements, assignments, and sample submissions."

### Agent 2 — Auth Agent
**Scope:** NextAuth setup, middleware, register API  
**Files:** `lib/auth.ts`, `app/api/auth/`, `middleware.ts`, `app/(auth)/`  
**Prompt pattern:** "Implement NextAuth v5 with credentials provider using Prisma adapter. Protect routes by role. Login page must match the design system in DESIGN.md."

### Agent 3 — API Route Agent
**Scope:** All REST endpoints  
**Files:** `app/api/**`  
**Prompt pattern:** "Implement the API routes defined in API.md. Use Zod for request validation. Log every mutation to ActivityLog via the logger helper. Return consistent { data, error } response shapes."

### Agent 4 — Instructor UI Agent
**Scope:** Instructor-facing pages and components  
**Files:** `app/(dashboard)/instructor/**`, `components/courses/`, `components/assignments/`  
**Prompt pattern:** "Build the instructor dashboard following DESIGN.md. Course cards show enrollment count, assignment count, and archive status. Assignment creation uses a multi-step form."

### Agent 5 — Student UI Agent
**Scope:** Student-facing pages and components  
**Files:** `app/(dashboard)/student/**`, `components/tasks/`, `components/notes/`  
**Prompt pattern:** "Build the student dashboard. Task Tracker shows assignments grouped by status with deadline urgency indicators (overdue = red, due today = amber, upcoming = normal). Self-notes is a simple CRUD panel."

### Agent 6 — Admin UI Agent
**Scope:** Admin panel  
**Files:** `app/(dashboard)/admin/**`  
**Prompt pattern:** "Build the admin panel with a users table (searchable, filterable by role, deactivatable) and a system-wide activity log table with filters for user, action type, and date range."

---

## 📋 Feature Checklist

### Phase 1 — Foundation
- [ ] Project scaffold (Next.js 14, Tailwind, shadcn/ui)
- [ ] Prisma schema + MySQL connection
- [ ] Seed script
- [ ] NextAuth v5 setup + middleware
- [ ] Register + Login pages

### Phase 2 — Core Features
- [ ] Course CRUD (instructor)
- [ ] Class code enrollment (student)
- [ ] Announcements (post + view)
- [ ] Assignment creation (instructor)
- [ ] File submission (student)
- [ ] Grading + feedback (instructor)

### Phase 3 — Productivity Features
- [ ] Task Tracker with deadline status
- [ ] Self-Notes CRUD
- [ ] Activity Log auto-recording

### Phase 4 — Admin + Polish
- [ ] Admin user management
- [ ] Admin analytics dashboard
- [ ] Responsive layout (desktop + laptop)
- [ ] Empty states on all pages
- [ ] Loading skeletons
- [ ] Toast notifications

---

## ⚙️ Environment Variables

```env
# .env.local
DATABASE_URL="mysql://user:password@localhost:3306/edutrack"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🚦 NFR Targets

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Response time | < 2 seconds |
| NFR-02 | Concurrent users | ≥ 100 |
| NFR-03 | Password storage | bcrypt, 12 rounds |
| NFR-04 | Role-based access | Middleware enforced |
| NFR-05 | Input sanitization | Zod + Prisma parameterized queries |
| NFR-07 | UI usability | Zero onboarding needed for basic tasks |
| NFR-09 | Availability | ≥ 90% during test phase |
| NFR-10 | Responsiveness | Desktop + laptop (≥ 1024px) |
| NFR-11 | Data integrity | DB transactions on submissions |
