import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

// Mirrors page.tsx: breadcrumb, heading + New Member button, members table.
// The button placeholder shows even for roles that can't invite -- the
// skeleton can't know the role yet, and a brief extra block beats a jump.
export default function MembersLoading() {
  return (
    <div role="status" aria-label="Loading members" className="flex flex-1 animate-pulse flex-col p-8">
      <Skeleton className="mb-2 h-5 w-20" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <TableSkeleton columns={["Name", "Role", ""]} className="mt-6" />
    </div>
  );
}
