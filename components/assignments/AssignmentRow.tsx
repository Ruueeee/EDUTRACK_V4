import { Clock } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { SubmitDialog } from "@/components/assignments/SubmitDialog"
import { deadlineClass, formatDueDate } from "@/lib/dates"

interface AssignmentRowProps {
  id: string
  title: string
  description?: string | null
  dueDate: string | Date
  maxPoints: number
  submission?: {
    status: string
    grade?: number | null
    feedback?: string | null
    fileName?: string | null
  } | null
}

export function AssignmentRow({
  id,
  title,
  description,
  dueDate,
  maxPoints,
  submission,
}: AssignmentRowProps) {
  const status = submission?.status ?? "PENDING"
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{title}</h3>
          {description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>}
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className={`h-3.5 w-3.5 ${deadlineClass(dueDate, status)}`} />
          <span className={`text-xs ${deadlineClass(dueDate, status)}`}>{formatDueDate(dueDate)}</span>
          <span className="text-xs text-muted-foreground">· {maxPoints} pts</span>
          {submission?.grade != null && (
            <span className="text-xs font-medium text-green-700">
              · Grade: {submission.grade}/{maxPoints}
            </span>
          )}
        </div>
        <SubmitDialog assignmentId={id} assignmentTitle={title} hasSubmission={!!submission} />
      </div>
      {submission?.feedback && (
        <p className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Feedback:</span> {submission.feedback}
        </p>
      )}
    </div>
  )
}
