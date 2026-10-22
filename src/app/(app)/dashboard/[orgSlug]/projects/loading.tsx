import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

// Mirrors page.tsx: breadcrumb, heading + New Project button, projects table.
export default function ProjectsLoading() {
  return (
    <div role="status" aria-label="Loading projects" className="flex flex-1 animate-pulse flex-col p-8">
      <Skeleton className="mb-2 h-5 w-20" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <TableSkeleton
        columns={["Name", "Priority", "Target date", "Lead", "Status"]}
        className="mt-6"
      />
    </div>
  );
}
