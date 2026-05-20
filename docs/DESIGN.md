# Design System — EduTrack

## Philosophy

EduTrack's UI should feel like a professional SaaS tool — not a student project. Every design decision must be justified by function, not aesthetics. Reference points: Linear.app, Vercel dashboard, Notion.

**Anti-patterns (never do these):**
- ❌ Rainbow gradients on buttons or backgrounds
- ❌ Glassmorphism (`backdrop-blur` for decoration)
- ❌ Neon/vibrant accent colors not tied to meaning
- ❌ Animated hero sections or scroll effects
- ❌ Emoji as UI elements
- ❌ Card shadows that are too dramatic (`shadow-xl` on everything)
- ❌ Full-width colored header bars for decoration

---

## Color Tokens

```css
/* Add to app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --ring: 215 20.2% 65.1%;
    --radius: 0.5rem;
  }
}
```

### Semantic Status Colors (Tailwind classes)
| Status | Background | Text |
|---|---|---|
| Pending | `bg-amber-100` | `text-amber-800` |
| Submitted | `bg-blue-100` | `text-blue-800` |
| Graded | `bg-green-100` | `text-green-800` |
| Late | `bg-red-100` | `text-red-800` |
| Archived | `bg-gray-100` | `text-gray-500` |

### Role Accent Colors
| Role | Color |
|---|---|
| Admin | `text-purple-700` |
| Instructor | `text-blue-700` |
| Student | `text-gray-700` |

---

## Typography

```
Font: Inter (from next/font/google)

Page Title:    text-2xl font-semibold tracking-tight
Section Title: text-lg font-medium
Card Title:    text-sm font-medium
Body Text:     text-sm text-muted-foreground
Label:         text-xs font-medium uppercase tracking-wide text-muted-foreground
Code/ID:       font-mono text-xs text-muted-foreground
```

---

## Layout

### Sidebar
- Width: `w-64` (fixed, not collapsible in v1)
- Background: `bg-white border-r`
- Nav item: `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors`
- Active nav item: `bg-accent text-accent-foreground`
- Logo area: `h-16 border-b px-4 flex items-center`

### Main Content Area
- Padding: `p-6` or `p-8`
- Max width: `max-w-5xl` for most pages, `max-w-3xl` for forms
- Gap between sections: `space-y-6`

### Topbar
- Height: `h-14`
- Background: `bg-white border-b`
- Content: breadcrumb on left, user menu on right

---

## Components

### PageHeader
```tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

### StatCard (for dashboards)
```tsx
// Minimal stat card — no icon backgrounds, no gradients
<div className="rounded-lg border bg-card p-4 shadow-sm">
  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Total Submissions
  </p>
  <p className="mt-1 text-2xl font-semibold">142</p>
  <p className="mt-1 text-xs text-muted-foreground">+12 this week</p>
</div>
```

### CourseCard
```tsx
<div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
  <div className="flex items-start justify-between">
    <div>
      <h3 className="text-sm font-medium">{course.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{enrollmentCount} students</p>
    </div>
    <span className="font-mono text-xs text-muted-foreground">{course.classCode}</span>
  </div>
  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
</div>
```

### AssignmentCard (Student view)
```tsx
<div className="rounded-lg border bg-card p-4 shadow-sm">
  <div className="flex items-start justify-between">
    <h3 className="text-sm font-medium">{assignment.title}</h3>
    <StatusBadge status={submission?.status ?? "PENDING"} />
  </div>
  <p className="mt-1 text-xs text-muted-foreground">{courseName}</p>
  <div className="mt-3 flex items-center gap-2">
    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    <span className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
      {formatDueDate(assignment.dueDate)}
    </span>
  </div>
</div>
```

### DeadlineIndicator (Task Tracker)
```tsx
// Color logic for deadlines
function getDeadlineClass(dueDate: Date, status: SubmissionStatus) {
  if (status === "GRADED" || status === "SUBMITTED") return "text-green-600"
  const now = new Date()
  const hoursLeft = differenceInHours(dueDate, now)
  if (hoursLeft < 0) return "text-red-600 font-medium"     // overdue
  if (hoursLeft < 24) return "text-amber-600 font-medium"  // due today
  return "text-muted-foreground"                           // upcoming
}
```

---

## Empty States

Every list must have an empty state. Use this structure:

```tsx
<div className="flex flex-col items-center gap-3 py-20 text-center">
  <div className="rounded-full bg-muted p-3">
    <BookOpen className="h-6 w-6 text-muted-foreground" />
  </div>
  <div>
    <p className="text-sm font-medium">No courses yet</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Create your first course to get started.
    </p>
  </div>
  <Button size="sm" variant="outline">Create Course</Button>
</div>
```

---

## Loading States

Use Tailwind's `animate-pulse` skeleton pattern, not spinners:

```tsx
// Skeleton card
<div className="rounded-lg border bg-card p-4 shadow-sm">
  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
  <div className="mt-2 h-3 w-1/2 rounded bg-muted animate-pulse" />
  <div className="mt-4 h-3 w-full rounded bg-muted animate-pulse" />
</div>
```

---

## Forms

- Use `react-hook-form` + `zod` + shadcn `<Form>` components
- Labels above inputs, always
- Error messages in `text-xs text-red-600` below the input
- Submit buttons: full width on mobile, auto width on desktop
- Destructive actions (delete, archive) use `variant="destructive"` with a confirmation dialog

---

## Sidebar Navigation Structure

### Student
```
Dashboard
├── My Courses
├── Task Tracker
├── Self-Notes
└── Activity Log
```

### Instructor
```
Dashboard
├── My Courses
│   └── [Course]
│       ├── Announcements
│       ├── Assignments
│       └── Roster
└── (no task tracker, no notes)
```

### Admin
```
Dashboard
├── Users
└── Activity Logs
```
