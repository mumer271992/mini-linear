"use client";

import { usePathname } from "next/navigation";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { TASK_STATUS_OPTIONS, UNASSIGNED_FILTER_VALUE } from "@/lib/task";
import type { TaskStatus } from "@/generated/prisma/client";

interface TaskFiltersProps {
  members: { id: string; name: string }[];
  appliedStatuses: TaskStatus[];
  appliedAssigneeIds: string[];
}

// Applying a filter navigates to a URL with the new ?status=/?assignee=
// param rather than holding state here -- tasks/page.tsx reads it back out
// and applies it server-side, so filters survive a refresh and are
// shareable via link. This uses a real window.location navigation instead
// of router.push()/replace(): in this app/environment, router.push()
// reliably updated the URL on the *first* call after a fresh page load, but
// any subsequent push/replace to the same pathname with different search
// params (changing or clearing an already-applied filter) silently failed
// to update the address bar at all. Reproduced with push, replace, pairing
// push with router.refresh(), with the FilterDropdown key-based remount
// removed, and even after switching to Next's documented pattern of
// sourcing current params from useSearchParams() instead of
// window.location.search -- none of it changed the outcome, so this isn't
// specific to any of those. A full navigation sidesteps whatever in the
// client router is causing it.
export function TaskFilters({ members, appliedStatuses, appliedAssigneeIds }: TaskFiltersProps) {
  const pathname = usePathname();

  const assigneeOptions = [
    { value: UNASSIGNED_FILTER_VALUE, label: "Unassigned" },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ];

  function updateParam(key: string, values: string[]) {
    const params = new URLSearchParams(window.location.search);
    if (values.length > 0) {
      params.set(key, values.join(","));
    } else {
      params.delete(key);
    }

    const query = params.toString();
    window.location.assign(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex gap-3">
      <FilterDropdown
        label="Status"
        options={TASK_STATUS_OPTIONS}
        initialAppliedValues={appliedStatuses}
        onApply={(values) => updateParam("status", values)}
      />
      <FilterDropdown
        label="Assignee"
        options={assigneeOptions}
        initialAppliedValues={appliedAssigneeIds}
        onApply={(values) => updateParam("assignee", values)}
      />
    </div>
  );
}
