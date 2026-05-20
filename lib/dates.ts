import { differenceInHours, format, formatDistanceToNow } from "date-fns"

export function formatDueDate(due: string | Date): string {
  const date = typeof due === "string" ? new Date(due) : due
  const now = new Date()
  const hoursLeft = differenceInHours(date, now)
  if (hoursLeft < -24) return `Overdue · ${format(date, "MMM d, yyyy")}`
  if (hoursLeft < 0) return `Overdue · ${formatDistanceToNow(date, { addSuffix: true })}`
  if (hoursLeft < 24) return `Due ${formatDistanceToNow(date, { addSuffix: true })}`
  return `Due ${format(date, "MMM d, yyyy 'at' h:mm a")}`
}

export function deadlineClass(due: string | Date, status?: string): string {
  if (status === "GRADED" || status === "SUBMITTED") return "text-green-600"
  const date = typeof due === "string" ? new Date(due) : due
  const hoursLeft = differenceInHours(date, new Date())
  if (hoursLeft < 0) return "text-red-600 font-medium"
  if (hoursLeft < 24) return "text-amber-600 font-medium"
  return "text-muted-foreground"
}

export function formatDate(d: string | Date) {
  return format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy")
}

export function formatDateTime(d: string | Date) {
  return format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy h:mm a")
}
