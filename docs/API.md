# API Reference — EduTrack

All routes are prefixed with `/api`. All responses follow the shape:
```json
{ "data": <T> | null, "error": string | null }
```

Authentication is required for all routes unless marked `[PUBLIC]`.

---

## Auth

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, role }` | Register new user |
| POST | `/api/auth/[...nextauth]` | `{ email, password }` | Login (NextAuth) |

---

## Courses

| Method | Route | Auth | Body / Params | Description |
|---|---|---|---|---|
| GET | `/api/courses` | Any | — | Get courses for current user |
| POST | `/api/courses` | INSTRUCTOR | `{ title, description }` | Create course |
| GET | `/api/courses/:courseId` | Enrolled or Instructor | — | Get single course |
| PATCH | `/api/courses/:courseId` | Instructor (owner) | `{ title?, description?, isArchived? }` | Update course |
| POST | `/api/courses/:courseId/enroll` | STUDENT | `{ classCode }` | Enroll via class code |

---

## Announcements

| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/api/announcements?courseId=` | Enrolled / Instructor | — | List announcements for course |
| POST | `/api/announcements` | INSTRUCTOR | `{ courseId, title, body }` | Post announcement |
| PATCH | `/api/announcements/:id` | INSTRUCTOR (owner) | `{ title?, body? }` | Edit announcement |
| DELETE | `/api/announcements/:id` | INSTRUCTOR (owner) | — | Delete announcement |

---

## Assignments

| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/api/assignments?courseId=` | Enrolled / Instructor | — | List assignments |
| POST | `/api/assignments` | INSTRUCTOR | `{ courseId, title, description, dueDate, maxPoints }` | Create assignment |
| GET | `/api/assignments/:id` | Enrolled / Instructor | — | Get assignment detail |
| PATCH | `/api/assignments/:id` | INSTRUCTOR (owner) | `{ title?, description?, dueDate?, maxPoints? }` | Update assignment |
| DELETE | `/api/assignments/:id` | INSTRUCTOR (owner) | — | Delete assignment |

---

## Submissions

| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/api/submissions?assignmentId=` | INSTRUCTOR or own STUDENT | — | List submissions for assignment |
| POST | `/api/submissions` | STUDENT | `{ assignmentId, fileUrl, fileName }` | Submit assignment |
| PATCH | `/api/submissions/:id/grade` | INSTRUCTOR | `{ grade, feedback }` | Grade submission |

---

## Self-Notes

| Method | Route | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/api/notes` | STUDENT | — | Get own notes |
| POST | `/api/notes` | STUDENT | `{ title, body }` | Create note |
| PATCH | `/api/notes/:id` | STUDENT (owner) | `{ title?, body? }` | Update note |
| DELETE | `/api/notes/:id` | STUDENT (owner) | — | Delete note |

---

## Activity Log

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/activity` | STUDENT (own) / ADMIN (all) | Get activity logs |

Query params for ADMIN: `?userId=&action=&from=&to=&page=&limit=`

---

## Admin

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | ADMIN | List all users (paginated) |
| PATCH | `/api/admin/users/:id` | ADMIN | Deactivate or change role |
| GET | `/api/admin/analytics` | ADMIN | Aggregate stats |

### Analytics Response Shape
```json
{
  "data": {
    "totalUsers": 0,
    "totalCourses": 0,
    "totalSubmissions": 0,
    "submissionsByStatus": {
      "PENDING": 0,
      "SUBMITTED": 0,
      "GRADED": 0,
      "LATE": 0
    },
    "activeUsersLast7Days": 0
  }
}
```

---

## Validation Schemas (Zod)

```typescript
// lib/validators/course.ts
export const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
})

// lib/validators/assignment.ts
export const createAssignmentSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime(),
  maxPoints: z.number().int().min(1).max(1000).default(100),
})

// lib/validators/note.ts
export const createNoteSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(10000),
})
```
