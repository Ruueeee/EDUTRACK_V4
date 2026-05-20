import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonList } from "@/components/common/SkeletonCard"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Task Tracker" description="Loading…" />
      <SkeletonList />
    </div>
  )
}
