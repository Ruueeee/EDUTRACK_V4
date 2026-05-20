# EduTrack — Cursor Prompt Package

A complete AI-ready project specification for building EduTrack, a web-based classroom and task management system for Caraga State University.

---

## Files in This Package

| File | Purpose |
|---|---|
| `PROMPT.md` | Master project spec — tech stack, roles, features, NFRs, file structure |
| `.cursorrules` | Cursor's standing instructions for code style, design rules, and API patterns |
| `SCHEMA.md` | Full Prisma schema, key queries, seed targets |
| `API.md` | Complete REST API reference with Zod validators |
| `DESIGN.md` | Design system — colors, typography, component patterns, anti-patterns |
| `SUB-AGENTS.md` | 9 self-contained Cursor Composer prompts, one per build phase |

---

## How to Use

### Step 1 — Copy to your project root
Place `.cursorrules` in the root of your Next.js project. Cursor will automatically load it.

### Step 2 — Add context docs
Place the remaining `.md` files wherever you keep project docs (e.g., `/docs/`). Reference them by name when prompting.

### Step 3 — Run agents in order
Open Cursor Composer (Cmd+I) and use the prompts in `SUB-AGENTS.md` one at a time:

```
Agent 1 → Scaffold
Agent 2 → Database schema + seed
Agent 3 → Auth
Agent 4 → API routes
Agent 5 → Shared layout
Agent 6 → Student UI
Agent 7 → Instructor UI
Agent 8 → Admin UI
Agent 9 → Polish
```

For each agent, attach the listed context files in Composer before sending.

### Step 4 — After each agent
- Run `npx prisma generate` after Agent 2
- Run `npx prisma db push` and `npx prisma db seed` after Agent 2
- Test auth before proceeding to Agent 4
- Review API routes with a tool like Hoppscotch before building UI

---

## SRS Reference Summary

This package fully implements EduTrack v1.1 (April 7, 2026) as specified in the SRS:

| SRS Section | Implemented By |
|---|---|
| 3.1 User Authentication | Agent 3 |
| 3.2 Course Management | Agents 4 + 7 |
| 3.3 Announcement Management | Agents 4 + 7 |
| 3.4 Assignment Management | Agents 4 + 6 + 7 |
| 3.5 Task Tracker | Agent 6 |
| 3.6 Self-Notes | Agent 6 |
| 3.7 Activity Logs | Agents 4 + 6 + 8 |
| 4.1 User Interfaces | Agents 5–8 |
| 5.1 Performance NFRs | Agent 9 + Prisma indexes |
| 5.3 Security NFRs | Agents 3 + 4 (bcrypt, Zod, RBAC) |
| 5.4 Quality Attributes | Agent 9 |

---

## Quick Commands

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# Run dev server
npm run dev

# Build for production
npm run build
```
