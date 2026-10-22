import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

// Mirrors TasksContainer: "Tasks" heading + Add Task button, the two filter
// pills, then the task table. Renders inside the [projectSlug] layout, so the
// breadcrumb, project title and tabs stay on screen while this loads.
export default function ProjectTasksLoading() {
  return (
    <div role="status" aria-label="Loading tasks" className="flex animate-pulse flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <TableSkeleton columns={["Title", "Assigned to", "Status", ""]} />
    </div>
  );
}
