import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonCard } from "@/components/common/SkeletonCard"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Loading…" />
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
