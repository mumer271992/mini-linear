import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

// Mirrors page.tsx: heading, three TaskStatusStats cards, then the My Tasks
// table. Renders inside the [orgSlug] layout, so the sidebar stays put.
export default function OrganizationDashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading overview"
      className="flex flex-1 animate-pulse flex-col gap-6 p-4"
    >
      <Skeleton className="h-8 w-64" />

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-2 h-9 w-12" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-28" />
        <TableSkeleton columns={["Title", "Project", "Status"]} rows={4} />
      </div>
    </div>
  );
}
