import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  basePath: string
  page: number
  total: number
  pageSize: number
  searchParams?: Record<string, string | undefined>
}

export function Pagination({ basePath, page, total, pageSize, searchParams = {} }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const build = (p: number) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v)
    }
    params.set("page", String(p))
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Link
          href={build(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent",
            page <= 1 && "pointer-events-none opacity-50"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Link>
        <Link
          href={build(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent",
            page >= totalPages && "pointer-events-none opacity-50"
          )}
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
