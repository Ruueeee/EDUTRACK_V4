"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SubmitDialogProps {
  assignmentId: string
  assignmentTitle: string
  hasSubmission?: boolean
}

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]

export function SubmitDialog({ assignmentId, assignmentTitle, hasSubmission }: SubmitDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("File exceeds 10MB limit")
      return
    }
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only PDF, DOCX, PNG, JPG are allowed")
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("assignmentId", assignmentId)
      const upload = await fetch("/api/uploads", { method: "POST", body: form })
      const uploadJson = await upload.json()
      if (!upload.ok || uploadJson.error) {
        toast.error(uploadJson.error ?? "Upload failed")
        return
      }
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          fileUrl: uploadJson.data.fileUrl,
          fileName: uploadJson.data.fileName,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Submission failed")
        return
      }
      toast.success("Assignment submitted")
      setOpen(false)
      setFile(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={hasSubmission ? "outline" : "default"}>
          <Upload className="h-4 w-4" />
          {hasSubmission ? "Resubmit" : "Submit"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit assignment</DialogTitle>
          <DialogDescription>{assignmentTitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">File (PDF, DOCX, PNG, JPG — max 10MB)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !file}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {hasSubmission ? "Resubmit" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
