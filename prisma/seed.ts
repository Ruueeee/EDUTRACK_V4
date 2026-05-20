import { PrismaClient, SubmissionStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
function code() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
}

async function hash(p: string) {
  return bcrypt.hash(p, 12)
}

async function main() {
  console.log("Seeding…")

  // Wipe (in dependency order)
  await prisma.activityLog.deleteMany()
  await prisma.selfNote.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  // Users
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@edutrack.com",
      passwordHash: await hash("admin123"),
      role: "ADMIN",
    },
  })

  const instructorPassword = await hash("instructor123")
  const instructor1 = await prisma.user.create({
    data: { name: "Dr. Maria Santos", email: "instructor1@edutrack.com", passwordHash: instructorPassword, role: "INSTRUCTOR" },
  })
  const instructor2 = await prisma.user.create({
    data: { name: "Prof. Juan Dela Cruz", email: "instructor2@edutrack.com", passwordHash: instructorPassword, role: "INSTRUCTOR" },
  })

  const studentPassword = await hash("student123")
  const students = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Student ${i + 1}`,
          email: `student${i + 1}@edutrack.com`,
          passwordHash: studentPassword,
          role: "STUDENT",
        },
      })
    )
  )

  // Courses
  const course1 = await prisma.course.create({
    data: {
      title: "Introduction to Computer Science",
      description: "Fundamentals of programming, algorithms, and data structures.",
      classCode: code(),
      instructorId: instructor1.id,
    },
  })
  const course2 = await prisma.course.create({
    data: {
      title: "Discrete Mathematics",
      description: "Logic, sets, combinatorics, and graph theory.",
      classCode: code(),
      instructorId: instructor2.id,
    },
  })
  const course3 = await prisma.course.create({
    data: {
      title: "Software Engineering",
      description: "SDLC, design patterns, agile, and team practices.",
      classCode: code(),
      instructorId: instructor1.id,
    },
  })

  // Enrollments — 5 students per course w/ overlap
  const enrollmentsByCourse: Record<string, string[]> = {
    [course1.id]: students.slice(0, 5).map((s) => s.id),
    [course2.id]: students.slice(3, 8).map((s) => s.id),
    [course3.id]: students.slice(5, 10).map((s) => s.id),
  }
  for (const [courseId, userIds] of Object.entries(enrollmentsByCourse)) {
    for (const userId of userIds) {
      await prisma.enrollment.create({ data: { courseId, userId } })
      await prisma.activityLog.create({ data: { userId, action: "ENROLL_COURSE", metadata: { courseId } } })
    }
  }

  // Announcements — 2 per course
  const courses = [course1, course2, course3]
  for (const c of courses) {
    await prisma.announcement.create({ data: { courseId: c.id, title: "Welcome!", body: `Welcome to ${c.title}. Read the syllabus.` } })
    await prisma.announcement.create({ data: { courseId: c.id, title: "Week 1 Notes", body: "Slides and reading materials posted." } })
  }

  // Assignments — 3 per course (past, today, future)
  const now = new Date()
  const past = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const today = new Date(now.getTime() + 6 * 60 * 60 * 1000)
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const assignments: { id: string; courseId: string; dueDate: Date }[] = []
  for (const c of courses) {
    const a1 = await prisma.assignment.create({
      data: { courseId: c.id, title: `${c.title} — HW 1`, description: "First homework.", dueDate: past, maxPoints: 100 },
    })
    const a2 = await prisma.assignment.create({
      data: { courseId: c.id, title: `${c.title} — Quiz`, description: "Short quiz.", dueDate: today, maxPoints: 50 },
    })
    const a3 = await prisma.assignment.create({
      data: { courseId: c.id, title: `${c.title} — Project`, description: "Mini project.", dueDate: future, maxPoints: 200 },
    })
    assignments.push(
      { id: a1.id, courseId: c.id, dueDate: past },
      { id: a2.id, courseId: c.id, dueDate: today },
      { id: a3.id, courseId: c.id, dueDate: future }
    )
  }

  // Submissions — ~60% of student-assignment pairs
  for (const a of assignments) {
    const enrolledIds = enrollmentsByCourse[a.courseId]
    for (const studentId of enrolledIds) {
      if (Math.random() > 0.4) {
        const isPast = a.dueDate < now
        const status: SubmissionStatus = isPast
          ? Math.random() > 0.5
            ? "GRADED"
            : "LATE"
          : "SUBMITTED"
        const submittedAt = new Date(a.dueDate.getTime() - (Math.random() > 0.5 ? 1 : -1) * 1000 * 60 * 60 * 24)
        const grade = status === "GRADED" ? Math.floor(60 + Math.random() * 40) : null
        const gradedAt = status === "GRADED" ? new Date() : null
        await prisma.submission.create({
          data: {
            studentId,
            assignmentId: a.id,
            status,
            submittedAt,
            grade,
            gradedAt,
            feedback: status === "GRADED" ? "Good work." : null,
            fileUrl: "/uploads/sample.pdf",
            fileName: "submission.pdf",
          },
        })
        await prisma.activityLog.create({
          data: { userId: studentId, action: "SUBMIT_ASSIGNMENT", metadata: { assignmentId: a.id } },
        })
        if (status === "GRADED") {
          await prisma.activityLog.create({
            data: { userId: a.courseId === course2.id ? instructor2.id : instructor1.id, action: "GRADE_SUBMISSION", metadata: { assignmentId: a.id, studentId } },
          })
        }
      }
    }
  }

  // Self-notes — 2-3 per student
  for (const s of students) {
    const count = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < count; i++) {
      await prisma.selfNote.create({
        data: { userId: s.id, title: `Study Note ${i + 1}`, body: "Review chapter and re-do exercises." },
      })
      await prisma.activityLog.create({ data: { userId: s.id, action: "CREATE_NOTE" } })
    }
  }

  // Login activity
  for (const u of [admin, instructor1, instructor2, ...students]) {
    await prisma.activityLog.create({ data: { userId: u.id, action: "LOGIN" } })
  }

  console.log("Done.")
  console.log("Logins:")
  console.log("  admin@edutrack.com / admin123")
  console.log("  instructor1@edutrack.com / instructor123")
  console.log("  student1@edutrack.com / student123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
