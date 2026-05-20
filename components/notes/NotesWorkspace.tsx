"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, StickyNote, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/common/EmptyState"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDateTime } from "@/lib/dates"

interface Note {
  id: string
  title: string
  body: string
  updatedAt: string
}

export function NotesWorkspace({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [activeId, setActiveId] = useState<string | null>(initialNotes[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = notes.find((n) => n.id === activeId) ?? null

  const updateLocal = (id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  }

  const save = useCallback(
    async (id: string, data: { title: string; body: string }) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          toast.error(json.error ?? "Failed to save")
          return
        }
        setSavedAt(new Date())
      } finally {
        setSaving(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!active) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void save(active.id, { title: active.title || "Untitled", body: active.body })
    }, 800)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.title, active?.body])

  const createNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", body: "Write your thoughts here…" }),
    })
    const json = await res.json()
    if (!res.ok || json.error) {
      toast.error(json.error ?? "Failed to create note")
      return
    }
    const created: Note = {
      id: json.data.id,
      title: json.data.title,
      body: json.data.body,
      updatedAt: json.data.updatedAt,
    }
    setNotes((prev) => [created, ...prev])
    setActiveId(created.id)
  }

  const deleteNote = async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok || json.error) {
      toast.error(json.error ?? "Failed to delete")
      return
    }
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeId === id) setActiveId(null)
    toast.success("Note deleted")
  }

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <aside className="rounded-lg border bg-card p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</span>
          <Button size="sm" variant="ghost" onClick={createNote}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
        {notes.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">No notes yet.</div>
        ) : (
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(n.id)}
                  className={cn(
                    "flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeId === n.id && "bg-accent"
                  )}
                >
                  <span className="truncate font-medium">{n.title || "Untitled"}</span>
                  <span className="truncate text-xs text-muted-foreground">{n.body.slice(0, 40)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        {!active ? (
          <EmptyState Icon={StickyNote} title="No note selected" description="Create or select a note to start writing." />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Input
                value={active.title}
                onChange={(e) => updateLocal(active.id, { title: e.target.value })}
                placeholder="Title"
                className="text-base font-medium"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Delete note">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteNote(active.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Textarea
              value={active.body}
              onChange={(e) => updateLocal(active.id, { body: e.target.value })}
              placeholder="Write your thoughts here…"
              className="min-h-[320px]"
            />
            <div className="flex items-center justify-end text-xs text-muted-foreground">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                </span>
              ) : savedAt ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" /> Saved · {formatDateTime(savedAt)}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
