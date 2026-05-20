import { Badge } from "@/components/ui/badge"

const map: Record<string, "pending" | "submitted" | "graded" | "late"> = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  GRADED: "graded",
  LATE: "late",
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={map[status] ?? "outline"}>{status}</Badge>
}
