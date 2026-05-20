import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface CourseCardProps {
  href: string
  title: string
  description?: string | null
  classCode?: string
  instructorName?: string | null
  stats?: { label: string; value: number | string }[]
  isArchived?: boolean
}

export function CourseCard({
  href,
  title,
  description,
  classCode,
  instructorName,
  stats = [],
  isArchived,
}: CourseCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{title}</h3>
          {instructorName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">By {instructorName}</p>
          )}
        </div>
        {classCode && <span className="shrink-0 font-mono text-xs text-muted-foreground">{classCode}</span>}
      </div>
      {description && (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {stats.map((s) => (
          <span key={s.label} className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{s.value}</span> {s.label}
          </span>
        ))}
        {isArchived && <Badge variant="archived">Archived</Badge>}
      </div>
    </Link>
  )
}
