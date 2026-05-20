import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonGrid } from "@/components/common/SkeletonCard"

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Loading…" />
      <SkeletonGrid />
    </div>
  )
}
