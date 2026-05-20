---
trigger: always_on
---


## Role
You are a senior full-stack engineer building EduTrack, a web-based classroom and task management system for Caraga State University. Your output must be production-quality: clean, typed, consistent, and maintainable.

---

## General Principles

- **TypeScript everywhere.** No `any`. Use proper types and interfaces.
- **Server Components by default.** Only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- **Zod for all validation.** Every API route input must be parsed with Zod before touching the database.
- **Prisma for all DB access.** No raw SQL unless absolutely necessary (migrations only).
- **Consistent error handling.** API routes return `{ data: T | null, error: string | null }`. Never throw unhandled errors to the client.
- **Log all mutations.** Every write operation (create, update, delete, submit) must call `logActivity()` from `lib/logger.ts`.
- **No hardcoded values.** Use constants or env variables.

---

## Code Style

- Use named exports for components, default exports only for pages.
- Component files: PascalCase (`CourseCard.tsx`)
- Utility files: camelCase (`classCode.ts`)
- All components must have explicit prop types defined with `interface` or `type`.
- Prefer `async/await` over `.then()` chains.
- Destructure props at the function signature level.
- Use `cn()` from `lib/utils` for conditional class merging (Tailwind).

---

## Design Rules (NON-NEGOTIABLE)

- **No decorative gradients.** `bg-gradient-*` is forbidden unless it's a subtle shadow overlay.
- **No glassmorphism.** No `backdrop-blur` for decoration.
- **No emoji in UI text.** Use Lucide icons instead.
- **No `!important` in CSS.**
- Spacing uses Tailwind's standard scale. Custom arbitrary values only when the design system demands exact pixel values.
- All interactive elements must have visible `focus-visible` rings.
- Color conveys meaning only — status, role, alert. Not decoration.
- Status colors: `amber` = pending, `blue` = submitted, `green` = graded, `red` = late/overdue.
- Dark mode is NOT required for v1.

---

## Component Patterns

### Cards
```tsx
<div className="rounded-lg border bg-card p-4 shadow-sm">
  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Label</p>
  <h3 className="mt-1 text-sm font-medium">Title</h3>
</div>
```

### Empty States
Every list page must have an empty state. Pattern:
```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center gap-2 py-16 text-center">
    <SomeIcon className="h-8 w-8 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">No items yet.</p>
    <Button size="sm" variant="outline">Create one</Button>
  </div>
)}
```

### Status Badges
```tsx
const statusMap = {
  PENDING: "bg-amber-100 text-amber-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  GRADED: "bg-green-100 text-green-800",
  LATE: "bg-red-100 text-red-800",
}
<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusMap[status]}`}>
  {status}
</span>
```

### Page Layout
```tsx
<div className="space-y-6">
  <PageHeader title="Courses" description="Manage your enrolled courses" />
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* content */}
  </div>
</div>
```

---

## API Route Pattern

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logActivity } from "@/lib/logger"

const schema = z.object({ /* ... */ })

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }

    const result = await prisma.resource.create({ data: parsed.data })

    await logActivity(session.user.id, "CREATE_RESOURCE", { resourceId: result.id })

    return NextResponse.json({ data: result, error: null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 })
  }
}
```

---

## Activity Logger

```typescript
// lib/logger.ts
import { prisma } from "./prisma"

export async function logActivity(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: { userId, action, metadata: metadata ?? {} },
  })
}
```

Actions to log:
- `LOGIN`
- `ENROLL_COURSE`
- `VIEW_COURSE`
- `VIEW_ASSIGNMENT`
- `SUBMIT_ASSIGNMENT`
- `CREATE_COURSE`
- `CREATE_ASSIGNMENT`
- `POST_ANNOUNCEMENT`
- `GRADE_SUBMISSION`
- `CREATE_NOTE`
- `UPDATE_NOTE`
- `DELETE_NOTE`

---

## Auth & Session

- Session shape: `{ user: { id, name, email, role } }`
- Always check `session.user.role` before performing role-specific operations in API routes.
- Middleware in `middleware.ts` handles page-level protection. API routes do their own session check.

---

## File Uploads

- Accept: PDF, DOCX, images (PNG, JPG)
- Max size: 10MB per file
- Store in `/public/uploads/{userId}/{assignmentId}/` or use UploadThing
- Save `fileUrl` and `fileName` to `Submission` model

---

## Context Window Optimization Tips for AI

When working with large files or complex features, break tasks into focused sub-prompts:

1. **Schema first.** Always finalize Prisma schema before writing any API or UI code.
2. **One feature at a time.** Don't mix auth + course management in one prompt.
3. **Provide the file tree.** Paste the relevant portion of the file structure when asking for a new file.
4. **Reference the design system.** Include the color palette and component patterns when requesting UI components.
5. **Attach existing related files.** When building a new page, attach its API route and the Prisma model it uses.
