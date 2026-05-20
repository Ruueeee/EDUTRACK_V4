"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GradeDialogProps {
  submissionId: string
  studentName: string
  maxPoints: number
  currentGrade?: number | null
  currentFeedback?: string | null
}

export function GradeDialog({
  submissionId,
  studentName,
  maxPoints,
  currentGrade,
  currentFeedback,
}: GradeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [grade, setGrade] = useState<string>(currentGrade != null ? String(currentGrade) : "")
  const [feedback, setFeedback] = useState<string>(currentFeedback ?? "")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const g = parseInt(grade, 10)
    if (isNaN(g) || g < 0 || g > maxPoints) {
      toast.error(`Grade must be between 0 and ${maxPoints}`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: g, feedback: feedback || undefined }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Failed to save grade")
        return
      }
      toast.success("Grade saved")
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {currentGrade != null ? "Update grade" : "Grade"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
          <DialogDescription>{studentName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grade">Grade (out of {maxPoints})</Label>
            <Input
              id="grade"
              type="number"
              min={0}
              max={maxPoints}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !grade}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save grade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
