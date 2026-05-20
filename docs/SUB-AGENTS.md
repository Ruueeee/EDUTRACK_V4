# Sub-Agent Prompts — EduTrack

Use these prompts in Cursor (Composer / Agent mode) one at a time, in order. Each prompt is self-contained. Attach the referenced files as context when using Cursor.

---

## Agent 1 — Project Scaffold

**Context files to attach:** none  
**What it builds:** package.json, tailwind config, folder structure, globals.css, shadcn setup

```
Create a new Next.js 14 project called "edutrack" using the App Router. Set up the following:

1. Install and configure: tailwind CSS, shadcn/ui (with the New York style, neutral base color), lucide-react, prisma, @prisma/client, next-auth@beta, react-hook-form, @hookform/resolvers, zod, bcryptjs, @types/bcryptjs, sonner, date-fns

2. Create the folder structure exactly as defined in PROMPT.md under "Project File Structure"

3. Set up globals.css with the CSS variables from DESIGN.md

4. Configure tailwind.config.ts to use the CSS variable color system (shadcn standard config)

5. Create a lib/utils.ts with the cn() helper using clsx and tailwind-merge

6. Create placeholder page.tsx files for every route in the file structure (just return a <div> with the route name)

7. Create .env.local with the placeholder variables from PROMPT.md

Do not write any business logic yet. Just scaffold.
```

---

## Agent 2 — Database Schema & Seed

**Context files to attach:** `SCHEMA.md`  
**What it builds:** prisma/schema.prisma, prisma/seed.ts, lib/prisma.ts, lib/classCode.ts

```
Using the Prisma schema in SCHEMA.md:

1. Write the complete prisma/schema.prisma file exactly as specified

2. Write lib/prisma.ts — a singleton Prisma client for Next.js (handle hot reload in dev)

3. Write lib/classCode.ts — the generateUniqueClassCode() function from SCHEMA.md

4. Write prisma/seed.ts that creates:
   - 1 admin user (admin@edutrack.com / password: admin123)
   - 2 instructors (instructor1@edutrack.com, instructor2@edutrack.com / password: instructor123)
   - 10 students (student1@edutrack.com through student10@edutrack.com / password: student123)
   - 3 courses, one per instructor (third course shared)
   - Enroll 5 students per course (with some overlap)
   - 2 announcements per course
   - 3 assignments per course with staggered due dates (one past, one today, one future)
   - Submissions for ~60% of student-assignment pairs with varied statuses
   - 2–3 self-notes per student
   - ActivityLog entries that match the above actions

All passwords must be hashed with bcrypt (12 rounds).
Use the generateUniqueClassCode() function for class codes.
```

---

## Agent 3 — Authentication

**Context files to attach:** `SCHEMA.md`, `API.md`, `DESIGN.md`  
**What it builds:** lib/auth.ts, middleware.ts, app/api/auth/, app/(auth)/login, app/(auth)/register

```
Implement authentication for EduTrack:

1. lib/auth.ts — NextAuth v5 config with:
   - Credentials provider (email + password)
   - Verify password with bcrypt against DB
   - Include { id, name, email, role } in session and JWT token
   - Use Prisma to find user by email

2. middleware.ts — Protect routes:
   - /student/* → only STUDENT role
   - /instructor/* → only INSTRUCTOR role  
   - /admin/* → only ADMIN role
   - Redirect unauthenticated users to /login
   - Redirect authenticated users away from /login and /register

3. app/api/auth/register/route.ts — POST handler:
   - Validate with Zod: { name, email, password, role (STUDENT | INSTRUCTOR) }
   - Hash password (bcrypt, 12 rounds)
   - Create user in DB
   - Return { data: { id, name, email, role }, error: null }

4. app/(auth)/login/page.tsx — Login form:
   - Email + password fields
   - "Sign in" button
   - Link to register
   - Use react-hook-form + zod
   - Show toast on error
   - Design: centered card, max-w-sm, clean — follow DESIGN.md typography and color tokens

5. app/(auth)/register/page.tsx — Register form:
   - Name, email, password, role (dropdown: Student / Instructor)
   - Follow same design pattern as login
```

---

## Agent 4 — Activity Logger + API Routes

**Context files to attach:** `API.md`, `SCHEMA.md`  
**What it builds:** lib/logger.ts, all app/api/** routes

```
Implement the backend API for EduTrack. Follow the API contract in API.md exactly.

First, create lib/logger.ts:
- Export logActivity(userId: string, action: string, metadata?: Record<string, unknown>)
- Writes to ActivityLog in the DB
- Must not throw — wrap in try/catch

Then implement all routes from API.md:
- /api/courses (GET, POST)
- /api/courses/[courseId] (GET, PATCH)
- /api/courses/[courseId]/enroll (POST)
- /api/announcements (GET, POST, PATCH, DELETE)
- /api/assignments (GET, POST, PATCH, DELETE)
- /api/assignments/[id] (GET)
- /api/submissions (GET, POST)
- /api/submissions/[id]/grade (PATCH)
- /api/notes (GET, POST)
- /api/notes/[id] (PATCH, DELETE)
- /api/activity (GET — own for student, all for admin with filters)
- /api/admin/users (GET, PATCH)
- /api/admin/analytics (GET)

Rules for every route:
- Check session with getServerSession, return 401 if missing
- Parse body with Zod, return 400 with error message if invalid
- Enforce role permissions (student can't create assignments, etc.)
- Call logActivity() on every mutating operation
- Return { data, error } shape consistently
- Use db transactions where data integrity matters (submission + log together)
```

---

## Agent 5 — Shared Layout Components

**Context files to attach:** `DESIGN.md`  
**What it builds:** components/layout/*, app/(dashboard)/layout.tsx

```
Build the shared dashboard layout for EduTrack. Follow DESIGN.md exactly.

1. components/layout/Sidebar.tsx:
   - Renders nav links appropriate for the current user's role (read from session)
   - Student nav: Dashboard, My Courses, Task Tracker, Self-Notes, Activity Log
   - Instructor nav: Dashboard, My Courses
   - Admin nav: Dashboard, Users, Activity Logs
   - Active link highlighted with bg-accent
   - Logo area at top: "EduTrack" in font-semibold, with a BookOpen icon
   - User name + role badge at bottom with logout button

2. components/layout/Topbar.tsx:
   - Breadcrumb based on current path
   - User avatar (initials) + dropdown menu (profile, logout)
   - h-14, border-b, bg-white

3. components/layout/PageHeader.tsx:
   - Props: { title, description?, action? }
   - Implement as shown in DESIGN.md

4. app/(dashboard)/layout.tsx:
   - Sidebar on left (w-64, fixed)
   - Main content area: ml-64, flex-1, overflow-auto
   - Topbar at top of main area
   - Wrap children in a padded container
```

---

## Agent 6 — Student Dashboard

**Context files to attach:** `DESIGN.md`, `API.md`  
**What it builds:** All student pages + components

```
Build all student-facing pages for EduTrack. Fetch data from the API routes already built.

Pages to build:

1. app/(dashboard)/student/page.tsx — Student Home
   - Stat cards: Enrolled Courses, Pending Tasks, Submitted This Week
   - Recent Announcements (last 3 across all enrolled courses)
   - Upcoming Deadlines (next 3 assignments)

2. app/(dashboard)/student/courses/page.tsx
   - Grid of CourseCard components
   - Button to enroll (opens a dialog with a class code input)
   - Empty state if no courses

3. app/(dashboard)/student/courses/[courseId]/page.tsx
   - Course title + instructor name
   - Tabs: Announcements | Assignments
   - Announcements: list sorted newest first
   - Assignments: list with submission status badge + submit button

4. app/(dashboard)/student/tasks/page.tsx — Task Tracker
   - Filter tabs: All | Pending | Submitted | Graded | Late
   - Each task card shows: assignment title, course name, due date (colored by urgency), status badge
   - Sort by due date ascending
   - Overdue tasks pinned to top in a separate "Overdue" section

5. app/(dashboard)/student/notes/page.tsx — Self-Notes
   - Two-panel layout: list on left, editor on right
   - Create, edit, delete notes
   - Notes are private (only visible to the current student)
   - Auto-save indicator

6. app/(dashboard)/student/activity/page.tsx — Activity Log
   - Table: Action | Details | Date/Time
   - Paginated (20 per page)
   - Human-readable action labels (not raw enum values)

Components to create:
- components/courses/CourseCard.tsx
- components/courses/EnrollDialog.tsx
- components/assignments/AssignmentCard.tsx
- components/assignments/SubmitDialog.tsx (file upload)
- components/tasks/TaskList.tsx
- components/notes/NoteList.tsx + NoteEditor.tsx
- components/activity/ActivityTable.tsx

Follow DESIGN.md for all styling. No gradient backgrounds. Use the deadline color logic from DESIGN.md for Task Tracker.
```

---

## Agent 7 — Instructor Dashboard

**Context files to attach:** `DESIGN.md`, `API.md`  
**What it builds:** All instructor pages + components

```
Build all instructor-facing pages for EduTrack.

Pages to build:

1. app/(dashboard)/instructor/page.tsx — Instructor Home
   - Stat cards: Total Courses, Total Students, Pending Grading
   - List of recent submissions to grade (with direct link)

2. app/(dashboard)/instructor/courses/page.tsx
   - Grid of course cards showing: title, class code (monospace), enrollment count, assignment count, archived status
   - "Create Course" button → opens dialog
   - Toggle to show/hide archived courses

3. app/(dashboard)/instructor/courses/[courseId]/page.tsx
   - Tabs: Announcements | Assignments | Roster
   - Announcements tab: list + "Post Announcement" button
   - Assignments tab: list with submission counts + "Create Assignment" button
   - Roster tab: table of enrolled students with name, email, submission count

4. app/(dashboard)/instructor/courses/[courseId]/assignments/[assignmentId]/page.tsx
   - Assignment details at top
   - Submissions table: student name, submitted at, status, grade
   - Click a row to open grading panel

5. Grading panel (can be a sheet/drawer):
   - Shows file download link
   - Grade input (0 to maxPoints)
   - Feedback textarea
   - Save button

Components to create:
- components/courses/CourseCreateDialog.tsx
- components/announcements/AnnouncementForm.tsx
- components/announcements/AnnouncementCard.tsx
- components/assignments/AssignmentForm.tsx
- components/assignments/GradeSheet.tsx
- components/instructor/RosterTable.tsx

Follow DESIGN.md. Class codes displayed in font-mono. No decorative elements.
```

---

## Agent 8 — Admin Panel

**Context files to attach:** `DESIGN.md`, `API.md`  
**What it builds:** Admin pages

```
Build the admin panel for EduTrack.

Pages to build:

1. app/(dashboard)/admin/page.tsx — Admin Dashboard
   - Stat cards: Total Users, Total Courses, Total Submissions, Active Users (last 7 days)
   - Submissions by status (simple horizontal bar chart using Tailwind widths — no chart library needed)

2. app/(dashboard)/admin/users/page.tsx — User Management
   - Searchable table: Name | Email | Role | Status | Joined | Actions
   - Filter by role (All / Student / Instructor / Admin)
   - Deactivate/reactivate action (toggle isActive)
   - Role displayed with colored badge (purple=admin, blue=instructor, gray=student)
   - Pagination (20 per page)

3. app/(dashboard)/admin/logs/page.tsx — Activity Logs
   - Table: User | Action | Details | Timestamp
   - Filters: user search, action type dropdown, date range
   - Paginated (50 per page)
   - Human-readable action labels

Follow DESIGN.md. Tables use borderless rows with subtle hover. No decorative elements.
```

---

## Agent 9 — Polish & NFRs

**Context files to attach:** `PROMPT.md` (NFR section), `DESIGN.md`  
**What it builds:** Loading states, error boundaries, toast notifications, responsive fixes

```
Polish the EduTrack application:

1. Add loading.tsx skeleton screens for all major pages (student/courses, student/tasks, instructor/courses, admin/users). Use animate-pulse skeleton cards following DESIGN.md patterns.

2. Add error.tsx boundaries for all route groups with a friendly error UI and retry button.

3. Add not-found.tsx for 404 cases.

4. Ensure all forms show Sonner toast notifications:
   - Success: green, "Course created", "Assignment submitted", etc.
   - Error: destructive red, show the error.message

5. Verify all interactive elements have focus-visible rings (add ring-offset-background and focus-visible:ring-2 where missing).

6. Audit the sidebar and all pages for any gradient, glassmorphism, or decorative shadow violations per DESIGN.md. Remove or replace with flat/border-based alternatives.

7. Add a confirmation dialog (shadcn AlertDialog) before all destructive actions: delete note, archive course, deactivate user.

8. Test that the layout holds at 1024px, 1280px, and 1440px widths. Fix any overflow or truncation issues.
```
