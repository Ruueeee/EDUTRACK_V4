import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { NotesWorkspace } from "@/components/notes/NotesWorkspace"

export default async function StudentNotesPage() {
  const session = await auth()
  const notes = await prisma.selfNote.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Self-Notes" description="Private notes — only you can see these." />
      <NotesWorkspace
        initialNotes={notes.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          updatedAt: n.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
